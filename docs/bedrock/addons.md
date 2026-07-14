# Add-Ons 系统

Add-Ons 是基岩版的行为包和资源包系统，允许修改游戏内容而无需安装第三方模组加载器。

## 组成部分

### 行为包 (Behavior Pack)
- 修改实体行为、掉落物、生成规则
- 添加新生物、新物品、新合成配方
- 使用 JSON 格式定义

### 资源包 (Resource Pack)
- 修改纹理、音效、模型、动画
- 自定义 UI、字体、粒子效果
- 改变游戏外观

## 与 Java 版模组的区别

| 特性 | Add-Ons | Java 版模组 |
|------|---------|-------------|
| 编程语言 | JSON/JavaScript（脚本 API） | Java |
| 安装方式 | 导入 .mcpack / .mcaddon | 安装 Forge/Fabric 加载器 |
| 兼容性 | 跨平台（基岩版全平台） | 仅 Java 版 |
| 能力上限 | 受限于官方 API | 几乎无限制 |

## 脚本 API

基岩版 1.19+ 引入了 GameTest Framework / 脚本 API，允许使用 JavaScript 编写更复杂的模组逻辑。
