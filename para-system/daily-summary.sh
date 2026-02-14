#!/bin/bash

# Daily Summary & Issue Scanner
# 每天 8:00 執行：總結更新、掃描問題、生成日報
# 時區：Asia/Shanghai (GMT+8)

set -e

WORKSPACE="/root/.openclaw/workspace"
MEMORY_DIR="$WORKSPACE/memory"
TODAY=$(date +%Y-%m-%d)
SUMMARY_FILE="$MEMORY_DIR/$TODAY-summary.md"

echo "📊 開始每日總結和問題掃描..."
echo "⏰ 時間: $(date '+%Y-%m-%d %H:%M:%S GMT+8')"
echo ""

# ============================================
# 第一部分：收集今日更新
# ============================================

echo "📝 收集今日更新..."

UPDATES=""

# 檢查 Git 提交
GIT_COMMITS=$(cd "$WORKSPACE" && git log --oneline --since="00:00" --until="23:59" 2>/dev/null | wc -l)
if [ "$GIT_COMMITS" -gt 0 ]; then
  UPDATES="$UPDATES\n### Git 提交\n- 今日提交數: $GIT_COMMITS 個\n"
  cd "$WORKSPACE" && git log --oneline --since="00:00" --until="23:59" 2>/dev/null | while read line; do
    UPDATES="$UPDATES\n  - $line"
  done
fi

# 檢查文件變更
MODIFIED_FILES=$(find "$WORKSPACE" -type f -mtime -1 ! -path "./.git/*" ! -path "./node_modules/*" 2>/dev/null | wc -l)
if [ "$MODIFIED_FILES" -gt 0 ]; then
  UPDATES="$UPDATES\n### 文件變更\n- 過去 24 小時修改: $MODIFIED_FILES 個文件\n"
fi

# 檢查記憶更新
if [ -f "$MEMORY_DIR/$TODAY.md" ]; then
  LINES=$(wc -l < "$MEMORY_DIR/$TODAY.md")
  UPDATES="$UPDATES\n### 記憶更新\n- 今日日誌行數: $LINES 行\n"
fi

# ============================================
# 第二部分：掃描現有問題
# ============================================

echo "🔍 掃描系統問題..."

ISSUES=""

# 1. 檢查 Cron 任務狀態
CRON_ERRORS=$(grep -r "lastStatus.*error" "$WORKSPACE" 2>/dev/null | wc -l)
if [ "$CRON_ERRORS" -gt 0 ]; then
  ISSUES="$ISSUES\n### ⚠️ Cron 任務錯誤\n- 發現 $CRON_ERRORS 個失敗的任務\n"
fi

# 2. 檢查記憶系統完整性
if [ ! -f "$WORKSPACE/MEMORY.md" ]; then
  ISSUES="$ISSUES\n### ⚠️ 記憶系統缺失\n- MEMORY.md 不存在\n"
fi

if [ ! -f "$WORKSPACE/memory-prune.js" ]; then
  ISSUES="$ISSUES\n### ⚠️ 清理腳本缺失\n- memory-prune.js 不存在\n"
fi

# 3. 檢查子代理配置
SUBAGENT_FILES=$(ls "$WORKSPACE/subagents/"*.md 2>/dev/null | wc -l)
if [ "$SUBAGENT_FILES" -lt 3 ]; then
  ISSUES="$ISSUES\n### ⚠️ 子代理配置不完整\n- 只找到 $SUBAGENT_FILES 個配置文件（需要 3 個）\n"
fi

# 4. 檢查 Git 狀態
GIT_STATUS=$(cd "$WORKSPACE" && git status --porcelain 2>/dev/null | wc -l)
if [ "$GIT_STATUS" -gt 0 ]; then
  ISSUES="$ISSUES\n### ⚠️ 未提交的變更\n- 有 $GIT_STATUS 個文件未提交\n"
fi

# 5. 檢查磁盤空間
DISK_USAGE=$(du -sh "$WORKSPACE" 2>/dev/null | cut -f1)
ISSUES="$ISSUES\n### 📊 磁盤使用\n- 工作目錄大小: $DISK_USAGE\n"

# 6. 檢查記憶文件數量
MEMORY_FILES=$(find "$MEMORY_DIR" -type f -name "*.md" 2>/dev/null | wc -l)
ISSUES="$ISSUES\n### 📁 記憶文件統計\n- 記憶文件數: $MEMORY_FILES 個\n"

# ============================================
# 第三部分：生成日報
# ============================================

echo "📄 生成日報..."

cat > "$SUMMARY_FILE" << EOF
# $TODAY 每日總結

**生成時間：** $(date '+%Y-%m-%d %H:%M:%S GMT+8')

## 📈 今日更新

$UPDATES

## 🔍 系統問題掃描

$ISSUES

## ✅ 系統健康度

- Git 提交: $GIT_COMMITS 個
- 文件變更: $MODIFIED_FILES 個
- 記憶文件: $MEMORY_FILES 個
- 磁盤使用: $DISK_USAGE

---

**下一步行動：**
1. 檢查是否有待處理的 Git 提交
2. 驗證 Cron 任務是否正常運行
3. 確認記憶系統完整性

EOF

echo "✅ 日報已生成: $SUMMARY_FILE"
echo ""
echo "📊 每日總結完成"
echo "  - 更新項: $(echo -e "$UPDATES" | grep -c "^-" || echo 0)"
echo "  - 問題項: $(echo -e "$ISSUES" | grep -c "^-" || echo 0)"
echo "  - 日報位置: $SUMMARY_FILE"

exit 0
