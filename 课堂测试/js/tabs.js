/**
 * 作者：王子涵
 * 建立时间：2026-11-02
 * 使用模型：DeepSeek-V4.1-Flash
 * 功能名称：可复用的 Tab 选项卡组件
 * 功能简介：为任意带 data-tabs 属性的容器提供选项卡切换，支持鼠标点击与键盘方向键，
 *          切换时先清除所有选项卡的选中状态，再设置当前元素的选中状态。
 *          所有类名、id 与 JS 变量统一使用 wzh_ 前缀。
 */
(function () {
    'use strict';

    // 选中状态类名与选择器常量，统一使用 wzh_ 前缀
    var wzh_ACTIVE_CLASS = 'wzh_is_active';
    var wzh_TAB_SELECTOR = '[role="tab"]';
    var wzh_PANEL_SELECTOR = '[role="tabpanel"]';

    /**
     * 功能名称：wzh_activateTab 激活指定选项卡
     * 功能简介：先清除当前容器内所有选项卡的选中状态（类名、aria-selected、tabIndex）
     *          并隐藏全部面板，再把传入的选项卡及其关联面板设为选中状态。
     * @param {HTMLElement} wzh_tab 被点击或键盘选中的选项卡按钮
     */
    function wzh_activateTab(wzh_tab) {
        if (!wzh_tab) return;

        var wzh_container = wzh_tab.closest('[data-tabs]');
        if (!wzh_container) return;

        var wzh_tabs = wzh_container.querySelectorAll(wzh_TAB_SELECTOR);
        var wzh_panels = wzh_container.querySelectorAll(wzh_PANEL_SELECTOR);

        // 第一步：清除所有选项卡的选中状态，保证同一时间只有一个选项卡生效
        wzh_tabs.forEach(function (wzh_item) {
            wzh_item.classList.remove(wzh_ACTIVE_CLASS);
            wzh_item.setAttribute('aria-selected', 'false');
            wzh_item.tabIndex = -1;
        });
        wzh_panels.forEach(function (wzh_panel) {
            wzh_panel.classList.remove(wzh_ACTIVE_CLASS);
            wzh_panel.hidden = true;
        });

        // 第二步：设置当前元素的选中状态，并显示其对应的面板
        wzh_tab.classList.add(wzh_ACTIVE_CLASS);
        wzh_tab.setAttribute('aria-selected', 'true');
        wzh_tab.tabIndex = 0;

        var wzh_panelTarget = wzh_container.querySelector('#' + wzh_tab.getAttribute('aria-controls'));
        if (wzh_panelTarget) {
            wzh_panelTarget.classList.add(wzh_ACTIVE_CLASS);
            wzh_panelTarget.hidden = false;
        }
    }

    /**
     * 功能名称：wzh_handleKeydown 选项卡键盘导航
     * 功能简介：在选项卡上按左右方向键、Home 或 End 时移动焦点并立即切换，
     *          让选项卡在不使用鼠标时同样可以操作。
     * @param {KeyboardEvent} wzh_event 键盘事件
     */
    function wzh_handleKeydown(wzh_event) {
        var wzh_key = wzh_event.key;
        if (wzh_key !== 'ArrowLeft' && wzh_key !== 'ArrowRight' && wzh_key !== 'Home' && wzh_key !== 'End') return;

        var wzh_tabs = Array.prototype.slice.call(wzh_event.currentTarget.querySelectorAll(wzh_TAB_SELECTOR));
        var wzh_current = wzh_tabs.indexOf(wzh_event.target);
        if (wzh_current === -1) return;

        wzh_event.preventDefault();

        var wzh_next = wzh_current;
        if (wzh_key === 'ArrowLeft') wzh_next = (wzh_current - 1 + wzh_tabs.length) % wzh_tabs.length;
        if (wzh_key === 'ArrowRight') wzh_next = (wzh_current + 1) % wzh_tabs.length;
        if (wzh_key === 'Home') wzh_next = 0;
        if (wzh_key === 'End') wzh_next = wzh_tabs.length - 1;

        wzh_tabs[wzh_next].focus();
        wzh_activateTab(wzh_tabs[wzh_next]);
    }

    /**
     * 功能名称：wzh_initTabs 初始化单个选项卡容器
     * 功能简介：通过事件委托为选项卡列表绑定点击与键盘事件，并激活默认选项卡；
     *          同一容器重复调用会被忽略，因此可以在一个页面里初始化多个选项卡。
     * @param {HTMLElement} wzh_container 带 data-tabs 属性的容器
     */
    function wzh_initTabs(wzh_container) {
        if (!wzh_container || wzh_container.dataset.wzhReady === 'true') return;

        var wzh_tabList = wzh_container.querySelector('[role="tablist"]');
        if (!wzh_tabList) return;

        // 点击监听：由选项卡列表统一接收，再判断点击是否落在某个选项卡上
        wzh_tabList.addEventListener('click', function (wzh_event) {
            var wzh_tab = wzh_event.target.closest(wzh_TAB_SELECTOR);
            if (wzh_tab && wzh_tabList.contains(wzh_tab)) wzh_activateTab(wzh_tab);
        });

        // 键盘监听：支持方向键、Home、End 切换
        wzh_tabList.addEventListener('keydown', wzh_handleKeydown);

        wzh_container.dataset.wzhReady = 'true';

        // 激活默认项：优先使用 data-tab-default 指定的 id，否则取第一个选项卡
        var wzh_defaultId = wzh_container.getAttribute('data-tab-default');
        var wzh_defaultTab = wzh_defaultId
            ? wzh_container.querySelector('#' + wzh_defaultId)
            : wzh_container.querySelector(wzh_TAB_SELECTOR);

        wzh_activateTab(wzh_defaultTab);
    }

    /**
     * 功能名称：wzh_autoInit 自动初始化
     * 功能简介：DOM 解析完成后扫描页面上所有 data-tabs 容器并逐一初始化，
     *          以后新增同类结构时不必再写额外脚本。
     */
    function wzh_autoInit() {
        document.querySelectorAll('[data-tabs]').forEach(wzh_initTabs);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', wzh_autoInit);
    } else {
        wzh_autoInit();
    }

    // 暴露到全局，页面动态添加选项卡容器时可手动调用
    window.WZH = window.WZH || {};
    window.WZH.initTabs = wzh_initTabs;
})();
