# 📝 待实现需求备忘录

> 整理自 2026-04-15 对话中提出但尚未实现的需求（规则引擎单独立项，不在此列）
> 硬编码问题清单详见 `docs/reports/REMAINING_HARDCODE_ISSUES.md`

---

## ~~一、休息与幕系统分离~~ ✅ 已完成（2026-04-15）

**来源：** 用户明确要求

**完成内容：**
- [x] `/rest` 系列命令（full/simple/emergency）只做恢复 + 时间推进，**不再结束幕**
- [x] 新增 `/act` 命令系列（查看/结束/历史/搜索）
- [x] 幕结束执行归档流程：生成幕总结 → 创建状态快照 → 推进幕号

**涉及文件：** `game-core.js`

---

## ~~二、system prompt 硬编码飞船名 [H1]~~ ✅ 已完成（2026-04-15）

**完成内容：**
- [x] 在 `PROMPT_TEMPLATES` 中新增 `systemRole` 模板，使用 `{{shipName}}` 和 `{{loreSummary}}` 占位符
- [x] `api-manager.js buildMessages()` 改为动态读取飞船名：Lore → DEFAULT_LORE → 兜底"飞船"
- [x] 优先使用 `PROMPT_TEMPLATES.systemRole` 模板，模板不可用时回退到内联版本（也使用动态飞船名）
- [x] 行为准则现在可通过编辑 `default-config.js` 的 `systemRole` 模板来自定义

**涉及文件：** `api-manager.js`, `default-config.js`

---

## ~~三、act-manager.js 初始幕硬编码 [H2]~~ ✅ 已完成（2026-04-15）

**完成内容：**
- [x] `createInitialAct()` 改为空幕（无预设事件），事件由玩家行为自然产生
- [x] 标题改为"序章"（不再硬编码剧情标题）
- [x] 起始时间从 `DEFAULT_STATE.act.start_time` 或 `DEFAULT_STATE.time` 动态读取
- [x] 飞船名从 `DEFAULT_LORE.playerShip.name` 动态读取
- [x] 起始位置从 `DEFAULT_STATE.captain.location` 动态读取
- [x] 船员列表从 `DEFAULT_STATE.crew` 动态生成 key_people

**涉及文件：** `act-manager.js`

---

## ~~四、ui-manager.js `parseLocation()` 硬编码地名映射 [H3]~~ ✅ 已完成（2026-04-15）

**完成内容：**
- [x] 星区/地区判断改为从 `Lore.data.starMap`（回退 `DEFAULT_LORE.starMap`）动态查找匹配节点
- [x] 按节点名长度降序排列，优先匹配更精确的节点
- [x] 用节点 `name` 提取核心词自动生成 sector，用 `name` 作为 region
- [x] 舰内位置（舰长室/舰桥/船舱）动态使用飞船名
- [x] 保留通用关键词映射（酒吧/舰桥/机库/医疗室等）作为具体地点
- [x] 无匹配时尝试从位置字符串中去掉区域名，余下部分作为具体地点

**涉及文件：** `ui-manager.js`

---

## ~~五、tools.js `searchActs()` 模拟数据 [M1]~~ ✅ 已完成（2026-04-15）

**完成内容：**
- [x] 移除全部硬编码 mockResults（星际探索者号/张三/织星）
- [x] 改为调用 `ActManagerInstance.searchByKeyword(keyword)` 获取真实幕数据
- [x] 新增按幕编号 `act_number` 检索，支持同时指定关键词+幕号组合过滤
- [x] 返回结构包含完整事件信息（act/actTitle/event/title/match/time/location/type）
- [x] 添加 `ActManagerInstance` 不可用时的降级处理
- [x] 支持 `limit` 参数限制返回数量，并返回 `total_matches` 总匹配数

**涉及文件：** `tools.js`

---

## ~~六、default-config.js 初始状态写死具体内容 [M3]~~ ✅ 已完成（2026-04-15）

**完成内容：**
- [x] `DEFAULT_STATE` 所有具体内容改为从 `DEFAULT_LORE` 动态派生
- [x] 飞船名从 `DEFAULT_LORE.playerShip.name` 读取
- [x] 起始位置从 `DEFAULT_LORE.starMap[0].name` 读取
- [x] 起始时间年份从 `DEFAULT_LORE.universe.era` 中提取
- [x] 船员从 `DEFAULT_LORE.playerShip.crew` 动态生成（无 crew 则为空数组）
- [x] 移除硬编码初始任务（"神秘信号源"）、硬编码船员（张三/李四）、硬编码剧情物品（数据芯片）
- [x] 物品清单只保留通用初始装备，不含剧情物品
- [x] 幕 start_time 使用动态年份

**涉及文件：** `default-config.js`

---

## ~~七、game-core.js 基准年硬编码 [M2]~~ ✅ 已完成（2026-04-15）

**完成内容：**
- [x] `getGameTimeInHours()` 基准年改为从 `DEFAULT_STATE.time.year` 动态读取
- [x] 不可用时回退到当前游戏时间年份（即差值为0）

**涉及文件：** `game-core.js`

---

## ~~八、幕归档增强 — AI 叙事总结~~ ✅ 已完成（2026-04-15）

**完成内容：**
- [x] `/act end` 独立触发，串起完整归档流程
- [x] `generateActSummary()` 统计事件类型/位置/经济
- [x] `createSnapshot()` 保存完整 state
- [x] 结构化幕档案存 localStorage
- [x] 在 `endCurrentAct()` 中调用 AI 生成叙事性幕总结（`generateActNarrative()`）
- [x] 将 AI 总结存入 `act.summary.narrative` 字段
- [x] `searchByKeyword()` 修复跳过无 keywords 幕的 bug，改为同时搜索 description 全文
- [x] 新增 `PROMPT_TEMPLATES.actSummary` 模板（`default-config.js`）

**涉及文件：** `act-manager.js`, `game-core.js`

---

## ~~九、validator.js 集成~~ ✅ 已完成（2026-04-15）

**完成内容：**
- [x] 在 `processWithRealAI()` 中集成 `ValidatorInstance.validateAIOutput()` 后处理校验
- [x] 校验错误显示为终端警告，警告输出到 console
- [x] 每次 AI 回复后调用 `recordEvent()` 记录用于连续性检查
- [x] validator.js 已有完整实现：数值自造检测、实体存在性检查、位置连续性验证

**涉及文件：** `validator.js`

---

## ~~十四、NPC 注册边界优化~~ ✅ 已完成（2026-04-16）

**来源：** 代码审查 — NPC 提取模式不足，缺乏注册边界控制

**完成内容：**
- [x] 在 `PROMPT_TEMPLATES.mainAction` 中添加 NPC 标注规则（规则8），引导 AI 用「名字」（种族/身份）格式输出
- [x] 引导 AI 用 `[NPC_STATUS] 名字|状态` 标记 NPC 死亡/离开等状态变更
- [x] 重构 `extractAndRegisterNPCs()`：统一 `tryRegister()` 入口函数，含名字长度/过滤词/同名同地点检查
- [x] 新增模式0：AI 标注格式（最优先匹配 prompt 引导的标准格式）
- [x] 新增模式3-8：对话标记、自我介绍、英文头衔、通讯来源、绰号代号、机器人/AI实体
- [x] 同名不同地点允许注册：id 包含 locId，用 `name@location` 去重
- [x] 新增 `_extractNPCStatusChanges()`：解析 `[NPC_STATUS]` 标记 + 叙事文本推断回退（死亡/离开）
- [x] 新增 `_extractRaceFromDesc()`：从描述文本自动识别种族（已知种族 + AI/机械实体）
- [x] 通用过滤词表 `FILTER_WORDS`：排除代词、通用称谓、玩家自身等噪声

**注册边界设计：**
- ✅ 注册：有明确名字/代号的可交互角色
- ❌ 不注册：无名描述性角色、群体、代词、玩家自身、纯历史人物
- ⚠️ 死亡/离开不删除，标记 `disposition` 为 `deceased`/`departed`

**涉及文件：** `game-core.js`, `default-config.js`

---

## 十、记忆检索增强

**严重度：** 🟢 低 — 改善长期游戏体验

**需要做的：**
- [ ] 每次保存事件时提取关键词，建立索引
- [ ] 支持按关键词搜索历史记忆
- [ ] 实现 `search_acts` 工具，让 AI 可通过 [TOOL_CALL] 搜索历史事件

**涉及文件：** `memory-storage.js`, `tools.js`

---

## 十一、Token 预算控制

**严重度：** 🟢 低 — 预防性措施

**需要做的：**
- [ ] 在 `api-manager.js buildMessages()` 中估算 token 数量
- [ ] 根据预算限制注入的记忆/历史数量
- [ ] 优先保留最近对话和高权重记忆

**涉及文件：** `api-manager.js`

---

## 十二、worldBuildWithAI() prompt 模板化

**严重度：** ⚪ 极低 — 收益低可延后

**需要做的：**
- [ ] 可选：移入 `PROMPT_TEMPLATES.worldBuild`

**涉及文件：** `game-core.js`, `default-config.js`

---

## 十三、低优先级硬编码 [L1-L3]

**严重度：** ⚪ 极低 — 不影响功能

- [ ] `game-core.js` fallbackDestinations 硬编码（离线回退用，影响极小）
- [ ] `game-core.js` worldBuild 示例提示文本（纯 UI 展示）
- [ ] `ui-manager.js` 任务面板写死示例任务 HTML（会被动态覆盖）

---

## 📋 优先级排序（综合）

| 顺序 | 编号 | 需求 | 严重度 | 工作量 | 理由 |
|------|------|------|--------|--------|------|
| ~~1~~ | ~~一~~ | ~~休息与幕系统分离~~ | ✅ 已完成 | — | — |
| ~~2~~ | ~~二~~ | ~~system prompt 硬编码飞船名~~ | ✅ 已完成 | — | — |
| ~~3~~ | ~~四~~ | ~~parseLocation 硬编码地名~~ | ✅ 已完成 | — | — |
| ~~4~~ | ~~五~~ | ~~searchActs 模拟数据~~ | ✅ 已完成 | — | — |
| ~~5~~ | ~~三~~ | ~~初始幕硬编码~~ | ✅ 已完成 | — | — |
| ~~6~~ | ~~六~~ | ~~初始状态写死具体内容~~ | ✅ 已完成 | — | — |
| ~~7~~ | ~~七~~ | ~~基准年硬编码~~ | ✅ 已完成 | — | — |
| ~~8~~ | ~~八~~ | ~~幕归档 AI 叙事总结~~ | ✅ 已完成 | — | — |
| ~~9~~ | ~~九~~ | ~~validator 集成~~ | ✅ 已完成 | — | — |
| ~~10~~ | ~~十四~~ | ~~NPC 注册边界优化~~ | ✅ 已完成 | — | — |
| 11 | 十 | 记忆检索增强 | 🟢 低 | ⭐⭐ 中 | 长期体验 |
| 12 | 十一 | Token 预算控制 | 🟢 低 | ⭐⭐ 中 | 预防性 |
| 13 | 十二 | worldBuild prompt 模板化 | ⚪ 极低 | ⭐ 小 | 可延后 |
| 14 | 十三 | 低优先级硬编码 L1-L3 | ⚪ 极低 | ⭐ 小 | 顺手改 |

---

*本文件随开发进度更新，完成的项打 ✅ 标记。*
*硬编码问题详细分析见 `docs/reports/REMAINING_HARDCODE_ISSUES.md`*
