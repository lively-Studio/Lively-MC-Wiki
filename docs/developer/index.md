# API 与贡献开发文档

灵影 Minecraft Wiki (Lively Minecraft Wiki) 提供完整的 JSON API、可配置的导航系统和标准化的内容贡献流程。

---

## 目录

- [API 端点总览](#api-端点总览)
- [静态 JSON API](#静态-json-api)
- [动态 JSON 内容 API](#动态-json-内容-api)
- [配置文件系统](#配置文件系统)
- [版本号占位符系统](#版本号占位符系统)
- [目录结构](#目录结构)
- [如何贡献内容](#如何贡献内容)
- [添加新版本站点](#添加新版本站点)
- [图片与画廊系统](#图片与画廊系统)
- [缓存策略](#缓存策略)

---

## API 端点总览

| 端点 | 类型 | 说明 |
|------|------|------|
| `/api/articles.json` | 静态 JSON | 全部文章列表（含元数据） |
| `/api/latest.json` | 静态 JSON | 最新版本信息 |
| `/api/versions.json` | 静态 JSON | 完整版本历史数据库 |
| `/page/gallery-data.js` | 静态 JS | 画廊图片数据（自动生成） |
| `page/#/api/json/{route}` | 动态 JSON | 单页原始 Markdown 内容 |

---

## 静态 JSON API

### `GET /api/articles.json`

返回所有文章的分类列表。

**响应结构**：

```json
{
  "total": 199,
  "updated": "2026-07-14",
  "description": "Lively Minecraft Wiki 文章列表 API",
  "categories": [
    {
      "id": "blocks", "title": "方块", "route": "/blocks", "count": 88,
      "articles": [
        { "title": "石头", "route": "/blocks/stone", "file": "java/blocks/stone.md" }
      ]
    }
  ],
  "pages": [
    { "title": "首页介绍", "route": "/", "file": "README.md" }
  ]
}
```

**字段说明**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `total` | number | 文章总数 |
| `updated` | string | 最后更新时间 (ISO 8601) |
| `categories` | array | 按分类组织的文章列表 |
| `categories[].id` | string | 分类唯一标识 |
| `categories[].title` | string | 分类中文名称 |
| `categories[].route` | string | 前端 hash 路由 |
| `categories[].count` | number | 该分类文章数 |
| `categories[].articles[].title` | string | 文章标题 |
| `categories[].articles[].route` | string | 前端 hash 路由 |
| `categories[].articles[].file` | string | Markdown 文件路径（含版本前缀） |
| `pages` | array | 独立页面列表 |

**使用示例**：

```javascript
fetch('/api/articles.json')
  .then(res => res.json())
  .then(data => {
    console.log(`共 ${data.total} 篇文章`);
    data.categories.forEach(cat => {
      console.log(`${cat.title}: ${cat.count} 篇`);
      cat.articles.forEach(a => {
        console.log(`  - ${a.title} (${a.route})`);
      });
    });
  });
```

### `GET /api/latest.json`

返回最新版本简要信息。

```json
{
  "java": {
    "version": "26.2", "name": "Chaos Cubed",
    "name_zh": "混沌立方", "date": "2026-06-16", "type": "release"
  },
  "bedrock": {
    "version": "26.30", "name": "Chaos Cubed",
    "name_zh": "混沌立方", "date": "2026-06-16", "type": "release"
  },
  "updated": "2026-06-16"
}
```

### `GET /api/versions.json`

返回完整版本历史，含 `java` 和 `bedrock` 字段，每个版本有 `version` / `name` / `name_zh` / `date` / `edition`。

---

## 动态 JSON 内容 API

### `page/#/api/json/{route}`

在浏览器中访问 `page/#/api/json/blocks/stone`，页面将渲染该文档的 Markdown 原始内容为 JSON 格式，而非 HTML。

```json
{
  "api_version": "1.0",
  "route": "/blocks/stone",
  "title": "石头",
  "file": "java/blocks/stone.md",
  "content_raw": "# 石头\n\n**类型**：固体方块...",
  "site": { "name": "Lively Minecraft Wiki", ... },
  "rendered_at": "2026-07-14T12:00:00.000Z"
}
```

### 通过 fetch 获取原始 Markdown

```javascript
// 直接获取 stone.md 原始内容
fetch('/Lively-MC-Wiki/docs/java/blocks/stone.md')
  .then(res => res.text())
  .then(md => {
    const title = md.split('\n')[0].replace('# ', '');
    console.log({ title, content: md });
  });
```

---

## 配置文件系统

所有站点配置和导航定义位于 `config/` 目录，与 OWD.K-MD3 框架分离。

### config.json

站点主配置：

```json
{
  "site": {
    "name": "Lively Minecraft Wiki",
    "titleSuffix": "Lively Minecraft Wiki",
    "meta": "灵影 Minecraft Wiki · 灵影中文百科",
    "docDir": "../docs",
    "logo": "assets/logo.jpg"
  },
  "nav": [
    { "title": "首页", "icon": "home" },
    { "title": "方块", "icon": "computer", "route": "/blocks", "file": "java/blocks/index.md" },
    ...
  ],
  "editions": [
    { "id": "java", "title": "Java 版", "color": "#3C8527", ... },
    { "id": "bedrock", "title": "基岩版", "color": "#2E6BE5", ... },
    ...
  ],
  "sidebarLinks": [ ... ],
  "home": { "heroTitle": "...", ... }
}
```

**字段说明**：

| 字段 | 说明 |
|------|------|
| `site.name` | 站点名称，显示在顶栏、标题栏 |
| `site.docDir` | 文档根目录相对于 `page/` 的路径 |
| `site.logo` | Logo 图片路径（相对于项目根目录） |
| `nav[]` | 侧边栏主导航，每个条目有 `title` / `route` / `file` / `icon` |
| `editions[]` | 支持的版本站点列表，每个版本有 `id` / `title` / `color` / `description` |
| `home` | 首页 Hero、按钮等配置 |

### 导航文件

每个版本站点的侧边栏导航定义在 `config/` 下的 `{edition}-nav.json` 文件中。

**格式**：

```json
[
  { "title": "石头", "route": "/blocks/stone", "file": "java/blocks/stone.md" },
  { "title": "圆石", "route": "/blocks/cobblestone", "file": "java/blocks/cobblestone.md" }
]
```

**文件列表**：

| 文件 | 版本 | 条目数 |
|------|------|--------|
| `config/blocks-nav.json` | Java | 87 |
| `config/items-nav.json` | Java | 13 |
| `config/mobs-nav.json` | Java | 20 |
| `config/crafting-nav.json` | Java | 8 |
| `config/mechanics-nav.json` | Java | 14 |
| `config/versions-nav.json` | Java | 0 |
| `config/bedrock-nav.json` | 基岩 | 10 |
| `config/china-nav.json` | 中国版 | 4 |
| `config/dungeons-nav.json` | Dungeons | 8 |
| `config/legends-nav.json` | Legends | 5 |
| `config/earth-nav.json` | Earth | 4 |
| `config/story-mode-nav.json` | Story Mode | 4 |

**添加新导航条目**：

只需在对应的 `config/{edition}-nav.json` 中添加一条记录，`app.js` 会在加载时自动注入到侧边栏和路由系统。无需修改 JS 代码。

---

## 版本号占位符系统

所有 Markdown 文档支持自动版本号替换：

| 占位符 | 替换为 | 示例值 |
|--------|--------|--------|
| `{{JE_VERSION}}` | Java 版最新版本号 | `26.2` |
| `{{BE_VERSION}}` | 基岩版最新版本号 | `26.30` |
| `{{JE_NAME}}` | Java 版英文名 | `Chaos Cubed` |
| `{{BE_NAME}}` | 基岩版英文名 | `Chaos Cubed` |
| `{{JE_NAME_ZH}}` | Java 版中文名 | `混沌立方` |
| `{{BE_NAME_ZH}}` | 基岩版中文名 | `混沌立方` |
| `{{JE_DATE}}` | Java 版发布日期 | `2026-06-16` |
| `{{BE_DATE}}` | 基岩版发布日期 | `2026-06-16` |

**Markdown 中的使用**：

```markdown
当前 Java 版最新版本为 {{JE_VERSION}}（{{JE_NAME_ZH}}），发布于 {{JE_DATE}}。
基岩版最新版本为 {{BE_VERSION}}（{{BE_NAME_ZH}}），发布于 {{BE_DATE}}。
```

**更新版本号**：

1. 编辑 `versions.json` 中的 `latest` 对象
2. 编辑 `api/latest.json` 同步更新
3. 运行 `python3 update_versions.py --dry-run` 预览变更
4. 运行 `python3 update_versions.py` 执行全局替换

---

## 目录结构

```
Lively-MC-Wiki/
├── config/                      # 配置文件（独立于框架）
│   ├── config.json              # 站点主配置
│   └── *-nav.json               # 各版本/分类的侧边栏导航
├── assets/                      # 静态资源
│   ├── logo.jpg                 # 站点 Logo
│   └── images/                  # 图片资源（按版本分目录）
│       ├── java/
│       ├── bedrock/
│       ├── china/
│       ├── dungeons/
│       ├── legends/
│       ├── earth/
│       └── story-mode/
├── api/                         # API 数据文件
│   ├── articles.json            # 文章索引
│   ├── latest.json              # 最新版本
│   └── versions.json            # 完整版本历史
├── docs/                        # Markdown 文档（按版本分目录）
│   ├── README.md                # 站点首页介绍
│   ├── api.md                   # 本文件
│   ├── _widgets.md              # 首页组件（已废弃）
│   ├── java/                    # Java 版（6 大分类，152 篇文章）
│   │   ├── blocks/              # 87 个方块
│   │   ├── items/               # 13 个物品
│   │   ├── mobs/                # 20 个生物
│   │   ├── crafting/            # 8 个合成
│   │   ├── mechanics/           # 14 个游戏机制
│   │   └── versions/            # 版本历史
│   ├── bedrock/                 # 基岩版
│   ├── china/                   # 中国版
│   ├── dungeons/                # 地下城
│   ├── legends/                 # 传奇
│   ├── earth/                   # 地球
│   └── story-mode/              # 故事模式
├── page/                        # 前端页面（OWD.K-MD3 框架）
│   ├── index.html               # 文档查看器
│   ├── gallery.html             # 图片画廊
│   ├── js/app.js                # 路由/渲染/导航逻辑
│   ├── css/                     # 样式表（5 个 CSS）
│   └── blocks-nav.json          # 已废弃 → config/
├── index.html                   # 网站首页
├── versions.json                # 版本数据库（被 update_versions.py 使用）
├── update_versions.py           # 版本号占位符替换脚本
├── download_images.py           # 图片批量下载脚本
└── LICENSE                      # 许可证
```

---

## 如何贡献内容

### 添加新文章

以在 Java 版添加新方块"铜块"为例：

**1. 创建 Markdown 文件**

在 `docs/java/blocks/` 下创建 `copper-block.md`：

```markdown
# 铜块

**类型**：固体方块
**可再生**：否
**可堆叠**：是（64）

## 获取

铜块可以用 9 个铜锭合成，也可以将铜块重新分解为 9 个铜锭。

## 氧化

铜块会随时间氧化，经历四个阶段：
- 铜块 → 斑驳的铜块 → 锈蚀的铜块 → 氧化的铜块

用蜜脾涂抹可防止氧化，用斧右键可脱蜡或除锈。
```

**2. 注册导航**

在 `config/blocks-nav.json` 中添加：

```json
{ "title": "铜块", "route": "/blocks/copper-block", "file": "java/blocks/copper-block.md" }
```

**3. 注册 API（可选）**

在 `api/articles.json` 的 `blocks` 分类中添加：

```json
{ "title": "铜块", "route": "/blocks/copper-block", "file": "java/blocks/copper-block.md" }
```

**4. 添加首页链接（可选）**

在 `index.html` 的 `WIKI_SECTIONS` 的 `blocks.links` 中添加或替换一个链接。

### 文章编写规范

**Markdown 格式**：

```markdown
# 文章标题

**属性名**：属性值
**属性名**：属性值

## 获取

获取方式的详细描述。

## 用途

用途的详细描述。

## 数据值

| 属性 | 值 |
|------|-----|
| ID | `minecraft:example` |
| 硬度 | 1.5 |
| 爆炸抗性 | 6.0 |

## 你知道吗

1. 有趣的事实一
2. 有趣的事实二

## 图库

![描述](图片URL)
*图片说明文字*
```

**规范要点**：
- 标题 `#` 只有一级，用于文章标题
- 属性列表使用 `**key**：value` 格式
- 章节使用 `##` 二级标题
- 图片使用 `![描述](URL)` 格式，运行 `download_images.py` 可自动下载到本地
- 使用 `{{JE_VERSION}}` 等占位符自动引用最新版本号

---

## 添加新版本站点

以添加 "Minecraft Education Edition（教育版）" 为例：

**1. 创建文档目录**

```bash
mkdir -p docs/education/blocks docs/education/items docs/education/guide
```

**2. 创建 index.md**

`docs/education/index.md`：

```markdown
# 教育版

Minecraft Education Edition 是面向教育的特殊版本...
```

**3. 创建导航文件**

`config/education-nav.json`：

```json
[
  { "title": "专属方块", "route": "/blocks", "file": "education/blocks/index.md" },
  { "title": "专属物品", "route": "/items", "file": "education/items/index.md" },
  { "title": "使用指南", "route": "/guide", "file": "education/guide/index.md" }
]
```

**4. 注册到 config.json**

在 `editions` 数组中添加：

```json
{ "id": "education", "title": "教育版", "icon": "book", "color": "#27AE60", "description": "Minecraft Education Edition 教育版指南" }
```

完成！无需修改任何 JS 代码，`app.js` 会自动加载新版本的导航和路由。

---

## 图片与画廊系统

### 下载图片

```bash
python3 download_images.py
```

脚本会：
1. 遍历 `docs/` 下所有版本的 `.md` 文件
2. 提取 `![alt](url)` 中的图片链接
3. 下载到 `assets/images/{edition}/{category}/{doc_name}/`
4. 自动替换 `.md` 中的 URL 为本地相对路径
5. 生成 `page/gallery-data.js` 画廊数据文件

### 画廊访问

访问 `page/gallery.html` 查看图片画廊，支持按版本筛选。

### 图片路径规范

- **在 markdown 中**：使用相对路径或绝对 URL，下载后自动替换为 `../../../assets/images/{edition}/...`
- **画廊数据**：自动生成 `GALLERY_IMAGES` 数组，每张图片有 `src` / `edition` / `editionName` / `name`
- **Logo**：统一使用 `assets/logo.jpg`，由 `config.json` 配置

---

## 缓存策略

所有静态文件建议设置以下 HTTP 缓存头：

```
# API 数据（1 小时）
Cache-Control: public, max-age=3600

# 静态资源（7 天）
Cache-Control: public, max-age=604800, immutable

# Markdown 文档（10 分钟）
Cache-Control: public, max-age=600
```

GitHub Pages 默认支持条件请求（ETag / If-Modified-Since），无需额外配置。

---

## 更新日志

| 日期 | 变更 |
|------|------|
| 2026-07-14 | 迁移至 `docs/` 根目录，全面重写；新增多版本支持、画廊系统、贡献指南 |
| 2026-07-14 | 原 `docs/java/api.md`，基于 `api/articles.json` / `versions.json` 的初始 API 文档 |
