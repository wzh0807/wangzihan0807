# 提示词留痕（追加写入，禁止覆盖）

格式：时间 | 大模型名称 | 提示词全文

---

2026-11-23 13:20 | DeepSeek-V4.1-Flash | https://spontaneous-valkyrie-4e4229.netlify.app/fullstack-init-lesson 完成

---

2026-11-23 13:20 | DeepSeek-V4.1-Flash | 在当前项目根目录创建 AGENTS.md，写入以下规则。 ## 项目结构与技术栈 - 前端：frontend/ 目录 - 原生 HTML、CSS、JavaScript，禁止使用任何第三方库、框架、CDN 链接 - 目录结构：frontend/ 下建 css/、js/、fonts/、images/ 子目录；fonts/ 存放 iconfont 图标文件（如果有） - 后端：backend/ 目录，Node.js + Express，RESTful+MVC 风格，所有接口以 /api/ 为前缀，端口固定为 8xxx（本人学号末三位 807，端口 8807） - 使用 express.static 托管 frontend/ 静态资源目录 - 后端通过 cors 中间件开放全部跨域访问 - 数据库：MySQL（用户名 root、密码写入 backend/.env） - 数据库凭据写入 backend/.env（变量名：DB_USER、DB_PASSWORD、DB_HOST、DB_NAME），不得出现在代码或 AGENTS.md 中；.env 同时加入 .gitignore - 根据后端的要求自行建立和修改数据库表，每张表建立后，插入至少 8 条有真实业务意义的测试数据 ## 命名与注释 - CSS 类名、JS 变量名、JS 函数名、数据库表名（及字段相关命名）一律以 wy_ 开头 - 每个文件头部包含注释块：姓名：王子涵 | 学号：0807 | 时间：yyyy-mm-dd | 大模型：DeepSeek-V4.1-Flash ## 记录文件（一律追加写入，禁止覆盖已有内容） - wangzihan_prompt.md（项目根目录） - backend/wy_interface.md - backend/wy_database.md - 统一 JSON 响应格式：{ "code": 0, "msg": "提示信息", "data": {...} } ## 前端约定 - 服务器返回的数据和错误信息输出到浏览器控制台 - 新建 HTML 页面后，在 frontend/index.html 中追加超链接入口

---

2026-11-23 13:20 | DeepSeek-V4.1-Flash | 请初始化本项目：1、git init + .gitignore（排除 node_modules、.env）+ 首次提交；2、按 AGENTS.md 规则创建前后端目录骨架、安装依赖；3、创建前端首页 index.html，包括姓名王子涵、学号 0807、项目名称、项目类别（模仿）、所有完成的 html 页面的超链接，有 canvas 背景动画，主体是页面链接导航，页面美观；4、创建 readme.md，在根目录下，包括学号、姓名。

---

2026-11-23 13:20 | DeepSeek-V4.1-Flash | 创建运行后台的 bat 文件，放在项目根目录：1、自动切换到 backend 目录再启动（用 %~dp0，双击时不受当前路径影响）；2、使用 chcp 65001 避免中文日志乱码；3、启动命令与 package.json 中的脚本保持一致；4、结尾加 pause，出错时窗口不关闭。

---

2026-11-23 13:20 | DeepSeek-V4.1-Flash | 在 frontend/ 下创建 database.html：1、页面有用户名、密码两个输入框，默认用户名 root，密码默认 xxxx，一个“测试连接”按钮；2、点击后调用后端接口 /api/db-test，把用户名密码发给后端；3、后端用 mysql2 尝试连接 MySQL，成功返回 { code:0, msg:"数据库连接成功", data:{ 数据库版本 } }，失败返回 code 非 0 和错误信息；4、前端把结果显示在页面上：成功用绿色，失败用红色，同时在控制台输出；5、数据库凭据从 backend/.env 读取；6、完成后在 frontend/index.html 加上本页面的超链接入口。

---

2026-11-23 13:20 | DeepSeek-V4.1-Flash | 完成科技新闻列表页面：1、在 MySQL 中建表 wy_news，字段包含：id、title、summary、content、source、publish_time、cover_img；2、插入至少 8 条真实的科技新闻测试数据；3、后端提供 GET /api/news 接口，返回全部新闻（按发布时间倒序），统一 JSON 格式 { code, msg, data }；4、新建 frontend/news.html，页面顶部显示当前调用的接口地址，下方以列表展示新闻标题、摘要、来源、时间；5、数据用 fetch 获取，控制台输出返回数据；6、把建表与插入数据的 SQL 追加写入 backend/wy_database.md，接口信息追加写入 backend/wy_interface.md，本次提示词追加写入 wangzihan_prompt.md；7、在 frontend/index.html 增加入口链接。

---

2026-11-23 13:20 | DeepSeek-V4.1-Flash | 完成图文列表页面：1、在 MySQL 中新建表 wy_gallery，字段：id、title、description、img_url、category、create_time，插入至少 8 条测试数据；2、后端提供 GET /api/gallery 接口，返回全部图文数据；3、新建 frontend/gallery.html，页面顶部显示接口地址，下方用网格布局展示“上图下文”卡片：图片、标题、描述；4、图片加载失败时显示占位色块，不要出现破图图标；5、页面适配手机宽度；6、记录写入 backend/wy_database.md、backend/wy_interface.md 和 wangzihan_prompt.md，并在首页加入口。

---

2026-11-23 13:30 | DeepSeek-V4.1-Flash | 传到netlify和课堂实践内个界面上（把前端发布到 Netlify 静态站点，用 MySQL 导出的数据快照经 _redirects 顶替 /api/news 与 /api/gallery，并在课堂实践首页新增第 17 张全栈项目卡片）

---

2026-11-23 13:41 | DeepSeek-V4.1-Flash | sk-****（API Key 已省略，仅写入 backend/.env）使用硅基流动API key创建基本AI应用:AI聊天 Api-key：sk是上面内个（新增 frontend/ai-chat.html、POST /api/chat 与 GET /api/chat/config，后端代理硅基流动接口）

---

2026-11-23 13:48 | DeepSeek-V4.1-Flash | 第一步我弄完了 / 帮我从第一部开始弄（按课程「跟做五步」逐项完成：.env 三行配置 → /api/chat 接口 → 聊天页面 → 多轮 messages 数组 → 测试与记录）

**本次遇到并解决的问题：**

1. 课程示例模型是 `deepseek-ai/DeepSeek-V4-Flash`，项目原先用 `Qwen/Qwen2.5-7B-Instruct`，已把 `backend/.env` 的 `SILICONFLOW_MODEL` 改为 DeepSeek-V4-Flash。
2. 改完 `.env` 后接口仍返回旧模型——`dotenv` 只在进程启动时读一次，必须重启后端（停掉旧 `node app.js` 再启动）才生效。
3. 本地验证多轮对话序列：先问「你好」，再问「我刚才问了什么？」，模型正确答出上一轮是「你好」，说明 `messages` 数组把历史一并发送的方式有效。
4. `.env` 位于 `backend/` 而不是项目根目录，读取时容易找错路径；Key 已由 `.gitignore` 排除，记录文件里用 `sk-****` 代替原文。

---

2026-11-23 14:10 | DeepSeek-V4.1-Flash | 给我新建一个文件夹命名为三级项目在新建文件夹里面完成，把整过的删掉`https://spontaneous-valkyrie-4e4229.netlify.app/fullstack-init-lesson`（把项目整体迁移到 三级项目/，旧目录 fullstack-init 删除，根目录 _redirects 与课堂实践首页入口同步改指向）

---

2026-11-23 14:20 | DeepSeek-V4.1-Flash | 把代码里所有有关wy的都换成wzh（文件名、CSS 类名、JS 变量与函数、接口路由、数据库名与表名、文档引用一并改为 wzh_ 前缀）

说明：以上 2026-11-23 13:20 的三条早期记录为历史原文，保持原样不回溯修改；自 2026-11-23 14:20 起，代码、文件名、数据库名与表名统一使用 `wzh_` 前缀。

---

2026-11-23 14:55 | DeepSeek-V4.1-Flash | `https://spontaneous-valkyrie-4e4229.netlify.app/llm-app-lesson` 完成这个项目

**本次完成内容：**

1. 把桌面上的全栈项目复制到 `D:\三级项目`，后端 8807 端口正常启动。
2. 新增 `backend/config/wzh_aiProviders.js`，集中维护硅基流动与七牛云两个平台的 baseURL / model / API Key。
3. 改造 `POST /api/chat`：支持 `provider` 参数热切换平台，401 / 402 / 404 / 429 统一翻译成中文提示。
4. `GET /api/chat/config` 返回默认平台与全部平台列表，只给 Key 是否已配置，不返回 Key 原文。
5. `frontend/ai-chat.html` 增加「AI 聊天 / 中华美食街客服」人设切换与平台下拉框；两种人设各自维护多轮历史。
6. 新增 `frontend/ai-task.html` 任务报告页：验收清单、任务一 Key 安全、任务二客服人设与 5 条测试记录、任务三答辩三问，并在首页和各页导航加入口。
7. 追加 `backend/wzh_interface.md` 接口文档，更新 `readme.md`。

**本次测试记录：**

- 单轮：硅基流动返回中文回答，`code=0`。
- 多轮：先问「你好，请用一句话介绍你自己」，再问「我刚才问了什么？」，模型正确复述上一轮问题。
- 客服人设 5 问：营业时间、招牌菜、配送范围 3 问答对；Python 快速排序、天气 2 问按话术拒绝并引导留言。
- 平台切换：七牛 Key 为空时返回「七牛云 还没有配置 API Key」；临时填入错误 Key 测试后返回 401 中文提示，随后已恢复为空。

**本次遇到的问题：**

1. 七牛云 Key 尚未提供，`backend/.env` 的 `QINIU_API_KEY` 先留空，页面下拉框会标注「未配置 Key」，填入后重启后端即可使用。
2. 修改 `.env` 后必须重启后端（dotenv 只在进程启动时读取一次），否则页面仍显示旧模型。
3. 线上 Netlify 是静态站点，没有 Node 后端，AI 对话需在本机 `start.bat` 启动后演示。

---

2026-11-25 08:50 | DeepSeek-V4.1-Flash | 在课程实践里面加一个 LLM 实践操作痕迹展示，里面包含：1、页面支持在"硅基流动 / 七牛"之间切换实现 AI 客服（后端读取配置即可，前端加一个下拉框），并现场演示切换后照常对话。2、完成知识库实现（自己上传文件、验证知识库功能）3、图像识别（上传图片，测试图片识别功能）4、语音识别（测试语音识别功能）

**本次实现：**

1. 新增 `frontend/llm-practice.html` 与 `frontend/js/wzh_llmpractice.js`，一页展示四项实践，并在全站导航与首页卡片添加入口。
2. 后端新增 `config/wzh_aiProviders.js` 专项模型配置（vision / asr / embedding），新增 `models/wzh_kbModel.js`（本地文件知识库 + 余弦检索）、`models/wzh_traceModel.js`（操作痕迹持久化）、`controllers/wzh_llmPracticeController.js`，并在 `routes/wzh_api.js` 注册 9 个接口。
3. 知识库不依赖 MySQL：文本分块后用 `BAAI/bge-m3` 向量化，索引与原始文件分别落在 `backend/data` 与 `backend/uploads/kb`。
4. 图像识别用 `Qwen/Qwen3-VL-8B-Instruct`，语音识别用 `FunAudioLLM/SenseVoiceSmall`，两者都走硅基流动，Key 只在 `backend/.env`。
5. 每次上传、提问、识别、对话都会追加操作痕迹，页面底部可查看、刷新、清空。

**本次测试记录：**

- 知识库：上传自建 `wzh_kb_demo.md`（2 个片段），问「中华美食街的营业时间、招牌菜和配送规则」，最高相似度 0.5769，回答正确。
- 图像识别：生成一张含蓝色圆形、橙色长方形与「WZH 0807 / 图像识别测试」文字的图片，模型正确识别颜色、形状与文字。
- 语音识别：用系统中文语音合成 9 秒 WAV，转写结果为「你好，我是王子涵，学号0807，这是课程实践的语音识别测试。」
- 平台切换：硅基流动对话成功；七牛 Key 为空时返回「七牛云 还没有配置 API Key」，切换失败也会留下痕迹。
- 页面验证：浏览器实测四个卡片渲染正常，下拉框含两个平台，知识库 / 图像 / 语音三个结果框均返回真实内容。

**本次遇到的问题：**

1. 七牛云 Key 仍未提供，`QINIU_API_KEY` 为空，需填入后重启后端才能演示「切换后照常对话」。
2. 修改 `.env` 后必须重启后端，dotenv 只在进程启动时读取一次。
3. 浏览器录音依赖麦克风权限，未授权时页面会提示改用音频文件上传。
