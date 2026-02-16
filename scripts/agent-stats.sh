#!/bin/bash
# 子代理使用統計

WORKLOG="/root/.openclaw/workspace/subagents/work-log.md"
PERF_FILE="/root/.openclaw/workspace/subagents/performance.json"

echo ""
echo "📊 子代理使用統計"
echo "================================"

if [ ! -f "$PERF_FILE" ]; then
    echo "❌ 找不到性能文件"
    exit 1
fi

# 使用 Python 讀取 JSON 並顯示統計
python3 << 'EOF'
import json
from pathlib import Path

perf_file = Path("/root/.openclaw/workspace/subagents/performance.json")

try:
    with open(perf_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
except:
    print("❌ 無法讀取性能文件")
    exit(1)

print("\n🔹 任務統計")
print("-" * 40)

total_tasks = 0
for agent_key, agent in data["agents"].items():
    total_tasks += agent["total_tasks"]
    emoji = "🔍" if agent_key == "空" else "🛠️" if agent_key == "剀" else "👀"
    print(f"{emoji} {agent['name']}: {agent['total_tasks']} 次")

print(f"\n📈 總計: {total_tasks} 次任務")

if data["history"]:
    print("\n🔹 最近任務")
    print("-" * 40)
    for h in data["history"][-5:]:
        status = "✅" if h["success"] else "❌"
        print(f"{status} {h['agent']}: {h['task']}")

print("\n" + "=" * 40 + "\n")
EOF
