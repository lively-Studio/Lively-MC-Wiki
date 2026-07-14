# API 开发文档

Lively Minecraft Wiki 提供以下 RESTful JSON API 端点，供开发者集成与自动化使用。

---

## API 端点总览

| 端点 | 说明 |
|------|------|
| `/api/articles.json` | 全部文章列表（含元数据） |
| `/api/latest.json` | 最新版本信息 |
| `/api/versions.json` | 完整版本历史数据库 |

---

## `GET /api/articles.json`

返回所有文章的分类列表，包含标题、路由和文件路径。

### 响应结构

```json
{
  "total": 156,
  "updated": "2026-07-14",
  "description": "...",
  "categories": [
    {
      "id": "blocks",
      "title": "方块",
      "icon": "computer",
      "route": "/blocks",
      "count": 88,
      "articles": [
        {
          "title": "石头",
          "route": "/blocks/stone",
          "file": "blocks/stone.md"
        }
      ]
    }
  ],
  "pages": [
    { "title": "首页介绍", "route": "/", "file": "README.md" }
  ]
}
```

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `total` | number | 文章总数 |
| `updated` | string | 最后更新时间 (ISO 8601 日期) |
| `categories` | array | 按分类组织的文章列表 |
| `categories[].id` | string | 分类唯一标识 |
| `categories[].title` | string | 分类中文名称 |
| `categories[].icon` | string | 分类图标标识 |
| `categories[].route` | string | 分类页面路由 |
| `categories[].count` | number | 该分类文章数 |
| `categories[].articles` | array | 文章列表 |
| `categories[].articles[].title` | string | 文章标题 |
| `categories[].articles[].route` | string | 文章路由（前端 hash 路由） |
| `categories[].articles[].file` | string | Markdown 文件相对路径 |
| `pages` | array | 独立页面列表 |

### 使用示例

```javascript
// 获取所有文章
fetch('/api/articles.json')
  .then(res => res.json())
  .then(data => {
    console.log(`共 ${data.total} 篇文章`);
    data.categories.forEach(cat => {
      console.log(`${cat.title}: ${cat.count} 篇`);
    });
  });

// 构建搜索索引
fetch('/api/articles.json')
  .then(res => res.json())
  .then(data => {
    const allArticles = [];
    data.categories.forEach(cat => {
      allArticles.push(...cat.articles);
    });
    allArticles.push(...data.pages);
    // 使用 allArticles 构建搜索
  });
```

---

## `GET /api/versions.json`

返回 Minecraft 完整版本历史数据库，包含 Java 版与基岩版。

### 响应结构

```json
{
  "latest": {
    "java": { "version": "1.21.5", "name": "Spring to Life", "name_zh": "春日生机", "date": "2025-03-25" },
    "bedrock": { "version": "1.21.70", "name": "Spring to Life", "name_zh": "春日生机", "date": "2025-03-25" }
  },
  "java_versions": [
    { "version": "1.21.5", "name": "Spring to Life", "name_zh": "春日生机", "date": "2025-03-25", "major": false }
  ],
  "bedrock_versions": [
    { "version": "1.21.70", "name": "Spring to Life", "name_zh": "春日生机", "date": "2025-03-25" }
  ],
  "updated": "2025-07-14",
  "description": "Minecraft 版本数据库"
}
```

### 字段说明

| 字段 | 说明 |
|------|------|
| `latest.java` | Java 版最新版本信息 |
| `latest.bedrock` | 基岩版最新版本信息 |
| `java_versions` | Java 版完整版本历史列表 |
| `bedrock_versions` | 基岩版完整版本历史列表 |
| `version` | 版本号字符串 |
| `name` | 版本英文名称 |
| `name_zh` | 版本中文名称 |
| `date` | 发布日期 |
| `major` | 是否为主要更新（仅 Java 版有此字段） |

### 使用示例

```javascript
// 获取最新版本信息
fetch('/api/versions.json')
  .then(res => res.json())
  .then(data => {
    const je = data.latest.java;
    console.log(`最新 Java 版: ${je.version} - ${je.name_zh}`);
    console.log(`发布日期: ${je.date}`);
  });

// 获取版本时间线
fetch('/api/versions.json')
  .then(res => res.json())
  .then(data => {
    const timeline = data.java_versions
      .filter(v => v.major)
      .map(v => `${v.version}: ${v.name_zh} (${v.date})`);
    console.log(timeline.join('\n'));
  });
```

---

## `GET /api/latest.json`

返回最新版本简要信息（精简版）。

### 响应结构

```json
{
  "java": {
    "version": "26.1",
    "name": "Spring to Life",
    "name_zh": "混沌立方",
    "date": "2026-06-16",
    "type": "release"
  },
  "bedrock": {
    "version": "26.1",
    "name": "Spring to Life",
    "name_zh": "混沌立方",
    "date": "2026-06-16",
    "type": "release"
  },
  "updated": "2026-06-16"
}
```

### 字段说明

| 字段 | 说明 |
|------|------|
| `java` / `bedrock` | 各平台最新版本对象 |
| `type` | 发布类型（`release`） |
| `version` | 最新版本号 |

### 使用示例

```javascript
// 简单版本号获取
fetch('/api/latest.json')
  .then(res => res.json())
  .then(data => {
    document.getElementById('version').textContent = data.java.version;
  });
```

---

## 版本号占位符系统

所有 Markdown 文档支持自动版本号替换，使用以下占位符：

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

### Markdown 中的使用

```markdown
当前 Java 版最新版本为 {{JE_VERSION}}（{{JE_NAME_ZH}}），
发布于 {{JE_DATE}}。
```

渲染后：

> 当前 Java 版最新版本为 1.21.5（春日生机），发布于 2025-03-25。

---

## 如何更新版本数据

编辑根目录下的 `versions.json`，修改 `latest` 对象中的版本信息即可：

```json
{
  "latest": {
    "java": "1.22",
    "java_name": "New Update",
    "java_name_zh": "新更新",
    "java_date": "2025-06-01",
    "bedrock": "1.22",
    "bedrock_name": "New Update",
    "bedrock_name_zh": "新更新",
    "bedrock_date": "2025-06-01"
  }
}
```

修改后，所有文档页面中的占位符将自动使用新值。同时更新 `api/latest.json` 和 `api/versions.json` 中的对应字段。

也可以使用自动化脚本 `update_versions.py`：

```bash
# 预览变更（不写入）
python3 update_versions.py --dry-run

# 检查文档中的过期版本号
python3 update_versions.py --check

# 执行替换
python3 update_versions.py
```

---

## 添加新文章

要添加新文章（以方块为例）：

1. 在 `docs/blocks/` 下创建 `新方块.md`：
   ```markdown
   # 新方块
   
   **类型**：固体方块
   **可再生**：是
   ...
   ```

2. 在 `api/articles.json` 的 `blocks.articles` 中添加条目：
   ```json
   { "title": "新方块", "route": "/blocks/新方块", "file": "blocks/新方块.md" }
   ```

3. 在 `page/blocks-nav.json` 中添加侧边栏条目（如需要）：
   ```json
   { "title": "新方块", "route": "/blocks/新方块", "file": "blocks/新方块.md" }
   ```

---

## 缓存策略

所有 API 端点返回 `application/json`，建议设置以下缓存头：

```
Cache-Control: public, max-age=3600
```

静态 JSON 文件通过 HTTP 服务器直接提供，支持浏览器条件请求（ETag / If-Modified-Since）。
