/**
 * 姓名：王子涵 | 学号：0807 | 时间：2026-11-23 | 大模型：DeepSeek-V4.1-Flash
 *
 * 功能名称：wzh_app 后端入口
 * 功能简介：装配 Express 应用——开启跨域、解析 JSON、托管 frontend/ 静态资源、
 *           挂载 /api 路由；端口固定 8807，启动后打印访问地址。
 */

const path = require('path');
const express = require('express');
const cors = require('cors');
const wzh_apiRouter = require('./routes/wzh_api');

var wzh_app = express();
var wzh_PORT = 8807;

// 课程作业环境：开放全部跨域
wzh_app.use(cors());
wzh_app.use(express.json());

// 前端静态资源：frontend/ 下的页面、css、js、images 直接可访问
wzh_app.use(express.static(path.join(__dirname, '..', 'frontend')));

// 全部接口统一 /api 前缀
wzh_app.use('/api', wzh_apiRouter);

// 未匹配到任何路由：统一返回 JSON，避免前端 fetch 到 HTML 导致 Unexpected token '<'
wzh_app.use(function (wzh_req, wzh_res) {
  wzh_res.status(404).json({ code: 404, msg: '接口或页面不存在：' + wzh_req.originalUrl, data: null });
});

// 兜底错误处理：任何未捕获异常都返回统一 JSON
wzh_app.use(function (wzh_err, wzh_req, wzh_res, wzh_next) {
  wzh_res.status(500).json({ code: 500, msg: '服务器内部错误：' + wzh_err.message, data: null });
});

wzh_app.listen(wzh_PORT, function () {
  console.log('====================================');
  console.log('  全栈项目已启动（王子涵 · 0807）');
  console.log('  前端首页： http://localhost:' + wzh_PORT);
  console.log('  健康检查： http://localhost:' + wzh_PORT + '/api/health');
  console.log('  新闻接口： http://localhost:' + wzh_PORT + '/api/news');
  console.log('  图文接口： http://localhost:' + wzh_PORT + '/api/gallery');
  console.log('====================================');
});
