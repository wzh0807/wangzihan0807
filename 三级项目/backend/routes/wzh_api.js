/**
 * 姓名：王子涵 | 学号：0807 | 时间：2026-11-23 | 大模型：DeepSeek-V4.1-Flash
 *
 * 功能名称：wzh_api 路由
 * 功能简介：集中定义 /api 下的全部接口路径，只做路由分发，业务逻辑放在控制器。
 */

const express = require('express');
const wzh_ctrl = require('../controllers/wzh_apiController');
const wzh_llm = require('../controllers/wzh_llmController');

var wzh_router = express.Router();

wzh_router.get('/health', wzh_ctrl.wzh_health);
wzh_router.post('/db-test', wzh_ctrl.wzh_dbTest);
wzh_router.get('/news', wzh_ctrl.wzh_newsList);
wzh_router.get('/gallery', wzh_ctrl.wzh_galleryList);
wzh_router.get('/chat/config', wzh_ctrl.wzh_chatConfig);

// LLM 实践：多平台客服、知识库、图像识别、语音识别
wzh_router.get('/chat/providers', wzh_llm.wzh_providers);
wzh_router.post('/chat', wzh_llm.wzh_chat);
wzh_router.post('/kb/upload', wzh_llm.wzh_kbUpload);
wzh_router.get('/kb/list', wzh_llm.wzh_kbList);
wzh_router.post('/kb/chat', wzh_llm.wzh_kbChat);
wzh_router.post('/vision', wzh_llm.wzh_vision);
wzh_router.post('/asr', wzh_llm.wzh_asr);

module.exports = wzh_router;
