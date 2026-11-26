/**
 * 姓名：王子涵 | 学号：0807 | 时间：2026-11-23 | 大模型：DeepSeek-V4.1-Flash
 *
 * 功能名称：wzh_aiProviders 大模型平台配置表
 * 功能简介：集中维护「硅基流动」与「七牛云」两个平台的三件套（baseURL / model / API Key），
 *           全部从 backend/.env 读取，换平台只改 .env，不动业务代码；
 *           对外只暴露 Key 是否已配置，绝不返回 Key 原文。
 */

const path = require('path');

// 与数据库模块一致：固定读取 backend/.env，避免从其他目录启动时读不到配置
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

var wzh_PROVIDERS = {
  siliconflow: {
    id: 'siliconflow',
    name: '硅基流动',
    baseUrl: process.env.SILICONFLOW_BASE_URL || 'https://api.siliconflow.cn/v1',
    model: process.env.SILICONFLOW_MODEL || 'deepseek-ai/DeepSeek-V4-Flash',
    apiKey: process.env.SILICONFLOW_API_KEY || ''
  },
  qiniu: {
    id: 'qiniu',
    name: '七牛云',
    baseUrl: process.env.QINIU_BASE_URL || 'https://api.qnaigc.com/v1',
    model: process.env.QINIU_MODEL || 'qiniu/conatus-free',
    apiKey: process.env.QINIU_API_KEY || ''
  }
};

// 课程实践用到的专项模型：图像识别、语音识别、知识库向量化
var wzh_TASK_MODELS = {
  vision: {
    name: '图像识别',
    providerId: process.env.VISION_PROVIDER || 'siliconflow',
    model: process.env.VISION_MODEL || 'Qwen/Qwen3-VL-8B-Instruct'
  },
  asr: {
    name: '语音识别',
    providerId: process.env.ASR_PROVIDER || 'siliconflow',
    model: process.env.ASR_MODEL || 'FunAudioLLM/SenseVoiceSmall'
  },
  embedding: {
    name: '知识库向量',
    providerId: process.env.EMBEDDING_PROVIDER || 'siliconflow',
    model: process.env.EMBEDDING_MODEL || 'BAAI/bge-m3'
  }
};

/**
 * 功能名称：wzh_defaultProviderId
 * 功能简介：返回默认平台 id：优先取 .env 的 CHAT_PROVIDER，
 *           写错或缺失时回落到硅基流动，保证接口永远有可用配置。
 */
function wzh_defaultProviderId() {
  var wzh_id = (process.env.CHAT_PROVIDER || '').trim();
  return wzh_PROVIDERS[wzh_id] ? wzh_id : 'siliconflow';
}

/**
 * 功能名称：wzh_getProvider
 * 功能简介：按平台 id 取配置对象，找不到返回 null，由控制器给出友好提示。
 */
function wzh_getProvider(wzh_id) {
  return wzh_PROVIDERS[wzh_id] || null;
}

/**
 * 功能名称：wzh_providerList
 * 功能简介：返回可展示给前端的平台列表（含模型名与 Key 配置状态，不含 Key 原文）。
 */
function wzh_providerList() {
  return Object.keys(wzh_PROVIDERS).map(function (wzh_id) {
    var wzh_p = wzh_PROVIDERS[wzh_id];
    return {
      id: wzh_p.id,
      name: wzh_p.name,
      baseUrl: wzh_p.baseUrl,
      model: wzh_p.model,
      keyConfigured: Boolean(wzh_p.apiKey)
    };
  });
}

/**
 * 功能名称：wzh_getTaskModel
 * 功能简介：按用途（vision / asr / embedding）返回专项模型配置，
 *           把平台 id 解析成 baseURL 与 Key，供控制器直接调用。
 */
function wzh_getTaskModel(wzh_kind) {
  var wzh_task = wzh_TASK_MODELS[wzh_kind];
  if (!wzh_task) {
    return null;
  }
  var wzh_provider = wzh_getProvider(wzh_task.providerId);
  if (!wzh_provider) {
    return null;
  }
  return {
    kind: wzh_kind,
    name: wzh_task.name,
    providerId: wzh_provider.id,
    providerName: wzh_provider.name,
    baseUrl: wzh_provider.baseUrl,
    apiKey: wzh_provider.apiKey,
    keyConfigured: Boolean(wzh_provider.apiKey),
    model: wzh_task.model
  };
}

/**
 * 功能名称：wzh_taskModelList
 * 功能简介：返回三个专项模型的展示信息（不含 Key 原文），供页面显示配置状态。
 */
function wzh_taskModelList() {
  return Object.keys(wzh_TASK_MODELS).map(function (wzh_kind) {
    var wzh_m = wzh_getTaskModel(wzh_kind);
    return {
      kind: wzh_kind,
      name: wzh_m ? wzh_m.name : wzh_kind,
      providerId: wzh_m ? wzh_m.providerId : '',
      providerName: wzh_m ? wzh_m.providerName : '',
      model: wzh_m ? wzh_m.model : '',
      keyConfigured: wzh_m ? wzh_m.keyConfigured : false
    };
  });
}

module.exports = {
  wzh_defaultProviderId: wzh_defaultProviderId,
  wzh_getProvider: wzh_getProvider,
  wzh_providerList: wzh_providerList,
  wzh_getTaskModel: wzh_getTaskModel,
  wzh_taskModelList: wzh_taskModelList
};
