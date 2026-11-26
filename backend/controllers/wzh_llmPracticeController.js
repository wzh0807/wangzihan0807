/**
 * 姓名：王子涵 | 学号：0807 | 时间：2026-11-25 | 大模型：DeepSeek-V4.1-Flash
 *
 * 功能名称：wzh_llmPracticeController 课程实践接口控制器
 * 功能简介：实现「LLM 实践操作痕迹展示」的四个模块：
 *           1) 知识库上传 / 列表 / 提问 / 删除（文本分块 + bge-m3 向量检索）
 *           2) 图像识别（图片转 base64 交给视觉模型）
 *           3) 语音识别（音频转发给 SenseVoice 转写）
 *           4) 操作痕迹读取 / 清空（每次操作都落盘）
 *           所有平台与模型都从 backend/.env 读取，Key 不返回给前端。
 */

const path = require('path');
const multer = require('multer');
const wzh_ai = require('../config/wzh_aiProviders');
const wzh_kb = require('../models/wzh_kbModel');
const wzh_trace = require('../models/wzh_traceModel');

// 统一用内存存储：知识库文件由模型层落盘，图片/音频只做一次转发
var wzh_upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 1 }
});

var wzh_TEXT_EXTS = ['.txt', '.md', '.markdown', '.csv', '.json', '.html', '.htm', '.log'];
var wzh_IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'];
var wzh_AUDIO_EXTS = ['.wav', '.mp3', '.m4a', '.webm', '.ogg', '.flac', '.mp4', '.aac'];

/**
 * 功能名称：wzh_friendlyHttp
 * 功能简介：把大模型平台的 HTTP 状态码翻译成课堂能讲清楚的中文原因。
 */
function wzh_friendlyHttp(wzh_name, wzh_status, wzh_raw) {
  if (wzh_status === 401) {
    return wzh_name + ' 返回 401：Key 无效或已过期，请检查 backend/.env 里的 Key 与 Bearer 前缀';
  }
  if (wzh_status === 402) {
    return wzh_name + ' 返回 402：余额不足，请领取免费额度或换一个平台';
  }
  if (wzh_status === 404) {
    return wzh_name + ' 返回 404：接口地址或模型名写错了，请核对 baseURL 是否带 /v1、model 是否与平台文档一致';
  }
  if (wzh_status === 413) {
    return wzh_name + ' 返回 413：上传内容太大，请压缩后再试';
  }
  if (wzh_status === 429) {
    return wzh_name + ' 返回 429：请求太频繁被限流，请等几秒再试';
  }
  if (wzh_status >= 500) {
    return wzh_name + ' 服务异常（' + wzh_status + '）：请稍后重试或切换平台';
  }
  return wzh_name + ' 返回 ' + wzh_status + '：' + String(wzh_raw || '').slice(0, 200);
}

/**
 * 功能名称：wzh_fetchJson
 * 功能简介：统一发起外部请求：非 2xx 时抛出翻译后的中文错误，
 *           2xx 但内容不是 JSON 时也给出可定位的提示。
 */
async function wzh_fetchJson(wzh_url, wzh_options, wzh_name) {
  var wzh_up = await fetch(wzh_url, wzh_options);
  var wzh_raw = await wzh_up.text();
  if (!wzh_up.ok) {
    throw new Error(wzh_friendlyHttp(wzh_name, wzh_up.status, wzh_raw));
  }
  try {
    return JSON.parse(wzh_raw);
  } catch (wzh_err) {
    throw new Error(wzh_name + ' 返回的内容不是合法 JSON：' + wzh_raw.slice(0, 200));
  }
}

/**
 * 功能名称：wzh_ok
 * 功能简介：记录成功痕迹并返回统一 JSON，避免每个接口重复写。
 */
function wzh_ok(wzh_res, wzh_module, wzh_action, wzh_start, wzh_provider, wzh_model, wzh_detail, wzh_data, wzh_msg) {
  wzh_trace.wzh_addTrace({
    module: wzh_module,
    action: wzh_action,
    status: 'success',
    provider: wzh_provider,
    model: wzh_model,
    durationMs: Date.now() - wzh_start,
    detail: wzh_detail
  });
  wzh_res.json({ code: 0, msg: wzh_msg || '操作成功', data: wzh_data });
}

/**
 * 功能名称：wzh_fail
 * 功能简介：记录失败痕迹并返回 code=-1，把真实原因放在 msg 里。
 */
function wzh_fail(wzh_res, wzh_module, wzh_action, wzh_start, wzh_err, wzh_provider, wzh_model) {
  var wzh_msg = wzh_err && wzh_err.message ? wzh_err.message : String(wzh_err || '未知错误');
  wzh_trace.wzh_addTrace({
    module: wzh_module,
    action: wzh_action,
    status: 'fail',
    provider: wzh_provider || '',
    model: wzh_model || '',
    durationMs: Date.now() - wzh_start,
    detail: wzh_msg
  });
  wzh_res.json({ code: -1, msg: wzh_msg, data: null });
}

/**
 * 功能名称：wzh_embedTexts
 * 功能简介：调用 bge-m3 把文本批量转成向量；每批 16 条，按 index 排好序返回。
 */
async function wzh_embedTexts(wzh_texts) {
  var wzh_model = wzh_ai.wzh_getTaskModel('embedding');
  if (!wzh_model) {
    throw new Error('知识库向量模型未配置：请检查 EMBEDDING_MODEL');
  }
  if (!wzh_model.apiKey) {
    throw new Error(wzh_model.providerName + ' 还没有配置 API Key，请先填写 backend/.env 的 SILICONFLOW_API_KEY');
  }

  var wzh_vectors = [];
  for (var wzh_start = 0; wzh_start < wzh_texts.length; wzh_start += 16) {
    var wzh_batch = wzh_texts.slice(wzh_start, wzh_start + 16);
    var wzh_json = await wzh_fetchJson(
      wzh_model.baseUrl.replace(/\/$/, '') + '/embeddings',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + wzh_model.apiKey
        },
        body: JSON.stringify({
          model: wzh_model.model,
          input: wzh_batch,
          encoding_format: 'float'
        }),
        signal: AbortSignal.timeout(60000)
      },
      wzh_model.providerName
    );

    var wzh_rows = Array.isArray(wzh_json.data) ? wzh_json.data : [];
    wzh_rows.sort(function (wzh_a, wzh_b) {
      return (wzh_a.index || 0) - (wzh_b.index || 0);
    });
    wzh_rows.forEach(function (wzh_row) {
      if (!Array.isArray(wzh_row.embedding) || !wzh_row.embedding.length) {
        throw new Error('向量模型返回了空向量，请检查 EMBEDDING_MODEL 是否可用');
      }
      wzh_vectors.push(wzh_row.embedding);
    });
  }

  if (wzh_vectors.length !== wzh_texts.length) {
    throw new Error('向量数量与文本数量不一致（' + wzh_vectors.length + ' / ' + wzh_texts.length + '）');
  }
  return wzh_vectors;
}

/**
 * 功能名称：wzh_htmlToText
 * 功能简介：把 html 文件里的脚本、样式、标签去掉，只保留可读文本。
 */
function wzh_htmlToText(wzh_html) {
  return String(wzh_html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&');
}

/**
 * 功能名称：wzh_extractText
 * 功能简介：按扩展名解析上传文件为纯文本；不支持的类型直接抛错。
 *           文本上限 30000 字，避免一次上传把向量额度用光。
 */
function wzh_extractText(wzh_file) {
  var wzh_ext = path.extname(wzh_file.originalname || '').toLowerCase();
  if (wzh_TEXT_EXTS.indexOf(wzh_ext) < 0) {
    throw new Error('知识库目前支持 ' + wzh_TEXT_EXTS.join(' / ') + ' 文本文件，暂不支持 ' + (wzh_ext || '未知类型'));
  }

  var wzh_text = wzh_file.buffer.toString('utf8').replace(/^\uFEFF/, '');
  if (wzh_ext === '.html' || wzh_ext === '.htm') {
    wzh_text = wzh_htmlToText(wzh_text);
  }
  wzh_text = wzh_text.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').trim();

  var wzh_truncated = false;
  if (wzh_text.length > 30000) {
    wzh_text = wzh_text.slice(0, 30000);
    wzh_truncated = true;
  }

  if (!wzh_text) {
    throw new Error('文件内容为空，换一个有内容的 txt / md 文件再试');
  }
  return { ext: wzh_ext, text: wzh_text, truncated: wzh_truncated };
}

/**
 * 功能名称：wzh_chunkText
 * 功能简介：把长文本切成约 600 字的片段，片段之间重叠 80 字；
 *           尽量在换行或中文句号处断开，保证语义完整。最多取 60 段。
 */
function wzh_chunkText(wzh_text) {
  var wzh_SIZE = 600;
  var wzh_OVERLAP = 80;
  var wzh_chunks = [];
  var wzh_start = 0;

  while (wzh_start < wzh_text.length && wzh_chunks.length < 60) {
    var wzh_end = Math.min(wzh_start + wzh_SIZE, wzh_text.length);

    if (wzh_end < wzh_text.length) {
      var wzh_windowStart = Math.max(wzh_end - 120, wzh_start);
      var wzh_slice = wzh_text.slice(wzh_windowStart, wzh_end);
      var wzh_break = Math.max(
        wzh_slice.lastIndexOf('\n'),
        wzh_slice.lastIndexOf('。'),
        wzh_slice.lastIndexOf('！'),
        wzh_slice.lastIndexOf('？'),
        wzh_slice.lastIndexOf('；')
      );
      if (wzh_break > 0) {
        wzh_end = wzh_windowStart + wzh_break + 1;
      }
    }

    var wzh_piece = wzh_text.slice(wzh_start, wzh_end).trim();
    if (wzh_piece) {
      wzh_chunks.push(wzh_piece);
    }
    if (wzh_end >= wzh_text.length) {
      break;
    }
    wzh_start = Math.max(wzh_end - wzh_OVERLAP, wzh_start + 1);
  }

  return wzh_chunks;
}

/**
 * 功能名称：wzh_chatCompletion
 * 功能简介：用 OpenAI 兼容格式请求 /chat/completions，返回解析后的 JSON。
 */
async function wzh_chatCompletion(wzh_provider, wzh_messages, wzh_temperature, wzh_maxTokens) {
  return wzh_fetchJson(
    wzh_provider.baseUrl.replace(/\/$/, '') + '/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + wzh_provider.apiKey
      },
      body: JSON.stringify({
        model: wzh_provider.model,
        messages: wzh_messages,
        temperature: typeof wzh_temperature === 'number' ? wzh_temperature : 0.3,
        max_tokens: wzh_maxTokens || 800
      }),
      signal: AbortSignal.timeout(90000)
    },
    wzh_provider.providerName
  );
}

/**
 * 功能名称：wzh_kbUploadCore
 * 功能简介：解析文件 → 分块 → 向量化 → 落盘，成功/失败都会留下痕迹。
 */
async function wzh_kbUploadCore(wzh_req, wzh_res) {
  var wzh_start = Date.now();
  var wzh_file = wzh_req.file;
  var wzh_action = '上传知识库文件';

  try {
    if (!wzh_file) {
      throw new Error('没有收到文件，请用 multipart/form-data 的 file 字段上传');
    }
    wzh_action = '上传知识库文件：' + wzh_file.originalname;

    var wzh_info = wzh_extractText(wzh_file);
    var wzh_chunks = wzh_chunkText(wzh_info.text);
    if (!wzh_chunks.length) {
      throw new Error('文件切分后没有可用内容');
    }

    var wzh_vectors = await wzh_embedTexts(wzh_chunks);
    var wzh_meta = wzh_kb.wzh_kbSaveDoc({
      name: wzh_file.originalname,
      ext: wzh_info.ext,
      size: wzh_file.size,
      buffer: wzh_file.buffer,
      chunks: wzh_chunks,
      vectors: wzh_vectors
    });

    var wzh_model = wzh_ai.wzh_getTaskModel('embedding');
    wzh_ok(
      wzh_res,
      '知识库',
      wzh_action,
      wzh_start,
      wzh_model.providerName,
      wzh_model.model,
      '切分为 ' + wzh_meta.chunkCount + ' 个片段并写入向量索引' + (wzh_info.truncated ? '（原文超过 3 万字已截断）' : ''),
      {
        doc: wzh_meta,
        chunkCount: wzh_meta.chunkCount,
        truncated: wzh_info.truncated,
        stats: wzh_kb.wzh_kbStats()
      },
      '知识库文件上传成功，共 ' + wzh_meta.chunkCount + ' 个片段'
    );
  } catch (wzh_err) {
    wzh_fail(wzh_res, '知识库', wzh_action, wzh_start, wzh_err);
  }
}

/**
 * 功能名称：wzh_kbUpload
 * 功能简介：先跑 multer 解析 multipart，再把错误也转成统一 JSON，
 *           避免文件超限时返回 HTML 错误页。
 */
function wzh_kbUpload(wzh_req, wzh_res) {
  wzh_upload.single('file')(wzh_req, wzh_res, function (wzh_err) {
    if (wzh_err) {
      return wzh_fail(wzh_res, '知识库', '上传知识库文件', Date.now(), new Error('文件上传失败：' + wzh_err.message));
    }
    wzh_kbUploadCore(wzh_req, wzh_res);
  });
}

/**
 * 功能名称：wzh_kbList
 * 功能简介：返回知识库文档列表与统计信息。
 */
function wzh_kbList(wzh_req, wzh_res) {
  try {
    wzh_res.json({
      code: 0,
      msg: '知识库共有 ' + wzh_kb.wzh_kbStats().docCount + ' 个文件',
      data: {
        docs: wzh_kb.wzh_kbList(),
        stats: wzh_kb.wzh_kbStats()
      }
    });
  } catch (wzh_err) {
    wzh_res.json({ code: -1, msg: '读取知识库失败：' + wzh_err.message, data: null });
  }
}

/**
 * 功能名称：wzh_kbAsk
 * 功能简介：问题向量化 → 余弦检索 top4 → 把资料片段拼进提示词 →
 *           让对话模型只依据资料回答，并把命中的片段与相似度一起返回。
 */
async function wzh_kbAsk(wzh_req, wzh_res) {
  var wzh_start = Date.now();
  var wzh_question = String((wzh_req.body || {}).question || '').trim();
  var wzh_action = '知识库提问';
  var wzh_model = wzh_ai.wzh_getTaskModel('embedding');

  try {
    if (!wzh_question) {
      throw new Error('请输入要问知识库的问题');
    }
    if (wzh_question.length > 500) {
      throw new Error('问题太长了，请控制在 500 字以内');
    }
    wzh_action = '知识库提问：' + wzh_question.slice(0, 60);

    if (!wzh_kb.wzh_kbStats().chunkCount) {
      throw new Error('知识库还是空的，请先在左侧上传 txt / md 文件');
    }

    var wzh_vector = (await wzh_embedTexts([wzh_question]))[0];
    var wzh_hits = wzh_kb.wzh_kbSearch(wzh_vector, 4);

    var wzh_provider = wzh_ai.wzh_getProvider('siliconflow');
    if (!wzh_provider || !wzh_provider.apiKey) {
      throw new Error('对话模型还没有配置 Key，请先填写 backend/.env 的 SILICONFLOW_API_KEY');
    }

    var wzh_best = wzh_hits.length ? wzh_hits[0].score : 0;
    if (wzh_best < 0.3) {
      return wzh_ok(
        wzh_res,
        '知识库',
        wzh_action,
        wzh_start,
        wzh_model.providerName,
        wzh_model.model,
        '最高相似度 ' + wzh_best.toFixed(3) + '，低于 0.3 阈值，未调用对话模型',
        {
          answer: '知识库中没有找到与这个问题相关的内容。最高相似度只有 ' + wzh_best.toFixed(3) + '，建议换一个问法，或先上传包含该主题的文件。',
          matches: wzh_hits.map(function (wzh_hit) {
            return {
              docName: wzh_hit.docName,
              chunkIndex: wzh_hit.chunkIndex,
              score: Number(wzh_hit.score.toFixed(4)),
              preview: wzh_hit.text.slice(0, 160)
            };
          }),
          provider: '',
          model: '',
          bestScore: Number(wzh_best.toFixed(4))
        },
        '未检索到足够相关的资料'
      );
    }

    var wzh_context = wzh_hits.map(function (wzh_hit, wzh_i) {
      return '[资料' + (wzh_i + 1) + '] 来源：' + wzh_hit.docName + '（片段 ' + (wzh_hit.chunkIndex + 1) + '）\n' + wzh_hit.text;
    }).join('\n\n');

    var wzh_json = await wzh_chatCompletion(
      wzh_provider,
      [
        {
          role: 'system',
          content: [
            '你是知识库问答助手，只能依据用户提供的【参考资料】回答。',
            '规则：',
            '1. 资料里有的信息才回答，并尽量引用资料编号，例如「(资料1)」；',
            '2. 资料里没有的信息，直接回答「知识库中没有找到相关内容」，绝对不要编造；',
            '3. 用简体中文回答，先给结论，再给依据，控制在 200 字以内。'
          ].join('\n')
        },
        {
          role: 'user',
          content: '【参考资料】\n' + wzh_context + '\n\n【问题】\n' + wzh_question
        }
      ],
      0.2,
      800
    );

    var wzh_answer = wzh_json.choices && wzh_json.choices[0] && wzh_json.choices[0].message
      ? wzh_json.choices[0].message.content
      : '';

    if (!wzh_answer) {
      throw new Error('对话模型没有返回内容，请稍后重试');
    }

    wzh_ok(
      wzh_res,
      '知识库',
      wzh_action,
      wzh_start,
      wzh_provider.name,
      wzh_json.model || wzh_provider.model,
      '命中 ' + wzh_hits.length + ' 个片段，最高相似度 ' + wzh_best.toFixed(3) + '；答：' + wzh_answer.slice(0, 80),
      {
        answer: wzh_answer,
        matches: wzh_hits.map(function (wzh_hit) {
          return {
            docName: wzh_hit.docName,
            chunkIndex: wzh_hit.chunkIndex,
            score: Number(wzh_hit.score.toFixed(4)),
            preview: wzh_hit.text.slice(0, 160)
          };
        }),
        provider: wzh_provider.id,
        providerName: wzh_provider.name,
        model: wzh_json.model || wzh_provider.model,
        bestScore: Number(wzh_best.toFixed(4)),
        usage: wzh_json.usage || null
      },
      '知识库回答成功'
    );
  } catch (wzh_err) {
    wzh_fail(wzh_res, '知识库', wzh_action, wzh_start, wzh_err, wzh_model ? wzh_model.providerName : '', wzh_model ? wzh_model.model : '');
  }
}

/**
 * 功能名称：wzh_kbDelete
 * 功能简介：按 id 删除知识库文档，并记录操作痕迹。
 */
function wzh_kbDelete(wzh_req, wzh_res) {
  var wzh_start = Date.now();
  var wzh_id = String(wzh_req.params.id || '').trim();
  var wzh_okDeleted = wzh_kb.wzh_kbDelete(wzh_id);

  if (!wzh_okDeleted) {
    return wzh_fail(wzh_res, '知识库', '删除知识库文件', wzh_start, new Error('没有找到 id 为 ' + wzh_id + ' 的文档'));
  }

  wzh_ok(wzh_res, '知识库', '删除知识库文件：' + wzh_id, wzh_start, '', '', '已同时删除索引与原始文件', {
    id: wzh_id,
    stats: wzh_kb.wzh_kbStats()
  }, '文档已删除');
}

/**
 * 功能名称：wzh_vision
 * 功能简介：接收图片文件 → 转 data URL → 交给视觉模型识别 → 返回中文描述。
 */
function wzh_vision(wzh_req, wzh_res) {
  wzh_upload.single('image')(wzh_req, wzh_res, async function (wzh_upErr) {
    var wzh_start = Date.now();
    var wzh_action = '图像识别';
    var wzh_model = wzh_ai.wzh_getTaskModel('vision');

    try {
      if (wzh_upErr) {
        throw new Error('图片上传失败：' + wzh_upErr.message);
      }
      var wzh_file = wzh_req.file;
      if (!wzh_file) {
        throw new Error('没有收到图片，请用 multipart/form-data 的 image 字段上传');
      }

      var wzh_ext = path.extname(wzh_file.originalname || '').toLowerCase();
      if (wzh_IMAGE_EXTS.indexOf(wzh_ext) < 0 && !/^image\//.test(wzh_file.mimetype || '')) {
        throw new Error('只支持 jpg / png / webp / gif / bmp 图片，当前文件是 ' + (wzh_ext || '未知类型'));
      }
      if (wzh_file.size > 10 * 1024 * 1024) {
        throw new Error('图片不能超过 10MB，请压缩后再上传');
      }
      wzh_action = '图像识别：' + wzh_file.originalname;

      if (!wzh_model || !wzh_model.apiKey) {
        throw new Error('视觉模型还没有配置 Key，请检查 backend/.env 的 VISION_MODEL 与 SILICONFLOW_API_KEY');
      }

      var wzh_question = String((wzh_req.body || {}).question || '').trim()
        || '请用简体中文详细描述这张图片：主要物体、场景、颜色、人物动作，以及图片中出现的文字。';

      var wzh_dataUrl = 'data:' + (wzh_file.mimetype || 'image/jpeg') + ';base64,' + wzh_file.buffer.toString('base64');
      var wzh_json = await wzh_chatCompletion(
        wzh_model,
        [
          {
            role: 'user',
            content: [
              { type: 'text', text: wzh_question },
              { type: 'image_url', image_url: { url: wzh_dataUrl } }
            ]
          }
        ],
        0.3,
        800
      );

      var wzh_reply = wzh_json.choices && wzh_json.choices[0] && wzh_json.choices[0].message
        ? wzh_json.choices[0].message.content
        : '';
      if (!wzh_reply) {
        throw new Error('视觉模型没有返回内容，请换一张图片再试');
      }

      wzh_ok(
        wzh_res,
        '图像识别',
        wzh_action,
        wzh_start,
        wzh_model.providerName,
        wzh_json.model || wzh_model.model,
        '图片 ' + Math.round(wzh_file.size / 1024) + 'KB；问题：' + wzh_question.slice(0, 60) + '；答：' + wzh_reply.slice(0, 80),
        {
          reply: wzh_reply,
          model: wzh_json.model || wzh_model.model,
          provider: wzh_model.providerId,
          providerName: wzh_model.providerName,
          image: {
            name: wzh_file.originalname,
            size: wzh_file.size,
            type: wzh_file.mimetype
          },
          usage: wzh_json.usage || null
        },
        '图片识别成功'
      );
    } catch (wzh_err) {
      wzh_fail(wzh_res, '图像识别', wzh_action, wzh_start, wzh_err, wzh_model ? wzh_model.providerName : '', wzh_model ? wzh_model.model : '');
    }
  });
}

/**
 * 功能名称：wzh_asr
 * 功能简介：接收音频文件 → 用 FormData 转发到 /audio/transcriptions →
 *           返回 SenseVoiceSmall 识别出的文字。
 */
function wzh_asr(wzh_req, wzh_res) {
  wzh_upload.single('audio')(wzh_req, wzh_res, async function (wzh_upErr) {
    var wzh_start = Date.now();
    var wzh_action = '语音识别';
    var wzh_model = wzh_ai.wzh_getTaskModel('asr');

    try {
      if (wzh_upErr) {
        throw new Error('音频上传失败：' + wzh_upErr.message);
      }
      var wzh_file = wzh_req.file;
      if (!wzh_file) {
        throw new Error('没有收到音频，请用 multipart/form-data 的 audio 字段上传');
      }

      var wzh_ext = path.extname(wzh_file.originalname || '').toLowerCase();
      if (wzh_AUDIO_EXTS.indexOf(wzh_ext) < 0 && !/^audio\//.test(wzh_file.mimetype || '')) {
        throw new Error('只支持 wav / mp3 / m4a / webm / ogg / flac 音频，当前文件是 ' + (wzh_ext || '未知类型'));
      }
      if (wzh_file.size > 20 * 1024 * 1024) {
        throw new Error('音频不能超过 20MB，请缩短录音再试');
      }
      wzh_action = '语音识别：' + wzh_file.originalname;

      if (!wzh_model || !wzh_model.apiKey) {
        throw new Error('语音模型还没有配置 Key，请检查 backend/.env 的 ASR_MODEL 与 SILICONFLOW_API_KEY');
      }

      var wzh_form = new FormData();
      wzh_form.append('model', wzh_model.model);
      wzh_form.append('file', new Blob([wzh_file.buffer], { type: wzh_file.mimetype || 'audio/wav' }), wzh_file.originalname || 'wzh_audio.wav');

      var wzh_json = await wzh_fetchJson(
        wzh_model.baseUrl.replace(/\/$/, '') + '/audio/transcriptions',
        {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + wzh_model.apiKey },
          body: wzh_form,
          signal: AbortSignal.timeout(90000)
        },
        wzh_model.providerName
      );

      var wzh_text = String(wzh_json.text || wzh_json.result || '').trim();
      if (!wzh_text) {
        throw new Error('语音识别没有返回文字，可能是录音太短或没有声音，请换一段音频再试');
      }

      wzh_ok(
        wzh_res,
        '语音识别',
        wzh_action,
        wzh_start,
        wzh_model.providerName,
        wzh_json.model || wzh_model.model,
        '音频 ' + Math.round(wzh_file.size / 1024) + 'KB；转写：' + wzh_text.slice(0, 100),
        {
          text: wzh_text,
          model: wzh_json.model || wzh_model.model,
          provider: wzh_model.providerId,
          providerName: wzh_model.providerName,
          audio: {
            name: wzh_file.originalname,
            size: wzh_file.size,
            type: wzh_file.mimetype
          },
          usage: wzh_json.usage || null
        },
        '语音识别成功'
      );
    } catch (wzh_err) {
      wzh_fail(wzh_res, '语音识别', wzh_action, wzh_start, wzh_err, wzh_model ? wzh_model.providerName : '', wzh_model ? wzh_model.model : '');
    }
  });
}

/**
 * 功能名称：wzh_llmConfig
 * 功能简介：返回对话平台列表、三个专项模型配置状态与知识库统计，
 *           页面初始化时据此填充下拉框与配置提示。
 */
function wzh_llmConfig(wzh_req, wzh_res) {
  wzh_res.json({
    code: 0,
    msg: 'ok',
    data: {
      defaultProvider: wzh_ai.wzh_defaultProviderId(),
      providers: wzh_ai.wzh_providerList(),
      tasks: wzh_ai.wzh_taskModelList(),
      kb: wzh_kb.wzh_kbStats()
    }
  });
}

/**
 * 功能名称：wzh_llmTraces
 * 功能简介：返回最近的操作痕迹，limit 默认 60，最多 150。
 */
function wzh_llmTraces(wzh_req, wzh_res) {
  var wzh_limit = (wzh_req.query || {}).limit || 60;
  var wzh_list = wzh_trace.wzh_listTraces(wzh_limit);
  wzh_res.json({
    code: 0,
    msg: '共 ' + wzh_list.length + ' 条操作痕迹',
    data: wzh_list
  });
}

/**
 * 功能名称：wzh_llmTracesClear
 * 功能简介：清空操作痕迹，方便重新开始一次课堂演示。
 */
function wzh_llmTracesClear(wzh_req, wzh_res) {
  wzh_trace.wzh_clearTraces();
  wzh_res.json({ code: 0, msg: '操作痕迹已清空', data: null });
}

module.exports = {
  wzh_kbUpload: wzh_kbUpload,
  wzh_kbList: wzh_kbList,
  wzh_kbAsk: wzh_kbAsk,
  wzh_kbDelete: wzh_kbDelete,
  wzh_vision: wzh_vision,
  wzh_asr: wzh_asr,
  wzh_llmConfig: wzh_llmConfig,
  wzh_llmTraces: wzh_llmTraces,
  wzh_llmTracesClear: wzh_llmTracesClear
};
