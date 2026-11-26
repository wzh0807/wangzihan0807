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

## GET /api/chat/config（多平台升级版）

- 修改时间：2026-11-23 14:55
- 请求参数：无
- 说明：返回默认平台、全部可选平台及各平台的模型名与 Key 配置状态，不包含 Key 原文。

响应示例：

```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "defaultProvider": "siliconflow",
    "provider": "siliconflow",
    "model": "deepseek-ai/DeepSeek-V4-Flash",
    "keyConfigured": true,
    "providers": [
      { "id": "siliconflow", "name": "硅基流动", "baseUrl": "https://api.siliconflow.cn/v1", "model": "deepseek-ai/DeepSeek-V4-Flash", "keyConfigured": true },
      { "id": "qiniu", "name": "七牛云", "baseUrl": "https://api.qnaigc.com/v1", "model": "qiniu/conatus-free", "keyConfigured": false }
    ]
  }
}
```

---

## POST /api/chat（多平台热切换版）

- 修改时间：2026-11-23 14:55
- 请求参数（JSON）：

```json
{
  "provider": "siliconflow",
  "messages": [
    { "role": "system", "content": "你是「中华美食街」的在线客服……" },
    { "role": "user", "content": "你们几点营业？" }
  ]
}
```

- 参数说明：
  - `provider`：`siliconflow`（硅基流动）或 `qiniu`（七牛云）；省略时取 `backend/.env` 的 `CHAT_PROVIDER`。
  - `messages`：最多取最近 20 条、单条最多 2000 字，最后一条必须是 `user`。
- 说明：按平台读取 `.env` 中的 `baseURL` / `model` / `API Key`，转发到对应平台的 `POST /v1/chat/completions`；换平台只改 `.env` 三个值，业务代码不变。
- 错误翻译：401 → Key 无效；402 → 余额不足；404 → baseURL 少了 /v1 或模型名写错；429 → 请求太频繁。

成功响应示例：

```json
{
  "code": 0,
  "msg": "回复成功",
  "data": {
    "reply": "亲，我们每天10:00-22:00营业，最后点餐是21:30哦～",
    "model": "deepseek-ai/DeepSeek-V4-Flash",
    "provider": "siliconflow",
    "providerName": "硅基流动",
    "usage": { "prompt_tokens": 96, "completion_tokens": 24, "total_tokens": 120 }
  }
}
```

失败响应示例（七牛 Key 未配置）：

```json
{ "code": -1, "msg": "七牛云 还没有配置 API Key，请在 backend/.env 填写后重启后端", "data": { "provider": "qiniu" } }
```

失败响应示例（Key 写错）：

```json
{ "code": -1, "msg": "七牛云 返回 401：Key 无效或已过期，请检查请求头是否为 Bearer sk-xxx，并确认复制时没带空格换行", "data": { "provider": "qiniu", "status": 401 } }
```

---

## 课程实践接口（LLM 实践操作痕迹展示）

修改时间：2026-11-25 08:50

说明：以下接口全部返回统一格式 `{ "code": 0, "msg": "...", "data": {...} }`；`code=0` 成功，非 0 失败。所有 Key 只从 `backend/.env` 读取，接口响应中不出现 Key 原文。

### 1. GET /api/llm/config

- 请求参数：无
- 说明：返回对话平台列表、三个专项模型（视觉 / 语音 / 向量）配置状态与知识库统计。
- 响应示例：

```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "defaultProvider": "siliconflow",
    "providers": [
      { "id": "siliconflow", "name": "硅基流动", "baseUrl": "https://api.siliconflow.cn/v1", "model": "deepseek-ai/DeepSeek-V4-Flash", "keyConfigured": true },
      { "id": "qiniu", "name": "七牛云", "baseUrl": "https://api.qnaigc.com/v1", "model": "qiniu/conatus-free", "keyConfigured": false }
    ],
    "tasks": [
      { "kind": "vision", "name": "图像识别", "providerId": "siliconflow", "providerName": "硅基流动", "model": "Qwen/Qwen3-VL-8B-Instruct", "keyConfigured": true },
      { "kind": "asr", "name": "语音识别", "providerId": "siliconflow", "providerName": "硅基流动", "model": "FunAudioLLM/SenseVoiceSmall", "keyConfigured": true },
      { "kind": "embedding", "name": "知识库向量", "providerId": "siliconflow", "providerName": "硅基流动", "model": "BAAI/bge-m3", "keyConfigured": true }
    ],
    "kb": { "docCount": 1, "chunkCount": 2, "updatedAt": "2026-11-25T00:48:00.000Z" }
  }
}
```

### 2. GET /api/llm/traces?limit=60

- 请求参数：`limit`（可选，默认 60，最大 150）
- 说明：读取操作痕迹，按时间倒序；记录保存在 `backend/data/wzh_llm_traces.json`。
- 响应示例：

```json
{
  "code": 0,
  "msg": "共 1 条操作痕迹",
  "data": [
    {
      "id": "trace_1795567480137_m6hqt",
      "time": "2026-11-25T00:44:40.137Z",
      "module": "AI客服",
      "action": "对话 · 硅基流动",
      "status": "success",
      "provider": "siliconflow",
      "model": "deepseek-ai/DeepSeek-V4-Flash",
      "durationMs": 2514,
      "detail": "问：你们几点关门？；答：我们每天 22:00 结束营业……"
    }
  ]
}
```

### 3. POST /api/llm/traces/clear

- 请求参数：无
- 说明：清空全部操作痕迹，便于重新开始一次课堂演示。
- 响应示例：`{ "code": 0, "msg": "操作痕迹已清空", "data": null }`

### 4. POST /api/kb/upload

- 请求方式：`multipart/form-data`
- 请求参数：`file`（必填，支持 txt / md / markdown / csv / json / html / htm / log，≤20MB）
- 说明：解析文本 → 按约 600 字分块（重叠 80 字）→ 调用 `BAAI/bge-m3` 向量化 → 原始文件存 `backend/uploads/kb/`，索引存 `backend/data/wzh_kb_index.json`。
- 响应示例：

```json
{
  "code": 0,
  "msg": "知识库文件上传成功，共 2 个片段",
  "data": {
    "doc": { "id": "kb_1795567430440_r54gk", "name": "wzh_kb_demo.md", "ext": ".md", "size": 2231, "uploadedAt": "2026-11-25T00:43:50.441Z", "chunkCount": 2 },
    "chunkCount": 2,
    "truncated": false,
    "stats": { "docCount": 1, "chunkCount": 2 }
  }
}
```

### 5. GET /api/kb/list

- 请求参数：无
- 说明：返回知识库文档列表与统计，不返回向量数组。
- 响应示例：

```json
{
  "code": 0,
  "msg": "知识库共有 1 个文件",
  "data": {
    "docs": [ { "id": "kb_1795567430440_r54gk", "name": "wzh_kb_demo.md", "ext": ".md", "size": 2231, "uploadedAt": "2026-11-25T00:43:50.441Z", "chunkCount": 2 } ],
    "stats": { "docCount": 1, "chunkCount": 2 }
  }
}
```

### 6. POST /api/kb/ask

- 请求头：`Content-Type: application/json`
- 请求参数：`question`（必填，≤500 字）
- 请求示例：`{ "question": "中华美食街的营业时间、招牌菜和配送规则是什么？" }`
- 说明：问题转向量 → 余弦相似度取 top4 → 相似度低于 0.3 直接返回「没有找到相关内容」→ 否则把资料拼进提示词，要求模型只依据资料回答。
- 响应示例：

```json
{
  "code": 0,
  "msg": "知识库回答成功",
  "data": {
    "answer": "营业时间每天 10:00 到 22:00（资料1）……",
    "matches": [
      { "docName": "wzh_kb_demo.md", "chunkIndex": 0, "score": 0.5769, "preview": "# 王子涵全栈项目 · 课程实践知识库……" }
    ],
    "provider": "siliconflow",
    "providerName": "硅基流动",
    "model": "deepseek-ai/DeepSeek-V4-Flash",
    "bestScore": 0.5769,
    "usage": { "prompt_tokens": 762, "completion_tokens": 156, "total_tokens": 918 }
  }
}
```

### 7. DELETE /api/kb/:id

- 请求参数：路径参数 `id`（文档 id，例如 `kb_1795567430440_r54gk`）
- 说明：同时删除向量索引条目与 `backend/uploads/kb/` 下的原始文件。
- 响应示例：`{ "code": 0, "msg": "文档已删除", "data": { "id": "kb_1795567430440_r54gk", "stats": { "docCount": 0, "chunkCount": 0 } } }`

### 8. POST /api/vision

- 请求方式：`multipart/form-data`
- 请求参数：
  - `image`（必填，jpg / jpeg / png / webp / gif / bmp，≤10MB）
  - `question`（可选，默认「请用简体中文描述这张图片」）
- 说明：图片 buffer 转 base64 data URL，交给 `Qwen/Qwen3-VL-8B-Instruct` 生成中文描述。
- 响应示例：

```json
{
  "code": 0,
  "msg": "图片识别成功",
  "data": {
    "reply": "这张图片左侧是一个蓝色圆形，右侧是一个橙色长方形，下方文字是 WZH 0807 和 图像识别测试。",
    "model": "Qwen/Qwen3-VL-8B-Instruct",
    "provider": "siliconflow",
    "providerName": "硅基流动",
    "image": { "name": "wzh_vision_test.png", "size": 10364, "type": "image/png" },
    "usage": { "prompt_tokens": 498, "completion_tokens": 156, "total_tokens": 654 }
  }
}
```

### 9. POST /api/asr

- 请求方式：`multipart/form-data`
- 请求参数：`audio`（必填，wav / mp3 / m4a / webm / ogg / flac，≤20MB）
- 说明：用 FormData 把音频转发到硅基流动 `POST /v1/audio/transcriptions`，模型 `FunAudioLLM/SenseVoiceSmall`。
- 响应示例：

```json
{
  "code": 0,
  "msg": "语音识别成功",
  "data": {
    "text": "你好，我是王子涵，学号0807，这是课程实践的语音识别测试。",
    "model": "FunAudioLLM/SenseVoiceSmall",
    "provider": "siliconflow",
    "providerName": "硅基流动",
    "audio": { "name": "wzh_asr_test.wav", "size": 373206, "type": "application/octet-stream" },
    "usage": { "type": "duration", "seconds": 9 }
  }
}
```

### 10. POST /api/chat（本次变更）

- 原有请求与响应不变，新增副作用：每次对话无论成功或失败，都会向 `backend/data/wzh_llm_traces.json` 追加一条 `module` 为 `AI客服` 的操作痕迹，记录 `action`（平台名）、`status`、`provider`、`model`、`durationMs` 与问题/回答摘要，不记录 Key 与完整对话。
