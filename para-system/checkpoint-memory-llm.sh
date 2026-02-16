#!/bin/bash
# 功能: LLM智能提取关键记忆，更新MEMORY.md
# 频率: 每6小时
# 输出: MEMORY.md

WORKSPACE="${YUE_WORKSPACE:-/root/.openclaw/workspace}"
MEMORY_FILE="$WORKSPACE/MEMORY.md"
DAILY_LOG_DIR="$WORKSPACE/memory"

# 读取今日日志
TODAY=$(date +%Y-%m-%d)
DAILY_LOG="$DAILY_LOG_DIR/$TODAY.md"

# 如果今日日志不存在，尝试读取最近的日志
if [ ! -f "$DAILY_LOG" ]; then
    DAILY_LOG=$(ls -t "$DAILY_LOG_DIR"/*.md 2>/dev/null | head -1)
fi

if [ ! -f "$DAILY_LOG" ]; then
    echo "❌ 没有找到日志文件"
    exit 1
fi

# 读取最后150行日志
RECENT_CONTENT=$(tail -150 "$DAILY_LOG" 2>/dev/null || echo "")

if [ -z "$RECENT_CONTENT" ]; then
    echo "❌ 日志内容为空"
    exit 1
fi

# 构建提示词
PROMPT="从以下日志中提取关键信息，用简洁的格式列出：
1. 今日成就（完成了什么）
2. 学习收获（学到了什么）
3. 重要决策（做了什么重要决定）
4. 遇到的挑战（遇到了什么问题）

日志内容：
$RECENT_CONTENT

请用简洁的格式输出，每项不超过一行。"

# 调用Claude API（通过OpenClaw的消息系统）
# 这里使用curl调用OpenClaw的内部API
RESPONSE=$(curl -s -X POST http://localhost:3000/api/checkpoint \
  -H "Content-Type: application/json" \
  -d "{\"prompt\": $(echo "$PROMPT" | jq -Rs .)}" 2>/dev/null)

SUMMARY=$(echo "$RESPONSE" | jq -r '.summary // empty' 2>/dev/null)

# 如果API调用失败，使用简单的关键词提取作为备选
if [ -z "$SUMMARY" ]; then
    echo "⚠️  LLM提取失败，使用备选方案"
    SUMMARY=$(echo "$RECENT_CONTENT" | grep -E "^(##|###|-|✅|🔧|📝)" | head -10)
fi

# 更新MEMORY.md
if [ -n "$SUMMARY" ]; then
    {
        echo ""
        echo "## 检查点 $(date '+%Y-%m-%d %H:%M')"
        echo ""
        echo "$SUMMARY"
        echo ""
        echo "---"
    } >> "$MEMORY_FILE"
    echo "✅ 检查点完成：$(date '+%Y-%m-%d %H:%M')"
else
    echo "⚠️  无法提取摘要"
fi
