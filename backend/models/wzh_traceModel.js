/**
 * 姓名：王子涵 | 学号：0807 | 时间：2026-11-25 | 大模型：DeepSeek-V4.1-Flash
 *
 * 功能名称：wzh_traceModel 操作痕迹存储
 * 功能简介：把课程实践里每次知识库上传、问答、图像识别、语音识别、平台切换的结果
 *           追加写入 backend/data/wzh_llm_traces.json，页面可随时读取展示，
 *           作为「LLM 实践操作痕迹」的持久化证据（最多保留 150 条）。
 */

const fs = require('fs');
const path = require('path');

var wzh_DATA_DIR = path.join(__dirname, '..', 'data');
var wzh_TRACE_FILE = path.join(wzh_DATA_DIR, 'wzh_llm_traces.json');
var wzh_MAX_TRACES = 150;

/**
 * 功能名称：wzh_ensureDir
 * 功能简介：确保 data 目录存在，首次运行时自动创建。
 */
function wzh_ensureDir() {
  if (!fs.existsSync(wzh_DATA_DIR)) {
    fs.mkdirSync(wzh_DATA_DIR, { recursive: true });
  }
}

/**
 * 功能名称：wzh_readTraces
 * 功能简介：读取痕迹数组；文件不存在或内容损坏时返回空数组，保证接口不崩。
 */
function wzh_readTraces() {
  wzh_ensureDir();
  if (!fs.existsSync(wzh_TRACE_FILE)) {
    return [];
  }
  try {
    var wzh_raw = fs.readFileSync(wzh_TRACE_FILE, 'utf8');
    var wzh_list = JSON.parse(wzh_raw);
    return Array.isArray(wzh_list) ? wzh_list : [];
  } catch (wzh_err) {
    return [];
  }
}

/**
 * 功能名称：wzh_writeTraces
 * 功能简介：把痕迹数组写回 JSON 文件（格式化的 2 空格缩进，便于直接打开查看）。
 */
function wzh_writeTraces(wzh_list) {
  wzh_ensureDir();
  fs.writeFileSync(wzh_TRACE_FILE, JSON.stringify(wzh_list, null, 2), 'utf8');
}

/**
 * 功能名称：wzh_addTrace
 * 功能简介：追加一条痕迹并返回它；时间用 ISO 字符串，前端负责转成本地时间。
 *           只记录摘要，不记录 API Key、图片或音频的原始内容。
 */
function wzh_addTrace(wzh_entry) {
  var wzh_list = wzh_readTraces();
  var wzh_item = {
    id: 'trace_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    time: new Date().toISOString(),
    module: String(wzh_entry.module || '系统').slice(0, 20),
    action: String(wzh_entry.action || '').slice(0, 80),
    status: wzh_entry.status === 'fail' ? 'fail' : 'success',
    provider: String(wzh_entry.provider || '').slice(0, 30),
    model: String(wzh_entry.model || '').slice(0, 80),
    durationMs: Math.max(0, Number(wzh_entry.durationMs) || 0),
    detail: String(wzh_entry.detail || '').slice(0, 300)
  };

  wzh_list.unshift(wzh_item);
  if (wzh_list.length > wzh_MAX_TRACES) {
    wzh_list = wzh_list.slice(0, wzh_MAX_TRACES);
  }
  wzh_writeTraces(wzh_list);
  return wzh_item;
}

/**
 * 功能名称：wzh_listTraces
 * 功能简介：按时间倒序返回最近 N 条痕迹，默认 60 条。
 */
function wzh_listTraces(wzh_limit) {
  var wzh_list = wzh_readTraces();
  var wzh_n = Math.min(Math.max(Number(wzh_limit) || 60, 1), wzh_MAX_TRACES);
  return wzh_list.slice(0, wzh_n);
}

/**
 * 功能名称：wzh_clearTraces
 * 功能简介：清空全部痕迹（页面上的「清空痕迹」按钮使用）。
 */
function wzh_clearTraces() {
  wzh_writeTraces([]);
  return true;
}

module.exports = {
  wzh_addTrace: wzh_addTrace,
  wzh_listTraces: wzh_listTraces,
  wzh_clearTraces: wzh_clearTraces
};
