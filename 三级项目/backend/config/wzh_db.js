/**
 * 姓名：王子涵 | 学号：0807 | 时间：2026-11-23 | 大模型：DeepSeek-V4.1-Flash
 *
 * 功能名称：wzh_db 数据库连接模块
 * 功能简介：从 backend/.env 读取数据库凭据，创建 mysql2 连接池，
 *           对外提供 wzh_query（执行 SQL）与 wzh_testConnection（用指定账号临时测试连接）。
 */

const path = require('path');
const mysql = require('mysql2/promise');

// 固定读取 backend/.env，避免从其他目录启动时读不到凭据
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

var wzh_config = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'wzh_fullstack',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 8,
  dateStrings: true
};

// 连接池：接口每次查询直接复用，避免频繁建连
var wzh_pool = mysql.createPool(wzh_config);

/**
 * 功能名称：wzh_query
 * 功能简介：执行一条 SQL 并返回结果行；使用预编译参数防止 SQL 注入。
 */
async function wzh_query(wzh_sql, wzh_params) {
  var wzh_result = await wzh_pool.query(wzh_sql, wzh_params || []);
  return wzh_result[0];
}

/**
 * 功能名称：wzh_testConnection
 * 功能简介：用页面传入（或 .env 中）的账号密码临时建立一次连接，
 *           查询 MySQL 版本号后立即关闭连接；连接失败时把错误抛给上层。
 */
async function wzh_testConnection(wzh_user, wzh_password) {
  var wzh_conn = await mysql.createConnection({
    host: wzh_config.host,
    port: wzh_config.port,
    user: wzh_user || wzh_config.user,
    password: typeof wzh_password === 'string' ? wzh_password : wzh_config.password,
    connectTimeout: 5000
  });

  try {
    var wzh_rows = await wzh_conn.query('SELECT VERSION() AS version, DATABASE() AS db');
    return {
      version: wzh_rows[0][0].version,
      database: wzh_rows[0][0].db || wzh_config.database
    };
  } finally {
    await wzh_conn.end();
  }
}

module.exports = {
  wzh_query: wzh_query,
  wzh_testConnection: wzh_testConnection,
  wzh_config: wzh_config
};
