# API 开发文档

Lively Minecraft Wiki 提供以下 JSON API 端点，供开发者集成与自动化使用。

---

## 目录

- [API 端点总览](#api-端点总览)
- [静态 JSON API](#静态-json-api)
- [JSON 内容 API](#json-内容-api)
- [侧边栏配置文件](#侧边栏配置文件)
- [版本号占位符系统](#版本号占位符系统)
- [项目配置与资源](#项目配置与资源)
- [添加新文章](#添加新文章)
- [图片画廊](#图片画廊)
- [缓存策略](#缓存策略)

---

## API 端点总览

| 端点 | 说明 |
|------|------|
| `/api/articles.json` | 全部文章列表（含元数据） |
| `/api/latest.json` | 最新版本信息 |
| `/api/versions.json` | 完整版本历史数据库 |
| `/api/pages.json` | 独立页面列表 |
| `page/#/api/json/{route}` | 单页 JSON 内容（动态渲染） |

---

## 静态 JSON API

### `GET /api/articles.json`

返回所有文章的分类列表。

**响应结构**：

```json
{
  "total": 156,
  "updated": "2026-07-14",
  "categories": [
    {
      "id": "blocks", "title": "方块", "route": "/blocks", "count": 88,
      "articles": [
        { "title": "石头", "route": "/blocks/stone", "file": "blocks/stone.md" }
      ]
    }
  ],
  "pages": [
    { "title": "首页介绍", "route": "/", "file": "README.md" }
  ]
}
```

### `GET /api/latest.json`

返回最新版本信息。

```json
{
  "java": { "version": "26.2", "name": "Chaos Cubed", "name_zh": "混沌立方", "date": "2026-06-16", "type": "release" },
  "bedrock": { "version": "26.30", "name": "Chaos Cubed", "name_zh": "混沌立方", "date": "2026-06-16", "type": "release" },
  "updated": "2026-06-16"
}
```

### `GET /api/versions.json`

返回完整版本历史，含 Java 版和基岩版所有已知版本的 `version` / `name` / `name_zh` / `date` / `edition` 字段。

### `GET /api/pages.json`

（计划）返回独立页面列表，含 `title` / `route` / `file`。

---

## JSON 内容 API

### `page/#/api/json/{route}`

动态渲染任意页面的 Markdown 源内容为 JSON 格式。

**URL 格式**：`page/#/api/json/blocks/stone`

**响应**（渲染在页面中，可直接 `fetch` 对应 markdown 文件获取原始数据）：

```json
{
  "api_version": "1.0",
  "route": "/blocks/stone",
  "title": "石头",
  "file": "blocks/stone.md",
  "content_raw": "# 石头\n\n**类型**：固体方块...",
  "site": { "name": "Lively Minecraft Wiki", ... },
  "rendered_at": "2026-07-14T12:00:00.000Z"
}
```

**使用示例**：

```javascript
// 获取石头页面的 JSON 数据
// 直接 fetch markdown 文件
fetch('/Lively-MC-Wiki/docs/blocks/stone.md')
  .then(res => res.text())
  .then(md => {
    // 解析 markdown 前端元数据
    const lines = md.split('\n');
    const title = lines[0].replace('# ', '');
    console.log({ title, content: md });
  });
```

---

## 侧边栏配置文件

所有侧边栏导航定义在 `config/` 目录下，每个分类一个文件：

| 文件 | 说明 | 条目数 |
|------|------|--------|
| `config/blocks-nav.json` | 方块列表 | 87 |
| `config/items-nav.json` | 物品列表 | 13 |
| `config/mobs-nav.json` | 生物列表 | 20 |
| `config/crafting-nav.json` | 合成列表 | 8 |
| `config/mechanics-nav.json` | 游戏机制列表 | 14 |
| `config/versions-nav.json` | 版本历史 | 0 |
| `config/config.json` | 站点配置 | - |

### 格式

每个 nav 文件为扁平 JSON 数组：

```json
[
  { "title": "石头", "route": "/blocks/stone", "file": "blocks/stone.md" },
  { "title": "圆石", "route": "/blocks/cobblestone", "file": "blocks/cobblestone.md" }
]
```

### 添加新条目

在对应的 `config/{category}-nav.json` 中添加一条即可，侧边栏会自动加载。无需修改 `app.js`。

---

## 版本号占位符系统

所有 Markdown 文档支持自动版本号替换：

| 占位符 | 替换为 | 数据来源 |
|--------|--------|----------|
| `{{JE_VERSION}}` | Java 版最新版本号 | `versions.json` |
| `{{BE_VERSION}}` | 基岩版最新版本号 | `versions.json` |
| `{{JE_NAME}}` | Java 版最新英文名 | `versions.json` |
| `{{BE_NAME}}` | 基岩版最新英文名 | `versions.json` |
| `{{JE_NAME_ZH}}` | Java 版最新中文名 | `versions.json` |
| `{{BE_NAME_ZH}}` | 基岩版最新中文名 | `versions.json` |
| `{{JE_DATE}}` | Java 版发布日期 | `versions.json` |
| `{{BE_DATE}}` | 基岩版发布日期 | `versions.json` |

**更新方式**：编辑 `versions.json` 后运行 `python3 update_versions.py --dry-run` 预览，确认后执行 `python3 update_versions.py`。

---

## 项目配置与资源

### 目录结构

```
Lively-MC-Wiki/
├── config/                  # 配置文件（独立于框架）
│   ├── config.json          # 站点配置（名称/logo/meta）
│   ├── blocks-nav.json      # 方块侧边栏
│   ├── items-nav.json       # 物品侧边栏
│   ├── mobs-nav.json        # 生物侧边栏
│   ├── crafting-nav.json    # 合成侧边栏
│   ├── mechanics-nav.json   # 机制侧边栏
│   └── versions-nav.json    # 版本侧边栏
├── assets/                  # 静态资源
│   ├── logo.jpg             # 站点 Logo
│   └── images/              # 图片资源
│       ├── blocks/          # 方块图片
│       ├── items/           # 物品图片
│       ├── mobs/            # 生物图片
│       └── ...
├── api/                     # API 数据文件
│   ├── articles.json        # 文章索引
│   ├── latest.json          # 最新版本
│   └── versions.json        # 版本历史
├── docs/                    # Markdown 文档
├── page/                    # 前端页面（OWD.K-MD3 框架）
└── index.html               # 网站首页
```

### config.json 结构

```json
{
  "site": {
    "name": "Lively Minecraft Wiki",
    "titleSuffix": "Lively Minecraft Wiki",
    "meta": "Lively Minecraft Wiki · 我的世界中文百科",
    "docDir": "../docs",
    "logo": "assets/logo.jpg"
  },
  "nav": [ ... ],
  "sidebarLinks": [ ... ],
  "home": { ... }
}
```

`config/` 目录独立于 OWD.K-MD3 框架，升级框架时不会被覆盖。`assets/` 目录存放所有图片资源，`logo.jpg` 路径由 `config.json` 控制，两个页面（根 `index.html` 和 `page/index.html`）JS 自动处理路径前缀。

---

## 添加新文章

以添加新方块为例：

1. 在 `docs/blocks/` 下创建 `new-block.md`

2. 在 `config/blocks-nav.json` 中添加侧边栏条目：
   ```json
   { "title": "新方块", "route": "/blocks/new-block", "file": "blocks/new-block.md" }
   ```

3. 在 `api/articles.json` 的 blocks 分类中添加：
   ```json
   { "title": "新方块", "route": "/blocks/new-block", "file": "blocks/new-block.md" }
   ```

4. 在 `index.html` 的 `WIKI_SECTIONS` 中添加首页链接（可选）

---

## 图片画廊

画廊页面位于 `page/gallery.html`，展示 `assets/images/` 下的所有图片。

**使用方式**：
1. 将图片放入 `assets/images/{category}/` 目录
2. 在 `page/gallery.html` 的 `IMAGES` 数组中注册：
   ```javascript
   IMAGES.push({ src: '../assets/images/blocks/stone.png', category: 'blocks', name: '石头' });
   ```
3. 访问 `page/gallery.html` 查看画廊

画廊支持：分类筛选、点击放大灯箱、响应式网格布局。

---

## 缓存策略

所有 API 端点返回 `application/json`，建议 HTTP 服务器设置：

```
Cache-Control: public, max-age=3600
```

静态 JSON 文件支持浏览器条件请求（ETag / If-Modified-Since）。
