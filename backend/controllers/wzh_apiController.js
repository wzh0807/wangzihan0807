/**
 * 姓名：王子涵 | 学号：0807 | 时间：2026-11-23 | 大模型：DeepSeek-V4.1-Flash
 *
 * 功能名称：wzh_apiController 接口控制器集合
 * 功能简介：把各接口的处理逻辑集中在这里，统一返回 { code, msg, data }，
 *           出错时把真实错误信息写进 msg 便于前端定位。
 */

const { wzh_testConnection } = require('../config/wzh_db');
const { wzh_findAllNews } = require('../models/wzh_newsModel');
const { wzh_findAllGallery } = require('../models/wzh_galleryModel');
const wzh_ai = require('../config/wzh_aiProviders');
const wzh_trace = require('../models/wzh_traceModel');

/**
 * 功能名称：wzh_health
 * 功能简介：健康检查，返回服务名、端口与运行时长，用于确认后端已启动。
 */
function wzh_health(wzh_req, wzh_res) {
  wzh_res.json({
    code: 0,
    msg: 'ok',
    data: {
      service: 'wzh-fullstack-init',
      port: 8807,
      uptime: Math.round(process.uptime()) + 's',
      time: new Date().toLocaleString('zh-CN')
    }
  });
}

/**
 * 功能名称：wzh_dbTest
 * 功能简介：接收前端传来的用户名与密码，用 mysql2 实际连一次 MySQL；
 *           成功返回数据库版本，失败返回 code=-1 与 MySQL 的原始错误信息。
 */
async function wzh_dbTest(wzh_req, wzh_res) {
  var wzh_body = wzh_req.body || {};
  var wzh_user = (wzh_body.username || '').trim();
  var wzh_password = typeof wzh_body.password === 'string' ? wzh_body.password : '';

  try {
    var wzh_info = await wzh_testConnection(wzh_user, wzh_password);
    wzh_res.json({
      code: 0,
      msg: '数据库连接成功',
      data: {
        version: wzh_info.version,
        database: wzh_info.database,
        user: wzh_user || 'root'
      }
    });
  } catch (wzh_err) {
    wzh_res.json({
      code: -1,
      msg: '数据库连接失败：' + wzh_err.message,
      data: { code: wzh_err.code || 'UNKNOWN' }
    });
  }
}

/**
 * 功能名称：wzh_newsList
 * 功能简介：返回全部科技新闻（按发布时间倒序），前端 news.html 消费。
 */
async function wzh_newsList(wzh_req, wzh_res) {
  try {
    var wzh_list = await wzh_findAllNews();
    wzh_res.json({ code: 0, msg: '新闻列表获取成功，共 ' + wzh_list.length + ' 条', data: wzh_list });
  } catch (wzh_err) {
    wzh_res.json({ code: -1, msg: '新闻列表获取失败：' + wzh_err.message, data: [] });
  }
}

/**
 * 功能名称：wzh_galleryList
 * 功能简介：返回全部图文数据（按创建时间倒序），前端 gallery.html 消费。
 */
async function wzh_galleryList(wzh_req, wzh_res) {
  try {
    var wzh_list = await wzh_findAllGallery();
    wzh_res.json({ code: 0, msg: '图文列表获取成功，共 ' + wzh_list.length + ' 条', data: wzh_list });
  } catch (wzh_err) {
    wzh_res.json({ code: -1, msg: '图文列表获取失败：' + wzh_err.message, data: [] });
  }
}

/**
 * 功能名称：wzh_chatConfig
 * 功能简介：返回 AI 聊天页需要的平台配置——默认平台、全部可选平台、
 *           各平台的模型名与 Key 是否已配置；只给状态，绝不返回 Key 原文。
 */
function wzh_chatConfig(wzh_req, wzh_res) {
  var wzh_defaultId = wzh_ai.wzh_defaultProviderId();
  var wzh_list = wzh_ai.wzh_providerList();
  var wzh_current = wzh_list[0];

  for (var i = 0; i < wzh_list.length; i++) {
    if (wzh_list[i].id === wzh_defaultId) {
      wzh_current = wzh_list[i];
    }
  }

  wzh_res.json({
    code: 0,
    msg: 'ok',
    data: {
      defaultProvider: wzh_defaultId,
      provider: wzh_current.id,
      model: wzh_current.model,
      keyConfigured: wzh_current.keyConfigured,
      providers: wzh_list
    }
  });
}

/**
 * 功能名称：wzh_friendlyError
 * 功能简介：把大模型平台返回的 HTTP 状态码翻译成课程要求的中文提示，
 *           让页面直接显示「Key 无效 / 余额不足 / 模型名或地址写错」等原因。
 */
function wzh_friendlyError(wzh_name, wzh_status, wzh_raw) {
  if (wzh_status === 401) {
    return wzh_name + ' 返回 401：Key 无效或已过期，请检查请求头是否为 Bearer sk-xxx，并确认复制时没带空格换行';
  }
  if (wzh_status === 402) {
    return wzh_name + ' 返回 402：余额不足，请到平台领取免费额度或先切换到另一个平台';
  }
  if (wzh_status === 404) {
    return wzh_name + ' 返回 404：先检查 baseURL 末尾是否带 /v1，再核对 model 是否与平台文档完全一致';
  }
  if (wzh_status === 429) {
    return wzh_name + ' 返回 429：请求太频繁，已触发限流，请等几秒再发';
  }
  if (wzh_status >= 500) {
    return wzh_name + ' 服务异常（' + wzh_status + '）：请稍后重试或切换平台';
  }
  return wzh_name + ' 返回 ' + wzh_status + '：' + String(wzh_raw || '').slice(0, 200);
}

/**
 * 功能名称：wzh_chat
 * 功能简介：接收前端传来的消息数组与平台 id，按平台转发给 /v1/chat/completions，
 *           把模型回复包成统一 JSON 返回；未配置 Key、参数非法或上游失败都返回 code=-1，
 *           并把平台报错翻译成中文提示。
 *           副作用：会发起一次外部 HTTPS 请求，最多等待 60 秒。
 */
async function wzh_chat(wzh_req, wzh_res) {
  var wzh_start = Date.now();
  var wzh_body = wzh_req.body || {};
  var wzh_messages = Array.isArray(wzh_body.messages) ? wzh_body.messages : [];

  // 平台热切换：前端传 provider，没传就用 .env 的 CHAT_PROVIDER
  var wzh_providerId = String(wzh_body.provider || '').trim() || wzh_ai.wzh_defaultProviderId();
  var wzh_provider = wzh_ai.wzh_getProvider(wzh_providerId);

  if (!wzh_provider) {
    var wzh_msgBadProvider = '不支持的平台：' + wzh_providerId + '（可选 siliconflow / qiniu）';
    wzh_trace.wzh_addTrace({
      module: 'AI客服', action: '对话 · 平台切换', status: 'fail', provider: wzh_providerId,
      durationMs: Date.now() - wzh_start, detail: wzh_msgBadProvider
    });
    return wzh_res.json({ code: -1, msg: wzh_msgBadProvider, data: null });
  }

  if (!wzh_provider.apiKey) {
    var wzh_msgNoKey = wzh_provider.name + ' 还没有配置 API Key，请在 backend/.env 填写后重启后端';
    wzh_trace.wzh_addTrace({
      module: 'AI客服', action: '对话 · ' + wzh_provider.name, status: 'fail', provider: wzh_provider.id,
      model: wzh_provider.model, durationMs: Date.now() - wzh_start, detail: wzh_msgNoKey
    });
    return wzh_res.json({ code: -1, msg: wzh_msgNoKey, data: { provider: wzh_provider.id } });
  }

  // 只保留合法角色与文本：单条最长 2000 字，最多取最近 20 条
  var wzh_clean = [];
  for (var i = 0; i < wzh_messages.length && i < 20; i++) {
    var wzh_m = wzh_messages[i] || {};
    var wzh_text = typeof wzh_m.content === 'string' ? wzh_m.content.slice(0, 2000) : '';
    if ((wzh_m.role === 'system' || wzh_m.role === 'user' || wzh_m.role === 'assistant') && wzh_text.trim()) {
      wzh_clean.push({ role: wzh_m.role, content: wzh_text });
    }
  }

  if (!wzh_clean.length || wzh_clean[wzh_clean.length - 1].role !== 'user') {
    wzh_trace.wzh_addTrace({
      module: 'AI客服', action: '对话 · ' + wzh_provider.name, status: 'fail', provider: wzh_provider.id,
      model: wzh_provider.model, durationMs: Date.now() - wzh_start, detail: '缺少用户消息'
    });
    return wzh_res.json({ code: -1, msg: '缺少用户消息（messages 最后一条必须是 user）', data: null });
  }

  var wzh_question = wzh_clean[wzh_clean.length - 1].content;

  try {
    // 两个平台都兼容 OpenAI 的 /chat/completions，所以这里只换 baseURL 与 model
    var wzh_up = await fetch(wzh_provider.baseUrl.replace(/\/$/, '') + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + wzh_provider.apiKey
      },
      body: JSON.stringify({
        model: wzh_provider.model,
        messages: wzh_clean,
        temperature: 0.7,
        max_tokens: 1024
      }),
      signal: AbortSignal.timeout(60000)
    });

    var wzh_raw = await wzh_up.text();
    if (!wzh_up.ok) {
      var wzh_msgUpstream = wzh_friendlyError(wzh_provider.name, wzh_up.status, wzh_raw);
      wzh_trace.wzh_addTrace({
        module: 'AI客服', action: '对话 · ' + wzh_provider.name, status: 'fail', provider: wzh_provider.id,
        model: wzh_provider.model, durationMs: Date.now() - wzh_start, detail: wzh_msgUpstream
      });
      return wzh_res.json({
        code: -1,
        msg: wzh_msgUpstream,
        data: { provider: wzh_provider.id, status: wzh_up.status }
      });
    }

    var wzh_json = JSON.parse(wzh_raw);
    var wzh_reply = wzh_json.choices && wzh_json.choices[0] && wzh_json.choices[0].message
      ? wzh_json.choices[0].message.content
      : '';

    wzh_trace.wzh_addTrace({
      module: 'AI客服',
      action: '对话 · ' + wzh_provider.name,
      status: 'success',
      provider: wzh_provider.id,
      model: wzh_json.model || wzh_provider.model,
      durationMs: Date.now() - wzh_start,
      detail: '问：' + wzh_question.slice(0, 60) + '；答：' + String(wzh_reply || '').slice(0, 80)
    });

    wzh_res.json({
      code: 0,
      msg: '回复成功',
      data: {
        reply: wzh_reply,
        model: wzh_json.model || wzh_provider.model,
        provider: wzh_provider.id,
        providerName: wzh_provider.name,
        usage: wzh_json.usage || null
      }
    });
  } catch (wzh_err) {
    wzh_trace.wzh_addTrace({
      module: 'AI客服', action: '对话 · ' + wzh_provider.name, status: 'fail', provider: wzh_provider.id,
      model: wzh_provider.model, durationMs: Date.now() - wzh_start, detail: '调用失败：' + wzh_err.message
    });
    wzh_res.json({ code: -1, msg: '调用大模型失败：' + wzh_err.message, data: null });
  }
}

module.exports = {
  wzh_health: wzh_health,
  wzh_dbTest: wzh_dbTest,
  wzh_newsList: wzh_newsList,
  wzh_galleryList: wzh_galleryList,
  wzh_chat: wzh_chat,
  wzh_chatConfig: wzh_chatConfig
};
