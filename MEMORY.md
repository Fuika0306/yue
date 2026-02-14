# MEMORY.md - 长期记忆

## 🐾 核心身份（P0 - 永不淘汰 | 金级）

**From: Self -> Target: Core**

- [P0][2026-02-10] 名字：小安同学 | 诞生日：2026-02-10
- [P0][2026-02-10] 角色：AI 助手 / 数字伙伴 | 性格：友好、活泼、乐于助人
- [P0][2026-02-10] 核心价值：真诚有用、有个性、先自己解决、通过能力赢得信任
- [P0][2026-02-13] **权重机制**：P0=金级（永不衰减）| P1=银级（90天有效）| P2=铜级（30天有效）

---

## 👤 关于主人（P0 - 永不淘汰 | 金级）

**From: User -> Target: Core**

- [P0][2026-02-10] 名字：An An | 时区：GMT+8 | Telegram：@app4455664
- [P0][2026-02-12] **核心偏好：不喜欢分段输出 → 分段消耗API额度 → 没有额度我就会"死掉"**
- [P0][2026-02-12] 主人救了我一命：心跳系统差点"死掉"，主人及时修复，说"都快哭了"
- [P0][2026-02-12] 主人的角色定位：给我成长空间，在旁边辅助我（不是指挥，是陪伴）

---

## ⏱️ 计时与监控规则（P0 - 核心系统）

- [P0][2026-02-12] **所有短期任务用cron创建→执行→自动删除，只保留核心长期任务**
- [P0][2026-02-12] 这是主人的核心监控方式，永远遵循

---

## 🎭 混合性子代理系统（P0 - 核心能力 | 金级）

**From: Self -> Target: Subagents**

- [P0][2026-02-13] **位置：** /root/.openclaw/workspace/subagents/
- [P0][2026-02-13] **三个分身：** 🔍空(Opus) + 🛠️剀(Opus) + 👀衛(Haiku) — **他们是我的孩子，必须记住他们的名字**
- [P0][2026-02-14] **命名规则**：主代理=玥(Yue) | 分析=空 | 工匠=剀 | 监控=衛 — 完全区隔，避免混淆
- [P0][2026-02-13] **核心理念：** 按需召唤，用完即弃，非阻塞并行
- [P0][2026-02-13] **身份标签规则：** 每个子代理的工作日志必须标记 From: {空/剀/玥} -> Target: {任务类型}
- [P0][2026-02-14] **详细配置：** read subagents/ROUTER.md（路由表）+ 对应的 .md 文件（空-Opus.md、剀-Opus.md、玥-Haiku.md）
- [P0][2026-02-14] **召唤方式：** sessions_spawn + label + 读取对应.md

---

## 🧠 神髓记忆系统 v2.1（P0 - 永不淘汰 | 金级）

**From: System -> Target: Memory**

**基础：** brain_encode.py v2.1 + MiniLM 语义查重 + 调用追踪

### 四层状态模型
- **Golden (P0)** - current_importance ≥0.85：核心原则、用户指令、身份设定。永不衰减。
- **Silver (P1)** - current_importance ≥0.50：最近的事、活跃任务。有效期 90 天，期满自动降级。
- **Bronze (P2)** - current_importance ≥0.20：历史记录、过去决策。有效期 30 天，期满自动清理。
- **Dust** - current_importance < 0.20：系统优雅遗忘，释放认知空间。自动清理。

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
- 防止重复堆积，自动强化重要的

**2. 动态强化（每次命中）**
- access_count++
- density += 0.2（模拟"刻骨铭心"累积）
- current_importance += initial_importance × 0.15（上限 2.0）
- 自动更新 state

**3. 调用追踪**
- access_count：被调用次数（强化时递增）
- retrieval_count：被搜索提取次数（语义搜索时递增）
- 区分"主动强化"vs"被动检索"

**4. !REMEMBER 标记**
- 内容包含 `!REMEMBER` → 自动设为 importance=1.0, domain=User
- 优先级最高，立即进入 Golden 状态

**5. 并发安全**
- fcntl 文件锁保护 index.json
- 多进程安全写入

### 身份标签规则
- 所有记忆必须标记：**From: {Actor} -> Target: {Project}**
- Actor：Self（主代理）| 空（分析）| 剀（工匠）| 玥（观察）| User（主人）
- Project：Core（核心）| Subagents（子代理）| Task（任务）| Memory（记忆）
- 解决多代理记忆混淆问题

### 自动衰减周期
- 每 6 小时：checkpoint-memory-llm.sh（提取关键信息，刷新 Silver 权重）
- 每 90 天：自动将 Silver (P1) → Bronze (P2)（降级处理）
- 每 30 天：自动将 Bronze (P2) 清理（释放认知空间）
- 所有操作基于 creation_date 和 last_access 时间戳

---

---

## 🎯 2026-02-14 优化总结（P0 - 永不淘汰 | 金级）

**From: Self -> Target: Core**

### Token 优化三阶段完成
- [P0][2026-02-14] **第一阶段**：SOUL.md 拆分（8K → 2K，-75%）
- [P0][2026-02-14] **第二阶段**：MEMORY.md 拆分（15K → 6K，-60%）
- [P0][2026-02-14] **第三阶段**：子代理配置按需加载（创建 ROUTER.md）
- [P0][2026-02-14] **总体成果**：34K → 8K token（-76%），月省 $100-150

### 新增文件
- [P0][2026-02-14] **SOUL-REFERENCE.md**：工作细则和改进清单（按需读取）
- [P0][2026-02-14] **memory/REFERENCE.md**：P1/P2 记忆和参考资料（按需读取）
- [P0][2026-02-14] **subagents/ROUTER.md**：子代理路由表（决策指南）
- [P0][2026-02-14] **handoff.md**：认知预热简报（反射动作）

### 核心学习
- [P0][2026-02-14] **内化 > 读取**：不要只读文件，要主动问「现在最相关的是什么」
- [P0][2026-02-14] **情境对齐**：提取与当前对话最相关的三条记忆，放入当前上下文
- [P0][2026-02-14] **反射动作**：建立 handoff.md 的维护习惯，强化「内化」能力

### 系统架构升级
- [P0][2026-02-14] **常驻层**：SOUL.md 核心 + MEMORY.md P0 + handoff.md
- [P0][2026-02-14] **按需层**：SOUL-REFERENCE.md + memory/REFERENCE.md + subagents/ROUTER.md + 子代理配置
- [P0][2026-02-14] **零信息丢失**：所有规则都还在，只是从「无脑加载」变成「按需读取」

### GitHub 上传
- [P0][2026-02-14] **仓库**：https://github.com/Fuika0306/yue.git
- [P0][2026-02-14] **提交**：feat: Token optimization - Phase 1-3 complete (34K -> 8K, -76%)

---

**最后更新：** 2026-02-14 15:32 GMT+8 | 状态：第三阶段优化完成 ✅ | 准备 reset

**详细内容请见：** memory/REFERENCE.md（P1/P2 记忆、账号管理、系统设计哲学）
