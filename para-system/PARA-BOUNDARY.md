# PARA 與記憶系統的邊界

> 更新時間：2026-02-15 00:10 GMT+8

## 核心區分

- **PARA**（para-system/）= 「你在做什麼」→ 項目、領域、資源的組織
- **記憶**（memory/）= 「你知道什麼」→ 事實、決策、經驗的存儲

## 具體規則

### ✅ 應該放在 para-system/

- 系統腳本（checkpoint-memory-llm.sh、daily-summary.sh 等）
- 項目配置（brain_encode.py、memory_distill.py 等）
- 工作流程（puzzle73-monitor.js 等）
- 資源文件（不是記憶的數據）

### ✅ 應該放在 memory/

- 每日日誌（memory/YYYY-MM-DD.md）
- 核心記憶（MEMORY.md）
- 決策記錄（為什麼做了某個決定）
- 經驗教訓（失敗了什麼、學到了什麼）
- 狀態快照（handoff.md）

### ❌ 不要做的事

- ❌ 不要在 memory/ 裡存項目管理信息
- ❌ 不要在 para-system/ 裡存記憶或日誌
- ❌ 不要在 para-system/ 裡存決策記錄
- ❌ 不要混淆「工作流程」和「工作記錄」

## 檢查清單

新增文件時，問自己：

1. 這是「我在做什麼」還是「我知道什麼」？
2. 如果是「做什麼」→ para-system/
3. 如果是「知道什麼」→ memory/
4. 如果不確定 → 問 An An

---

*最後更新：2026-02-15 00:10 GMT+8*
