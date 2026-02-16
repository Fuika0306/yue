# 混合性子代理系统

小安同学的影子分身军团。按需召唤，用完即弃。

---

## 🎭 三个分身

| 分身 | 专长 | 模型 |
|-----|------|------|
| 🔍 空 | 深度搜索、解谜、多步推理 | claude-opus-4-6-thinking |
| 🛠️ 剀 | 写代码、API集成、自动化 | claude-opus-4-5-20251101 |
| 👀 衛 | 监控、状态检查、异常检测 | claude-haiku-4-5-20251001 |

**主代理：玥** — 理解意思、派人、整合结果、回复用户

---

## 📂 文件结构

```
subagents/
├── README.md                    # 本文件 - 系统说明
├── ROUTER.md                    # 路由决策树 - 何时召唤哪个子代理
├── 空-Opus.md                   # 分析子代理配置
├── 剀-Opus.md                   # 工匠子代理配置
├── 衛-Haiku.md                  # 监控子代理配置
├── work-log.md                  # 工作日志 - 任务历史记录
├── central_memory_index.json    # 子代理学习记录（预留）
└── context_snapshot.json        # 上下文快照（预留）
```

**说明：**
- `空/剀/衛-*.md`：子代理的身份和行为配置
- `ROUTER.md`：何时召唤哪个子代理的决策树
- `work-log.md`：任务历史记录
- `*.json`：系统状态和学习记录（预留功能）

---

## 🚀 召喚方式

查看 `templates.md` 獲取快速模板。基本用法：

```javascript
sessions_spawn({
  label: "analyzer",  // 或 craftsman / sentinel
  model: "anthropic/claude-opus-4-6-thinking",
  task: `
    阅读 subagents/空-Opus.md 了解你的身份。
    
    任務：{具體任務}
    
    完成後保存經驗到 subagents/central_memory_index.json
  `,
  runTimeoutSeconds: 300
})
```

**記錄任務結果：**

```bash
# 更新性能統計
python3 scripts/track-performance.py 空 "任務描述" success 3200

# 更新工作日誌
python3 scripts/update-work-log.py 空 "任務描述" success 3200

# 保存經驗
python3 scripts/save-learning.py 空 "任務描述" success "洞察內容" diagnosis
```

---

## ✨ 特性

1. **专属 Prompt** — 每个分身有固定的性格和输出格式
2. **任务模板** — 常用任务一键召唤
3. **结果存档** — 历史结果可追溯
4. **协作机制** — 子代理可建议转交任务

---

**创建日期**：2026-02-13
**设计者**：小安同学 🐾
