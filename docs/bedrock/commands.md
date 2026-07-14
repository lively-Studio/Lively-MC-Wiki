# 命令差异

基岩版命令系统与 Java 版有显著差异。

## 支持的差异

| 特性 | 基岩版 | Java 版 |
|------|--------|---------|
| `/execute` 子命令 | 有限的子命令支持 | 完整的子命令系统（if/unless/store/run等） |
| `/give` 数量 | 命令格式不同 | 标准格式 |
| `/scoreboard` | 不支持 | 完整计分板系统 |
| NBT 数据 | 不支持 | 完整支持 |
| 原始 JSON 文本 | 使用 JSON 格式 | 使用 JSON 文本组件 |

## 基岩版独有命令

- `/ability`：设置玩家能力（世界建造者、飞行等）
- `/camerashake`：相机震动效果
- `/clearspawnpoint`：清除出生点
- `/event`：触发实体事件
- `/music`：控制游戏音乐
- `/playanimation`：播放实体动画
- `/structure`：结构方块相关操作

## 目标选择器

基岩版与 Java 版在目标选择器的参数上存在差异。基岩版使用 `family` 而非 `type` 来筛选实体类型。
