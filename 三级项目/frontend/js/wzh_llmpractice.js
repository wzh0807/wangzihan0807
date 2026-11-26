/**
 * 姓名：王子涵 | 学号：0807 | 时间：2026-11-26 | 大模型：DeepSeek-V4.1-Flash
 *
 * 功能名称：wzh_llmpractice LLM 实践页交互
 * 功能简介：驱动 LLM 实践页四块能力——双平台 AI 客服、知识库上传与问答、图像识别、语音识别；
 *           每次请求都写入操作痕迹面板并 console.log 输出，方便现场演示与课后复查。
 */
(function () {
  'use strict';

  // ---------- 公共元素 ----------
  var wzh_traceBox = document.getElementById('wzh_trace_box');
  var wzh_traceClear = document.getElementById('wzh_trace_clear');

  // ---------- AI 客服 ----------
  var wzh_providerSelect = document.getElementById('wzh_provider');
  var wzh_providerBadge = document.getElementById('wzh_provider_badge');
  var wzh_chatMeta = document.getElementById('wzh_chat_meta');
  var wzh_chatBox = document.getElementById('wzh_llm_chat_box');
  var wzh_chatForm = document.getElementById('wzh_llm_chat_form');
  var wzh_chatInput = document.getElementById('wzh_llm_chat_input');
  var wzh_chatBtn = document.getElementById('wzh_llm_chat_btn');
  var wzh_chatClear = document.getElementById('wzh_llm_chat_clear');

  // ---------- 知识库 ----------
  var wzh_kbFile = document.getElementById('wzh_kb_file');
  var wzh_kbList = document.getElementById('wzh_kb_list');
  var wzh_kbBadge = document.getElementById('wzh_kb_badge');
  var wzh_kbQuestion = document.getElementById('wzh_kb_question');
  var wzh_kbAsk = document.getElementById('wzh_kb_ask');
  var wzh_kbOut = document.getElementById('wzh_kb_out');
  var wzh_kbMatched = document.getElementById('wzh_kb_matched');

  // ---------- 图像识别 ----------
  var wzh_visionFile = document.getElementById('wzh_vision_file');
  var wzh_visionPreview = document.getElementById('wzh_vision_preview');
  var wzh_visionQuestion = document.getElementById('wzh_vision_question');
  var wzh_visionBtn = document.getElementById('wzh_vision_btn');
  var wzh_visionBadge = document.getElementById('wzh_vision_badge');
  var wzh_visionOut = document.getElementById('wzh_vision_out');

  // ---------- 语音识别 ----------
  var wzh_asrRecord = document.getElementById('wzh_asr_record');
  var wzh_asrFile = document.getElementById('wzh_asr_file');
  var wzh_asrAudio = document.getElementById('wzh_asr_audio');
  var wzh_asrBadge = document.getElementById('wzh_asr_badge');
  var wzh_asrOut = document.getElementById('wzh_asr_out');

  // ---------- 运行时状态 ----------
  var wzh_providers = [];
  var wzh_messages = [
    { role: 'system', content: '你是《高级网页设计》课程全栈项目的 AI 客服「小智」，用简体中文回答：先一句话回应问题，再给 1-3 条可执行步骤，控制在 150 字以内，不要编造事实。' }
  ];
  var wzh_visionData = '';
  var wzh_visionName = '';
  var wzh_recorder = null;
  var wzh_recChunks = [];
  var wzh_recStream = null;
  var wzh_recording = false;

  /**
   * 功能名称：wzh_escapeHtml
   * 功能简介：把尖括号与引号转义，避免模型回复里的 HTML 破坏页面结构。
   */
  function wzh_escapeHtml(wzh_str) {
    return String(wzh_str == null ? '' : wzh_str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * 功能名称：wzh_isStaticHost
   * 功能简介：判断是否运行在没有后端的静态托管环境（非 localhost / 127.0.0.1）；
   *           用于切换成静态演示模式，避免直接请求 /api 拿到 404 的 HTML。
   */
  function wzh_isStaticHost() {
    var wzh_host = location.hostname;
    return !(wzh_host === 'localhost' || wzh_host === '127.0.0.1');
  }

  /**
   * 功能名称：wzh_friendlyErr
   * 功能简介：把静态托管下常见的 "Unexpected token '<'"（把 404 HTML 当 JSON 解析）换成可读提示，
   *           其他错误原样返回。
   */
  function wzh_friendlyErr(wzh_err) {
    var wzh_msg = (wzh_err && wzh_err.message) ? wzh_err.message : String(wzh_err);
    if (wzh_msg.indexOf('not valid JSON') >= 0 || wzh_msg.indexOf('Unexpected token') >= 0) {
      return '当前为静态托管，接口不可用；请在本地运行 backend 后访问 http://localhost:8807 再试。';
    }
    return wzh_msg;
  }

  /**
   * 功能名称：wzh_now
   * 功能简介：返回 HH:mm:ss 格式的当前时间，用于操作痕迹的时间戳。
   */
  function wzh_now() {
    var wzh_d = new Date();
    function wzh_pad(wzh_n) { return wzh_n < 10 ? '0' + wzh_n : String(wzh_n); }
    return wzh_pad(wzh_d.getHours()) + ':' + wzh_pad(wzh_d.getMinutes()) + ':' + wzh_pad(wzh_d.getSeconds());
  }

  /**
   * 功能名称：wzh_trace
   * 功能简介：往操作痕迹面板追加一行记录（时间 + 内容），按结果着色并自动滚到底部；
   *           同时把同一内容输出到控制台，方便演示时对照。
   */
  function wzh_trace(wzh_text, wzh_ok) {
    var wzh_line = document.createElement('div');
    wzh_line.className = 'wzh_trace_line' + (wzh_ok === true ? ' wzh_ok' : wzh_ok === false ? ' wzh_err' : '');
    wzh_line.innerHTML = '<span class="wzh_trace_time">' + wzh_now() + '</span>  ' + wzh_escapeHtml(wzh_text);
    wzh_traceBox.appendChild(wzh_line);
    wzh_traceBox.scrollTop = wzh_traceBox.scrollHeight;
    console.log('[trace] ' + wzh_text);
  }

  /**
   * 功能名称：wzh_setBadge
   * 功能简介：设置状态徽标文字与颜色（wzh_on 绿色 / wzh_off 红色 / 无 灰色）。
   */
  function wzh_setBadge(wzh_el, wzh_text, wzh_state) {
    wzh_el.textContent = wzh_text;
    wzh_el.className = 'wzh_badge' + (wzh_state === 'on' ? ' wzh_on' : wzh_state === 'off' ? ' wzh_off' : '');
  }

  /**
   * 功能名称：wzh_pushBubble
   * 功能简介：在客服对话区追加一条气泡，返回气泡元素，供"思考中"占位后替换内容。
   */
  function wzh_pushBubble(wzh_role, wzh_text, wzh_notice) {
    var wzh_el = document.createElement('div');
    wzh_el.className = 'wzh_msg ' + (wzh_role === 'user' ? 'wzh_msg_user' : 'wzh_msg_ai');
    wzh_el.innerHTML = '<div class="wzh_msg_text">' + wzh_escapeHtml(wzh_text) + '</div>';
    if (wzh_notice) {
      wzh_el.style.opacity = '0.72';
    }
    wzh_chatBox.appendChild(wzh_el);
    wzh_chatBox.scrollTop = wzh_chatBox.scrollHeight;
    return wzh_el;
  }

  /**
   * 功能名称：wzh_currentProvider
   * 功能简介：从已加载的平台列表里取出下拉框当前选中的平台对象，找不到返回 null。
   */
  function wzh_currentProvider() {
    var wzh_id = wzh_providerSelect.value;
    for (var i = 0; i < wzh_providers.length; i++) {
      if (wzh_providers[i].id === wzh_id) {
        return wzh_providers[i];
      }
    }
    return null;
  }

  /**
   * 功能名称：wzh_applyProvider
   * 功能简介：把当前平台的名字、模型与 Key 状态同步到徽标和模型提示上。
   */
  function wzh_applyProvider() {
    var wzh_p = wzh_currentProvider();
    if (!wzh_p) {
      return;
    }
    wzh_setBadge(wzh_providerBadge, wzh_p.name + ' · ' + (wzh_p.keyConfigured ? 'Key 已配置' : 'Key 未配置'), wzh_p.keyConfigured ? 'on' : 'off');
    wzh_chatMeta.innerHTML = '模型：<b>' + wzh_escapeHtml(wzh_p.model) + '</b>';
  }

  /**
   * 功能名称：wzh_loadProviders
   * 功能简介：读取 /api/chat/providers 填充下拉框（未配置 Key 的平台加提示后缀），
   *           默认选中后端返回的平台并写入痕迹。
   */
  async function wzh_loadProviders() {
    // 静态托管没有后端：用内置平台清单占位，避免请求 /api 得到 404 页面
    if (wzh_isStaticHost()) {
      wzh_providers = [
        { id: 'siliconflow', name: '硅基流动', model: 'deepseek-ai/DeepSeek-V4-Flash', keyConfigured: false },
        { id: 'qiniu', name: '七牛', model: 'qiniu/conatus-free', keyConfigured: false }
      ];
      wzh_providerSelect.innerHTML = '';
      wzh_providers.forEach(function (wzh_p) {
        var wzh_opt = document.createElement('option');
        wzh_opt.value = wzh_p.id;
        wzh_opt.textContent = wzh_p.name;
        wzh_providerSelect.appendChild(wzh_opt);
      });
      wzh_providerSelect.value = 'siliconflow';
      wzh_setBadge(wzh_providerBadge, '静态演示', '');
      wzh_chatMeta.innerHTML = '本地启动 backend 后可切换平台并对话';
      wzh_trace('静态托管模式：跳过平台接口请求（需本地 backend 8807）', false);
      return;
    }

    try {
      var wzh_resp = await fetch('/api/chat/providers');
      var wzh_json = await wzh_resp.json();
      console.log('[llm] 平台列表：', wzh_json);

      if (wzh_json.code !== 0) {
        wzh_setBadge(wzh_providerBadge, '平台读取失败', 'off');
        wzh_trace('读取平台列表失败：' + wzh_json.msg, false);
        return;
      }

      wzh_providers = wzh_json.data.providers || [];
      wzh_providerSelect.innerHTML = '';
      wzh_providers.forEach(function (wzh_p) {
        var wzh_opt = document.createElement('option');
        wzh_opt.value = wzh_p.id;
        wzh_opt.textContent = wzh_p.name + (wzh_p.keyConfigured ? '' : '（未配置 Key）');
        wzh_providerSelect.appendChild(wzh_opt);
      });
      wzh_providerSelect.value = wzh_json.data.default || 'siliconflow';
      wzh_applyProvider();

      var wzh_ready = wzh_providers.filter(function (wzh_p) { return wzh_p.keyConfigured; }).length;
      wzh_trace('读取平台列表成功：共 ' + wzh_providers.length + ' 个平台，' + wzh_ready + ' 个已配置 Key', true);
    } catch (wzh_err) {
      console.error('[llm] 平台列表读取失败：', wzh_err);
      wzh_setBadge(wzh_providerBadge, '后端未连接', 'off');
      wzh_trace('平台列表读取失败：' + wzh_err.message + '（请确认后端已启动）', false);
    }
  }

  /**
   * 功能名称：wzh_onProviderChange
   * 功能简介：下拉框切换平台时更新徽标与模型提示，并在对话区留一条切换说明；
   *           对话历史不清空，用于演示"切换后照常对话"。
   */
  function wzh_onProviderChange() {
    wzh_applyProvider();
    var wzh_p = wzh_currentProvider();
    if (!wzh_p) {
      return;
    }
    wzh_trace('切换平台 → ' + wzh_p.name + '（' + wzh_p.model + '）', true);
    wzh_pushBubble('ai', '已切换到「' + wzh_p.name + '」，模型 ' + wzh_p.model + '。对话历史保留，可以继续提问。', true);
  }

  /**
   * 功能名称：wzh_trimHistory
   * 功能简介：保留 system 人设与最近 10 轮对话，避免请求体无限增长。
   */
  function wzh_trimHistory() {
    var wzh_body = wzh_messages.slice(1);
    if (wzh_body.length > 20) {
      wzh_messages = [wzh_messages[0]].concat(wzh_body.slice(wzh_body.length - 20));
    }
  }

  /**
   * 功能名称：wzh_sendChat
   * 功能简介：把平台与消息数组 POST 给 /api/chat，成功替换"思考中"占位并记录模型，
   *           失败显示错误气泡；副作用：一次外部请求与痕迹写入。
   */
  async function wzh_sendChat(wzh_event) {
    if (wzh_event) {
      wzh_event.preventDefault();
    }

    var wzh_text = wzh_chatInput.value.trim();
    if (!wzh_text) {
      wzh_chatInput.focus();
      return;
    }

    var wzh_p = wzh_currentProvider();
    var wzh_providerId = wzh_providerSelect.value;

    wzh_messages.push({ role: 'user', content: wzh_text });
    wzh_trimHistory();
    wzh_pushBubble('user', wzh_text);
    wzh_chatInput.value = '';
    wzh_chatBtn.disabled = true;
    wzh_chatBtn.textContent = '思考中…';

    var wzh_loading = wzh_pushBubble('ai', '正在思考…');
    wzh_loading.classList.add('wzh_msg_loading');

    // 静态托管：不发真实请求，给出可读的演示说明
    if (wzh_isStaticHost()) {
      wzh_loading.classList.remove('wzh_msg_loading');
      wzh_loading.querySelector('.wzh_msg_text').textContent =
        '当前是 GitHub Pages 静态托管，无法访问 /api/chat。\n'
        + '在本地运行 backend 后打开 http://localhost:8807/llm-practice.html，就能得到真实回复；这里只演示界面效果。';
      wzh_trace('静态托管：跳过真实请求（需本地后端）', false);
      wzh_chatBtn.disabled = false;
      wzh_chatBtn.textContent = '发送';
      return;
    }

    try {
      var wzh_resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: wzh_providerId, messages: wzh_messages })
      });
      var wzh_json = await wzh_resp.json();
      console.log('[llm] AI 客服响应：', wzh_json);

      wzh_loading.classList.remove('wzh_msg_loading');

      if (wzh_json.code === 0 && wzh_json.data && wzh_json.data.reply) {
        var wzh_reply = wzh_json.data.reply;
        wzh_messages.push({ role: 'assistant', content: wzh_reply });
        wzh_loading.querySelector('.wzh_msg_text').textContent = wzh_reply;
        wzh_chatMeta.innerHTML = '模型：<b>' + wzh_escapeHtml(wzh_json.data.model) + '</b>';
        wzh_trace('AI 客服回复成功 · 平台 ' + wzh_json.data.providerName + ' · 模型 ' + wzh_json.data.model, true);
      } else {
        wzh_loading.classList.add('wzh_msg_err');
        wzh_loading.querySelector('.wzh_msg_text').textContent = '回复失败：' + (wzh_json.msg || '未知错误');
        wzh_trace('AI 客服失败 · ' + (wzh_p ? wzh_p.name : wzh_providerId) + ' · ' + (wzh_json.msg || '未知错误'), false);
      }
    } catch (wzh_err) {
      console.error('[llm] AI 客服请求失败：', wzh_err);
      wzh_loading.classList.remove('wzh_msg_loading');
      wzh_loading.classList.add('wzh_msg_err');
      wzh_loading.querySelector('.wzh_msg_text').textContent = '请求失败：' + wzh_friendlyErr(wzh_err)
        + '\n请确认后端已在 http://localhost:8807 启动。';
      wzh_trace('AI 客服请求失败：' + wzh_friendlyErr(wzh_err), false);
    } finally {
      wzh_chatBtn.disabled = false;
      wzh_chatBtn.textContent = '发送';
      wzh_chatBox.scrollTop = wzh_chatBox.scrollHeight;
      wzh_chatInput.focus();
    }
  }

  /**
   * 功能名称：wzh_clearChat
   * 功能简介：清空对话——重置为只有 system 人设，并放回欢迎语。
   */
  function wzh_clearChat() {
    wzh_messages = [wzh_messages[0]];
    wzh_chatBox.innerHTML = '';
    wzh_pushBubble('ai', '对话已清空。我是 AI 客服「小智」，可以问我课程项目、接口或大模型相关的问题。');
    wzh_chatInput.value = '';
    wzh_trace('清空客服对话', true);
    wzh_chatInput.focus();
  }

  /**
   * 功能名称：wzh_kbRefresh
   * 功能简介：拉取 /api/kb/list 渲染知识库文件列表与数量徽标；空库时显示占位提示。
   */
  async function wzh_kbRefresh() {
    if (wzh_isStaticHost()) {
      wzh_setBadge(wzh_kbBadge, '静态演示', '');
      wzh_kbList.innerHTML = '<div class="wzh_empty">静态托管下知识库接口不可用；本地启动 backend 后即可上传与检索。</div>';
      return;
    }

    try {
      var wzh_resp = await fetch('/api/kb/list');
      var wzh_json = await wzh_resp.json();
      console.log('[llm] 知识库列表：', wzh_json);

      if (wzh_json.code !== 0) {
        wzh_trace('知识库列表读取失败：' + wzh_json.msg, false);
        return;
      }

      var wzh_files = wzh_json.data || [];
      wzh_setBadge(wzh_kbBadge, wzh_files.length + ' 个文件', wzh_files.length ? 'on' : '');
      wzh_kbList.innerHTML = '';

      if (!wzh_files.length) {
        var wzh_empty = document.createElement('div');
        wzh_empty.className = 'wzh_empty';
        wzh_empty.textContent = '知识库为空，先上传一个 txt / md 文件试试。';
        wzh_kbList.appendChild(wzh_empty);
        return;
      }

      wzh_files.forEach(function (wzh_f) {
        var wzh_item = document.createElement('div');
        wzh_item.className = 'wzh_kb_item';
        wzh_item.innerHTML = '<div><b>' + wzh_escapeHtml(wzh_f.name) + '</b><br>'
          + '<span>' + wzh_f.chunkCount + ' 块 · ' + wzh_f.chars + ' 字 · ' + (wzh_f.size / 1024).toFixed(1) + ' KB</span></div>'
          + '<span>' + wzh_escapeHtml(wzh_f.time) + '</span>';
        wzh_kbList.appendChild(wzh_item);
      });
    } catch (wzh_err) {
      console.error('[llm] 知识库列表读取失败：', wzh_err);
      wzh_trace('知识库列表读取失败：' + wzh_friendlyErr(wzh_err), false);
    }
  }

  /**
   * 功能名称：wzh_kbUpload
   * 功能简介：读取用户选择的文本文件（UTF-8），POST 给 /api/kb/upload 入库；
   *           成功后刷新列表并写入痕迹。
   */
  function wzh_kbUpload() {
    var wzh_file = wzh_kbFile.files && wzh_kbFile.files[0];
    if (!wzh_file) {
      return;
    }
    if (wzh_file.size > 200 * 1024) {
      wzh_kbOut.className = 'wzh_llm_out wzh_err';
      wzh_kbOut.textContent = '文件超过 200KB，请换一个小一点的文本文件。';
      wzh_trace('知识库上传被拒绝：' + wzh_file.name + ' 超过 200KB', false);
      return;
    }

    var wzh_reader = new FileReader();
    wzh_reader.onload = async function () {
      wzh_kbOut.className = 'wzh_llm_out';
      wzh_kbOut.textContent = '正在上传并切块…';
      try {
        var wzh_resp = await fetch('/api/kb/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: wzh_file.name, content: String(wzh_reader.result || '') })
        });
        var wzh_json = await wzh_resp.json();
        console.log('[llm] 知识库上传：', wzh_json);

        if (wzh_json.code === 0) {
          wzh_kbOut.className = 'wzh_llm_out wzh_ok';
          wzh_kbOut.textContent = wzh_json.msg;
          wzh_trace('知识库上传成功：' + wzh_file.name + ' · ' + wzh_json.data.chunkCount + ' 块', true);
          wzh_kbRefresh();
        } else {
          wzh_kbOut.className = 'wzh_llm_out wzh_err';
          wzh_kbOut.textContent = '上传失败：' + wzh_json.msg;
          wzh_trace('知识库上传失败：' + wzh_json.msg, false);
        }
      } catch (wzh_err) {
        console.error('[llm] 知识库上传失败：', wzh_err);
        wzh_kbOut.className = 'wzh_llm_out wzh_err';
        wzh_kbOut.textContent = '上传失败：' + wzh_friendlyErr(wzh_err);
        wzh_trace('知识库上传失败：' + wzh_friendlyErr(wzh_err), false);
      } finally {
        wzh_kbFile.value = '';
      }
    };
    wzh_reader.readAsText(wzh_file, 'utf-8');
  }

  /**
   * 功能名称：wzh_kbAsk
   * 功能简介：把当前平台与问题 POST 给 /api/kb/chat，展示回答并列出检索命中的知识块。
   */
  async function wzh_kbAskQuestion() {
    var wzh_question = wzh_kbQuestion.value.trim();
    if (!wzh_question) {
      wzh_kbQuestion.focus();
      return;
    }

    wzh_kbAsk.disabled = true;
    wzh_kbAsk.textContent = '检索中…';
    wzh_kbOut.className = 'wzh_llm_out';
    wzh_kbOut.textContent = '正在检索知识库并请求大模型…';
    wzh_kbMatched.innerHTML = '';

    try {
      var wzh_resp = await fetch('/api/kb/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: wzh_providerSelect.value, question: wzh_question })
      });
      var wzh_json = await wzh_resp.json();
      console.log('[llm] 知识库问答：', wzh_json);

      if (wzh_json.code === 0 && wzh_json.data) {
        wzh_kbOut.className = 'wzh_llm_out wzh_ok';
        wzh_kbOut.textContent = wzh_json.data.reply;
        wzh_trace('知识库问答成功 · 平台 ' + wzh_json.data.providerName + ' · 命中 ' + wzh_json.data.matched.length + ' 个片段', true);

        wzh_json.data.matched.forEach(function (wzh_m, wzh_i) {
          var wzh_item = document.createElement('div');
          wzh_item.className = 'wzh_match';
          wzh_item.innerHTML = '<b>片段 ' + (wzh_i + 1) + ' · ' + wzh_escapeHtml(wzh_m.file) + ' · 匹配分 ' + wzh_m.score + '</b>'
            + wzh_escapeHtml(wzh_m.text.slice(0, 220)) + (wzh_m.text.length > 220 ? '…' : '');
          wzh_kbMatched.appendChild(wzh_item);
        });
      } else {
        wzh_kbOut.className = 'wzh_llm_out wzh_err';
        wzh_kbOut.textContent = '问答失败：' + (wzh_json.msg || '未知错误');
        wzh_trace('知识库问答失败：' + (wzh_json.msg || '未知错误'), false);
      }
    } catch (wzh_err) {
      console.error('[llm] 知识库问答失败：', wzh_err);
      wzh_kbOut.className = 'wzh_llm_out wzh_err';
      wzh_kbOut.textContent = '问答失败：' + wzh_friendlyErr(wzh_err);
      wzh_trace('知识库问答失败：' + wzh_friendlyErr(wzh_err), false);
    } finally {
      wzh_kbAsk.disabled = false;
      wzh_kbAsk.textContent = '知识库问答';
    }
  }

  /**
   * 功能名称：wzh_visionPick
   * 功能简介：读取用户选择的图片为 DataURL，显示预览并更新徽标；数据暂存在内存等待识别。
   */
  function wzh_visionPick() {
    var wzh_file = wzh_visionFile.files && wzh_visionFile.files[0];
    if (!wzh_file) {
      return;
    }
    if (wzh_file.size > 4 * 1024 * 1024) {
      wzh_visionOut.className = 'wzh_llm_out wzh_err';
      wzh_visionOut.textContent = '图片超过 4MB，请压缩后再试。';
      wzh_trace('图像识别被拒绝：' + wzh_file.name + ' 超过 4MB', false);
      return;
    }

    var wzh_reader = new FileReader();
    wzh_reader.onload = function () {
      wzh_visionData = String(wzh_reader.result || '');
      wzh_visionName = wzh_file.name;
      wzh_visionPreview.src = wzh_visionData;
      wzh_visionPreview.classList.add('wzh_show');
      wzh_setBadge(wzh_visionBadge, '已选择：' + wzh_file.name, 'on');
      wzh_visionOut.className = 'wzh_llm_out';
      wzh_visionOut.textContent = '图片已就绪，点击「开始识别」。';
      wzh_trace('选择图片：' + wzh_file.name + ' · ' + (wzh_file.size / 1024).toFixed(1) + ' KB', true);
    };
    wzh_reader.readAsDataURL(wzh_file);
  }

  /**
   * 功能名称：wzh_visionRun
   * 功能简介：把图片 DataURL 与识别要求 POST 给 /api/vision，展示模型描述、模型名与 token 用量。
   */
  async function wzh_visionRun() {
    if (!wzh_visionData) {
      wzh_visionOut.className = 'wzh_llm_out wzh_err';
      wzh_visionOut.textContent = '请先选择一张图片。';
      return;
    }

    wzh_visionBtn.disabled = true;
    wzh_visionBtn.textContent = '识别中…';
    wzh_visionOut.className = 'wzh_llm_out';
    wzh_visionOut.textContent = '正在上传图片并请求视觉模型…';

    try {
      var wzh_resp = await fetch('/api/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: wzh_visionData, question: wzh_visionQuestion.value.trim() })
      });
      var wzh_json = await wzh_resp.json();
      console.log('[llm] 图像识别：', wzh_json);

      if (wzh_json.code === 0 && wzh_json.data) {
        wzh_visionOut.className = 'wzh_llm_out wzh_ok';
        var wzh_usage = wzh_json.data.usage && wzh_json.data.usage.total_tokens
          ? '（共 ' + wzh_json.data.usage.total_tokens + ' tokens）'
          : '';
        wzh_visionOut.textContent = wzh_json.data.reply + '\n\n模型：' + wzh_json.data.model + wzh_usage;
        wzh_setBadge(wzh_visionBadge, '识别成功 · ' + wzh_json.data.model, 'on');
        wzh_trace('图像识别成功：' + wzh_visionName + ' · 模型 ' + wzh_json.data.model, true);
      } else {
        wzh_visionOut.className = 'wzh_llm_out wzh_err';
        wzh_visionOut.textContent = '识别失败：' + (wzh_json.msg || '未知错误');
        wzh_setBadge(wzh_visionBadge, '识别失败', 'off');
        wzh_trace('图像识别失败：' + (wzh_json.msg || '未知错误'), false);
      }
    } catch (wzh_err) {
      console.error('[llm] 图像识别失败：', wzh_err);
      wzh_visionOut.className = 'wzh_llm_out wzh_err';
      wzh_visionOut.textContent = '识别失败：' + wzh_friendlyErr(wzh_err);
      wzh_trace('图像识别失败：' + wzh_friendlyErr(wzh_err), false);
    } finally {
      wzh_visionBtn.disabled = false;
      wzh_visionBtn.textContent = '开始识别';
    }
  }

  /**
   * 功能名称：wzh_blobToWav
   * 功能简介：把 MediaRecorder 录到的音频（webm/ogg）解码后重新编码为 16 位单声道 WAV，
   *           以兼容语音识别接口；解码失败时由调用方退回原始格式。
   */
  function wzh_blobToWav(wzh_blob) {
    return new Promise(function (wzh_resolve, wzh_reject) {
      var wzh_reader = new FileReader();
      wzh_reader.onerror = function () { wzh_reject(new Error('音频读取失败')); };
      wzh_reader.onload = function () {
        var wzh_Ctx = window.AudioContext || window.webkitAudioContext;
        var wzh_ctx = new wzh_Ctx();
        wzh_ctx.decodeAudioData(wzh_reader.result, function (wzh_buf) {
          var wzh_ch = wzh_buf.getChannelData(0);
          var wzh_rate = wzh_buf.sampleRate;
          var wzh_view = new DataView(new ArrayBuffer(44 + wzh_ch.length * 2));

          function wzh_str(wzh_pos, wzh_s) {
            for (var i = 0; i < wzh_s.length; i++) {
              wzh_view.setUint8(wzh_pos + i, wzh_s.charCodeAt(i));
            }
          }

          wzh_str(0, 'RIFF');
          wzh_view.setUint32(4, 36 + wzh_ch.length * 2, true);
          wzh_str(8, 'WAVE');
          wzh_str(12, 'fmt ');
          wzh_view.setUint32(16, 16, true);
          wzh_view.setUint16(20, 1, true);
          wzh_view.setUint16(22, 1, true);
          wzh_view.setUint32(24, wzh_rate, true);
          wzh_view.setUint32(28, wzh_rate * 2, true);
          wzh_view.setUint16(32, 2, true);
          wzh_view.setUint16(34, 16, true);
          wzh_str(36, 'data');
          wzh_view.setUint32(40, wzh_ch.length * 2, true);

          for (var wzh_i = 0; wzh_i < wzh_ch.length; wzh_i++) {
            var wzh_v = Math.max(-1, Math.min(1, wzh_ch[wzh_i]));
            wzh_view.setInt16(44 + wzh_i * 2, wzh_v < 0 ? wzh_v * 0x8000 : wzh_v * 0x7FFF, true);
          }

          wzh_ctx.close();
          wzh_resolve(new Blob([wzh_view], { type: 'audio/wav' }));
        }, function () {
          wzh_ctx.close();
          wzh_reject(new Error('浏览器无法解码该音频'));
        });
      };
      wzh_reader.readAsArrayBuffer(wzh_blob);
    });
  }

  /**
   * 功能名称：wzh_asrSend
   * 功能简介：把音频 Blob 转 Base64 后 POST 给 /api/asr，展示识别文字与模型；
   *           失败时在输出区与痕迹里写明原因。
   */
  async function wzh_asrSend(wzh_blob, wzh_name) {
    wzh_asrOut.className = 'wzh_llm_out';
    wzh_asrOut.textContent = '正在上传音频并识别…';
    wzh_setBadge(wzh_asrBadge, '识别中…', '');

    var wzh_reader = new FileReader();
    wzh_reader.onerror = function () {
      wzh_asrOut.className = 'wzh_llm_out wzh_err';
      wzh_asrOut.textContent = '音频读取失败。';
    };
    wzh_reader.onload = async function () {
      var wzh_dataUrl = String(wzh_reader.result || '');
      var wzh_base64 = wzh_dataUrl.split(',')[1] || '';
      try {
        var wzh_resp = await fetch('/api/asr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audio: wzh_base64, mime: wzh_blob.type || 'audio/wav', name: wzh_name })
        });
        var wzh_json = await wzh_resp.json();
        console.log('[llm] 语音识别：', wzh_json);

        if (wzh_json.code === 0 && wzh_json.data) {
          var wzh_text = (wzh_json.data.text || '').trim();
          wzh_asrOut.className = 'wzh_llm_out wzh_ok';
          wzh_asrOut.textContent = wzh_text
            ? wzh_text + '\n\n模型：' + wzh_json.data.model
            : '识别完成，但没有识别出文字（可能是静音或音量太小）。\n\n模型：' + wzh_json.data.model;
          wzh_setBadge(wzh_asrBadge, wzh_text ? '识别成功' : '未识别到文字', wzh_text ? 'on' : 'off');
          wzh_trace('语音识别完成：' + wzh_name + ' · ' + (wzh_text ? '识别到 ' + wzh_text.length + ' 字' : '无文字'), true);
        } else {
          wzh_asrOut.className = 'wzh_llm_out wzh_err';
          wzh_asrOut.textContent = '识别失败：' + (wzh_json.msg || '未知错误');
          wzh_setBadge(wzh_asrBadge, '识别失败', 'off');
          wzh_trace('语音识别失败：' + (wzh_json.msg || '未知错误'), false);
        }
      } catch (wzh_err) {
        console.error('[llm] 语音识别失败：', wzh_err);
        wzh_asrOut.className = 'wzh_llm_out wzh_err';
        wzh_asrOut.textContent = '识别失败：' + wzh_friendlyErr(wzh_err);
        wzh_trace('语音识别失败：' + wzh_friendlyErr(wzh_err), false);
      }
    };
    wzh_reader.readAsDataURL(wzh_blob);
  }

  /**
   * 功能名称：wzh_asrToggle
   * 功能简介：开始/停止录音。开始时申请麦克风权限并启动 MediaRecorder；
   *           停止后在浏览器内转 WAV 并提交识别，按钮文字与状态徽标同步变化。
   */
  async function wzh_asrToggle() {
    if (wzh_recording) {
      if (wzh_recorder && wzh_recorder.state !== 'inactive') {
        wzh_recorder.stop();
      }
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      wzh_asrOut.className = 'wzh_llm_out wzh_err';
      wzh_asrOut.textContent = '当前浏览器不支持录音，请改用「上传音频文件」或在 localhost 下打开。';
      wzh_trace('录音不可用：浏览器不支持 getUserMedia', false);
      return;
    }

    try {
      wzh_recStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      wzh_recChunks = [];
      wzh_recorder = new MediaRecorder(wzh_recStream);

      wzh_recorder.ondataavailable = function (wzh_event) {
        if (wzh_event.data && wzh_event.data.size) {
          wzh_recChunks.push(wzh_event.data);
        }
      };

      wzh_recorder.onstop = async function () {
        wzh_recording = false;
        wzh_asrRecord.textContent = '开始录音';
        wzh_asrRecord.classList.remove('wzh_btn_ghost');
        wzh_setBadge(wzh_asrBadge, '处理音频…', '');

        if (wzh_recStream) {
          wzh_recStream.getTracks().forEach(function (wzh_t) { wzh_t.stop(); });
          wzh_recStream = null;
        }

        var wzh_raw = new Blob(wzh_recChunks, { type: wzh_recorder.mimeType || 'audio/webm' });
        wzh_recChunks = [];
        if (!wzh_raw.size) {
          wzh_asrOut.className = 'wzh_llm_out wzh_err';
          wzh_asrOut.textContent = '没有录到声音，请检查麦克风后重试。';
          wzh_trace('录音为空：未采集到音频数据', false);
          return;
        }

        wzh_asrAudio.src = URL.createObjectURL(wzh_raw);
        wzh_trace('录音完成：' + (wzh_raw.size / 1024).toFixed(1) + ' KB，准备转为 WAV', true);

        try {
          var wzh_wav = await wzh_blobToWav(wzh_raw);
          wzh_asrSend(wzh_wav, 'wzh_record.wav');
        } catch (wzh_err) {
          console.warn('[llm] WAV 转换失败，直接上传原始音频：', wzh_err);
          wzh_trace('WAV 转换失败，改用原始格式上传：' + wzh_err.message, false);
          wzh_asrSend(wzh_raw, 'wzh_record.webm');
        }
      };

      wzh_recorder.start();
      wzh_recording = true;
      wzh_asrRecord.innerHTML = '<span class="wzh_rec_dot"></span>停止录音';
      wzh_asrRecord.classList.add('wzh_btn_ghost');
      wzh_setBadge(wzh_asrBadge, '正在录音…', 'on');
      wzh_asrOut.className = 'wzh_llm_out';
      wzh_asrOut.textContent = '正在录音，说完后点击「停止录音」自动识别。';
      wzh_trace('开始录音：已获得麦克风权限', true);
    } catch (wzh_err) {
      console.error('[llm] 录音启动失败：', wzh_err);
      wzh_asrOut.className = 'wzh_llm_out wzh_err';
      wzh_asrOut.textContent = '无法开始录音：' + wzh_err.message + '（请允许麦克风权限，并使用 http://localhost:8807 打开）';
      wzh_setBadge(wzh_asrBadge, '录音不可用', 'off');
      wzh_trace('录音启动失败：' + wzh_err.message, false);
    }
  }

  /**
   * 功能名称：wzh_asrUpload
   * 功能简介：处理用户选择的音频文件——更新播放器并直接提交识别，不做格式转换。
   */
  function wzh_asrUpload() {
    var wzh_file = wzh_asrFile.files && wzh_asrFile.files[0];
    if (!wzh_file) {
      return;
    }
    if (wzh_file.size > 18 * 1024 * 1024) {
      wzh_asrOut.className = 'wzh_llm_out wzh_err';
      wzh_asrOut.textContent = '音频超过 18MB，请换一个更短的文件。';
      wzh_trace('音频上传被拒绝：' + wzh_file.name + ' 超过 18MB', false);
      return;
    }
    wzh_asrAudio.src = URL.createObjectURL(wzh_file);
    wzh_trace('选择音频文件：' + wzh_file.name + ' · ' + (wzh_file.size / 1024).toFixed(1) + ' KB', true);
    wzh_asrSend(wzh_file, wzh_file.name);
    wzh_asrFile.value = '';
  }

  /**
   * 功能名称：wzh_keydown
   * 功能简介：客服输入框 Enter 直接发送，Shift + Enter 保留换行。
   */
  function wzh_keydown(wzh_event) {
    if (wzh_event.key === 'Enter' && !wzh_event.shiftKey) {
      wzh_event.preventDefault();
      wzh_sendChat();
    }
  }

  /**
   * 功能名称：wzh_init
   * 功能简介：绑定全部按钮与文件选择事件，写入欢迎气泡，读取平台列表与知识库列表。
   */
  function wzh_init() {
    wzh_pushBubble('ai', '你好，我是 AI 客服「小智」。可以在上方切换「硅基流动 / 七牛」，切换后我们继续聊。');
    wzh_trace('页面初始化：绑定事件，读取平台与知识库', true);

    wzh_providerSelect.addEventListener('change', wzh_onProviderChange);
    wzh_chatForm.addEventListener('submit', wzh_sendChat);
    wzh_chatInput.addEventListener('keydown', wzh_keydown);
    wzh_chatClear.addEventListener('click', wzh_clearChat);
    wzh_traceClear.addEventListener('click', function () {
      wzh_traceBox.innerHTML = '';
      wzh_trace('操作痕迹已清空', true);
    });

    wzh_kbFile.addEventListener('change', wzh_kbUpload);
    wzh_kbAsk.addEventListener('click', wzh_kbAskQuestion);

    wzh_visionFile.addEventListener('change', wzh_visionPick);
    wzh_visionBtn.addEventListener('click', wzh_visionRun);

    wzh_asrRecord.addEventListener('click', wzh_asrToggle);
    wzh_asrFile.addEventListener('change', wzh_asrUpload);

    wzh_loadProviders();
    wzh_kbRefresh();
  }

  wzh_init();
})();
