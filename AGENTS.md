# AGENTS.md

《高级网页设计》课程的 Gitee 仓库：若干学生的**独立**静态站点，外加一个较大的原生 JS 应用。根目录没有构建、测试、lint 或包管理器 —— 纯 HTML/CSS/原生 JS。除非有要求，不要引入框架、打包工具或 CDN。`README.md` 是 Gitee 默认模板，忽略即可。`.opencode/` 是 OpenCode 工具（其自带的 `package.json`/`node_modules` 已被忽略），不属于任何站点。

## 语言与文档约定

- 本项目所有说明文字、文档、检查清单、提交说明一律使用**简体中文**。
- 文件路径、命令、HTML/CSS/JS 标识符（标签名、类名、ID、函数名、变量名、选择器、API 字段）保留英文原文，不要翻译或改写。
- 代码注释用中文书写（标识符本身保持英文）；新建页面与 JS 函数的注释要求见「新建 HTML 文件约定」。

## 目录结构与入口

每个顶层目录都是一个独立站点；多数页面内联 CSS，彼此不共享资源。始终使用完整路径。

| 路径 | 归属 / 入口 |
| --- | --- |
| 根目录 `index.html`、`gaojiwanyesheji.html`、`html*.html`、`ziwojiashao.html` | 陈禹燃练习页；多数内联 CSS，部分链接 `basic.css`/`html_basic.css` |
| 根目录 `self-intro.html` | 李汶静独立自我介绍页；不属于陈禹燃，也未从根首页链接 |
| 根目录 `img/` | 仅有 `头像.jpg`，被 `html_self.html` 使用 |
| `1/index.html` | 王子涵练习首页/目录，链接 `1/` 下的各页面 |
| `1/项目/` | WordTrip 单词背诵应用 —— 父仓库中**未跟踪**，有独立嵌套 `.git`（分支 `master`，无远程） |
| `1/catch-ball.html` | 抓小球游戏（`catch-ball.css/js`）；`1/spec.md` 是其规格 |
| `1/l1/` | 分级练习（`starter-level*-0807wzh.html`、`data.js`） |
| `24001011029赵雨欣/index.html` | 赵雨欣（`zwjs.html`、`zyx.html` 在此目录，不在仓库根）；页面自包含，`basic.css` 为空 |
| `wangyao-information/index.html` | 王垚；无 `basic.css`，使用 `html_basic.css`/`*004.css` |
| `2002120309曹炳宇/web-c/高级网页设计/` | 曹炳宇 |

## 关键注意事项

- `2002120309曹炳宇/.../Git/` 是约 405 MB 的 **Git for Windows 完整安装副本**（该学生目录整体约 494 MB），全部已被跟踪。绝不编辑、扫描或删除它。
- 绝不要在仓库根目录执行 `git add .`。Gitee 提交技能会让你这么做，不要照做。只暂存明确路径，否则可能把嵌套的 WordTrip 仓库和无关改动一并暂存。
- `1/项目/` 是拥有独立历史、**无远程**的嵌套仓库，父仓库未跟踪它。绝不要把它暂存进父仓库；那里的改动属于它自己的仓库（用 `git -C 1/项目` 或在其中执行 git），其提交永远不会进入父仓库历史。
- `1/` 下许多仍在使用的文件有意不跟踪（如 `catch-ball.*`、`l1/`、`spec.md`、`.trae/`、`项目/`）。不要把 `git status` 的噪音当成自己的改动，未经询问绝不删除或提交它们。
- 根目录的 `node.exe`、`npm*`、`npx*`、`corepack*`、`node-v24.*.msi`、`install_tools.bat`、`nodevars.bat` 是已入库的二进制文件，不是构建环境。根目录没有 `package.json`；`.opencode/package.json` 与 `node_modules/` 本地存在但已被忽略。
- 密钥：`.git/config` 的 `origin` URL 内嵌 Gitee token，且部分 `.opencode/skills/*/SKILL.md` 含明文 Gitee token。绝不打印、复制、粘贴进对话或提交。
- 文件为 UTF-8 **无 BOM**，含中文内容。`.opencode/skills/*` 使用 CRLF —— 保持原样。
- 未经要求不要 commit 或 push。`origin/HEAD -> master`；`origin/main` 也存在。
- 以下断链在改动前就已存在，不是你的改动造成的：根 `html.html` 链接缺失的 `./html-work.css`；根 `html.html`/`gaojiwanyesheji.html`/`html_basic001.html` 链接缺失的 `./img/1.jpg`；`24001011029赵雨欣/*.html` 链接缺失的 `myphoto.jpg`。

## 新建 HTML 文件约定

每新建的 `.html` 文件（根目录或任意子目录）必须在 `<head>` 顶部、任何 `<style>`/`<script>` 之前加上注释块，字段如下（中文）：

```html
<!--
  作者：王子涵
  建立时间：2026-11-02
  使用模型：DeepSeek-V4.1-Flash
  功能名称：<页面名称>
  功能简介：<一句话说明这个页面做什么>
-->
```

- `建立时间` 填真实创建日期，`使用模型` 填实际写该文件的模型 —— 不要照抄其他文件的注释块。
- 所有 CSS 类名、id 与 JS 变量（含函数名）统一以 `wzh_` 开头（王子涵姓名首字母），新增代码必须遵守；GitHub 仓库名须包含姓名全拼 `wangzihan0807`。
- 内联 JS 同样要注释：每个函数上方写一条中文注释，说明「功能名称」与「功能简介」（做什么、返回什么、有什么副作用）；非显然的代码块也要加注释。为页面新建的外部 `.js` 文件同样适用。
- 已有文件不做回溯补注释，除非明确要求。

## 运行与验证

- 无自动化测试。通过浏览器打开页面来验证改动。
- 多数页面用 `file://` 即可打开。
- `1/项目`（WordTrip）会请求 `data/*.json`，`file://` 会失败。在 `1/项目` 下执行 `python -m http.server 8080`，再打开 `http://localhost:8080`。
- WordTrip 约定（来自 `1/项目/README.md`，该应用的权威文档，与根 README 不同）：近似 BEM 的 `wzh_` 前缀、全局 `window.WZH`（`js/common.js:776`）、CSS 分层顺序 `base -> layout -> components -> pages`、`js/common.js` 在加载时自动初始化。`data/*.json` 为 `{code,message,data}` 信封，`apiGet` 解包 `.data`（`js/common.js:145`）。其提交使用 Conventional Commits（`feat:`/`fix:`/`style:`/`chore:`）。
- `1/spec.md` 是抓小球的规格（其中写的文件名是 `index.html`/`style.css`/`script.js`，实际文件是 `catch-ball.html/css/js`）。改动游戏时保持两者同步。

## 已有指令来源

- `1/.trae/rules/superpowers.md` 定义了课程流程：brainstorm -> 写 `spec.md` -> 任务计划 -> 人工验收清单 -> 写代码 -> 代码审查 -> 浏览器验证 -> git -> `retrospective.md`。`1/` 下的新功能须遵守；编码前先确认规格。
- `.opencode/skills/webdesign/SKILL.md` 已**过时**：引用 `D:\gaojiwangye`、根目录 `zwjs.html`/`zyx.html`（现位于 `24001011029赵雨欣/`），并引用缺失的 `myphoto.jpg`。不要相信其中的路径。
- 各 Gitee 提交技能内容重复且内嵌凭据；只采纳其中的远程/分支信息，并只暂存明确路径。
