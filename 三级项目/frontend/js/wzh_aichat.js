/**
 * 姓名：王子涵 | 学号：0807 | 时间：2026-11-23 | 大模型：DeepSeek-V4.1-Flash
 *
 * 功能名称：wzh_aichat AI 聊天交互
 * 功能简介：维护多轮消息数组，把用户输入连同历史消息 POST 给 /api/chat，
 *           把模型回复渲染成气泡；请求期间显示"正在思考"，失败时显示错误气泡。
 */
(function () {
  'use strict';

  var wzh_box = document.getElementById('wzh_chat_box');
  var wzh_form = document.getElementById('wzh_chat_form');
  var wzh_input = document.getElementById('wzh_chat_input');
  var wzh_btn = document.getElementById('wzh_chat_btn');
  var wzh_clear = document.getElementById('wzh_chat_clear');
  var wzh_model = document.getElementById('wzh_chat_model');
  var wzh_api_url = document.getElementById('wzh_api_url');
  var wzh_api_link = document.getElementById('wzh_api_link');

  var wzh_API = '/api/chat';
  var wzh_MAX_ROUNDS = 10; // 最多保留最近 10 轮，加上 system 提示

  // 发给模型的消息数组：第一条固定为 system 设定
  var wzh_messages = [
    { role: 'system', content: '你是《高级网页设计》课程全栈项目里的 AI 助手，用简体中文回答，尽量简洁准确。' }
  ];

  /**
   * 功能名称：wzh_escapeHtml
   * 功能简介：转义尖括号与引号，避免模型回复里的 HTML 破坏页面结构。
   */
  function wzh_escapeHtml(wzh_str) {
    return String(wzh_str == null ? '' : wzh_str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * 功能名称：wzh_scrollBottom
   * 功能简介：把聊天区滚动到底部，保证最新一条消息可见。
   */
  function wzh_scrollBottom() {
    wzh_box.scrollTop = wzh_box.scrollHeight;
  }

  /**
   * 功能名称：wzh_pushBubble
   * 功能简介：在聊天区追加一个气泡（role 为 user / ai），返回该气泡元素，
   *           供"正在思考"占位后替换文字使用。
   */
  function wzh_pushBubble(wzh_role, wzh_text) {
    var wzh_el = document.createElement('div');
    wzh_el.className = 'wzh_msg ' + (wzh_role === 'user' ? 'wzh_msg_user' : 'wzh_msg_ai');
    wzh_el.innerHTML = '<div class="wzh_msg_text">' + wzh_escapeHtml(wzh_text) + '</div>';
    wzh_box.appendChild(wzh_el);
    wzh_scrollBottom();
    return wzh_el;
  }

  /**
   * 功能名称：wzh_trimHistory
   * 功能简介：只保留 system 提示与最近 wzh_MAX_ROUNDS 轮对话，避免请求体无限变长。
   */
  function wzh_trimHistory() {
    var wzh_body = wzh_messages.slice(1);
    if (wzh_body.length > wzh_MAX_ROUNDS * 2) {
      wzh_messages = [wzh_messages[0]].concat(wzh_body.slice(wzh_body.length - wzh_MAX_ROUNDS * 2));
    }
  }

  /**
   * 功能名称：wzh_send
   * 功能简介：提交表单——把用户输入加入消息数组并渲染气泡，显示思考占位，
   *           请求 /api/chat 成功后把占位替换为回复；失败显示红色错误气泡。
   */
  async function wzh_send(wzh_event) {
    if (wzh_event) {
      wzh_event.preventDefault();
    }

    var wzh_text = wzh_input.value.trim();
    if (!wzh_text) {
      wzh_input.focus();
      return;
    }

    wzh_messages.push({ role: 'user', content: wzh_text });
    wzh_trimHistory();
    wzh_pushBubble('user', wzh_text);

    wzh_input.value = '';
    wzh_btn.disabled = true;
    wzh_btn.textContent = '思考中…';

    var wzh_loading = wzh_pushBubble('ai', '正在思考…');
    wzh_loading.classList.add('wzh_msg_loading');

    try {
      var wzh_resp = await fetch(wzh_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: wzh_messages })
      });
      var wzh_json = await wzh_resp.json();

      // 前端约定：服务器返回的数据与错误都输出到控制台
      console.log('[chat] 响应：', wzh_json);

      if (wzh_json.code === 0 && wzh_json.data && wzh_json.data.reply) {
        var wzh_reply = wzh_json.data.reply;
        wzh_messages.push({ role: 'assistant', content: wzh_reply });
        wzh_loading.querySelector('.wzh_msg_text').textContent = wzh_reply;
        wzh_loading.classList.remove('wzh_msg_loading');
        if (wzh_json.data.model) {
          wzh_model.textContent = wzh_json.data.model;
        }
      } else {
        wzh_loading.classList.remove('wzh_msg_loading');
        wzh_loading.classList.add('wzh_msg_err');
        wzh_loading.querySelector('.wzh_msg_text').textContent = '回复失败：' + (wzh_json.msg || '未知错误');
      }
    } catch (wzh_err) {
      console.error('[chat] 请求失败：', wzh_err);
      var wzh_offline = location.hostname !== 'localhost' && location.hostname !== '127.0.0.1';
      wzh_loading.classList.remove('wzh_msg_loading');
      wzh_loading.classList.add('wzh_msg_err');
      wzh_loading.querySelector('.wzh_msg_text').textContent = wzh_offline
        ? '线上静态环境没有后端代理，请在本机运行 start.bat 后访问 http://localhost:8807/ai-chat.html。'
        : '请求失败：' + wzh_err.message + '\n请确认后端已启动（http://localhost:8807）。';
    } finally {
      wzh_btn.disabled = false;
      wzh_btn.textContent = '发送';
      wzh_scrollBottom();
      wzh_input.focus();
    }
  }

  /**
   * 功能名称：wzh_clearChat
   * 功能简介：清空对话——重置消息数组、清空气泡区并放回欢迎语。
   */
  function wzh_clearChat() {
    wzh_messages = [wzh_messages[0]];
    wzh_box.innerHTML = '';
    wzh_pushBubble('ai', '对话已清空，我们重新开始。');
    wzh_input.value = '';
    wzh_input.focus();
  }

  /**
   * 功能名称：wzh_keydown
   * 功能简介：Enter 直接发送，Shift + Enter 保留换行。
   */
  function wzh_keydown(wzh_event) {
    if (wzh_event.key === 'Enter' && !wzh_event.shiftKey) {
      wzh_event.preventDefault();
      wzh_send();
    }
  }

  /**
   * 功能名称：wzh_init
   * 功能简介：初始化页面——显示接口地址、绑定事件，并尝试读取后端配置的模型名。
   */
  async function wzh_init() {
    wzh_api_url.textContent = wzh_API;
    wzh_api_link.href = wzh_API;

    wzh_form.addEventListener('submit', wzh_send);
    wzh_input.addEventListener('keydown', wzh_keydown);
    wzh_clear.addEventListener('click', wzh_clearChat);

    try {
      var wzh_resp = await fetch('/api/chat/config');
      var wzh_json = await wzh_resp.json();
      console.log('[chat] 配置探测：', wzh_json);
      if (wzh_json.code === 0 && wzh_json.data && wzh_json.data.model) {
        wzh_model.textContent = wzh_json.data.model;
      }
      if (wzh_json.code === 0 && wzh_json.data && !wzh_json.data.keyConfigured) {
        wzh_pushBubble('ai', '提示：后端还没有配置 SILICONFLOW_API_KEY，发送消息会失败。');
      }
    } catch (wzh_err) {
      console.warn('[chat] 配置探测失败：', wzh_err);
    }
  }

  wzh_init();
})();
