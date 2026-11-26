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
 * 功能简介：返回 AI 聊天页需要的配置（默认平台、模型名、Key 是否已配置），
 *           不泄露 Key 本身，供页面顶部展示。
 */
function wzh_chatConfig(wzh_req, wzh_res) {
  wzh_res.json({
    code: 0,
    msg: 'ok',
    data: {
      provider: 'siliconflow',
      model: process.env.SILICONFLOW_MODEL || 'Qwen/Qwen2.5-7B-Instruct',
      keyConfigured: Boolean(process.env.SILICONFLOW_API_KEY),
      providers: [
        {
          id: 'siliconflow',
          name: '硅基流动',
          model: process.env.SILICONFLOW_MODEL || 'Qwen/Qwen2.5-7B-Instruct',
          keyConfigured: Boolean(process.env.SILICONFLOW_API_KEY)
        },
        {
          id: 'qiniu',
          name: '七牛',
          model: process.env.QINIU_MODEL || 'qiniu/conatus-free',
          keyConfigured: Boolean(process.env.QINIU_API_KEY)
        }
      ]
    }
  });
}

module.exports = {
  wzh_health: wzh_health,
  wzh_dbTest: wzh_dbTest,
  wzh_newsList: wzh_newsList,
  wzh_galleryList: wzh_galleryList,
  wzh_chatConfig: wzh_chatConfig
};
