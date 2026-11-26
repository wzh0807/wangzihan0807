# 三级项目 · 全栈项目初始化（课堂案例复刻）

- 姓名：王子涵
- 学号：0807
- 项目类别：模仿（课堂案例复刻）
- 技术栈：原生 HTML/CSS/JS + Node.js Express + MySQL 5.7
- 后端端口：8807

## 启动方式

1. 确认本机 MySQL 已启动（phpstudy 面板启动或运行 `mysqld`）
2. 双击根目录 `start.bat`
3. 浏览器访问 http://localhost:8807

## 接口

| 接口 | 说明 |
| --- | --- |
| `GET /api/health` | 健康检查 |
| `POST /api/db-test` | 测试数据库连接 |
| `GET /api/news` | 科技新闻列表 |
| `GET /api/gallery` | 图文列表 |
| `POST /api/chat` | AI 聊天 / 在线客服（按 provider 转发硅基流动或七牛） |
| `GET /api/chat/config` | 平台列表、模型名与 Key 配置状态 |
| `GET /api/llm/config` | 课程实践：平台与视觉/语音/向量模型配置状态 |
| `GET /api/llm/traces` | 课程实践：读取操作痕迹 |
| `POST /api/llm/traces/clear` | 课程实践：清空操作痕迹 |
| `POST /api/kb/upload` | 课程实践：上传知识库文件（multipart，字段名 file） |
| `GET /api/kb/list` | 课程实践：知识库文档列表 |
| `POST /api/kb/ask` | 课程实践：知识库检索问答 |
| `DELETE /api/kb/:id` | 课程实践：删除知识库文档 |
| `POST /api/vision` | 课程实践：图片识别（multipart，字段名 image） |
| `POST /api/asr` | 课程实践：语音识别（multipart，字段名 audio） |

## 大模型应用

- 页面：`frontend/ai-chat.html`（AI 聊天 / 中华美食街客服，可切换硅基流动、七牛云）
- 报告：`frontend/ai-task.html`（Key 安全、客服人设测试记录、答辩三问）
- 配置：在 `backend/.env` 中填写 `SILICONFLOW_API_KEY` 与 `QINIU_API_KEY`，改完需重启后端
- 换平台只改三个值：`baseURL`、`model`、`API Key`，业务代码不动

## 课程实践 · LLM 操作痕迹展示

- 页面：`frontend/llm-practice.html`（一页完成四项现场演示）
- 实践一：AI 客服，下拉框切换硅基流动 / 七牛云，切换后继续对话
- 实践二：知识库，上传 txt / md 文件，自动分块 + `BAAI/bge-m3` 向量化，提问时余弦检索 top4 片段再回答
- 实践三：图像识别，上传图片交给 `Qwen/Qwen3-VL-8B-Instruct` 生成中文描述
- 实践四：语音识别，浏览器录音或上传音频，交给 `FunAudioLLM/SenseVoiceSmall` 转写
- 操作痕迹：每次操作写入 `backend/data/wzh_llm_traces.json`，页面底部可查看、刷新、清空
- 知识库文件保存在 `backend/uploads/kb/`，索引保存在 `backend/data/wzh_kb_index.json`，不依赖 MySQL

详细说明见 `backend/wzh_interface.md`，数据库重建脚本见 `backend/wzh_database.md`。
