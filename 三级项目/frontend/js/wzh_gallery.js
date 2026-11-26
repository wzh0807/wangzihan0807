/**
 * 姓名：王子涵 | 学号：0807 | 时间：2026-11-23 | 大模型：DeepSeek-V4.1-Flash
 *
 * 功能名称：wzh_gallery 图文列表渲染
 * 功能简介：fetch GET /api/gallery，按分类生成筛选按钮并渲染“上图下文”卡片；
 *           图片加载失败时替换为占位色块，不出现破图图标。
 */
(function () {
  'use strict';

  var wzh_box = document.getElementById('wzh_gallery_box');
  var wzh_chips = document.getElementById('wzh_g_chips');
  var wzh_summary = document.getElementById('wzh_g_summary');

  var wzh_API = '/api/gallery';
  var wzh_all = [];
  var wzh_active = '全部';

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
   * 功能简介：给卡片图片绑定 error 事件，加载失败时隐藏 img 并给外层加占位样式。
   */
  function wzh_bindFallback() {
    var wzh_imgs = wzh_box.querySelectorAll('.wzh_g_thumb img');
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
   * 功能名称：wzh_countByCategory
   * 功能简介：统计每个分类的条数，返回 [{name, count}]，按首次出现顺序排列。
   */
  function wzh_countByCategory() {
    var wzh_order = [];
    var wzh_map = {};
    for (var i = 0; i < wzh_all.length; i++) {
      var wzh_c = wzh_all[i].category || '未分类';
      if (!wzh_map[wzh_c]) {
        wzh_map[wzh_c] = 0;
        wzh_order.push(wzh_c);
      }
      wzh_map[wzh_c] += 1;
    }
    return wzh_order.map(function (wzh_name) {
      return { name: wzh_name, count: wzh_map[wzh_name] };
    });
  }

  /**
   * 功能名称：wzh_renderChips
   * 功能简介：生成“全部 + 各分类”的筛选按钮，带条数；当前分类高亮。
   */
  function wzh_renderChips() {
    var wzh_list = [{ name: '全部', count: wzh_all.length }].concat(wzh_countByCategory());
    var wzh_html = '';
    for (var i = 0; i < wzh_list.length; i++) {
      var wzh_c = wzh_list[i];
      wzh_html += '<button type="button" class="wzh_g_chip'
        + (wzh_c.name === wzh_active ? ' wzh_g_active' : '')
        + '" data-wzh-category="' + wzh_escapeHtml(wzh_c.name) + '">'
        + wzh_escapeHtml(wzh_c.name) + '（' + wzh_c.count + '）</button>';
    }
    wzh_chips.innerHTML = wzh_html;
  }

  /**
   * 功能名称：wzh_renderCards
   * 功能简介：把传入的图文数组渲染成卡片网格；空数组时显示空状态。
   */
  function wzh_renderCards(wzh_list) {
    if (!wzh_list.length) {
      wzh_box.innerHTML = '<div class="wzh_empty">该分类下暂无图文数据。</div>';
      return;
    }

    var wzh_html = ['<div class="wzh_g_grid">'];
    for (var i = 0; i < wzh_list.length; i++) {
      var wzh_item = wzh_list[i];
      wzh_html.push(
        '<article class="wzh_g_card">',
        '  <div class="wzh_g_thumb">',
        '    <span class="wzh_g_badge">' + wzh_escapeHtml(wzh_item.category || '未分类') + '</span>',
        '    <img src="' + wzh_escapeHtml(wzh_item.img_url) + '" alt="' + wzh_escapeHtml(wzh_item.title) + '" loading="lazy">',
        '  </div>',
        '  <div class="wzh_g_body">',
        '    <p>' + wzh_escapeHtml(wzh_item.description) + '</p>',
        '    <span class="wzh_g_time">' + wzh_escapeHtml(wzh_item.create_time) + '</span>',
        '  </div>',
        '</article>'
      );
    }
    wzh_html.push('</div>');

    wzh_box.innerHTML = wzh_html.join('\n');
    wzh_bindFallback();
  }

  /**
   * 功能名称：wzh_applyFilter
   * 功能简介：按当前分类筛选数据并重绘卡片与顶部统计条，同时打印本次条数。
   */
  function wzh_applyFilter() {
    var wzh_view = wzh_active === '全部'
      ? wzh_all
      : wzh_all.filter(function (wzh_item) { return (wzh_item.category || '未分类') === wzh_active; });

    wzh_renderChips();
    wzh_renderCards(wzh_view);
    wzh_summary.innerHTML = '本次共返回 <b>' + wzh_view.length + '</b> 条图文（数据来自接口 '
      + '<code>' + wzh_API + '</code> <a href="' + wzh_API + '" target="_blank" rel="noopener">打开 JSON ↗</a>）';
    console.log('[gallery] 当前分类：' + wzh_active + '，共 ' + wzh_view.length + ' 条');
  }

  /**
   * 功能名称：wzh_loadGallery
   * 功能简介：请求接口、打印完整返回、缓存数据并应用当前筛选；失败时给出可读提示。
   */
  async function wzh_loadGallery() {
    try {
      var wzh_resp = await fetch(wzh_API);
      var wzh_json = await wzh_resp.json();

      console.log('[gallery] 接口地址：', wzh_API);
      console.log('[gallery] 完整返回：', wzh_json);

      if (wzh_json.code !== 0) {
        wzh_summary.innerHTML = '接口返回失败：' + wzh_escapeHtml(wzh_json.msg);
        wzh_box.innerHTML = '<div class="wzh_empty">接口返回失败：' + wzh_escapeHtml(wzh_json.msg) + '</div>';
        return;
      }

      wzh_all = Array.isArray(wzh_json.data) ? wzh_json.data : [];
      wzh_applyFilter();
    } catch (wzh_err) {
      console.error('[gallery] 请求失败：', wzh_err);
      wzh_summary.innerHTML = '请求失败：' + wzh_escapeHtml(wzh_err.message);
      wzh_box.innerHTML = '<div class="wzh_empty">请求失败：' + wzh_escapeHtml(wzh_err.message)
        + '<br>请确认后端已启动（http://localhost:8807）。</div>';
    }
  }

  // 事件委托：点击分类按钮切换筛选
  wzh_chips.addEventListener('click', function (wzh_event) {
    var wzh_btn = wzh_event.target.closest('[data-wzh-category]');
    if (!wzh_btn) {
      return;
    }
    wzh_active = wzh_btn.getAttribute('data-wzh-category');
    wzh_applyFilter();
  });

  wzh_loadGallery();
})();
