#!/bin/bash
# 功能: 深度分析+模式提取+主动优化
# 频率: 每周日 3:00
# 输出: 综合分析报告

WORKSPACE="${YUE_WORKSPACE:-/root/.openclaw/workspace}"
REPORT_FILE="$WORKSPACE/life/archives/nightly-analysis-report-$(date +%Y%m%d).md"
MEMORY_FILE="$WORKSPACE/MEMORY.md"

# 生成报告头
cat > "$REPORT_FILE" << EOF
# 夜间深度分析报告
生成时间: $(date '+%Y-%m-%d %H:%M:%S')
周期: 每周日 3:00

---

## 📊 系统健康检查

EOF

# 1. 检查MEMORY.md大小
MEMORY_SIZE=$(wc -c < "$MEMORY_FILE" 2>/dev/null || echo 0)
MEMORY_LINES=$(wc -l < "$MEMORY_FILE" 2>/dev/null || echo 0)

echo "### MEMORY.md 状态" >> "$REPORT_FILE"
echo "- 文件大小: $MEMORY_SIZE 字节" >> "$REPORT_FILE"
echo "- 行数: $MEMORY_LINES 行" >> "$REPORT_FILE"

if [ $MEMORY_SIZE -gt 2500 ]; then
    echo "- ⚠️  **需要归档** (超过2500字节)" >> "$REPORT_FILE"
else
    echo "- ✅ 正常" >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"

# 2. 检查磁盘空间
DISK_USAGE=$(df "$WORKSPACE" | tail -1 | awk '{print $5}' | sed 's/%//')
echo "### 磁盘空间" >> "$REPORT_FILE"
echo "- 使用率: ${DISK_USAGE}%" >> "$REPORT_FILE"

if [ $DISK_USAGE -gt 80 ]; then
    echo "- ⚠️  **需要清理** (超过80%)" >> "$REPORT_FILE"
else
    echo "- ✅ 正常" >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"

# 3. 检查临时文件
TEMP_FILES=$(find "$WORKSPACE/memory" -name "checkpoint-*.log" -type f 2>/dev/null | wc -l)
echo "### 临时文件" >> "$REPORT_FILE"
echo "- 检查点日志: $TEMP_FILES 个" >> "$REPORT_FILE"

if [ $TEMP_FILES -gt 20 ]; then
    echo "- ⚠️  **需要清理** (超过20个)" >> "$REPORT_FILE"
else
    echo "- ✅ 正常" >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"

# 4. 统计本周活动
echo "## 📈 本周活动统计" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

DAILY_LOGS=$(ls -1 "$WORKSPACE/memory"/*.md 2>/dev/null | wc -l)
echo "- 日志文件: $DAILY_LOGS 个" >> "$REPORT_FILE"

DECISIONS=$(jq '.decisions | length' "$WORKSPACE/life/decisions/index.json" 2>/dev/null || echo 0)
echo "- 决策记录: $DECISIONS 个" >> "$REPORT_FILE"

echo "" >> "$REPORT_FILE"

# 5. 自动清理建议
echo "## 🧹 自动清理建议" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if [ $MEMORY_SIZE -gt 2500 ]; then
    echo "### 1. MEMORY.md 归档" >> "$REPORT_FILE"
    echo "建议将旧内容移到 \`life/archives/\` 目录" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
fi

if [ $TEMP_FILES -gt 20 ]; then
    echo "### 2. 清理检查点日志" >> "$REPORT_FILE"
    echo "建议删除7天前的 checkpoint-*.log 文件" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
fi

if [ $DISK_USAGE -gt 80 ]; then
    echo "### 3. 磁盘空间清理" >> "$REPORT_FILE"
    echo "建议清理不必要的文件或归档旧数据" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
fi

# 6. 下周任务预告
echo "## 📅 下周任务预告" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "- [ ] 检查MEMORY.md是否需要归档" >> "$REPORT_FILE"
echo "- [ ] 清理7天前的临时文件" >> "$REPORT_FILE"
echo "- [ ] 验证所有定时任务状态" >> "$REPORT_FILE"
echo "- [ ] 更新决策日志索引" >> "$REPORT_FILE"

echo "" >> "$REPORT_FILE"
echo "---" >> "$REPORT_FILE"
echo "报告生成完成: $(date '+%Y-%m-%d %H:%M:%S')" >> "$REPORT_FILE"

echo "✅ 夜间深度分析完成"
echo "📄 报告位置: $REPORT_FILE"
