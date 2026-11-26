/**
 * 姓名：王子涵 | 学号：0807 | 时间：2026-11-23 | 大模型：DeepSeek-V4.1-Flash
 *
 * 功能名称：wzh_gallery 图文列表渲染
 * 功能简介：fetch GET /api/gallery，用网格渲染"上图下文"卡片；
 *           图片加载失败时替换为占位色块，不出现破图图标。
 */
(function () {
  'use strict';

  var wzh_box = document.getElementById('wzh_gallery_box');
  var wzh_api_url = document.getElementById('wzh_api_url');
  var wzh_api_link = document.getElementById('wzh_api_link');

  var wzh_API = '/api/gallery';

  /**
   * 功能名称：wzh_escapeHtml
   * 功能简介：转义文本中的尖括号与引号，避免数据库内容破坏页面结构。
   */
  function wzh_escapeHtml(wzh_str) {
    return String(wzh_str == null ? '' : wzh_str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * 功能名称：wzh_bindFallback
   * 功能简介：给所有卡片图片绑定 error 事件，加载失败时隐藏 img 并给外层加占位样式。
   */
  function wzh_bindFallback() {
    var wzh_imgs = wzh_box.querySelectorAll('.wzh_gallery_thumb img');
    for (var i = 0; i < wzh_imgs.length; i++) {
      wzh_imgs[i].addEventListener('error', function () {
        var wzh_thumb = this.parentNode;
        wzh_thumb.classList.add('wzh_fallback');
        this.style.display = 'none';
        console.warn('[gallery] 图片加载失败：', this.getAttribute('src'));
      });
    }
  }

  /**
   * 功能名称：wzh_renderGallery
   * 功能简介：把图文数组拼成卡片网格；空数组时显示空状态提示。
   */
  function wzh_renderGallery(wzh_list) {
    if (!Array.isArray(wzh_list) || wzh_list.length === 0) {
      wzh_box.innerHTML = '<div class="wzh_empty">数据库里还没有图文数据，请先执行 backend/wzh_database.md 中的 SQL。</div>';
      return;
    }

    var wzh_html = ['<div class="wzh_gallery_grid">'];
    for (var i = 0; i < wzh_list.length; i++) {
      var wzh_item = wzh_list[i];

      wzh_html.push(
        '<article class="wzh_gallery_card">',
        '  <div class="wzh_gallery_thumb">',
        '    <img src="' + wzh_escapeHtml(wzh_item.img_url) + '" alt="' + wzh_escapeHtml(wzh_item.title) + '" loading="lazy">',
        '  </div>',
        '  <div class="wzh_gallery_body">',
        '    <h3>' + wzh_escapeHtml(wzh_item.title) + '</h3>',
        '    <p>' + wzh_escapeHtml(wzh_item.description) + '</p>',
        '    <span class="wzh_tag">' + wzh_escapeHtml(wzh_item.category) + ' · ' + wzh_escapeHtml(wzh_item.create_time) + '</span>',
        '  </div>',
        '</article>'
      );
    }
    wzh_html.push('</div>');

    wzh_box.innerHTML = wzh_html.join('\n');
    wzh_bindFallback();
  }

  /**
   * 功能名称：wzh_loadGallery
   * 功能简介：请求接口、打印完整返回、渲染卡片，并在接口条上补充条数。
   */
  async function wzh_loadGallery() {
    wzh_api_url.textContent = wzh_API;
    wzh_api_link.href = wzh_API;

    try {
      var wzh_resp = await fetch(wzh_API);
      var wzh_json = await wzh_resp.json();

      console.log('[gallery] 接口地址：', wzh_API);
      console.log('[gallery] 完整返回：', wzh_json);

      if (wzh_json.code !== 0) {
        wzh_box.innerHTML = '<div class="wzh_empty">接口返回失败：' + wzh_escapeHtml(wzh_json.msg) + '</div>';
        return;
      }

      wzh_renderGallery(wzh_json.data);
      wzh_api_url.textContent = wzh_API + '（' + (wzh_json.data || []).length + ' 条）';
    } catch (wzh_err) {
      console.error('[gallery] 请求失败：', wzh_err);
      wzh_box.innerHTML = '<div class="wzh_empty">请求失败：' + wzh_escapeHtml(wzh_err.message) + '<br>请确认后端已启动（http://localhost:8807）。</div>';
    }
  }

  wzh_loadGallery();
})();
