# TOOLS.md - 環境配置

## 系統環境

- **OS:** Linux (OpenCloudOS)
- **Python:** 3.10+
- **Node.js:** v22.22.0
- **工作目錄:** ~/.openclaw/workspace
- **時區:** GMT+8

## 已安裝的工具

### Python 套件

- sentence-transformers (MiniLM) - 語義編碼
- numpy - 向量運算
- torch - PyTorch

### Node.js 套件

- tweetnacl - 加密簽名
- tweetnacl-util - 工具函數

### 系統工具

- git - 版本控制
- cron - 定時任務
- jq - JSON 處理

## 環境變數

```bash
# 工作目錄配置（可選，默認 ~/.openclaw/workspace）
export YUE_WORKSPACE="$HOME/.openclaw/workspace"

# Python 依賴安裝
pip3 install -r requirements.txt --break-system-packages
```

## 核心腳本位置

- **記憶編碼:** para-system/brain_encode.py
- **記憶檢索:** para-system/brain_retrieve.py
- **語義編碼:** para-system/semantic_encoder.py
- **每日總結:** para-system/daily-summary.sh
- **深度分析:** para-system/nightly-deep-analysis.sh
- **檢查點:** para-system/checkpoint-memory-llm.sh

## 記憶系統

- **Golden 記憶:** MEMORY.md（永不衰減）
- **Silver 記憶:** memory/YYYY-MM-DD.md（7天衰減）
- **Bronze 記憶:** memory/handoff.md（快照）
- **嵌入向量:** memory/embeddings/（MiniLM 編碼）

---

更新日期：2026-02-16 04:30 GMT+8
