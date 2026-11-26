/**
 * 姓名：王子涵 | 学号：0807 | 时间：2026-11-23 | 大模型：DeepSeek-V4.1-Flash
 *
 * 功能名称：wzh_api 路由
 * 功能简介：集中定义 /api 下的全部接口路径，只做路由分发，业务逻辑放在控制器。
 */

const express = require('express');
const wzh_ctrl = require('../controllers/wzh_apiController');
const wzh_practice = require('../controllers/wzh_llmPracticeController');

var wzh_router = express.Router();

wzh_router.get('/health', wzh_ctrl.wzh_health);
wzh_router.post('/db-test', wzh_ctrl.wzh_dbTest);
wzh_router.get('/news', wzh_ctrl.wzh_newsList);
wzh_router.get('/gallery', wzh_ctrl.wzh_galleryList);
wzh_router.post('/chat', wzh_ctrl.wzh_chat);
wzh_router.get('/chat/config', wzh_ctrl.wzh_chatConfig);

// 课程实践：LLM 操作痕迹展示
wzh_router.get('/llm/config', wzh_practice.wzh_llmConfig);
wzh_router.get('/llm/traces', wzh_practice.wzh_llmTraces);
wzh_router.post('/llm/traces/clear', wzh_practice.wzh_llmTracesClear);
wzh_router.post('/kb/upload', wzh_practice.wzh_kbUpload);
wzh_router.get('/kb/list', wzh_practice.wzh_kbList);
wzh_router.post('/kb/ask', wzh_practice.wzh_kbAsk);
wzh_router.delete('/kb/:id', wzh_practice.wzh_kbDelete);
wzh_router.post('/vision', wzh_practice.wzh_vision);
wzh_router.post('/asr', wzh_practice.wzh_asr);

module.exports = wzh_router;
