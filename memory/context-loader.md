# 記憶摘要加載器

> 更新時間：2026-02-15 00:05 GMT+8

## 加載策略

- **對話開始**：只讀 MEMORY.md（Golden，<500 token）
- **需要細節時**：按需檢索 memory/ 目錄下的具體文件
- **永遠不要一次加載所有記憶文件**

## 快速索引

| 需要什麼 | 讀取文件 | 用途 |
|---------|--------|------|
| 用戶信息 | USER.md | An An 的基本信息、偏好 |
| 當前狀態 | memory/handoff.md | 上次對話的狀態、待辦項 |
| 今日日誌 | memory/2026-02-15.md | 今天完成了什麼、進行中的任務 |
| 歷史日誌 | memory/YYYY-MM-DD.md | 查詢特定日期的工作記錄 |
| 系統設計 | memory/REFERENCE.md | 賬號、系統哲學、優化學習 |
| 子代理配置 | subagents/ROUTER.md | 子代理的調度決策樹 |
| 工作日誌 | subagents/work-log.md | 三個子代理的任務歷史 |

## 檢索規則

1. **簡單查詢**（「今天做了什麼」）→ 讀 handoff.md + 今日日誌
2. **用戶偏好查詢**（「An An 喜歡什麼」）→ 讀 MEMORY.md + USER.md
3. **歷史查詢**（「上週發生了什麼」）→ 讀 memory/YYYY-MM-DD.md
4. **系統問題查詢**（「記憶系統怎麼設計的」）→ 讀 memory/REFERENCE.md
5. **子代理查詢**（「空最近在做什麼」）→ 讀 subagents/work-log.md

## 不要做的事

- ❌ 對話開始時讀取所有 memory/ 文件
- ❌ 讀取 SOUL.md（行為規則應該內化在 system prompt）
- ❌ 讀取 para-system/ 目錄（除非明確需要）
- ❌ 一次性加載超過 1000 token 的記憶文件
- ❌ 重複讀取同一個文件（除非內容已更新）

## 緩存策略

- MEMORY.md：每次對話開始讀一次
- handoff.md：每次對話開始讀一次
- USER.md：每次對話開始讀一次
- 其他文件：按需讀取，不要主動加載
