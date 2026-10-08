---
name: webdesign004-commit
description: 提交高级网页设计项目到Gitee仓库。当用户要求提交webdesign004项目、推送高级网页设计到Gitee时使用。
---

# Webdesign004项目提交技能

## 使用场景
当用户要求将高级网页设计项目提交到Gitee仓库时使用此技能。

## 配置信息
- **仓库地址**: https://gitee.com/neusoft_wangyao_jsj/webdesign004project.git
- **认证方式**: 私人令牌（OAuth2）

## 操作步骤

### 1. 添加所有文件到暂存区
```bash
git add .
```

### 2. 提交更改
```bash
git commit -m "提交信息（根据实际修改内容自定义）"
```

### 3. 配置远程仓库（如已配置则跳过）
```bash
git remote set-url origin https://oauth2:<private_token>@gitee.com/neusoft_wangyao_jsj/webdesign004project.git
```

### 4. 推送到远程仓库
```bash
git push -u origin master
```

## 注意事项
- 使用私人令牌认证避免每次输入密码
- 提交前确保所有文件已保存
- 如遇冲突先拉取再解决：`git pull origin master`
- .gitignore 已排除 node_modules 等目录
