# 接口文档（追加写入，禁止覆盖）

服务地址：`http://localhost:8807`
统一响应格式：`{ "code": 0, "msg": "提示信息", "data": {...} }`，`code=0` 成功，非 0 失败。

---

## GET /api/health

- 修改时间：2026-11-23 13:32
- 请求参数：无

响应示例：

```json
{
  "code": 0,
  "msg": "ok",
  "data": { "service": "wzh-fullstack-init", "port": 8807, "uptime": "12s", "time": "2026/11/23 13:32:10" }
}
```

---

## POST /api/db-test

- 修改时间：2026-11-23 13:33
- 请求参数（JSON）：

```json
{ "username": "root", "password": "你的数据库密码" }
```

- 成功响应示例：

```json
{
  "code": 0,
  "msg": "数据库连接成功",
  "data": { "version": "5.7.26", "database": "wzh_fullstack", "user": "root" }
}
```

- 失败响应示例（密码错误）：

```json
{
  "code": -1,
  "msg": "数据库连接失败：Access denied for user 'root'@'localhost' (using password: YES)",
  "data": { "code": "ER_ACCESS_DENIED_ERROR" }
}
```

---

## GET /api/news

- 修改时间：2026-11-23 13:34
- 请求参数：无（按 `publish_time` 倒序返回 wzh_news 全部数据）

响应示例：

```json
{
  "code": 0,
  "msg": "新闻列表获取成功，共 12 条",
  "data": [
    {
      "id": 1,
      "title": "国产大模型开源新版本，推理成本再降四成",
      "summary": "新版本在中文长文本理解上继续提升，同时把单次推理成本压低了约 40%。",
      "content": "该模型团队公布了最新评测结果……",
      "source": "新华社",
      "publish_time": "2026-11-23 09:20",
      "cover_img": "/images/gallery-1.svg"
    }
  ]
}
```

---

## GET /api/gallery

- 修改时间：2026-11-23 13:35
- 请求参数：无（按 `create_time` 倒序返回 wzh_gallery 全部数据）

响应示例：

```json
{
  "code": 0,
  "msg": "图文列表获取成功，共 8 条",
  "data": [
    {
      "id": 1,
      "title": "光子芯片晶圆",
      "description": "以光互连替代部分电互连，功耗更低，适合数据中心内部高速传输。",
      "img_url": "/images/gallery-1.svg",
      "category": "芯片",
      "create_time": "2026-11-23 10:00"
    }
  ]
}
```

---

## GET /api/chat/config

- 修改时间：2026-11-23 13:41
- 请求参数：无
- 说明：返回 AI 聊天页顶部展示的模型信息，不包含 API Key 本身。

响应示例：

```json
{
  "code": 0,
  "msg": "ok",
  "data": { "provider": "siliconflow", "model": "Qwen/Qwen2.5-7B-Instruct", "keyConfigured": true }
}
```

---

## POST /api/chat

- 修改时间：2026-11-23 13:41
- 请求参数（JSON）：

```json
{
  "messages": [
    { "role": "system", "content": "你是《高级网页设计》课程全栈项目里的 AI 助手（可省略）" },
    { "role": "user", "content": "用一句话解释什么是RESTful接口" }
  ]
}
```

- 说明：后端读取 `backend/.env` 中的 `SILICONFLOW_API_KEY`，转发到硅基流动 `POST https://api.siliconflow.cn/v1/chat/completions`；`messages` 最多取最近 20 条、单条最多 2000 字，最后一条必须是 `user`。Key 不会出现在前端代码或响应里。

成功响应示例：

```json
{
  "code": 0,
  "msg": "回复成功",
  "data": {
    "reply": "RESTful接口是一种遵循REST（Representational State Transfer）架构风格的网络服务接口设计。",
    "model": "Qwen/Qwen2.5-7B-Instruct",
    "usage": { "prompt_tokens": 36, "completion_tokens": 37, "total_tokens": 73 }
  }
}
```

失败响应示例：

```json
{ "code": -1, "msg": "后端未配置 SILICONFLOW_API_KEY，请检查 backend/.env", "data": null }
```

---

## POST /api/chat（2026-11-26 升级：支持多平台热切换）

- 修改时间：2026-11-26 13:40
- 请求参数（JSON）：

```json
{
  "provider": "siliconflow",
  "messages": [
    { "role": "system", "content": "你是课程 AI 客服小智（可省略）" },
    { "role": "user", "content": "帮我介绍一下这个项目" }
  ]
}
```

- `provider` 可选 `siliconflow`（硅基流动）或 `qiniu`（七牛），省略时默认 `siliconflow`
- 后端按 provider 读取 `.env`：`SILICONFLOW_BASE_URL / SILICONFLOW_API_KEY / SILICONFLOW_MODEL`，或 `QINIU_BASE_URL / QINIU_API_KEY / QINIU_MODEL`
- 响应里额外返回 `provider` 与 `providerName`，前端据此显示当前平台

响应示例：

```json
{
  "code": 0,
  "msg": "回复成功",
  "data": {
    "reply": "我是课程 AI 客服小智……",
    "provider": "siliconflow",
    "providerName": "硅基流动",
    "model": "deepseek-ai/DeepSeek-V4-Flash",
    "usage": { "prompt_tokens": 30, "completion_tokens": 60, "total_tokens": 90 }
  }
}
```

---

## GET /api/chat/providers

- 修改时间：2026-11-26 13:40
- 请求参数：无
- 说明：返回两个平台的模型名与 Key 是否已配置，前端下拉框据此渲染（不返回 Key 本身）

响应示例：

```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "providers": [
      { "id": "siliconflow", "name": "硅基流动", "model": "deepseek-ai/DeepSeek-V4-Flash", "keyConfigured": true },
      { "id": "qiniu", "name": "七牛", "model": "qiniu/conatus-free", "keyConfigured": false }
    ],
    "default": "siliconflow"
  }
}
```

---

## POST /api/kb/upload

- 修改时间：2026-11-26 13:41
- 请求参数（JSON，前端用 FileReader 读出文本后提交）：

```json
{ "name": "readme.md", "content": "文件全文……" }
```

- 限制：单文件 ≤ 200KB；按空行与 400 字切块；数据落盘到 `backend/data/wzh_kb.json`

响应示例：

```json
{
  "code": 0,
  "msg": "知识库上传成功：readme.md，切分为 2 块",
  "data": { "id": "kb_1795670874482_upm5", "name": "readme.md", "size": 846, "chars": 547, "chunkCount": 2, "time": "2026/11/26 13:27:54" }
}
```

---

## GET /api/kb/list

- 修改时间：2026-11-26 13:41
- 请求参数：无
- 说明：返回知识库文件的元信息（不含正文与分块）

响应示例：

```json
{
  "code": 0,
  "msg": "知识库共 1 个文件",
  "data": [
    { "id": "kb_1795670874482_upm5", "name": "readme.md", "size": 846, "chars": 547, "chunkCount": 2, "time": "2026/11/26 13:27:54" }
  ]
}
```

---

## POST /api/kb/chat

- 修改时间：2026-11-26 13:42
- 请求参数（JSON）：

```json
{ "provider": "siliconflow", "question": "这个项目的端口和数据库名是什么？" }
```

- 说明：把问题拆成中文二字词与英文整词做关键词检索（命中次数 × 词长），取前 3 个片段拼进 system 提示，再转调所选平台的大模型

响应示例：

```json
{
  "code": 0,
  "msg": "知识库回答成功",
  "data": {
    "reply": "根据提供的资料，项目的后端端口是 8807……",
    "provider": "siliconflow",
    "providerName": "硅基流动",
    "model": "deepseek-ai/DeepSeek-V4-Flash",
    "matched": [
      { "file": "readme.md", "score": 8, "text": "# 三级项目 · 全栈项目初始化……" }
    ]
  }
}
```

---

## POST /api/vision

- 修改时间：2026-11-26 13:43
- 请求参数（JSON，图片为 DataURL）：

```json
{ "image": "data:image/jpeg;base64,/9j/4AAQ...", "question": "请描述这张图片的内容" }
```

- 说明：仅走硅基流动视觉模型（`.env` 的 `SILICONFLOW_VISION_MODEL`，当前 `Qwen/Qwen3-VL-30B-A3B-Instruct`）；Base64 超过 8MB 拒绝
- 依赖：`app.js` 已把 `express.json` 上限放宽到 30MB

响应示例：

```json
{
  "code": 0,
  "msg": "图像识别成功",
  "data": { "reply": "一个戴着红色围巾的卡通女孩头像……", "model": "Qwen/Qwen3-VL-30B-A3B-Instruct", "usage": { "total_tokens": 300 } }
}
```

---

## POST /api/asr

- 修改时间：2026-11-26 13:44
- 请求参数（JSON，音频为 Base64）：

```json
{ "audio": "UklGRiQAAABXQVZF...", "mime": "audio/wav", "name": "wzh_record.wav" }
```

- 说明：后端把 Base64 还原成 Blob，以 multipart 调硅基流动 `POST /v1/audio/transcriptions`，模型取 `.env` 的 `SILICONFLOW_ASR_MODEL`（当前 `FunAudioLLM/SenseVoiceSmall`）
- 限制：Base64 ≤ 24MB（原始音频约 18MB）

响应示例：

```json
{ "code": 0, "msg": "语音识别成功", "data": { "text": "你好，这是一段测试录音", "model": "FunAudioLLM/SenseVoiceSmall" } }
```
