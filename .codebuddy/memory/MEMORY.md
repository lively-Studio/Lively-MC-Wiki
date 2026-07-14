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

## 文档内容覆盖
- README.md: 首页介绍
- blocks.md: 方块列表（100+ 种）
- items.md: 物品列表（工具/武器/盔甲/食物/药水/附魔）
- mobs.md: 生物图鉴（友好/中立/敌对/Boss）
- crafting.md: 合成与烧炼配方
- mechanics.md: 游戏机制（红石/附魔/酿造/战斗/交易）
- versions.md: 版本历史
- about.md: 关于页面
- _widgets.md: 首页功能面板
