# 📚 文档中心

> Space RPG H5 项目文档索引。所有开发文档统一存放在 `docs/` 目录下。

---

## 目录结构

```
docs/
├── README.md                  ← 你在这里（文档索引）
├── TODO_MEMO.md               ← 待实现需求备忘录
│
├── design/                    ← 设计文档（架构、方案）
│   └── RULE_ENGINE_DESIGN.md  ← 规则引擎设计文档
│
├── guides/                    ← 使用指南
│   └── QUICK_START.md         ← 快速开始指南
│
├── reports/                   ← 分析报告（一次性产出）
│   ├── AI_MEMORY_MECHANISM_REPORT.md  ← AI记忆机制分析
│   ├── API_FIX_REPORT.md              ← API修复报告
│   └── REMAINING_HARDCODE_ISSUES.md   ← 硬编码问题清单
│
└── reviews/                   ← 代码审查
    ├── AI_INTEGRATION_REVIEW.md       ← AI集成审查
    ├── CODE_REVIEW.md                 ← 代码审查报告
    └── INTERACTION_CHECK_REPORT.md    ← 交互检查报告
```

---

## 文档分类说明

| 分类 | 目录 | 说明 | 更新频率 |
|------|------|------|---------|
| **设计** | `design/` | 架构方案、功能设计、技术规格 | 需求变更时更新 |
| **指南** | `guides/` | 使用教程、快速入门、操作手册 | 功能变更时更新 |
| **报告** | `reports/` | 分析报告、问题清单、修复记录 | 一次性产出，通常不更新 |
| **审查** | `reviews/` | 代码审查、集成检查、质量报告 | 一次性产出，通常不更新 |
| **根目录** | `docs/` | 索引文件、待办备忘录等全局性文档 | 持续更新 |

---

## 文档清单

### 📌 全局
| 文档 | 说明 | 状态 |
|------|------|------|
| [TODO_MEMO.md](./TODO_MEMO.md) | 待实现需求备忘录，记录所有已讨论未开发的需求 | 🟢 活跃维护 |

### 🏗️ 设计文档
| 文档 | 说明 | 状态 |
|------|------|------|
| [RULE_ENGINE_DESIGN.md](./design/RULE_ENGINE_DESIGN.md) | 通用规则引擎设计方案（面向非技术人员） | 🟡 待实现 |

### 📖 使用指南
| 文档 | 说明 | 状态 |
|------|------|------|
| [QUICK_START.md](./guides/QUICK_START.md) | 项目快速开始指南 | 🟢 可用 |

### 📊 分析报告
| 文档 | 说明 | 状态 |
|------|------|------|
| [AI_MEMORY_MECHANISM_REPORT.md](./reports/AI_MEMORY_MECHANISM_REPORT.md) | AI生成与记忆机制深度分析 | ✅ 归档 |
| [API_FIX_REPORT.md](./reports/API_FIX_REPORT.md) | API修复报告 | ✅ 归档 |
| [REMAINING_HARDCODE_ISSUES.md](./reports/REMAINING_HARDCODE_ISSUES.md) | 剩余硬编码问题清单 | ✅ 归档 |

### 🔍 代码审查
| 文档 | 说明 | 状态 |
|------|------|------|
| [AI_INTEGRATION_REVIEW.md](./reviews/AI_INTEGRATION_REVIEW.md) | AI集成审查报告 | ✅ 归档 |
| [CODE_REVIEW.md](./reviews/CODE_REVIEW.md) | 代码质量审查报告 | ✅ 归档 |
| [INTERACTION_CHECK_REPORT.md](./reviews/INTERACTION_CHECK_REPORT.md) | 交互检查报告 | ✅ 归档 |

---

## 文档管理规范

### 新建文档
1. 根据类型放入对应子目录
2. 按命名规则命名（见下方）
3. 在本索引文件中添加条目

### 📛 命名规则

**总体格式：** `[类型前缀]_[主题描述].md`，全大写，下划线分隔。

| 目录 | 前缀 | 格式 | 示例 |
|------|------|------|------|
| `design/` | 无前缀 | `功能名_DESIGN.md` | `RULE_ENGINE_DESIGN.md` |
| `guides/` | 无前缀 | `主题_GUIDE.md` 或 `QUICK_START.md` | `WORLDBUILD_GUIDE.md` |
| `reports/` | 无前缀 | `主题_REPORT.md` | `API_FIX_REPORT.md` |
| `reviews/` | 无前缀 | `主题_REVIEW.md` | `CODE_REVIEW.md` |
| `docs/` 根 | 无前缀 | `功能名.md` | `TODO_MEMO.md` |

**命名要素：**
- ✅ 全大写英文 + 下划线：`RULE_ENGINE_DESIGN.md`
- ✅ 用后缀表明文档类型：`_DESIGN` / `_GUIDE` / `_REPORT` / `_REVIEW` / `_MEMO`
- ✅ 主题部分简短精准，2-4个单词以内
- ❌ 不用中文命名
- ❌ 不用驼峰：~~`RuleEngineDesign.md`~~
- ❌ 不用小写：~~`rule-engine-design.md`~~
- ❌ 不用日期做前缀：~~`20260415_REPORT.md`~~（日期记在文档内部）

**常用后缀含义：**

| 后缀 | 含义 | 用途 |
|------|------|------|
| `_DESIGN` | 设计方案 | 架构、功能设计、技术规格 |
| `_GUIDE` | 使用指南 | 教程、操作手册 |
| `_REPORT` | 分析报告 | 问题分析、修复记录、现状评估 |
| `_REVIEW` | 审查报告 | 代码审查、质量检查 |
| `_MEMO` | 备忘录 | 待办事项、会议记录、决策备忘 |
| `_SPEC` | 技术规格 | 接口定义、数据格式、协议文档 |
| `_CHANGELOG` | 变更日志 | 版本变更记录 |

### 状态标记
- 🟢 **活跃维护** — 持续更新中
- 🟡 **待实现** — 方案已定，代码未写
- 🔵 **开发中** — 正在实现
- ✅ **归档** — 已完成，仅供查阅
- ⛔ **过时** — 内容已过期，仅供参考

### 清理规则
- 过时文档保留但标记 ⛔，不删除
- 每个大版本发布前检查一次文档状态
