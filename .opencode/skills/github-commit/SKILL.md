---
name: github-commit
description: 提交本项目并推送到 GitHub 仓库。当用户要求提交代码、git commit、git push 到 GitHub 时使用。
---

# GitHub 项目提交技能

将当前《高级网页设计》项目提交（commit）并推送到 GitHub。

## 仓库与认证

- **SSH 地址**: `git@github.com:wzh0807/wangzihan0807.git`
- **HTTPS 地址**: `https://github.com/wzh0807/wangzihan0807.git`
- **认证**: 使用已注册公钥 `C:/Users/19872/.ssh/id_ed25519`（GitHub 账号 `wzh0807`）
- **网络**: github.com 的 22 端口不可用，`~/.ssh/config` 中已把 `github.com` 指向 `ssh.github.com:443`
- **验证**: `ssh -T git@github.com` 应返回 `Hi wzh0807! You've successfully authenticated...`

## 操作步骤

### 1. 验证 SSH 认证

```bash
ssh -T git@github.com
```

### 2. 配置 github 远程（保留原有的 gitee origin）

```bash
git remote add github git@github.com:wzh0807/wangzihan0807.git
# 若已存在则改为
git remote set-url github git@github.com:wzh0807/wangzihan0807.git
```

### 3. 暂存明确的路径（禁止 `git add .`）

```bash
git add -- AGENTS.md .opencode/skills 1/Untitled-1.html 1/self.html 1/catch-ball.html 1/catch-ball.css 1/catch-ball.js 1/dataTyp004.html 1/spec.md 1/l1 1/.trae "1/img/JS_obj-fun.html"
```

### 4. 提交

```bash
git commit -m "提交高级网页设计项目并同步到GitHub"
```

### 5. 推送

```bash
git push -u github master
```

## 注意事项

- **禁止 `git add .`**：`1/项目/` 是嵌套仓库（WordTrip），加进来会变成 gitlink 且内容不会上传，必须排除。
- 不要提交任何带令牌的 URL 或文件：`.git/config` 的 origin 内嵌 Gitee 令牌，`.opencode/skills/*/SKILL.md` 中也含明文令牌；本项目技能文件不应再写入任何令牌。
- 仓库约 554 MB（含 `2002120309曹炳宇/.../Git/` 中约 405 MB 的 Git for Windows）。单文件最大约 89 MB，低于 GitHub 的 100 MB 硬限制，但首次推送耗时较长，建议在后台执行。
- 远端仓库为空时，首次 `push -u` 会创建 `master` 分支；之后直接用 `git push github master`。
- 只改了部分文件时，把第 3 步路径换成实际改动路径。
