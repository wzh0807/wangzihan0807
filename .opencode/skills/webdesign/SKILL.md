---
name: webdesign
description: Use when working on the 高级网页设计 (Advanced Web Design) course project for 赵雨欣 in D:\gaojiwangye. This static HTML/CSS course-practice site is written in plain native HTML, CSS and vanilla JS without any CDN or frameworks. Use when editing index.html, zwjs.html, zyx.html, basic.css, adding a new page, updating the class directory/TOC, or styling pages for this project.
---

# 高级网页设计 - 课堂实践项目

学生：赵雨欣（学号 24001011029）｜《高级网页设计》课堂实践。

## 项目概况

一个纯静态 HTML/CSS 网页项目，无构建工具、无依赖、不引用任何 CDN。

| 文件 | 作用 |
| ---- | ---- |
| `index.html` | 主页面，课堂目录与页面索引，内嵌本项目的开发提示词与说明 |
| `zwjs.html` | 「自我介绍」网页（个人简介、兴趣爱好、目标、自我评价） |
| `zyx.html` | `zwjs.html` 的重复副本 |
| `basic.css` | 基础样式文件（当前为空，可为后续页面提供公用样式） |

## 硬性约定

- **只使用原生代码**：手写 HTML / CSS / 原生 JavaScript。
- **不使用 CDN**：所有字体、图标、样式必须本地内置（内联 `<style>`/SVG 或本地文件）。
- 页面必须 `lang="zh-CN"` 并声明 `charset="utf-8"`。
- 移动端适配：`<meta name="viewport" content="width=device-width,initial-scale=1">`。
- 新增页面先建 `.html` 文件，再在 `index.html` 的固定入口里同步添加链接。

## index.html 目录机制

- 页面顶部区域会通过脚本把 `.html` 文件渲染成卡片（`#file-list`），可搜索/筛选。
- 固定入口在脚本 `addLink('xxx', 'xxx.html')` 处维护。新增页面时必须同步在固定入口添加，
  否则页面在部分环境下（无目录索引）无法被访问。
- `index.html` 的 `#user-prompt` 内嵌了生成该页面的原始提示词，是页面设计约束的一部分。

## 待办（引用但暂未创建的文件）

- `html_basics.html`（HTML基础 页面）在固定入口中被引用，但尚未创建。
- `myphoto.jpg`（个人照片）被 `zwjs.html` / `zyx.html` 引用，尚未提供。

## 工作流程

1. 修改或新增页面后在浏览器中打开验证渲染与交互。
2. 遵守既有视觉风格（暖色、卡片圆角、渐变、`.card`/`.item` 模式）。
3. 提交时做好中文提交信息，区分「新增页面」「美化样式」「修复」等类型。