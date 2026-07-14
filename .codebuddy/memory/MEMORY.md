# Lively MC Wiki 项目记忆

## 项目概述
- 基于 OWD.K-MD3 (Open-web-docs.kit) 框架构建的 Minecraft 中文维基百科
- 纯静态站点，Material Design 3 设计规范，支持亮色/暗色主题
- 零构建工具，Python HTTP Server 即可运行

## 技术栈
- 框架: OWD.K-MD3 (https://github.com/Open-code-Studio/Open-web-docs.kit)
- 内容驱动: Markdown 文件
- 渲染引擎: marked.js v15.0.7 + highlight.js v11.11.1
- 设计: Material Design 3 + 响应式布局

## 项目结构
- index.html: 首页（Hero + Features + Widgets）
- page/index.html: 文档页面模板（侧边栏 + TOC）
- page/config.json: 站点配置文件
- page/js/app.js: 路由、Markdown 渲染、导航逻辑
- page/css/: 5 个 CSS 文件 (theme, layout, components, markdown, home)
- docs/: 9 个 Markdown 文档

## 自定义修改
- index.html: navToPage 支持自定义 route
- page/index.html: 品牌名称改为 Minecraft Wiki
- page/config.json: 完整 MC Wiki 配置

## MC Wiki 风格组件 (2026-07-14)
- **MC Infobox**: page/css/components.css 中添加 `.mc-infobox` 样式（右浮动信息框，MC Wiki 风格）
- **MC Gallery**: page/css/components.css 中添加 `.mc-gallery` 样式（图片网格 + caption）
- **MC Video**: `.mc-video` 样式用于视频嵌入容器
- **GIF Badge**: `.mc-gif-badge` 标记动画图片
- **Post-processing**: page/js/app.js 中 `processInfobox()`, `processGallery()`, `processAnimatedImages()` 三个函数在 marked 渲染后自动转换格式

## 图片下载
- download_images.py: Python 脚本，从 .md 文件中提取图片 URL 并下载到 page/images/blocks/
- 图片保存路径: page/images/blocks/{block_name}/{hash}.ext
- 下载后自动更新 .md 文件中的 URL 为本地相对路径

## 文档内容覆盖
- README.md: 首页介绍
- docs/blocks/: 87 个方块详细文档（所有方块均已扩展为完整内容，含 infobox 数据、用途、数据值、音效、你知道吗、图库等）
- docs/items.md: 物品列表
- docs/mobs.md: 生物图鉴
- docs/crafting.md: 合成与烧炼配方
- docs/mechanics.md: 游戏机制
- docs/versions.md: 版本历史
- docs/about.md: 关于页面
- docs/_widgets.md: 首页功能面板
