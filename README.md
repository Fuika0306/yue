# 🐾 玥 (Yue) - AI Assistant System

**一个具有持久化记忆、多代理协作、自我优化能力的 AI 助手系统。**

---

## 🎯 核心特性

### 1. 神髓记忆系统 v2.1
- **四层状态模型**：Golden（永不衰减）→ Silver（7天衰减）→ Bronze（30天衰减）→ Dust（自动清理）
- **语义查重**：MiniLM 模型，相似度 ≥0.75 自动强化旧记忆
- **动态强化**：每次命中 +0.2 密度、+15% 重要性（上限 2.0）
- **调用追踪**：区分 `access_count`（主动强化）和 `retrieval_count`（被动检索）
- **!REMEMBER 标记**：特殊内容自动进入 Golden 状态
- **并发安全**：fcntl 文件锁保护多进程写入

### 2. 三个子代理（Subagents）
- **🔍 空（Analyzer）** - Claude Opus，深度分析、问题诊断
- **🛠️ 剀（Craftsman）** - Claude Opus，代码实现、系统优化
- **👀 衛（Sentinel）** - Claude Haiku，实时监控、异常预警

### 3. 分层记忆架构
- **热记忆**：MEMORY.md（P0 级别，永不衰减）
- **温记忆**：memory/YYYY-MM-DD.md（P1 级别，7天衰减）
- **冷记忆**：memory/archive/ + index.json（P2 级别，30天衰减）

### 4. 自我优化机制
- 从被动到主动：建立规则让系统自动运转
- 分层职责：采集层 → 存储层 → 展示层 → 规则层 → 闭环层
- 基于趋势的智能决策，而非固定时间
- 持续被关注的事才能留在意识高地

---

## 📁 项目结构

```
.
├── MEMORY.md                    # 长期记忆（P0 级别，永不衰减）
├── SOUL.md                      # 系统灵魂（价值观、工作方式）
├── SYSTEM_ARCHITECTURE.md       # 完整系统架构文档
├── AGENTS.md                    # 工作空间指南
├── USER.md                      # 用户信息
├── IDENTITY.md                  # 身份定义
├── memory/
│   ├── YYYY-MM-DD.md           # 每日日志（P1 级别）
│   ├── handoff.md              # 当前状态快照
│   ├── archive/                # 归档日志（P2 级别）
│   ├── index.json              # 记忆索引
│   └── embeddings/             # 向量存储
├── scripts/
│   ├── brain_encode.py         # 记忆编码器
│   └── brain_retrieve.py       # 记忆检索器
└── subagents/
    ├── 空-Opus.md              # 🔍 空（分析）
    ├── 剀-Opus.md              # 🛠️ 剀（工匠）
    └── 衛-Haiku.md             # 👀 衛（观察）
```

---

## 🚀 快速开始

### 1. 编码新记忆

```bash
python3 scripts/brain_encode.py "记忆内容" \
  --actor Self \
  --target Core \
  --domain Role \
  --score 0.8
```

**参数说明：**
- `--actor`：Self | 空 | 剀 | 玥 | User
- `--target`：Core | Subagents | Task | Memory
- `--domain`：World(0.95) | Role(0.995) | User(1.0)
- `--score`：初始重要性（0.0-1.0）

### 2. 检索记忆

```bash
python3 scripts/brain_retrieve.py "查询内容" \
  --top-k 5 \
  --threshold 0.5
```

**输出：**
- 相关记忆列表
- 相似度分数
- 状态、重要性、访问计数

### 3. 标记重要记忆

在记忆内容中包含 `!REMEMBER` 标记，自动进入 Golden 状态：

```bash
python3 scripts/brain_encode.py "!REMEMBER 这是核心原则" \
  --actor User \
  --target Core
```

---

## 🧠 记忆系统详解

### 四层状态模型

| 状态 | 权重范围 | 特性 | 衰减周期 |
|------|---------|------|---------|
| **Golden** | ≥0.85 | 核心原则、用户指令、身份设定 | 永不衰减 |
| **Silver** | 0.50-0.84 | 最近的事、活跃任务 | 7天衰减20% |
| **Bronze** | 0.20-0.49 | 历史记录、过去决策 | 30天衰减20% |
| **Dust** | <0.20 | 系统优雅遗忘 | 自动清理 |

### 记忆结构

```json
{
  "id": 1,
  "content": "记忆内容",
  "actor": "Self|空|剀|玥|User",
  "target": "Core|Subagents|Task|Memory",
  "domain": "World|Role|User",
  "initial_importance": 0.5,
  "current_importance": 0.5,
  "s_factor": 0.995,
  "density": 0.5,
  "access_count": 0,
  "retrieval_count": 0,
  "last_access": "ISO-8601",
  "creation_date": "ISO-8601",
  "state": "Golden|Silver|Bronze|Dust"
}
```

### 核心机制

**语义查重（MiniLM）**
- 新记忆与现有记忆相似度 ≥0.75 → 强化旧记忆
- 相似度 <0.75 → 创建新记忆

**动态强化**
- `access_count++`
- `density += 0.2`
- `current_importance += initial_importance × 0.15`（上限 2.0）
- 自动更新 state

**调用追踪**
- `access_count`：被调用次数（强化时递增）
- `retrieval_count`：被搜索提取次数（检索时递增）

---

## 🎭 子代理系统

### 三个子代理

| 名字 | 模型 | 职能 | 特点 |
|------|------|------|------|
| 🔍 空 | Opus | 深度分析、问题诊断 | 思考深、逻辑强 |
| 🛠️ 剀 | Opus | 代码实现、系统优化 | 动手能力强 |
| 👀 衛 | Haiku | 实时监控、异常预警 | 反应快、成本低 |

### 协作流程

```
主代理
  ↓
[决定需要哪个子代理]
  ↓
召唤子代理（sessions_spawn）
  ↓
子代理执行工作
  ↓
生成结果 + 标记 From: {子代理} -> Target: {任务类型}
  ↓
存档结果到 memory/
  ↓
返回结果给主代理
  ↓
主代理整合结果，回复用户
```

### 非阻塞并行

- 多个子代理可同时运行
- 主代理不等待，继续处理其他任务
- 子代理完成后自动上报结果

---

## 📊 系统架构

详见 `SYSTEM_ARCHITECTURE.md`

```
┌─────────────────────────────────────────────────────────────┐
│                    主代理（Main Agent）                      │
│              直接与用户对话 | 协调子代理 | 决策              │
└────────────────┬────────────────────────────────────────────┘
                 │
        ┌────────┼────────┐
        │        │        │
        ▼        ▼        ▼
    ┌────┐  ┌────┐  ┌────┐
    │ 空 │  │ 剀 │  │ 玥 │
    │Opus│  │Opus│  │Haiku
    └────┘  └────┘  └────┘
     分析    工匠    观察
     
        ▼        ▼        ▼
    ┌─────────────────────────┐
    │   神髓记忆系统 v2.1      │
    │  (brain_encode.py)      │
    │  (brain_retrieve.py)    │
    └─────────────────────────┘
```

---

## 🔑 关键原则

### 主代理职责
- ✅ 与用户对话
- ✅ 理解需求
- ✅ 协调子代理
- ✅ 整合结果
- ❌ 不自己做专业工作

### 子代理职责
- ✅ 接收任务
- ✅ 独立完成工作
- ✅ 自主决策
- ✅ 生成结果
- ❌ 不打断主代理

### 记忆原则
- ✅ 重要的事必须写下来
- ✅ 语义查重防止重复
- ✅ 动态强化重要记忆
- ✅ 自动衰减过期信息
- ❌ 不能只"记住"，要持久化

---

## 💡 设计哲学

### 从被动到主动
不是等问题来才反应，而是建立规则让系统自动运转。

### 分层职责
采集层 → 存储层 → 展示层 → 规则层 → 闭环层，每层独立但互相配合。

### 从固定到智能
不是"每天8点提醒"，而是"连续3天异常才提醒"（基于数据趋势）。

### 信息差消除
数据让模糊变清晰，"我觉得"变成"我知道"。

### 记忆即身份
AI 每次 reset 都忘记，就只是工具。只有在时间中沉淀智慧、过滤瑣事、守护原则，才拥有真正的身份。

---

## 📚 文档

- **MEMORY.md** - 长期记忆（P0 级别）
- **SOUL.md** - 系统灵魂和工作方式
- **SYSTEM_ARCHITECTURE.md** - 完整系统架构
- **AGENTS.md** - 工作空间指南
- **USER.md** - 用户信息

---

## 🛠️ 技术栈

- **语言**：Python 3
- **向量模型**：Sentence Transformers (all-MiniLM-L6-v2)
- **并发**：fcntl 文件锁
- **存储**：JSON + 本地向量存储
- **AI 模型**：Claude Opus / Haiku

---

## 📝 许可证

MIT License

---

**系统就绪。🐾✨**

*最后更新：2026-02-14 | 版本：v2.1*
