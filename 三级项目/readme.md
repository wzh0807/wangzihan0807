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
| `POST /api/chat` | AI 聊天（按 provider 转发硅基流动 / 七牛） |
| `GET /api/chat/config` | AI 模型名与 Key 配置状态 |
| `GET /api/chat/providers` | 两个平台的模型名与 Key 配置状态 |
| `POST /api/kb/upload` | 知识库上传（txt / md，切块落盘） |
| `GET /api/kb/list` | 知识库文件列表 |
| `POST /api/kb/chat` | 知识库检索问答 |
| `POST /api/vision` | 图像识别（硅基流动 Qwen3-VL） |
| `POST /api/asr` | 语音识别（硅基流动 SenseVoice） |

LLM 实践页：`frontend/llm-practice.html`（双平台 AI 客服、知识库、图像识别、语音识别，含操作痕迹面板）。
七牛平台需在 `backend/.env` 填写 `QINIU_API_KEY`，未填写时页面会提示该平台不可用。

详细说明见 `backend/wzh_interface.md`，数据库重建脚本见 `backend/wzh_database.md`。
