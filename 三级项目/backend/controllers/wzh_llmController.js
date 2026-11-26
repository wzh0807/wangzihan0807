/**
 * 姓名：王子涵 | 学号：0807 | 时间：2026-11-26 | 大模型：DeepSeek-V4.1-Flash
 *
 * 功能名称：wzh_llmController LLM 实践控制器
 * 功能简介：LLM 实践页的四类能力都集中在这里——多平台热切换的 AI 客服、知识库上传与检索问答、
 *           图像识别、语音识别；Key 一律从 backend/.env 读取，绝不返回给前端。
 */

const fs = require('fs');
const path = require('path');

// 知识库持久化文件：后端重启后已上传的文件仍然存在
const wzh_KB_DIR = path.join(__dirname, '..', 'data');
const wzh_KB_FILE = path.join(wzh_KB_DIR, 'wzh_kb.json');
const wzh_KB_MAX_CONTENT = 200 * 1024; // 单个文本文件最大 200KB
const wzh_KB_CHUNK = 400;              // 每个知识块大约 400 字

/**
 * 功能名称：wzh_providerConfig
 * 功能简介：按平台 id 返回该平台的 baseURL / Key / 模型名，全部来自 .env；
 *           平台不存在时返回 null。
 */
function wzh_providerConfig(wzh_id) {
  var wzh_map = {
    siliconflow: {
      id: 'siliconflow',
      name: '硅基流动',
      base: (process.env.SILICONFLOW_BASE_URL || 'https://api.siliconflow.cn/v1').replace(/\/$/, ''),
      key: process.env.SILICONFLOW_API_KEY || '',
      model: process.env.SILICONFLOW_MODEL || 'Qwen/Qwen2.5-7B-Instruct',
      visionModel: process.env.SILICONFLOW_VISION_MODEL || 'Qwen/Qwen2.5-VL-32B-Instruct'
    },
    qiniu: {
      id: 'qiniu',
      name: '七牛',
      base: (process.env.QINIU_BASE_URL || 'https://api.qnaigc.com/v1').replace(/\/$/, ''),
      key: process.env.QINIU_API_KEY || '',
      model: process.env.QINIU_MODEL || 'qiniu/conatus-free',
      visionModel: ''
    }
  };
  return wzh_map[wzh_id] || null;
}

/**
 * 功能名称：wzh_pickProvider
 * 功能简介：从请求体里取 provider（默认 siliconflow），校验平台是否存在且 Key 已配置；
 *           返回 { cfg } 或 { error }，error 是可直接返回给前端的中文提示。
 */
function wzh_pickProvider(wzh_body) {
  var wzh_id = (wzh_body && wzh_body.provider) || 'siliconflow';
  var wzh_cfg = wzh_providerConfig(wzh_id);
  if (!wzh_cfg) {
    return { error: '未知平台：' + wzh_id + '（可选 siliconflow / qiniu）' };
  }
  if (!wzh_cfg.key) {
    return { error: '后端未配置 ' + (wzh_id === 'qiniu' ? 'QINIU_API_KEY' : 'SILICONFLOW_API_KEY') + '，请检查 backend/.env 并重启后端' };
  }
  return { cfg: wzh_cfg };
}

/**
 * 功能名称：wzh_cleanMessages
 * 功能简介：只保留合法角色与文本消息（单条 ≤2000 字，最多 20 条），
 *           返回清洗后的数组，供转发给大模型使用。
 */
function wzh_cleanMessages(wzh_messages) {
  var wzh_clean = [];
  if (!Array.isArray(wzh_messages)) {
    return wzh_clean;
  }
  for (var i = 0; i < wzh_messages.length && i < 20; i++) {
    var wzh_m = wzh_messages[i] || {};
    var wzh_text = typeof wzh_m.content === 'string' ? wzh_m.content.slice(0, 2000) : '';
    if ((wzh_m.role === 'system' || wzh_m.role === 'user' || wzh_m.role === 'assistant') && wzh_text.trim()) {
      wzh_clean.push({ role: wzh_m.role, content: wzh_text });
    }
  }
  return wzh_clean;
}

/**
 * 功能名称：wzh_callChat
 * 功能简介：把消息数组转发到指定平台的 /chat/completions，返回上游解析后的 JSON；
 *           上游非 2xx 时抛出带状态码与响应片段的错误。副作用：发起一次外部 HTTPS 请求。
 */
async function wzh_callChat(wzh_cfg, wzh_messages, wzh_extra) {
  var wzh_payload = Object.assign({
    model: wzh_cfg.model,
    messages: wzh_messages,
    temperature: 0.7,
    max_tokens: 1024
  }, wzh_extra || {});

  var wzh_up = await fetch(wzh_cfg.base + '/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + wzh_cfg.key
    },
    body: JSON.stringify(wzh_payload),
    signal: AbortSignal.timeout(60000)
  });

  var wzh_raw = await wzh_up.text();
  if (!wzh_up.ok) {
    throw new Error('上游返回 ' + wzh_up.status + '：' + wzh_raw.slice(0, 300));
  }
  return JSON.parse(wzh_raw);
}

/**
 * 功能名称：wzh_providers
 * 功能简介：列出两个平台及其模型、Key 是否已配置，前端下拉框据此渲染并提示可用状态。
 */
function wzh_providers(wzh_req, wzh_res) {
  var wzh_list = ['siliconflow', 'qiniu'].map(function (wzh_id) {
    var wzh_cfg = wzh_providerConfig(wzh_id);
    return {
      id: wzh_cfg.id,
      name: wzh_cfg.name,
      model: wzh_cfg.model,
      keyConfigured: Boolean(wzh_cfg.key)
    };
  });
  wzh_res.json({ code: 0, msg: 'ok', data: { providers: wzh_list, default: 'siliconflow' } });
}

/**
 * 功能名称：wzh_chat
 * 功能简介：AI 客服对话入口。接收 { provider, messages }，按 provider 选择平台的
 *           baseURL / Key / 模型后转发；成功返回 reply 与实际平台、模型。
 */
async function wzh_chat(wzh_req, wzh_res) {
  var wzh_body = wzh_req.body || {};
  var wzh_picked = wzh_pickProvider(wzh_body);

  if (wzh_picked.error) {
    return wzh_res.json({ code: -1, msg: wzh_picked.error, data: null });
  }

  var wzh_clean = wzh_cleanMessages(wzh_body.messages);
  if (!wzh_clean.length || wzh_clean[wzh_clean.length - 1].role !== 'user') {
    return wzh_res.json({ code: -1, msg: '缺少用户消息（messages 最后一条必须是 user）', data: null });
  }

  try {
    var wzh_json = await wzh_callChat(wzh_picked.cfg, wzh_clean);
    var wzh_reply = wzh_json.choices && wzh_json.choices[0] && wzh_json.choices[0].message
      ? wzh_json.choices[0].message.content
      : '';

    wzh_res.json({
      code: 0,
      msg: '回复成功',
      data: {
        reply: wzh_reply,
        provider: wzh_picked.cfg.id,
        providerName: wzh_picked.cfg.name,
        model: wzh_json.model || wzh_picked.cfg.model,
        usage: wzh_json.usage || null
      }
    });
  } catch (wzh_err) {
    wzh_res.json({ code: -1, msg: '调用大模型失败：' + wzh_err.message, data: null });
  }
}

/**
 * 功能名称：wzh_loadKb
 * 功能简介：读取 data/wzh_kb.json 里的知识库数据；文件不存在或格式损坏时返回空结构。
 */
function wzh_loadKb() {
  try {
    var wzh_raw = fs.readFileSync(wzh_KB_FILE, 'utf8');
    var wzh_json = JSON.parse(wzh_raw);
    if (wzh_json && Array.isArray(wzh_json.files)) {
      return wzh_json;
    }
  } catch (wzh_err) {
    // 首次运行没有文件，属于正常情况
  }
  return { files: [] };
}

/**
 * 功能名称：wzh_saveKb
 * 功能简介：把知识库数据写回 data/wzh_kb.json，目录不存在时自动创建。副作用：写磁盘。
 */
function wzh_saveKb(wzh_data) {
  if (!fs.existsSync(wzh_KB_DIR)) {
    fs.mkdirSync(wzh_KB_DIR, { recursive: true });
  }
  fs.writeFileSync(wzh_KB_FILE, JSON.stringify(wzh_data, null, 2), 'utf8');
}

/**
 * 功能名称：wzh_splitChunks
 * 功能简介：按空行切段，再把过长的段落切开，合并成约 400 字一块的数组，
 *           保证每块既能独立表达意思，又不会超过模型上下文。
 */
function wzh_splitChunks(wzh_text) {
  var wzh_norm = String(wzh_text || '').replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n');
  var wzh_paras = wzh_norm.split(/\n{2,}/);
  var wzh_chunks = [];
  var wzh_buf = '';

  function wzh_flush() {
    var wzh_t = wzh_buf.trim();
    if (wzh_t) {
      wzh_chunks.push(wzh_t);
    }
    wzh_buf = '';
  }

  for (var i = 0; i < wzh_paras.length; i++) {
    var wzh_p = wzh_paras[i].trim();
    if (!wzh_p) {
      continue;
    }
    if (wzh_p.length > wzh_KB_CHUNK) {
      wzh_flush();
      for (var j = 0; j < wzh_p.length; j += wzh_KB_CHUNK) {
        wzh_chunks.push(wzh_p.slice(j, j + wzh_KB_CHUNK));
      }
      continue;
    }
    if ((wzh_buf + '\n' + wzh_p).trim().length > wzh_KB_CHUNK) {
      wzh_flush();
    }
    wzh_buf = wzh_buf ? wzh_buf + '\n' + wzh_p : wzh_p;
  }
  wzh_flush();
  return wzh_chunks;
}

/**
 * 功能名称：wzh_kbUpload
 * 功能简介：接收前端读出的文本 { name, content }，切块后追加到知识库并落盘；
 *           返回文件名、块数与总字数，前端据此提示上传成功。
 */
function wzh_kbUpload(wzh_req, wzh_res) {
  var wzh_body = wzh_req.body || {};
  var wzh_name = String(wzh_body.name || '').trim().slice(0, 120);
  var wzh_content = typeof wzh_body.content === 'string' ? wzh_body.content : '';

  if (!wzh_name) {
    return wzh_res.json({ code: -1, msg: '缺少文件名', data: null });
  }
  if (!wzh_content.trim()) {
    return wzh_res.json({ code: -1, msg: '文件内容为空，或该格式无法按文本读取（请上传 txt / md 等文本文件）', data: null });
  }
  if (Buffer.byteLength(wzh_content, 'utf8') > wzh_KB_MAX_CONTENT) {
    return wzh_res.json({ code: -1, msg: '文件超过 200KB，请换一个更小的文本文件', data: null });
  }

  var wzh_chunks = wzh_splitChunks(wzh_content);
  if (!wzh_chunks.length) {
    return wzh_res.json({ code: -1, msg: '没有解析出可用内容', data: null });
  }

  var wzh_data = wzh_loadKb();
  var wzh_item = {
    id: 'kb_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    name: wzh_name,
    size: Buffer.byteLength(wzh_content, 'utf8'),
    chars: wzh_content.length,
    chunkCount: wzh_chunks.length,
    chunks: wzh_chunks,
    time: new Date().toLocaleString('zh-CN')
  };
  wzh_data.files.push(wzh_item);
  wzh_saveKb(wzh_data);

  wzh_res.json({
    code: 0,
    msg: '知识库上传成功：' + wzh_name + '，切分为 ' + wzh_chunks.length + ' 块',
    data: {
      id: wzh_item.id,
      name: wzh_item.name,
      size: wzh_item.size,
      chars: wzh_item.chars,
      chunkCount: wzh_item.chunkCount,
      time: wzh_item.time
    }
  });
}

/**
 * 功能名称：wzh_kbList
 * 功能简介：返回知识库里全部文件的元信息（不含正文与分块），供前端列表展示。
 */
function wzh_kbList(wzh_req, wzh_res) {
  var wzh_data = wzh_loadKb();
  var wzh_list = wzh_data.files.map(function (wzh_f) {
    return {
      id: wzh_f.id,
      name: wzh_f.name,
      size: wzh_f.size,
      chars: wzh_f.chars,
      chunkCount: wzh_f.chunkCount,
      time: wzh_f.time
    };
  });
  wzh_res.json({ code: 0, msg: '知识库共 ' + wzh_list.length + ' 个文件', data: wzh_list });
}

/**
 * 功能名称：wzh_extractTerms
 * 功能简介：把问题拆成检索关键词——英文/数字取整词，中文按二字切分，
 *           去重后最多 40 个，作为关键词检索的打分依据。
 */
function wzh_extractTerms(wzh_question) {
  var wzh_s = String(wzh_question || '').toLowerCase();
  var wzh_terms = wzh_s.match(/[a-z0-9_]{2,}/g) || [];
  var wzh_cn = wzh_s.match(/[\u4e00-\u9fa5]+/g) || [];

  for (var i = 0; i < wzh_cn.length; i++) {
    var wzh_seg = wzh_cn[i];
    if (wzh_seg.length <= 2) {
      wzh_terms.push(wzh_seg);
    } else {
      for (var j = 0; j < wzh_seg.length - 1; j++) {
        wzh_terms.push(wzh_seg.slice(j, j + 2));
      }
    }
  }

  var wzh_seen = {};
  var wzh_result = [];
  for (var k = 0; k < wzh_terms.length; k++) {
    if (!wzh_seen[wzh_terms[k]] && wzh_terms[k].length >= 2) {
      wzh_seen[wzh_terms[k]] = true;
      wzh_result.push(wzh_terms[k]);
    }
  }
  return wzh_result.slice(0, 40);
}

/**
 * 功能名称：wzh_retrieve
 * 功能简介：对全部知识块做关键词打分（命中次数 × 词长），取分数最高的前 3 块；
 *           全部为 0 分时退回前 3 块，保证模型至少拿到一些资料。返回 { chunks, matched }。
 */
function wzh_retrieve(wzh_question) {
  var wzh_data = wzh_loadKb();
  var wzh_terms = wzh_extractTerms(wzh_question);
  var wzh_scored = [];
  var wzh_index = 0;

  wzh_data.files.forEach(function (wzh_f) {
    wzh_f.chunks.forEach(function (wzh_c) {
      var wzh_low = wzh_c.toLowerCase();
      var wzh_score = 0;
      for (var t = 0; t < wzh_terms.length; t++) {
        var wzh_term = wzh_terms[t];
        var wzh_pos = wzh_low.indexOf(wzh_term);
        while (wzh_pos !== -1) {
          wzh_score += wzh_term.length;
          wzh_pos = wzh_low.indexOf(wzh_term, wzh_pos + wzh_term.length);
        }
      }
      wzh_scored.push({ score: wzh_score, file: wzh_f.name, text: wzh_c, order: wzh_index++ });
    });
  });

  wzh_scored.sort(function (a, b) { return b.score - a.score || a.order - b.order; });
  var wzh_top = wzh_scored.filter(function (wzh_s) { return wzh_s.score > 0; }).slice(0, 3);
  if (!wzh_top.length) {
    wzh_top = wzh_scored.slice(0, 3);
  }

  return {
    matched: wzh_top.map(function (wzh_s) {
      return { file: wzh_s.file, score: wzh_s.score, text: wzh_s.text };
    }),
    chunks: wzh_top
  };
}

/**
 * 功能名称：wzh_kbChat
 * 功能简介：知识库问答——先做关键词检索，把命中的片段拼进 system 提示，
 *           再按所选平台调用大模型；返回回答、引用片段与所用平台。
 */
async function wzh_kbChat(wzh_req, wzh_res) {
  var wzh_body = wzh_req.body || {};
  var wzh_picked = wzh_pickProvider(wzh_body);
  var wzh_question = String(wzh_body.question || '').trim();

  if (wzh_picked.error) {
    return wzh_res.json({ code: -1, msg: wzh_picked.error, data: null });
  }
  if (!wzh_question) {
    return wzh_res.json({ code: -1, msg: '请先输入问题', data: null });
  }

  var wzh_kb = wzh_retrieve(wzh_question);
  if (!wzh_kb.matched.length) {
    return wzh_res.json({ code: -1, msg: '知识库还是空的，请先上传 txt / md 文件', data: null });
  }

  var wzh_context = wzh_kb.matched.map(function (wzh_m, wzh_i) {
    return '【片段' + (wzh_i + 1) + ' · 来源：' + wzh_m.file + '】\n' + wzh_m.text;
  }).join('\n\n');

  var wzh_messages = [
    {
      role: 'system',
      content: '你是课程知识库问答助手。请只依据下面提供的资料回答，资料没有提到的内容要明确说“资料中没有提到”，不要编造。\n\n资料：\n' + wzh_context
    },
    { role: 'user', content: wzh_question.slice(0, 2000) }
  ];

  try {
    var wzh_json = await wzh_callChat(wzh_picked.cfg, wzh_messages, { temperature: 0.3 });
    var wzh_reply = wzh_json.choices && wzh_json.choices[0] && wzh_json.choices[0].message
      ? wzh_json.choices[0].message.content
      : '';

    wzh_res.json({
      code: 0,
      msg: '知识库回答成功',
      data: {
        reply: wzh_reply,
        provider: wzh_picked.cfg.id,
        providerName: wzh_picked.cfg.name,
        model: wzh_json.model || wzh_picked.cfg.model,
        matched: wzh_kb.matched
      }
    });
  } catch (wzh_err) {
    wzh_res.json({ code: -1, msg: '知识库问答失败：' + wzh_err.message, data: null });
  }
}

/**
 * 功能名称：wzh_vision
 * 功能简介：图像识别——接收 data URI 图片与问题，用硅基流动视觉模型
 *           走 /chat/completions 的 image_url 消息；返回识别文字描述。
 */
async function wzh_vision(wzh_req, wzh_res) {
  var wzh_body = wzh_req.body || {};
  var wzh_image = typeof wzh_body.image === 'string' ? wzh_body.image : '';
  var wzh_question = String(wzh_body.question || '请描述这张图片的内容，并指出图中的关键文字或物体。').slice(0, 500);

  if (!/^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(wzh_image)) {
    return wzh_res.json({ code: -1, msg: '图片格式不正确，请上传 png / jpg / webp 图片', data: null });
  }
  if (wzh_image.length > 8 * 1024 * 1024) {
    return wzh_res.json({ code: -1, msg: '图片太大（Base64 超过 8MB），请压缩后再上传', data: null });
  }

  var wzh_cfg = wzh_providerConfig('siliconflow');
  if (!wzh_cfg.key) {
    return wzh_res.json({ code: -1, msg: '后端未配置 SILICONFLOW_API_KEY，请检查 backend/.env', data: null });
  }
  if (!wzh_cfg.visionModel) {
    return wzh_res.json({ code: -1, msg: '后端未配置 SILICONFLOW_VISION_MODEL', data: null });
  }

  var wzh_messages = [
    {
      role: 'user',
      content: [
        { type: 'text', text: wzh_question },
        { type: 'image_url', image_url: { url: wzh_image } }
      ]
    }
  ];

  try {
    var wzh_up = await fetch(wzh_cfg.base + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + wzh_cfg.key
      },
      body: JSON.stringify({
        model: wzh_cfg.visionModel,
        messages: wzh_messages,
        temperature: 0.2,
        max_tokens: 800
      }),
      signal: AbortSignal.timeout(60000)
    });

    var wzh_raw = await wzh_up.text();
    if (!wzh_up.ok) {
      return wzh_res.json({ code: -1, msg: '视觉模型返回 ' + wzh_up.status + '：' + wzh_raw.slice(0, 300), data: null });
    }

    var wzh_json = JSON.parse(wzh_raw);
    var wzh_reply = wzh_json.choices && wzh_json.choices[0] && wzh_json.choices[0].message
      ? wzh_json.choices[0].message.content
      : '';

    wzh_res.json({
      code: 0,
      msg: '图像识别成功',
      data: {
        reply: wzh_reply,
        model: wzh_json.model || wzh_cfg.visionModel,
        usage: wzh_json.usage || null
      }
    });
  } catch (wzh_err) {
    wzh_res.json({ code: -1, msg: '图像识别失败：' + wzh_err.message, data: null });
  }
}

/**
 * 功能名称：wzh_asr
 * 功能简介：语音识别——接收前端录音/上传音频的 Base64，转成 Blob 后
 *           以 multipart 调硅基流动 /audio/transcriptions，返回识别出的文字。
 */
async function wzh_asr(wzh_req, wzh_res) {
  var wzh_body = wzh_req.body || {};
  var wzh_audio = typeof wzh_body.audio === 'string' ? wzh_body.audio : '';
  var wzh_mime = String(wzh_body.mime || 'audio/webm').slice(0, 60);
  var wzh_name = String(wzh_body.name || 'wzh_record.webm').slice(0, 80);

  if (!wzh_audio) {
    return wzh_res.json({ code: -1, msg: '没有收到音频数据', data: null });
  }
  if (wzh_audio.length > 24 * 1024 * 1024) {
    return wzh_res.json({ code: -1, msg: '音频太大（Base64 超过 24MB），请缩短录音时间', data: null });
  }

  var wzh_cfg = wzh_providerConfig('siliconflow');
  var wzh_model = process.env.SILICONFLOW_ASR_MODEL || 'FunAudioLLM/SenseVoiceSmall';
  if (!wzh_cfg.key) {
    return wzh_res.json({ code: -1, msg: '后端未配置 SILICONFLOW_API_KEY，请检查 backend/.env', data: null });
  }

  try {
    var wzh_buf = Buffer.from(wzh_audio, 'base64');
    var wzh_form = new FormData();
    wzh_form.append('file', new Blob([wzh_buf], { type: wzh_mime }), wzh_name);
    wzh_form.append('model', wzh_model);

    var wzh_up = await fetch(wzh_cfg.base + '/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + wzh_cfg.key },
      body: wzh_form,
      signal: AbortSignal.timeout(90000)
    });

    var wzh_raw = await wzh_up.text();
    if (!wzh_up.ok) {
      return wzh_res.json({ code: -1, msg: '语音识别接口返回 ' + wzh_up.status + '：' + wzh_raw.slice(0, 300), data: null });
    }

    var wzh_json = JSON.parse(wzh_raw);
    var wzh_text = wzh_json.text || (wzh_json.data && wzh_json.data.text) || '';
    wzh_res.json({
      code: 0,
      msg: '语音识别成功',
      data: { text: wzh_text, model: wzh_json.model || wzh_model }
    });
  } catch (wzh_err) {
    wzh_res.json({ code: -1, msg: '语音识别失败：' + wzh_err.message, data: null });
  }
}

module.exports = {
  wzh_providers: wzh_providers,
  wzh_chat: wzh_chat,
  wzh_kbUpload: wzh_kbUpload,
  wzh_kbList: wzh_kbList,
  wzh_kbChat: wzh_kbChat,
  wzh_vision: wzh_vision,
  wzh_asr: wzh_asr
};
