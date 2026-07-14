# Lively MC Wiki 项目记忆

## 项目概述
- 基于 OWD.K-MD3 (Open-web-docs.kit) 框架构建的 Minecraft 中文维基百科
- 纯静态站点，Material Design 3 设计规范，支持亮色/暗色主题
- 零构建工具，Python HTTP Server 即可运行

## 技术栈
- 框架: OWD.K-MD3 (https://github.com/Open-code-Studio/Open-web-docs.kit)
- 内容驱动: Markdown 文件
- 渲染引擎: marked.js v15.0.7 + highlight.js v11.11.1
- 设计: OREUI (Mojang Ore UI 设计系统，深色石板风格) + 响应式布局
- 主题: 深色默认，支持亮色/暗色切换

## 项目结构
- index.html: 首页（Hero + Features + Widgets）
- page/index.html: 文档页面模板（侧边栏 + TOC）
- page/config.json: 站点配置文件
- page/js/app.js: 路由、Markdown 渲染、导航逻辑
- page/css/: 5 个 CSS 文件 (theme, layout, components, markdown, home)
- page/blocks-nav.json: 侧边栏方块子菜单数据
- api/: 版本控制 API (latest.json, versions.json)
- docs/blocks/: 87 个方块详细文档
- docs/items/: 14 个物品文档 (index + 13 子文章)
- docs/mobs/: 21 个生物文档 (index + 20 子文章)
- docs/crafting/: 9 个合成文档 (index + 8 子文章)
- docs/mechanics/: 15 个机制文档 (index + 14 子文章)
- docs/versions/: 1 个版本历史文档
- docs/ (根): 7 个顶层文档

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

## 版本号自动管理 (2026-07-14)
- `versions.json`: 最新版本数据库（Java 1.21.5 春日生机, 基岩 1.21.70）
- `update_versions.py`: 扫描 .md 文件替换 `{{JE_VERSION}}` 等占位符，支持 --check/--dry-run
- `page/js/app.js`: `loadVersions()` + `replaceVersionPlaceholders()` 运行时替换
- 占位符: `{{JE_VERSION}}`, `{{BE_VERSION}}`, `{{JE_NAME}}`, `{{BE_NAME}}`, `{{JE_NAME_ZH}}`, `{{BE_NAME_ZH}}`, `{{JE_DATE}}`, `{{BE_DATE}}`

## OREUI 主题 (2026-07-14, v2)
- 基于 Spectrollay-OreUI/OreUI 真实设计令牌完全重写（1700+ 行 CSS 参考）
- **OreUI 核心特征**：
  - 中灰背景 `#48494A` + 浅色顶栏 `#E6E8EB`（4px 粗底边框）
  - 3D 斜面面板边框：双色 `#333334`/`#5A5B5C` 制造立体感
  - 立体按钮：`#D0D1D4` 背景 + 底部阴影，按下缩进 2px
  - 绿色 `#3C8527` / 蓝色 `#2E6BE9` / 红色 `#C33636`
  - 0px 圆角（OreUI 全部直角），NotoSans Bold 字体
  - 自定义 10px 宽滚动条（深灰轨道 + 白滑块加黑边）
- 所有 5 个 CSS 文件已基于真实 OreUI 令牌重写
- 向后兼容旧 MD3 CSS 变量名（映射到 OREUI 变量）

## 图片下载
- download_images.py: Python 脚本，递归处理所有 docs/ 下的 .md 文件
- 支持分类：blocks, items, mobs, crafting, mechanics, versions
- 图片保存路径: page/images/{category}/{doc_name}/{hash}.ext
- 下载后自动更新 .md 文件中的 URL 为本地相对路径

## API 版本控制
- api/latest.json: 最新版本信息（Java 1.21.5 春日生机, 基岩 1.21.70）
- api/versions.json: 完整版本历史列表（Java 20 个版本 + 基岩 13 个版本）
- api/articles.json: **完整文章列表 API**（156 篇文章，按 6 大分类组织，含 title/route/file）
- docs/api.md: API 开发文档（所有端点说明、使用示例、版本号占位符、更新指南）

## 侧边栏 - MC Wiki 分区导航（2026-07-14 重做）
- **结构**：`.nav-sections` → `.nav-section`（有子文章的类别）或 `.nav-item-link`（独立页面）
- **每分区**：section header（图标 + 标题）→ `.nav-cat-link`（分类总览）→ `.nav-child-link`（子文章列表）
- **搜索**：侧边栏顶部有 `.sidebar-search` 输入框，实时过滤导航项
- **活跃状态**：绿色左边框 + 背景高亮，三级链接各有独立 --active 类
- **数据源**：blocks 子文章来自 `blocks-nav.json`，其他类别子文章来自 `api/articles.json`

## 文档内容覆盖
- README.md: 首页介绍
- docs/blocks/: 87 个方块详细文档（含 infobox、用途、数据值、音效、你知道吗、图库）
- docs/items/: 14 个物品文档（index + 13 子文章：工具、武器、盔甲、食物、药水等）
- docs/mobs/: 21 个生物文档（index + 20 子文章：被动/中立/敌对/Boss 全覆盖）
- docs/crafting/: 9 个合成文档（index + 8 子文章：工具、武器、盔甲、方块、食物、红石、酿造、烧炼）
- docs/mechanics/: 15 个机制文档（index + 14 子文章：红石、附魔、酿造、锻造、交易、以物易物、战斗、农业、养殖、信标、天气、铁砧、袭击、进度）
- docs/versions/: 版本历史总览
- docs/about.md: 关于页面
- docs/_widgets.md: 首页功能面板
