/**
 * 姓名：王子涵 | 学号：0807 | 时间：2026-11-23 | 大模型：DeepSeek-V4.1-Flash
 *
 * 功能名称：wzh_newsModel 新闻数据模型
 * 功能简介：负责 wzh_news 表的查询，只处理 SQL，不关心 HTTP。
 */

const { wzh_query } = require('../config/wzh_db');

/**
 * 功能名称：wzh_findAllNews
 * 功能简介：查询全部新闻，按发布时间倒序返回（最新的排最前）。
 */
async function wzh_findAllNews() {
  var wzh_sql = [
    'SELECT id, title, summary, content, source,',
    '       DATE_FORMAT(publish_time, "%Y-%m-%d %H:%i") AS publish_time,',
    '       cover_img',
    '  FROM wzh_news',
    ' ORDER BY publish_time DESC'
  ].join(' ');

  return wzh_query(wzh_sql);
}

module.exports = { wzh_findAllNews: wzh_findAllNews };
