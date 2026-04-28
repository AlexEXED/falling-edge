# 残留硬编码问题清单

> 更新时间: 2026-04-16 00:47  
> 扫描范围: js/*.js, index.html

---

## 🔴 高优先级（影响可配置性 / 可维护性）

### 1. 战斗系统魔法数字 — `tools.js`

| 位置 | 硬编码值 | 含义 | 建议 |
|---|---|---|---|
| 基础命中率 | `hitChance = 70` | 默认命中率70% | 提取为 `COMBAT_CONFIG.baseHitChance` |
| 距离惩罚 | `range > 300` → `-30`, `range > 100` → `-15` | 距离命中惩罚 | 提取为 `COMBAT_CONFIG.rangeThresholds` |
| 武器命中修正 | `laser +10`, `missile +5`, `railgun -5` | 武器类型加成 | 提取为 `COMBAT_CONFIG.weaponHitModifiers` |
| 随机因子 | `Math.random() * 20 - 10` | 命中随机 ±10 | 提取为 `COMBAT_CONFIG.hitRandomRange` |
| 命中钳制 | `Math.max(10, Math.min(95, hitChance))` | 最低10%/最高95% | 提取为 `COMBAT_CONFIG.hitClamp` |
| 基础伤害 | `baseDamage = 20`, laser=25, missile=40 | 武器基础伤害 | 提取为 `COMBAT_CONFIG.weaponDamage` |
| 暴击率 | `Math.random() * 100 < 15` | 固定15%暴击 | 提取为 `COMBAT_CONFIG.critRate` |
| 暴击倍率 | `baseDamage * 1.5` | 1.5倍伤害 | 提取为 `COMBAT_CONFIG.critMultiplier` |
| 距离衰减 | `range > 200` → `*0.7`, `range > 100` → `*0.85` | 伤害衰减 | 提取为 `COMBAT_CONFIG.damageDecay` |
| 伤害波动 | `0.8 + Math.random() * 0.4` | 80%~120%波动 | 提取为 `COMBAT_CONFIG.damageVariance` |

### 2. 技能检定魔法数字 — `tools.js`

| 位置 | 硬编码值 | 含义 | 建议 |
|---|---|---|---|
| 基础成功率 | `baseSuccess = 50`, piloting=60 | 默认/特殊技能基础成功率 | 提取为 `SKILL_CHECK_CONFIG.baseRates` |
| 随机因子 | `Math.random() * 30 - 15` | 成功率随机 ±15 | 提取为 `SKILL_CHECK_CONFIG.randomRange` |
| 成功率钳制 | `Math.max(5, Math.min(95, ...))` | 最低5%/最高95% | 提取为 `SKILL_CHECK_CONFIG.clamp` |
| 成功档次 | `margin > 30` → 大成功, `> 15` → 成功 | 结果分级 | 提取为 `SKILL_CHECK_CONFIG.tiers` |
| 失败档次 | `margin > 30` → 大失败, `> 15` → 失败 | 结果分级 | 同上 |

### 3. 恢复量硬编码 — `tools.js` + `game-state.js`

| 位置 | 硬编码值 | 含义 | 建议 |
|---|---|---|---|
| tools.js 待机恢复 | `energy + recovery`, `shield + Math.floor(recovery / 2)` | 精力/护盾恢复系数 | 提取为 `REST_CONFIG.passive` |
| game-state.js full | `health+40, energy+60, hull+20, shield+30` | 港口完整休息 | 提取为 `REST_CONFIG.full` |
| game-state.js simple | `health+20, energy+30, hull+10, shield+15` | 飞船内休息 | 提取为 `REST_CONFIG.simple` |
| game-state.js emergency | `health+10, energy+15` | 野外紧急休息 | 提取为 `REST_CONFIG.emergency` |
| game-state.js 负面30% | `Math.random() < 0.3` | 紧急休息负面效果概率 | 提取为 `REST_CONFIG.emergencyPenaltyChance` |
| game-core.js 休息时长 | `full=8h, simple=4h, emergency=2h` | 休息推进时间 | 提取为 `REST_CONFIG.hours` |

### 4. 导航系统硬编码 — `tools.js`

| 位置 | 硬编码值 | 含义 | 建议 |
|---|---|---|---|
| 遭遇率 | `Math.random() < 0.2` | 20%随机遭遇 | 提取为 `NAVIGATION_CONFIG.encounterRate` |
| 待机恢复上限 | `Math.min(hours, 24)` | 每小时1%精力，上限24% | 提取为 `NAVIGATION_CONFIG.maxPassiveRecovery` |

### 5. 离线回退商品（game-core.js 重复定义）

| 位置 | 问题 | 建议 |
|---|---|---|
| `renderOfflineTradeList()` | 能量电池50€等4项商品硬编码在函数内 | 已有 `DEFAULT_LORE.offlineTradeBasics`，但 game-core.js 中存在**重复**兜底列表，应统一引用 |
| `renderOfflineRepairList()` | "备用零件恢复20%"、"护盾充能50€恢复25%" | 应从配置读取 |
| `generateOfflineAgents()` | `price: mission?200:100` | 离线代理人服务价格硬编码 |

---

## 🟡 中优先级（影响用户体验一致性）

### 6. UI 状态文本阈值 — `ui-manager.js`

| 位置 | 硬编码值 | 含义 |
|---|---|---|
| 健康描述 | `<30` 危险, `<60` 受伤, `<100` 受损, `=100` 正常 | 舰长健康文本 |
| 精力描述 | `<30` 疲惫, `<60` 疲劳, `<100` 有点累, `=100` 尚可 | 舰长精力文本 |
| 进度条颜色 | `<20` 红色, `<50` 橙色, `>=50` 绿色 | 进度条样式 |
| 低燃料警告 | `fuel < 20` | 燃料警告阈值 |
| 低生命值警告 | `health < 30` | 生命值警告阈值 |
| 状态栏兜底 | `'船体 ████░░ 85% | 护盾 ██░░░░ 50% | 燃料 ██░░░░ 45%'` | 状态栏示例文本 |

**建议**: 提取为 `UI_CONFIG.thresholds` 和 `UI_CONFIG.statusLabels`。

### 7. game-state.js 状态描述阈值

| 位置 | 硬编码值 | 含义 |
|---|---|---|
| 健康描述 | `>=90`良好, `>=70`正常, `>=50`一般, `>=30`不佳, `>=10`危险 | `getStatusDescription()` |
| 精力描述 | `>=90`充沛, `>=70`尚可, `>=50`一般, `>=30`不足, else精疲力竭 | 同上 |
| 燃料描述 | `>=90`充足, `>=70`尚可, `>=50`一般, `>=30`偏低, else告急 | 同上 |

**说明**: 与 ui-manager.js 的阈值**不一致**（一个用 30/60/100，另一个用 90/70/50/30/10），应统一。

### 8. 记忆存储限制 — `memory-storage.js`

| 位置 | 硬编码值 | 含义 |
|---|---|---|
| MAX_SIZE | `4 * 1024 * 1024` (4MB) | localStorage 上限 |
| COMPRESSION_THRESHOLD | `3.5 * 1024 * 1024` (3.5MB) | 开始压缩阈值 |
| MAX_CONVERSATIONS_PER_SESSION | `100` | 每会话最大对话数 |
| MAX_SESSIONS | `5` | 最大会话数 |
| MAX_EVENTS | `1000` | 最大事件数 |
| 对话截断 | AI回复 `> 500` 字截断, 玩家输入 `> 200` 字截断 | 压缩时截断长度 |
| 旧事件清理 | `daysDiff < 30` | 30天后清理事件 |
| 时间衰减 | `Math.max(0.3, 1.0 - (hoursDiff / 24) * 0.1)` | 记忆衰减公式 |

**建议**: 提取为 `MEMORY_CONFIG` 常量对象。

### 9. 代理人系统数字 — `game-core.js`

| 位置 | 硬编码值 | 含义 |
|---|---|---|
| 刷新间隔 | `24 + Math.floor(Math.random() * 48)` (24~72h) | 代理人刷新时间 |
| NPC名称长度 | `name.length < 2 \|\| name.length > 12` | NPC名称合法范围 |

### 10. 场景印象/舰长日志限制 — `world-lore.js`

| 位置 | 硬编码值 | 含义 |
|---|---|---|
| 印象上限 | `list.length > 15` | 每地点最多15条印象 |
| 印象注入上限 | `impressions.slice(-8)` | 注入prompt最多8条 |
| 日志上限 | `captainLog.length > 50` | 最多50条舰长日志 |
| 日志摘要 | `getLogSummary(maxEntries = 5)` | prompt注入5条日志 |

### 11. 声望阈值 — `world-lore.js`

| 位置 | 硬编码值 | 含义 |
|---|---|---|
| 声望标签 | `>=50`友好, `>=20`好感, `<=-50`敌对, `<=-20`警惕 | 声望等级划分 |
| 声望范围 | `Math.max(-100, Math.min(100, ...))` | -100~100 |

### 12. 时间系统常量 — `game-state.js`

| 位置 | 硬编码值 | 含义 |
|---|---|---|
| 月天数 | `t.day > 30` → 每月30天 | 简化历法 |
| 年月数 | `t.month > 12` → 每年12月 | 标准历法 |
| 小时转换 | `365 * 24`, `30 * 24` | 年/月转小时 |

### 13. API 超时 — `api-manager.js`

| 位置 | 硬编码值 | 含义 |
|---|---|---|
| 请求超时 | `setTimeout(() => controller.abort(), 30000)` | 30秒超时 |
| 默认温度 | `temperature = 0.7` | AI温度参数 |
| 默认token | `maxTokens = 500` | 最大token |
| 重试次数 | `maxRetries: 3` | 重试上限 |
| 重试延迟 | `baseDelay: 1000, maxDelay: 10000` | 退避策略 |

---

## 🟢 低优先级（合理硬编码 / 改动收益小）

### 14. 属性值上下限 — 多个文件

`Math.max(0, ...)` / `Math.min(100, ...)` 在 game-state.js, tools.js, validator.js 中大量使用。这些是通用游戏属性 0~100 钳制，属于合理范式。

### 15. API 提供商地址 — `api-manager.js`

`providerURLs` 对象中的 5 个 URL、anthropic-version `'2023-06-01'` 等属于 API 对接的固有配置，硬编码合理。

### 16. HTTP 状态码处理 — `api-manager.js`

`status === 401/403/429/500/404` 的分支处理和中文错误提示，属于标准 HTTP 错误处理，硬编码合理。

### 17. 日期格式化 — `game-core.js`

`diffHours < 24` → "X小时前", `< 168` → "X天前" 等时间显示逻辑，属于通用 UI 格式化，改动收益小。

### 18. game-state.js 兜底默认值

`captain: { health: 100, energy: 100, ... }` 等极端兜底值（仅在 DEFAULT_STATE 也缺失时使用），改动收益极低。

### 19. game-core.js 命令历史上限

`this.maxHistory = 50` — 已为实例变量，可配置性足够。

### 20. 终端行数上限 — `ui-manager.js`

`this.maxTerminalLines = 100` — 已为实例变量。

---

## 📊 统计摘要

| 优先级 | 数量 | 估计涉及数值 | 状态 |
|---|---|---|---|
| 🔴 高（游戏机制参数） | 5 组 | ~35个数值 | 建议提取为配置对象 |
| 🟡 中（UI/存储/系统参数） | 8 组 | ~30个数值 | 可选提取 |
| 🟢 低（合理硬编码） | 7 组 | ~15个数值 | 维持现状 |

---

## 💡 推荐方案

在 `js/default-config.js` 中新增以下配置块，然后在各模块中引用：

```javascript
// === 战斗机制参数 ===
const COMBAT_CONFIG = {
    baseHitChance: 70,
    rangeThresholds: [
        { range: 300, hitPenalty: 30, damageMult: 0.7 },
        { range: 200, hitPenalty: 0,  damageMult: 0.7 },
        { range: 100, hitPenalty: 15, damageMult: 0.85 }
    ],
    weaponHitModifiers: { laser: 10, missile: 5, railgun: -5 },
    weaponDamage: { default: 20, laser: 25, missile: 40 },
    hitRandomRange: 10,        // ±10
    hitClamp: { min: 10, max: 95 },
    critRate: 15,              // 百分比
    critMultiplier: 1.5,
    damageVariance: { min: 0.8, max: 1.2 }
};

// === 技能检定参数 ===
const SKILL_CHECK_CONFIG = {
    baseRate: 50,
    skillRates: { piloting: 60 },
    randomRange: 15,           // ±15
    clamp: { min: 5, max: 95 },
    successTiers: [
        { margin: 30, label: '大成功' },
        { margin: 15, label: '成功' },
        { margin: 0,  label: '勉强成功' }
    ],
    failureTiers: [
        { margin: 30, label: '大失败' },
        { margin: 15, label: '失败' },
        { margin: 0,  label: '接近成功' }
    ]
};

// === 休息恢复参数 ===
const REST_CONFIG = {
    full:      { health: 40, energy: 60, hull: 20, shield: 30, hours: 8 },
    simple:    { health: 20, energy: 30, hull: 10, shield: 15, hours: 4 },
    emergency: { health: 10, energy: 15, hull: 0,  shield: 0,  hours: 2 },
    emergencyPenaltyChance: 0.3
};

// === 导航参数 ===
const NAVIGATION_CONFIG = {
    encounterRate: 0.2,
    maxPassiveRecovery: 24
};

// === 记忆存储参数 ===
const MEMORY_CONFIG = {
    maxSize: 4 * 1024 * 1024,
    compressionThreshold: 3.5 * 1024 * 1024,
    maxConversationsPerSession: 100,
    maxSessions: 5,
    maxEvents: 1000,
    aiTruncateLength: 500,
    playerTruncateLength: 200,
    eventRetentionDays: 30,
    timeDecayFloor: 0.3,
    timeDecayRate: 0.1
};

// === UI 参数 ===
const UI_CONFIG = {
    thresholds: {
        healthLabels: [
            { max: 30, label: '危险', color: 'red' },
            { max: 60, label: '受伤', color: 'orange' },
            { max: 99, label: '受损', color: 'yellow' },
            { max: 100, label: '正常', color: 'green' }
        ],
        progressBarColors: [
            { max: 20, color: '#ff3333' },
            { max: 50, color: '#ff9900' }
        ]
    },
    warningThresholds: { fuel: 20, health: 30 }
};

// === 代理人系统参数 ===
const AGENT_CONFIG = {
    refreshMinHours: 24,
    refreshRandomHours: 48,
    npcNameLength: { min: 2, max: 12 }
};

// === 场景印象/日志参数 ===
const LORE_LIMITS = {
    maxImpressions: 15,
    impressionsInPrompt: 8,
    maxCaptainLog: 50,
    logInPrompt: 5
};
```

### 实施步骤

1. 在 `default-config.js` 添加上述配置常量
2. `tools.js`：引用 `COMBAT_CONFIG` / `SKILL_CHECK_CONFIG` / `NAVIGATION_CONFIG` 替换魔法数字
3. `game-state.js`：引用 `REST_CONFIG` 替换恢复量硬编码
4. `game-core.js`：引用 `REST_CONFIG.*.hours` / `AGENT_CONFIG` / `LORE_LIMITS`
5. `ui-manager.js`：引用 `UI_CONFIG` 替换阈值
6. `memory-storage.js`：引用 `MEMORY_CONFIG` 替换存储参数
7. `world-lore.js`：引用 `LORE_LIMITS` 替换上限值

**预计改动量**: 约 100 行引用替换（无逻辑变更），风险低。
