/**
 * 姓名：王子涵 | 学号：0807 | 时间：2026-11-23 | 大模型：DeepSeek-V4.1-Flash
 *
 * 功能名称：wzh_database 数据库连接测试逻辑
 * 功能简介：收集表单里的用户名密码，POST 到 /api/db-test，把结果按成功/失败着色显示，
 *           同时在控制台打印完整响应，方便排查。
 */
(function () {
  'use strict';

  var wzh_form = document.getElementById('wzh_db_form');
  var wzh_result = document.getElementById('wzh_db_result');
  var wzh_btn = document.getElementById('wzh_db_btn');

  /**
   * 功能名称：wzh_renderResult
   * 功能简介：把结果文字写进结果框，并按成功（绿）/失败（红）切换样式。
   */
  function wzh_renderResult(wzh_text, wzh_type) {
    wzh_result.textContent = wzh_text;
    wzh_result.className = 'wzh_result' + (wzh_type ? ' wzh_' + wzh_type : '');
  }

  /**
   * 功能名称：wzh_submit
   * 功能简介：提交表单——禁用按钮防止重复点击，请求 /api/db-test，
   *           根据返回的 code 渲染提示；请求异常也给出红色提示，页面不白屏。
   */
  async function wzh_submit(wzh_event) {
    wzh_event.preventDefault();

    var wzh_username = document.getElementById('wzh_username').value.trim();
    var wzh_password = document.getElementById('wzh_password').value;

    wzh_btn.disabled = true;
    wzh_btn.textContent = '连接中…';
    wzh_renderResult('正在连接 MySQL，请稍候…', '');

    try {
      var wzh_resp = await fetch('/api/db-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: wzh_username, password: wzh_password })
      });
      var wzh_json = await wzh_resp.json();

      // 前端约定：服务器返回的数据与错误都输出到控制台
      console.log('[db-test] 响应：', wzh_json);

      if (wzh_json.code === 0) {
        var wzh_d = wzh_json.data || {};
        wzh_renderResult(
          '✅ ' + wzh_json.msg + '\n' +
          '数据库版本：' + (wzh_d.version || '未知') + '\n' +
          '当前库名：' + (wzh_d.database || '未选择') + '\n' +
          '登录用户：' + (wzh_d.user || wzh_username),
          'ok'
        );
      } else {
        wzh_renderResult('❌ ' + wzh_json.msg, 'err');
      }
    } catch (wzh_err) {
      console.error('[db-test] 请求失败：', wzh_err);
      // 线上静态托管环境没有后端进程，给出可执行的替代说明
      var wzh_offline = location.hostname !== 'localhost' && location.hostname !== '127.0.0.1';
      var wzh_hint = wzh_offline
        ? '当前是线上静态演示，无法连接本机 MySQL；请在本机运行 start.bat 后打开 http://localhost:8807/database.html 测试。'
        : '请确认后端是否已启动（http://localhost:8807）。';
      wzh_renderResult('❌ 请求失败：' + wzh_err.message + '\n' + wzh_hint, 'err');
    } finally {
      wzh_btn.disabled = false;
      wzh_btn.textContent = '测试连接';
    }
  }

  wzh_form.addEventListener('submit', wzh_submit);
})();
