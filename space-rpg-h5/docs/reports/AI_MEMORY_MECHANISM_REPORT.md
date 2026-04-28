# AI 生成与记忆机制分析报告

> 生成时间: 2026-04-15 17:22

---

## 一、整体架构概览

```
玩家输入
  │
  ▼
GameCore.processCommand()
  │
  ├─ 系统命令 (/trade, /agents, /repair, /worldbuild ...)
  │   └─ 各自调用 APIManager.sendRequest(prompt)
  │       └─ prompt 来自 PROMPT_TEMPLATES + 变量填充
  │
  └─ 自然语言行动
      └─ processWithRealAI(action)
          │
          ├─ 构建 mainAction prompt (PROMPT_TEMPLATES.mainAction)
          │   ├─ 游戏状态 (State.state)
          │   ├─ 世界观事实 (Lore.buildSceneFacts)
          │   ├─ 持久记忆 (MemoryStorage.queryMemories)
          │   └─ 导航航路 (Lore.getNavigationRoutes)
          │
          ├─ APIManager.sendRequest(prompt)
          │   ├─ buildMessages() → system prompt + 会话历史 + 当前消息
          │   └─ HTTP → AI 提供商 (DeepSeek/OpenAI/Claude/Qwen/GLM/Custom)
          │
          ├─ parseAIResponse() → 叙事 + 工具调用 + 武器/防御信息
          │
          ├─ executeToolCalls() → Tools模块执行游戏数据变更
          │
          └─ saveToMemoryStorage() → 持久化到 MemoryStorage
```

---

## 二、涉及的模块清单

### 1. `js/api-manager.js` — AI 通信层
| 职责 | 说明 |
|------|------|
| 多提供商支持 | DeepSeek, OpenAI, Claude, Qwen, GLM, 自定义 |
| 请求构建 | `buildMessages()` 组装 system + history + user 消息 |
| 重试机制 | 指数退避，最多3次，30秒超时 |
| 会话历史 | `sessionHistory[]` 最近10轮对话（内存级，页面刷新丢失） |
| 响应处理 | `processResponse()` 提取不同提供商的回复格式 |

**⚠️ 硬编码问题：**
- **`buildMessages()` 第308-322行**：system prompt 硬编码在代码中
  ```js
  content: `你是星际探索者号的船载AI终端...`
  ```
  这是一个**独立于** `PROMPT_TEMPLATES.mainAction` 的第二个 system prompt。`mainAction` 在 `game-core.js` 中作为 user 消息发送，而此处的 system prompt 包含角色设定和行为准则，**始终硬编码**。
  
  **影响**: 如果玩家通过向导自定义了飞船名称（如"黑鹰号"），此处仍写死为"星际探索者号"。

- **`baseURLs` 和 `models` 第14-29行**：API 地址和模型列表硬编码
  - 这属于**合理硬编码**（API 规范，不应让用户修改官方地址）

### 2. `js/game-core.js` — AI 编排与解析层
| 职责 | 说明 |
|------|------|
| `processWithRealAI()` | 构建完整prompt，调用API，解析回复 |
| `parseAIResponse()` | 分离叙事/工具调用/武器防御信息 |
| `executeToolCalls()` | 执行AI返回的 [TOOL_CALL] 指令 |
| `saveToMemoryStorage()` | 将交互保存到持久记忆 |
| `showTradeInfo()` | 交易系统AI生成 |
| `showRepairInfo()` | 维修系统AI生成 |
| `showAgents()` | 代理人NPC AI生成 |
| `worldBuildWithAI()` | 世界观AI调整 |

**⚠️ 硬编码问题：**
- **`worldBuildWithAI()` 中的prompt**（约80行）：定义了11种世界观操作类型的长prompt，直接写在代码中，未模板化到 `PROMPT_TEMPLATES`
  - **严重性**: 低。这是功能定义，与 `executeWorldBuildOp()` 的 switch-case 紧耦合，模板化意义不大
- **`testConnection()` 中的验证prompt**：连接测试的系统提示硬编码
  - **严重性**: 极低。验证功能，无需配置化

### 3. `js/memory-storage.js` — 持久记忆层
| 职责 | 说明 |
|------|------|
| `addConversation()` | 保存玩家-AI 对话记录 |
| `addEvent()` | 保存关键事件（战斗/交易/移动等） |
| `queryMemories()` | 按时间/权重/位置查询记忆 |
| `buildFactsFromWorldState()` | 从世界观+状态动态构建事实数据库 |
| 自动清理 | 4MB 上限，超限自动压缩和清理旧记忆 |
| 持久化 | `localStorage` 存储，跨页面保持 |

**⚠️ 硬编码问题：**
- **无**。已在上一轮将 `facts` 改为动态构建。
- 容量限制 (`MAX_SIZE=4MB`, `MAX_SESSIONS=5` 等) 是合理常量。

### 4. `js/world-lore.js` — 世界观数据层
| 职责 | 说明 |
|------|------|
| `buildSceneFacts()` | 为AI prompt构建场景事实段落 |
| `buildSystemLore()` | 为API system prompt构建世界观摘要 |
| `getNavigationRoutes()` | 获取当前位置可用航路 |
| `getPortServices()` | 获取港口服务（数据驱动） |
| `getAvailableAgentTypes()` | 获取代理人类型（数据驱动映射） |
| NPC/船只/线索注册 | 动态实体管理 |

**⚠️ 硬编码问题：**
- **`buildSystemLore()` 方法**：该方法构建的文本包含一些格式化字符串，但数据来源已全部数据化，**无硬编码问题**。

### 5. `js/default-config.js` — 配置数据层
| 职责 | 说明 |
|------|------|
| `DEFAULT_LORE` | 世界观默认数据（种族/势力/星图/飞船/代理人/武器类型等） |
| `PROMPT_TEMPLATES` | 所有 AI prompt 模板（mainAction/trade/repair/agent） |
| `DEFAULT_STATE` | 游戏初始状态 |

**⚠️ 硬编码问题：无**。这正是配置应该存在的地方。

### 6. `js/tools.js` — 游戏工具层
| 职责 | 说明 |
|------|------|
| `callTool()` | 执行AI返回的工具调用 |
| 战斗/资源/导航/交易 | 游戏数据变更执行器 |

**⚠️ 硬编码问题：** 工具的参数验证和效果公式（如伤害计算），属于游戏规则，合理硬编码。

---

## 三、记忆机制详解

### 记忆的三个层次

```
┌─────────────────────────────────────────────────────┐
│ 第1层: 会话历史 (api-manager.js sessionHistory)      │
│   生命周期: 页面刷新即丢失                            │
│   容量: 最近10轮对话                                  │
│   用途: 让AI能"记住"当前对话上下文                     │
│   存储: 内存                                         │
└─────────────────────────────────────────────────────┘
              │ 每次AI调用时注入到 messages 中
              ▼
┌─────────────────────────────────────────────────────┐
│ 第2层: 持久记忆 (memory-storage.js)                  │
│   生命周期: 跨页面持久化                              │
│   容量: 4MB，按权重/时间自动清理                      │
│   用途: 长期记忆（几天前发生的事）                     │
│   存储: localStorage                                 │
│   内容:                                              │
│     - conversations: 对话记录（按会话分组）            │
│     - events: 关键事件（战斗/交易/装备等）             │
│     - facts: 动态构建的事实数据库                      │
│     - snapshots: 玩家状态快照                         │
│     - indexes: 记忆索引（按位置/类型/关键词）          │
└─────────────────────────────────────────────────────┘
              │ 查询最近5条高权重记忆，注入到 mainAction prompt
              ▼
┌─────────────────────────────────────────────────────┐
│ 第3层: 世界观数据 (world-lore.js)                    │
│   生命周期: 永久持久化                                │
│   用途: 不变的世界设定 + 动态实体                     │
│   存储: localStorage                                 │
│   内容:                                              │
│     - universe/races/factions: 世界背景               │
│     - starMap: 星系地图                               │
│     - npcs/knownShips: 动态实体注册表                 │
│     - reputation: 声望系统                            │
│     - discoveredClues: 线索系统                       │
│     - locationAgents: 代理人缓存（24-72h轮换）        │
└─────────────────────────────────────────────────────┘
```

### 记忆注入到 AI 的完整流程

1. **system prompt** (`api-manager.js buildMessages()`): 世界观摘要 + 角色设定
2. **会话历史** (`api-manager.js sessionHistory`): 最近10轮对话
3. **mainAction prompt** (`game-core.js`): 游戏状态 + 场景事实 + 持久记忆 + 航路 + 玩家行动

---

## 四、发现的硬编码问题汇总

### 🔴 需要修复（中优先级）

| # | 位置 | 问题 | 建议 |
|---|------|------|------|
| **NEW-1** | `api-manager.js` L308-322 `buildMessages()` | system prompt 硬编码"星际探索者号"和行为准则 | 应模板化到 `PROMPT_TEMPLATES.systemRole`，动态填入飞船名 |

### 🟡 可选修复（低优先级）

| # | 位置 | 问题 | 建议 |
|---|------|------|------|
| **NEW-2** | `game-core.js` `worldBuildWithAI()` | 世界观调整prompt约80行硬编码 | 可移入 `PROMPT_TEMPLATES.worldBuild`，但与switch-case强耦合 |

### ✅ 合理硬编码（不需修改）

| 位置 | 内容 | 理由 |
|------|------|------|
| `api-manager.js` baseURLs/models | API地址和模型列表 | API规范，非游戏内容 |
| `api-manager.js` retryConfig | 重试策略(3次/1s/10s) | 网络配置，非游戏数据 |
| `memory-storage.js` 容量常量 | 4MB/100条/5会话 | 技术限制常量 |
| `tools.js` 游戏公式 | 伤害计算/资源消耗 | 游戏规则逻辑 |
| `game-core.js` 规则引擎关键词 | '攻击'/'战斗'等 | 离线NLP替代，逻辑非数据 |
| `game-core.js` testConnection prompt | 连接验证提示 | 诊断功能，无需配置化 |

---

## 五、结论

- **AI生成涉及 6 个模块**：api-manager（通信）、game-core（编排）、default-config（模板）、world-lore（数据）、memory-storage（记忆）、tools（执行）
- **记忆机制有 3 层**：会话历史（内存）→ 持久记忆（localStorage）→ 世界观（localStorage）
- **新发现 1 个中优先级硬编码**：`api-manager.js buildMessages()` 中的 system prompt 未模板化，写死了飞船名"星际探索者号"
- **1 个低优先级可选修复**：worldBuild prompt 可模板化但收益不大