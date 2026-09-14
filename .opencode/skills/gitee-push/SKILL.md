---
name: gitee-push
description: Push project to Gitee repository. Use when committing and pushing code to Gitee with token authentication.
---

# Gitee Push Skill

This skill helps you push your project to a Gitee repository using token authentication.

## Repository Configuration

- **Repository URL**: https://gitee.com/neusoft_wangyao_jsj/webdesign004project.git
- **Token**: 2895bf9c892c041ddec4eb9439fc7345

## Steps

1. Initialize git repository (if not already initialized)
2. Configure git user
3. Add remote with token authentication
4. Add all files
5. Create commit
6. Push to remote

## Commands

```bash
# Initialize git
git init

# Add remote with token
git remote add origin https://2895bf9c892c041ddec4eb9439fc7345@gitee.com/neusoft_wangyao_jsj/webdesign004project.git

# Add all files
git add .

# Commit
git commit -m "提交高级网页设计项目"

# Push
git push -u origin master
```

## Notes

- The token is embedded in the remote URL for authentication
- First push uses `-u` to set upstream tracking
- Subsequent pushes can use simple `git push`
