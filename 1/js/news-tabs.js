/*
  作者：王子涵
  建立时间：2026-11-16
  使用模型：DeepSeek-V4.1-Flash
  功能名称：可复用 Tab 选项卡组件
  功能简介：为任意带 data-tabs 属性的容器提供选项卡切换能力。
            切换时先清除全部选项卡的选中状态，再设置当前元素；
            支持点击事件委托与键盘方向键，同一页面可放多组选项卡互不干扰。
*/

(function () {
  'use strict';

  var wzh_TAB_SELECTOR = '.wzh_tab';          // 选项卡按钮
  var wzh_PANEL_SELECTOR = '.wzh_panel';      // 对应面板
  var wzh_ACTIVE_CLASS = 'wzh_is_active';     // 选中态类名
  var wzh_READY_FLAG = 'data-tabs-ready';    // 防止同一容器重复初始化

  /**
   * 功能名称：wzh_activateTab
   * 功能简介：把指定选项卡设为选中态。
   *           步骤是「先清除、后设置」：
   *           ① 遍历该容器内全部选项卡，移除 wzh_is_active、aria-selected 置 false、tabIndex 置 -1；
   *           ② 遍历全部面板，统一加 hidden 隐藏；
   *           ③ 再给当前选项卡加选中类、aria-selected 置 true、tabIndex 置 0，并显示对应面板。
   *           副作用：直接改写 DOM 的类名、属性与 hidden；不返回值。
   * 参数：wzh_tabsRoot 选项卡容器；wzh_tab 目标选项卡按钮。
   */
  function wzh_activateTab(wzh_tabsRoot, wzh_tab) {
    var wzh_tabs = wzh_tabsRoot.querySelectorAll(wzh_TAB_SELECTOR);
    var wzh_panels = wzh_tabsRoot.querySelectorAll(wzh_PANEL_SELECTOR);
    var wzh_i;

    // ① 清除所有选项卡的选中状态
    for (wzh_i = 0; wzh_i < wzh_tabs.length; wzh_i++) {
      wzh_tabs[wzh_i].classList.remove(wzh_ACTIVE_CLASS);
      wzh_tabs[wzh_i].setAttribute('aria-selected', 'false');
      wzh_tabs[wzh_i].tabIndex = -1;
    }

    // ② 隐藏所有面板
    for (wzh_i = 0; wzh_i < wzh_panels.length; wzh_i++) {
      wzh_panels[wzh_i].hidden = true;
    }

    // ③ 设置当前选项卡为选中状态
    wzh_tab.classList.add(wzh_ACTIVE_CLASS);
    wzh_tab.setAttribute('aria-selected', 'true');
    wzh_tab.tabIndex = 0;

    // 通过 aria-controls 找到该选项卡负责的面板并显示
    var wzh_panelId = wzh_tab.getAttribute('aria-controls');
    var wzh_panel = wzh_panelId ? wzh_tabsRoot.querySelector('#' + wzh_panelId) : null;
    if (wzh_panel) wzh_panel.hidden = false;
  }

  /**
   * 功能名称：wzh_handleClick
   * 功能简介：选项卡栏的点击事件处理（事件委托）。
   *           用 closest 判断点击目标是否落在某个 .wzh_tab 上，
   *           命中则调用 wzh_activateTab 切换，避免给每个按钮单独绑定事件。
   */
  function wzh_handleClick(wzh_event) {
    var wzh_tab = wzh_event.target.closest(wzh_TAB_SELECTOR);
    if (!wzh_tab) return;
    var wzh_tabsRoot = wzh_tab.closest('[data-tabs]');
    if (!wzh_tabsRoot) return;
    wzh_activateTab(wzh_tabsRoot, wzh_tab);
  }

  /**
   * 功能名称：wzh_handleKeydown
   * 功能简介：选项卡栏的键盘事件处理，支持 ← → 切换、Home 跳到第一个、End 跳到最后一个。
   *           切换后把焦点同步到新选项卡，保证键盘操作连贯。
   */
  function wzh_handleKeydown(wzh_event) {
    var wzh_tab = wzh_event.target.closest(wzh_TAB_SELECTOR);
    if (!wzh_tab) return;

    var wzh_tabsRoot = wzh_tab.closest('[data-tabs]');
    if (!wzh_tabsRoot) return;

    var wzh_tabs = Array.prototype.slice.call(wzh_tabsRoot.querySelectorAll(wzh_TAB_SELECTOR));
    var wzh_current = wzh_tabs.indexOf(wzh_tab);
    var wzh_next = -1;

    if (wzh_event.key === 'ArrowRight') {
      wzh_next = (wzh_current + 1) % wzh_tabs.length;
    } else if (wzh_event.key === 'ArrowLeft') {
      wzh_next = (wzh_current - 1 + wzh_tabs.length) % wzh_tabs.length;
    } else if (wzh_event.key === 'Home') {
      wzh_next = 0;
    } else if (wzh_event.key === 'End') {
      wzh_next = wzh_tabs.length - 1;
    } else {
      return;
    }

    wzh_event.preventDefault();
    wzh_activateTab(wzh_tabsRoot, wzh_tabs[wzh_next]);
    wzh_tabs[wzh_next].focus();
  }

  /**
   * 功能名称：wzh_initTabs
   * 功能简介：初始化一个选项卡容器。
   *           读取 data-tab-default 指定默认项（缺省为 0），调用一次 wzh_activateTab 落地初始状态，
   *           再在选项卡栏上挂 click 与 keydown 事件（每容器只挂一次）。
   * 参数：wzh_tabsRoot 带 data-tabs 的容器元素。
   */
  function wzh_initTabs(wzh_tabsRoot) {
    if (!wzh_tabsRoot || wzh_tabsRoot.hasAttribute(wzh_READY_FLAG)) return;

    var wzh_tabs = wzh_tabsRoot.querySelectorAll(wzh_TAB_SELECTOR);
    if (!wzh_tabs.length) return;

    var wzh_default = parseInt(wzh_tabsRoot.getAttribute('data-tab-default'), 10);
    if (isNaN(wzh_default) || wzh_default < 0 || wzh_default >= wzh_tabs.length) wzh_default = 0;

    // 落地初始选中状态（同样走「先清除后设置」的同一套逻辑）
    wzh_activateTab(wzh_tabsRoot, wzh_tabs[wzh_default]);

    // 事件监听挂在选项卡栏容器上，采用事件委托
    var wzh_tablist = wzh_tabsRoot.querySelector('.wzh_tablist');
    if (wzh_tablist) {
      wzh_tablist.addEventListener('click', wzh_handleClick);
      wzh_tablist.addEventListener('keydown', wzh_handleKeydown);
    }

    wzh_tabsRoot.setAttribute(wzh_READY_FLAG, 'true');
  }

  /**
   * 功能名称：wzh_autoInit
   * 功能简介：页面加载后自动扫描所有 [data-tabs] 容器并逐个初始化。
   *           后续动态插入的新容器可再次调用 wzh_autoInit 或直接调用 wzh_initTabs。
   */
  function wzh_autoInit() {
    var wzh_roots = document.querySelectorAll('[data-tabs]');
    for (var wzh_i = 0; wzh_i < wzh_roots.length; wzh_i++) {
      wzh_initTabs(wzh_roots[wzh_i]);
    }
  }

  // 暴露到全局，便于页面动态添加容器时手动初始化
  window.wzh_tabs = {
    init: wzh_initTabs,
    initAll: wzh_autoInit
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wzh_autoInit);
  } else {
    wzh_autoInit();
  }
})();
