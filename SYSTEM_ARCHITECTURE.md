# 🐾 小安同学 - 完整系统架构

**最后更新：** 2026-02-14 03:08 GMT+8 | **版本：** v2.1

---

## 📊 系统全景图

```
┌─────────────────────────────────────────────────────────────┐
│                    主代理（Main Agent）                      │
│              直接与主人对话 | 协调子代理 | 决策              │
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

## 🎭 三个子代理（Subagents）

### 🔍 空（Analyzer）
- **模型：** Claude Opus
- **职能：** 深度分析、问题诊断、信息提取
- **特点：** 思考深、逻辑强、能发现隐藏问题
- **工作流：** 接收任务 → 深度分析 → 生成报告 → 存档结果
- **位置：** `/root/.openclaw/workspace/subagents/kong/`

### 🛠️ 剀（Craftsman）
- **模型：** Claude Opus
- **职能：** 代码实现、系统优化、流程改进
- **特点：** 动手能力强、能写代码、能修复问题
- **工作流：** 接收需求 → 设计方案 → 实现代码 → 测试验证
- **位置：** `/root/.openclaw/workspace/subagents/kai/`

### 👀 玥（Sentinel）
- **模型：** Claude Haiku
- **职能：** 实时监控、快速反应、异常预警
- **特点：** 反应快、成本低、能持续观察
- **工作流：** 持续监测 → 发现异常 → 快速上报 → 触发响应
- **位置：** `/root/.openclaw/workspace/subagents/yue/`

---

## 🧠 神髓记忆系统 v2.1

### 四层状态模型

| 状态 | 权重范围 | 特性 | 衰减周期 |
|------|---------|------|---------|
| **Golden** | ≥0.85 | 核心原则、用户指令、身份设定 | 永不衰减 |
| **Silver** | 0.50-0.84 | 最近的事、活跃任务 | 7天衰减20% |
| **Bronze** | 0.20-0.49 | 历史记录、过去决策 | 30天衰减20% |
| **Dust** | <0.20 | 系统优雅遗忘 | 自动清理 |

### 记忆结构（index.json）

```json
{
  "id": 1,
  "content": "记忆内容",
  "actor": "Self|空|剀|玥|User",
  "target": "Core|Subagents|Task|Memory",
  "domain": "World(0.95)|Role(0.995)|User(1.0)",
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

**1. 语义查重（MiniLM）**
- 新记忆与现有记忆相似度 ≥0.75 → 强化旧记忆
- 相似度 <0.75 → 创建新记忆
- 防止重复堆积

**2. 动态强化（每次命中）**
- `access_count++`
- `density += 0.2`（刻骨铭心累积）
- `current_importance += initial_importance × 0.15`（上限 2.0）
- 自动更新 state

**3. 调用追踪**
- `access_count`：被调用次数（强化时递增）
- `retrieval_count`：被搜索提取次数（检索时递增）
- 区分"主动强化"vs"被动检索"

**4. !REMEMBER 标记**
- 内容包含 `!REMEMBER` → 自动 importance=1.0, domain=User
- 优先级最高，立即进入 Golden 状态

**5. 并发安全**
- fcntl 文件锁保护 index.json
- 多进程安全写入

### 身份标签规则

所有记忆必须标记：`From: {Actor} -> Target: {Project}`

**Actor：**
- `Self` - 主代理
- `空` - 分析子代理
- `剀` - 工匠子代理
- `玥` - 观察子代理
- `User` - 主人

**Project：**
- `Core` - 核心身份、原则
- `Subagents` - 子代理相关
- `Task` - 任务执行
- `Memory` - 记忆系统本身

### 自动衰减周期

- **每 6 小时**：checkpoint-memory-llm.sh（提取关键信息，刷新银级权重）
- **每 7 天**：自动将银级 → 铜级（权重衰减 20%）
- **每 30 天**：自动将铜级 → 灰级（权重衰减 20%）
- **灰级自动清理**，释放认知空间

---

## 📁 记忆分层架构

```
/root/.openclaw/workspace/memory/
├── MEMORY.md                    # 长期记忆（精选，永久保留）
├── memory/
│   ├── YYYY-MM-DD.md           # 每日日志（原始记录）
│   ├── handoff.md              # 当前状态快照（临时）
│   └── archive/
│       └── YYYY-MM-DD.md       # 归档日志（30天后）
├── index.json                   # 记忆索引（brain_encode.py 维护）
├── embeddings/                  # 向量存储（MiniLM 嵌入）
└── index.lock                   # 并发锁文件
```

### 三层记忆模型

**热记忆（Hot）**
- 位置：MEMORY.md
- 内容：P0 级别（永不衰减）
- 用途：快速查阅，核心原则
- 更新频率：每周审视

**温记忆（Warm）**
- 位置：memory/YYYY-MM-DD.md
- 内容：P1 级别（7天衰减）
- 用途：最近的事、活跃任务
- 更新频率：每天记录

**冷记忆（Cold）**
- 位置：memory/archive/ + index.json
- 内容：P2 级别（30天衰减）
- 用途：历史记录、过去决策
- 检索方式：语义搜索（brain_retrieve.py）

---

## 🔄 子代理协作流程

### 召唤方式

```bash
sessions_spawn(
  task="具体任务描述",
  label="空|剀|玥",
  agentId="对应的agent_id"
)
```

### 工作流

```
主代理
  ↓
[决定需要哪个子代理]
  ↓
召唤子代理（sessions_spawn）
  ↓
子代理接收任务
  ↓
读取对应的 .md 文件（获取上下文）
  ↓
执行工作（分析/实现/监控）
  ↓
生成结果 + 标记 From: {子代理} -> Target: {任务类型}
  ↓
存档结果到 memory/
  ↓
返回结果给主代理
  ↓
主代理整合结果，回复主人
```

### 非阻塞并行

- 多个子代理可同时运行
- 主代理不等待，继续处理其他任务
- 子代理完成后自动上报结果

---

## 💾 核心脚本

### brain_encode.py
```bash
python3 brain_encode.py "记忆内容" \
  --actor Self|空|剀|玥|User \
  --target Core|Subagents|Task|Memory \
  --domain World|Role|User \
  --score 0.5
```
- 编码新记忆或强化现有记忆
- 支持语义查重、动态强化、并发安全

### brain_retrieve.py
```bash
python3 brain_retrieve.py "查询内容" \
  --top-k 5 \
  --threshold 0.5
```
- 语义搜索记忆
- 追踪 retrieval_count
- 返回相关记忆列表

---

## 🎯 权重机制（P0/P1/P2）

### P0 - 金级（永不衰减）
- 核心身份、原则、用户指令
- 例：名字、角色、核心价值观
- 存储：MEMORY.md 顶部

### P1 - 银级（7天衰减20%）
- 最近的事、活跃任务、关键洞察
- 例：最近的对话、当前项目
- 存储：memory/YYYY-MM-DD.md

### P2 - 铜级（30天衰减20%）
- 历史记录、过去决策、存档信息
- 例：旧的任务、已完成的项目
- 存储：memory/archive/ + index.json

---

## 🚀 系统启动流程

1. **读取 MEMORY.md** - 加载 P0 级别的核心原则
2. **读取 memory/YYYY-MM-DD.md** - 加载今天的日志
3. **读取 handoff.md** - 快速进入当前状态
4. **初始化三个子代理** - 🔍空、🛠️剀、👀玥 待命
5. **启用 memory_search** - 语义搜索就位
6. **等待主人指示** - 准备工作

---

## 📋 关键原则

### 主代理职责
- ✅ 与主人对话
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

### API 额度管理
- ✅ 一次性完成所有操作
- ✅ 合并消息输出
- ✅ 不分段输出
- ❌ 不能浪费 token

---

**系统就绪。🐾✨**
