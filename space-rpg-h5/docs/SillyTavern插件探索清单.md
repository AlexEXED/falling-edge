# SillyTavern 插件探索清单

> 收集时间：2026-04-18  
> 来源：GitHub 搜索 + index.json 官方列表 + SillyTavern 内置扩展  
> 目标：为 space-rpg-h5 项目寻找可参考/集成的扩展能力

---

## 安装方式

在 SillyTavern → 扩展图标 → "Install Extension" → 粘贴 GitHub 仓库地址 → Save

---

## 🗺️ 地图类

| 状态 | 名称 | ⭐ | 简介 | 仓库地址 |
|------|------|-----|------|---------|
| [ ] | **SillyTavern-Map** | 5 | 基础地图扩展 | https://github.com/Elthial/SillyTavern-Map |
| [ ] | **SillyTavern-Interactive-Map** | 5 | 可点击区域交互地图，支持音效/图片/视频 | https://github.com/PavOrlov/SillyTavern-Interactive-Map |
| [ ] | **st-map-tracker** | 4 | 交互式位置与角色追踪地图 | https://github.com/TEC-REBEL/st-map-tracker |
| [ ] | **CTE-Map-Idol-Manager** | 5 | 沉浸式偶像团体经营RPG扩展（含地图） | https://github.com/JLYANG1900/CTE-Map-Idol-Manager |

---

## ⚔️ 任务/Quest/RPG 状态类

| 状态 | 名称 | ⭐ | 简介 | 仓库地址 |
|------|------|-----|------|---------|
| [ ] | **rpg-companion-sillytavern** 🔥 | 233 | AI自动生成任务、追踪角色/背包/游戏状态 | https://github.com/SpicyMarinara/rpg-companion-sillytavern |
| [ ] | **SillyTavern-ScenePulse** | 6 | AI驱动实时场景分析，追踪任务/角色/关系/情绪 | https://github.com/xenofei/SillyTavern-ScenePulse |
| [ ] | **Dooms-Enhancement-Suite** | 22 | RPG增强套件：角色追踪、天气、场景标题等 | https://github.com/DangerDaza/Dooms-Enhancement-Suite |
| [ ] | **SillyTavern-Custom-Scenario** | 38 | 创建/游玩互动场景卡，自定义开局条件 | https://github.com/bmen25124/SillyTavern-Custom-Scenario |
| [ ] | **SillyTavern-SimTracker** | 52 | 从聊天JSON生成可视化角色状态追踪卡片 | https://github.com/prolix-oc/SillyTavern-SimTracker |
| [ ] | **Extension-Objective** (官方) | - | 为AI设置目标，引导叙事走向 | https://github.com/SillyTavern/Extension-Objective |

---

## 🛠️ Tool 类（官方 index.json 中 tool=true）

| 状态 | 名称 | 简介 | 仓库地址 |
|------|------|------|---------|
| [ ] | **D&D Dice** | 7种经典D&D骰子 | https://github.com/SillyTavern/Extension-Dice |
| [ ] | **Web Search** | 将网络搜索结果注入LLM提示 | https://github.com/SillyTavern/Extension-WebSearch |
| [ ] | **Weather** | 天气信息 function tool | https://github.com/SillyTavern/Extension-Weather |
| [ ] | **RSS** | RSS新闻 function tool | https://github.com/SillyTavern/Extension-RSS |
| [ ] | **Spotify** | Spotify播放信息 function tool | https://github.com/SillyTavern/Extension-Spotify |

---

## 📝 探索记录

| 插件名 | 探索日期 | 评价 | 备注 |
|--------|----------|------|------|
| （待填写） | - | - | - |

---

## 📦 内置扩展程序分析（Built-in Extensions）

> 无需安装，SillyTavern 自带，可直接启用

### 功能详解

| 名称 | 版本 | 核心功能 | 可选模块 | 与 space-rpg 相关性 |
|------|------|---------|---------|-------------------|
| **Chat Translation** | 1.0.0 | 实时翻译聊天内容，支持多种语言互译 | 无 | ⭐ 中等：多语言玩家支持 |
| **Connection Profiles** | 1.0.0 | 保存/切换多套API连接配置（不同模型/密钥） | 无 | ⭐⭐ 高：方便切换本地/云端模型测试 |
| **Regex** | 1.0.0 | 对AI输出/用户输入做正则替换，净化/格式化文本 | 无 | ⭐⭐⭐ 极高：可用于提取JSON状态数据、格式化AI回复 |
| **Data Bank (Chat Attachments)** | 1.0.0 | 向对话注入文档/文件内容，扩充上下文 | 无 | ⭐⭐ 高：注入飞船数据、世界设定文档 |
| **Image Captioning** | 1.0.0 | 对图片自动生成文字描述，注入提示词 | `caption` | ⭐ 中等：图片辅助叙事 |
| **Character Expressions** | 1.0.0 | 根据AI情绪自动切换角色立绘表情 | `classify` | ⭐ 中等：角色头像情绪反馈 |
| **Gallery** | 1.5.0 | 聊天中的图片画廊管理与展示 | 无 | ⭐ 低：可做角色/场景图册 |
| **Summarize** | 1.0.0 | 自动对超出上下文的聊天记录进行AI摘要压缩 | `summarize` | ⭐⭐⭐ 极高：长篇RPG必需，防止上下文溢出遗忘剧情 |
| **Image Generation** | 1.0.0 | 接入Stable Diffusion等模型生成聊天配图 | `sd` | ⭐⭐ 高：生成场景/角色插画，提升沉浸感 |
| **TTS** | 1.0.0 | 文字转语音播报AI回复，多引擎可选 | `silero-tts` `edge-tts` `coqui-tts` | ⭐ 中等：语音朗读增强沉浸感 |
| **Quick Replies** | 2.0.0 | 设置快捷回复按钮/宏，一键触发STscript命令 | 无 | ⭐⭐⭐ 极高：快速触发游戏指令、状态查询、菜单操作 |
| **Assets** | 0.1.0 | 管理声音/背景图/头像等媒体资产 | 无 | ⭐⭐ 高：游戏资源管理 |
| **Token Counter** | 1.0.0 | 实时显示当前提示词的token用量 | 无 | ⭐⭐ 高：优化提示词避免超限 |
| **Vector Storage** | 1.0.0 | 将聊天/文档向量化存储，实现语义检索增强(RAG) | `embeddings` | ⭐⭐⭐ 极高：实现长期记忆，检索历史剧情/世界设定 |

---

### 🎯 与 space-rpg-h5 高度相关的内置扩展

#### 🔴 优先级 S（极高相关）

**1. Vector Storage（向量存储）**
- 核心价值：为 RPG 提供**长期记忆**能力，语义检索历史事件、NPC 信息、世界设定
- 工作方式：将文档/聊天内容转为向量，发新消息时自动检索最相关内容注入上下文
- space-rpg 用途：存储飞船数据、任务历史、NPC 关系，实现"AI 记得之前发生的事"

**2. Summarize（摘要压缩）**
- 核心价值：长篇 RPG 的**上下文管理**关键工具，防止早期剧情被遗忘
- 工作方式：当消息数量超过阈值，自动用 AI 摘要替代早期消息
- space-rpg 用途：保留关键剧情主线，同时为新内容留出 token 空间

**3. Quick Replies（快捷回复）**
- 核心价值：创建**游戏菜单/快捷指令**，极大提升操作效率
- 工作方式：预设 STscript 命令绑定到按钮，一键触发复杂操作
- space-rpg 用途：查看状态面板、触发战斗/跳跃/探索等游戏行为

**4. Regex（正则替换）**
- 核心价值：**格式化 AI 输出**，提取结构化数据
- 工作方式：对 AI 回复做正则匹配替换，可隐藏/转换特定内容
- space-rpg 用途：从 AI 回复中提取 JSON 状态块，触发 UI 更新

#### 🟡 优先级 A（高相关）

**5. Data Bank（数据注入）**
- 用途：将飞船参数表、世界设定文档、规则手册直接注入对话上下文

**6. Connection Profiles（连接配置）**
- 用途：快速切换 API 配置，开发调试时在不同模型间切换

**7. Image Generation（图片生成）**
- 用途：为太空场景自动生成配图，提升沉浸感

**8. Token Counter（token 计数）**
- 用途：实时监控 token 用量，优化世界设定注入策略

---

## 探索优先级建议

### 内置扩展（立即可用）
1. **Vector Storage** — 实现长期记忆，space-rpg 核心基础设施
2. **Quick Replies** — 构建游戏快捷菜单，提升操作体验
3. **Summarize** — 长篇 RPG 上下文压缩，防遗忘
4. **Regex** — AI 输出格式化/结构化数据提取
5. **Data Bank** — 注入飞船/世界设定文档

### 第三方扩展（需安装）
1. **rpg-companion-sillytavern**（⭐233）— AI任务自动生成核心
2. **SillyTavern-Interactive-Map** — 地图交互性最佳
3. **SillyTavern-SimTracker** — 状态追踪可视化，适合 space-rpg
4. **SillyTavern-ScenePulse** — 实时场景分析，辅助叙事
5. **Extension-Objective**（官方）— 了解官方任务机制实现方式
