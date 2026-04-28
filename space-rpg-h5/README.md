# 太空RPG H5网页版

> **⚠️ 项目已终止（2026-04-25）**
> 
> 本项目已由成熟的 SillyTavern（酒馆）方案取代，永久停止开发。
> 核心原因：SillyTavern 内置扩展（Vector Storage/Summarize/Quick Replies/Regex）+ 第三方插件（rpg-companion等）已完整覆盖本项目自研的全部功能需求，且生态更成熟。
> 
> 代码保留归档，开发经验已记录，可供未来参考。

基于《太空RPG项目最终汇报》方案开发的H5网页版本，实现AI驱动的MUD风格太空探索角色扮演游戏。

## 项目概述

### 核心特性
- **沉浸式船载终端界面** - 零出戏的游戏体验
- **双层架构记忆系统** - 状态管理 + 文件检索
- **8个核心工具系统** - 战斗、交易、航行等自动化计算
- **幕间休息机制** - 有条件触发的游戏节拍器
- **本地存储持久化** - 无需服务器，完全离线运行

### 技术架构
```
前端: HTML5 + CSS3 + JavaScript ES6+
存储: LocalStorage + IndexedDB (模拟文件系统)
架构: 双层架构 (状态层 + 检索层)
```

## 文件结构
```
space-rpg-h5/
├── index.html              # 主界面
├── test.html              # 功能测试页面
├── css/
│   ├── terminal.css       # 终端风格基础样式
│   ├── game.css          # 游戏特定样式
│   └── settings.css      # 设置界面样式
├── js/
│   ├── game-state.js     # 游戏状态管理 (state.json)
│   ├── tools.js          # 工具系统 (8个核心工具)
│   ├── act-manager.js    # 幕文件管理
│   ├── validator.js      # 后处理校验器
│   ├── api-manager.js    # AI API管理器
│   ├── settings-manager.js # 设置管理器
│   ├── game-core.js      # 游戏核心逻辑
│   ├── ui-manager.js     # UI管理
│   └── main.js           # 主入口
└── README.md             # 本文档
```

## 核心机制

### 1. 记忆系统
- **L0 状态层**: `state.json` 结构化游戏状态
- **L1 检索层**: `acts/` 幕文件 + 关键词索引
- **L2 快照层**: 幕末状态存档，用于一致性验证
- **L_T 报幕层**: 船载终端界面，每轮覆盖

### 2. 工具系统
| 工具 | 功能 | 强制调用场景 |
|------|------|-------------|
| `calculate_battle` | 战斗计算 | 所有战斗场景 |
| `update_resources` | 资源更新 | 所有资源变化 |
| `roll_check` | 技能检定 | 所有判定场景 |
| `navigate` | 航行计算 | 所有航行场景 |
| `trade` | 交易计算 | 所有交易场景 |
| `time_advance` | 时间推进 | 时间推进场景 |
| `search_acts` | 幕文件检索 | 查询历史 |
| `check_rest_conditions` | 检查休息条件 | `/rest` 命令 |

### 3. AI API集成
- **支持平台**: DeepSeek, OpenAI, Claude, Qwen, GLM, 自定义API
- **API配置**: 通过设置界面配置API密钥和参数
- **智能工具建议**: AI自动分析行动并建议工具调用
- **沉浸式叙事**: AI生成船载终端风格的叙事响应

### 4. 幕间休息机制
- **有条件触发**: 休息不是随时可用的技术操作
- **三级休息**:
  - **完整休息**: 满足所有条件，完全恢复，触发幕间归档
  - **简易休息**: 仅需不在战斗中，部分恢复
  - **紧急休息**: 无条件，极少恢复+可能负面状态
- **可生长系统**: 解锁新休息条件（技能、物品、升级）

### 5. 一致性保证
- **Python工具独占写入** → JavaScript工具独占写入
- **后处理校验器** → 实时验证AI输出
- **状态快照** → 可回溯验证
- **内嵌关键词索引** → 精确检索不依赖AI

## 使用方法

### 启动游戏
1. 直接打开 `index.html` 文件
2. 或部署到Web服务器

### 基本操作
- **输入自然语言行动描述**: 如"攻击前方的海盗船"
- **使用系统命令**: 以 `/` 开头，如 `/rest`, `/status`
- **查看帮助**: 输入 `/help`

### 可用命令
```
/rest              # 请求幕间休息（需满足条件）
/rest emergency    # 紧急休息（无条件，有代价）
/status            # 查看完整状态报告
/history           # 查看命令历史
/save              # 手动保存游戏
/load              # 加载存档
/correct           # 手动修正AI错误
/help              # 显示帮助信息
/reset             # 重置游戏（新游戏）
/settings          # 打开设置界面
```

### 键盘快捷键
- **Ctrl+S**: 保存游戏
- **Ctrl+L**: 加载游戏
- **Ctrl+H**: 显示帮助
- **Ctrl+D**: 开发者工具
- **Ctrl+,**: 打开设置界面
- **Esc**: 关闭所有模态框

## 开发者工具

在浏览器控制台中可用的开发者工具：

```javascript
// 添加资源
devTools.addResource('credits', 1000);

// 完全恢复状态
devTools.fullHeal();

// 跳转到目的地
devTools.jumpTo('火星殖民地');

// 显示调试信息
devTools.showDebugInfo();

// 导出游戏数据
exportGameData();

// 导入游戏数据
importGameData();
```

## 技术实现细节

### 状态管理
- 使用 `GameState` 类管理游戏状态
- LocalStorage 持久化存储
- 自动保存/加载机制

### 工具调用
- 基于规则的自动工具检测
- 异步工具执行
- 工具结果验证

### 数据存储
- **游戏状态**: LocalStorage (`space_rpg_state`)
- **幕文件**: LocalStorage (`space_rpg_acts`)
- **快照**: LocalStorage (`space_rpg_snapshots`)
- **命令历史**: LocalStorage (`space_rpg_command_history`)
- **设置配置**: LocalStorage (`space_rpg_settings`)
- **API配置**: LocalStorage (`space_rpg_api_config`)

### UI系统
- 响应式终端界面
- 实时状态更新
- 通知系统
- 模态框交互

## 与原方案的对应关系

| 原方案组件 | H5实现 |
|-----------|--------|
| `state.json` | `game-state.js` + LocalStorage |
| `tools.py` | `tools.js` (8个核心工具) |
| `act_manager.py` | `act-manager.js` |
| `validator.py` | `validator.js` |
| `api_manager.py` | `api-manager.js` + `settings-manager.js` |
| `build_turn.py` | `ui-manager.js` (报幕生成) |
| `main.py` | `game-core.js` + `main.js` |
| `game-data/` | LocalStorage 多个键值 |
| `rules.md` | 硬编码在工具逻辑中 |

## 扩展性

### 添加新工具
1. 在 `tools.js` 的 `ToolSystem` 类中添加新方法
2. 在 `registerTools()` 中注册工具
3. 在 `game-core.js` 的 `detectToolCalls()` 中添加检测逻辑

### 添加新休息条件
1. 修改 `game-state.js` 中的 `rest_conditions` 结构
2. 更新 `checkRestConditions()` 方法
3. 更新UI中的条件显示

### 添加新游戏机制
1. 扩展 `game-state.js` 中的状态结构
2. 添加相应的工具函数
3. 更新UI显示逻辑

## 浏览器兼容性

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

**要求**: 支持 LocalStorage 和 ES6+ 的现代浏览器

## API配置指南

### 支持的AI平台
1. **DeepSeek** - 推荐，成本低，中文支持好
2. **OpenAI** - GPT系列，功能强大
3. **Claude** - Anthropic，长上下文能力强
4. **Qwen** - 通义千问，阿里云
5. **GLM** - 智谱AI，国产优秀模型
6. **自定义API** - 支持任意兼容OpenAI格式的API

### 配置步骤
1. 点击右上角设置按钮 ⚙️
2. 选择"API配置"标签页
3. 选择AI服务提供商
4. 输入API密钥（从对应平台获取）
5. 选择模型（自动加载可用模型）
6. 点击"测试连接"验证配置
7. 启用API功能

### 成本估算
- **DeepSeek**: 约¥0.015/轮（有缓存）
- **OpenAI GPT-3.5**: 约¥0.03/轮
- **Claude Haiku**: 约¥0.15/轮
- **Qwen/GLM**: 约¥0.02-0.05/轮

## 已知限制

1. **API依赖**: 需要网络连接和有效的API密钥
2. **成本考虑**: 长期使用需要API预算
3. **存储限制**: LocalStorage 有5MB限制
4. **性能**: 大量幕文件可能影响检索性能

## 未来改进方向

1. **多模型切换**: 支持在同一会话中切换不同AI模型
2. **本地模型集成**: 集成本地运行的AI模型（如Ollama）
3. **IndexedDB优化**: 使用 IndexedDB 替代 LocalStorage
4. **PWA支持**: 实现离线应用和推送通知
5. **多人联机**: WebSocket 实现多玩家支持
6. **可视化地图**: Canvas 绘制星际地图

## 许可证

MIT License

## 致谢

基于《太空RPG项目最终汇报》方案开发，感谢多轮AI交叉验证（豆包、DeepSeek×3轮、GLM）提供的技术验证和架构设计。