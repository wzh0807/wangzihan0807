/**
 * 姓名：王子涵 | 学号：0807 | 时间：2026-11-23 | 大模型：DeepSeek-V4.1-Flash
 *
 * 功能名称：wzh_news 科技新闻列表渲染
 * 功能简介：fetch GET /api/news，把返回的新闻数组渲染成列表；
 *           控制台输出完整返回数据，失败时页面给出可读提示。
 */
(function () {
  'use strict';

  var wzh_box = document.getElementById('wzh_news_box');
  var wzh_api_url = document.getElementById('wzh_api_url');
  var wzh_api_link = document.getElementById('wzh_api_link');

  var wzh_API = '/api/news';

  /**
   * 功能名称：wzh_escapeHtml
   * 功能简介：转义标题等文本里的尖括号，避免数据库内容破坏页面结构。
   */
  function wzh_escapeHtml(wzh_str) {
    return String(wzh_str == null ? '' : wzh_str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * 功能名称：wzh_renderNews
   * 功能简介：把新闻数组拼成列表 HTML；空数组时显示空状态提示。
   */
  function wzh_renderNews(wzh_list) {
    if (!Array.isArray(wzh_list) || wzh_list.length === 0) {
      wzh_box.innerHTML = '<div class="wzh_empty">数据库里还没有新闻数据，请先执行 backend/wzh_database.md 中的 SQL。</div>';
      return;
    }

    var wzh_html = ['<div class="wzh_news_list">'];
    for (var i = 0; i < wzh_list.length; i++) {
      var wzh_item = wzh_list[i];
      var wzh_cover = wzh_item.cover_img || './images/gallery-1.svg';

      wzh_html.push(
        '<article class="wzh_news_item">',
        '  <img src="' + wzh_escapeHtml(wzh_cover) + '" alt="' + wzh_escapeHtml(wzh_item.title) + '封面" loading="lazy">',
        '  <div>',
        '    <h2 class="wzh_news_title">' + wzh_escapeHtml(wzh_item.title) + '</h2>',
        '    <p class="wzh_news_summary">' + wzh_escapeHtml(wzh_item.summary) + '</p>',
        '    <div class="wzh_news_meta">',
        '      <span class="wzh_src">' + wzh_escapeHtml(wzh_item.source) + '</span>',
        '      <span>' + wzh_escapeHtml(wzh_item.publish_time) + '</span>',
        '      <span># ' + wzh_escapeHtml(wzh_item.id) + '</span>',
        '    </div>',
        '  </div>',
        '</article>'
      );
    }
    wzh_html.push('</div>');

    wzh_box.innerHTML = wzh_html.join('\n');
  }

  /**
   * 功能名称：wzh_loadNews
   * 功能简介：请求接口并渲染；同时把接口地址与条数写回页面，
   *           便于答辩时"页面看接口"。
   */
  async function wzh_loadNews() {
    wzh_api_url.textContent = wzh_API;
    wzh_api_link.href = wzh_API;

    try {
      var wzh_resp = await fetch(wzh_API);
      var wzh_json = await wzh_resp.json();

      console.log('[news] 接口地址：', wzh_API);
      console.log('[news] 完整返回：', wzh_json);

      if (wzh_json.code !== 0) {
        wzh_box.innerHTML = '<div class="wzh_empty">接口返回失败：' + wzh_escapeHtml(wzh_json.msg) + '</div>';
        return;
      }

      wzh_renderNews(wzh_json.data);

      // 顶部接口条补充显示条数
      wzh_api_url.textContent = wzh_API + '（' + (wzh_json.data || []).length + ' 条）';
    } catch (wzh_err) {
      console.error('[news] 请求失败：', wzh_err);
      wzh_box.innerHTML = '<div class="wzh_empty">请求失败：' + wzh_escapeHtml(wzh_err.message) + '<br>请确认后端已启动（http://localhost:8807）。</div>';
    }
  }

  wzh_loadNews();
})();
