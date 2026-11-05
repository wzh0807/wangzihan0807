/**
 * 作者：王子涵
 * 建立时间：2026-11-02
 * 使用模型：DeepSeek-V4.1-Flash
 * 功能名称：可复用的 Tab 选项卡组件
 * 功能简介：为任意带 data-tabs 属性的容器提供选项卡切换，支持鼠标点击与键盘方向键，
 *          切换时先清除所有选项卡的选中状态，再设置当前元素的选中状态。
 */
(function () {
    'use strict';

    /**
     * 功能名称：激活指定选项卡
     * 功能简介：先清除当前容器内所有选项卡的选中状态（类名、aria-selected、tabIndex）
     *          并隐藏全部面板，再把传入的选项卡及其关联面板设为选中状态。
     * @param {HTMLElement} tab 被点击或键盘选中的选项卡按钮
     */
    function activateTab(tab) {
        if (!tab) return;

        var container = tab.closest('[data-tabs]');
        if (!container) return;

        var tabs = container.querySelectorAll('[role="tab"]');
        var panels = container.querySelectorAll('[role="tabpanel"]');

        // 第一步：清除所有选项卡的选中状态，保证同一时间只有一个选项卡生效
        tabs.forEach(function (item) {
            item.classList.remove('is-active');
            item.setAttribute('aria-selected', 'false');
            item.tabIndex = -1;
        });
        panels.forEach(function (panel) {
            panel.classList.remove('is-active');
            panel.hidden = true;
        });

        // 第二步：设置当前元素的选中状态，并显示其对应的面板
        tab.classList.add('is-active');
        tab.setAttribute('aria-selected', 'true');
        tab.tabIndex = 0;

        var panel = container.querySelector('#' + tab.getAttribute('aria-controls'));
        if (panel) {
            panel.classList.add('is-active');
            panel.hidden = false;
        }
    }

    /**
     * 功能名称：选项卡键盘导航
     * 功能简介：在选项卡上按左右方向键、Home 或 End 时移动焦点并立即切换，
     *          让选项卡在不使用鼠标时同样可以操作。
     * @param {KeyboardEvent} event 键盘事件
     */
    function handleKeydown(event) {
        var key = event.key;
        if (key !== 'ArrowLeft' && key !== 'ArrowRight' && key !== 'Home' && key !== 'End') return;

        var tabs = Array.prototype.slice.call(event.currentTarget.querySelectorAll('[role="tab"]'));
        var current = tabs.indexOf(event.target);
        if (current === -1) return;

        event.preventDefault();

        var next = current;
        if (key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length;
        if (key === 'ArrowRight') next = (current + 1) % tabs.length;
        if (key === 'Home') next = 0;
        if (key === 'End') next = tabs.length - 1;

        tabs[next].focus();
        activateTab(tabs[next]);
    }

    /**
     * 功能名称：初始化单个选项卡容器
     * 功能简介：通过事件委托为 tablist 绑定点击与键盘事件，并激活默认选项卡；
     *          同一容器重复调用会被忽略，因此可以在一个页面里初始化多个选项卡。
     * @param {HTMLElement} container 带 data-tabs 属性的容器
     */
    function initTabs(container) {
        if (!container || container.dataset.tabsReady === 'true') return;

        var tabList = container.querySelector('[role="tablist"]');
        if (!tabList) return;

        // 点击监听：由 tablist 统一接收，再判断点击是否落在某个选项卡上
        tabList.addEventListener('click', function (event) {
            var tab = event.target.closest('[role="tab"]');
            if (tab && tabList.contains(tab)) activateTab(tab);
        });

        // 键盘监听：支持方向键、Home、End 切换
        tabList.addEventListener('keydown', handleKeydown);

        container.dataset.tabsReady = 'true';

        // 激活默认项：优先使用 data-tab-default 指定的 id，否则取第一个选项卡
        var defaultId = container.getAttribute('data-tab-default');
        var defaultTab = defaultId
            ? container.querySelector('#' + defaultId)
            : container.querySelector('[role="tab"]');

        activateTab(defaultTab);
    }

    /**
     * 功能名称：自动初始化
     * 功能简介：DOM 解析完成后扫描页面上所有 data-tabs 容器并逐一初始化，
     *          以后新增同类结构时不必再写额外脚本。
     */
    function autoInit() {
        document.querySelectorAll('[data-tabs]').forEach(initTabs);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoInit);
    } else {
        autoInit();
    }

    // 暴露到全局，页面动态添加选项卡容器时可手动调用
    window.WZH = window.WZH || {};
    window.WZH.initTabs = initTabs;
})();
