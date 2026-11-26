/**
 * 姓名：王子涵 | 学号：0807 | 时间：2026-11-23 | 大模型：DeepSeek-V4.1-Flash
 *
 * 功能名称：wzh_galleryModel 图文数据模型
 * 功能简介：负责 wzh_gallery 表的查询，只处理 SQL，不关心 HTTP。
 */

const { wzh_query } = require('../config/wzh_db');

/**
 * 功能名称：wzh_findAllGallery
 * 功能简介：查询全部图文数据，按创建时间倒序返回。
 */
async function wzh_findAllGallery() {
  var wzh_sql = [
    'SELECT id, title, description, img_url, category,',
    '       DATE_FORMAT(create_time, "%Y-%m-%d %H:%i") AS create_time',
    '  FROM wzh_gallery',
    ' ORDER BY create_time DESC'
  ].join(' ');

  return wzh_query(wzh_sql);
}

module.exports = { wzh_findAllGallery: wzh_findAllGallery };
