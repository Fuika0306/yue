#!/usr/bin/env python3
"""
子代理性能追蹤 - 更新腳本
用途：記錄子代理任務完成情況
"""

import json
import sys
from datetime import datetime
from pathlib import Path

PERF_FILE = Path(__file__).parent.parent / "subagents" / "performance.json"

def update_performance(agent, task_desc, success=True, tokens=0):
    """更新子代理性能數據"""
    
    if not PERF_FILE.exists():
        print(f"❌ 找不到 {PERF_FILE}")
        return False
    
    try:
        with open(PERF_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"❌ 讀取失敗: {e}")
        return False
    
    if agent not in data["agents"]:
        print(f"❌ 未知子代理: {agent}")
        return False
    
    agent_data = data["agents"][agent]
    
    # 更新統計
    agent_data["total_tasks"] += 1
    if success:
        agent_data["success"] += 1
    else:
        agent_data["failure"] += 1
    
    agent_data["total_tokens"] += tokens
    agent_data["avg_tokens"] = agent_data["total_tokens"] // agent_data["total_tasks"]
    agent_data["success_rate"] = round(
        (agent_data["success"] / agent_data["total_tasks"]) * 100, 1
    )
    agent_data["last_task"] = task_desc
    agent_data["last_updated"] = datetime.now().strftime("%Y-%m-%d %H:%M")
    
    # 添加到歷史
    data["history"].append({
        "timestamp": datetime.now().isoformat(),
        "agent": agent,
        "task": task_desc,
        "success": success,
        "tokens": tokens
    })
    
    # 保存
    try:
        with open(PERF_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"✅ 已記錄: {agent} - {task_desc}")
        return True
    except Exception as e:
        print(f"❌ 保存失敗: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("用法: python3 track-performance.py <agent> <task> <success|failure> [tokens]")
        print("例子: python3 track-performance.py 空 '分析日誌' success 3200")
        sys.exit(1)
    
    agent = sys.argv[1]
    task = sys.argv[2]
    status = sys.argv[3].lower() == "success"
    tokens = int(sys.argv[4]) if len(sys.argv) > 4 else 0
    
    update_performance(agent, task, status, tokens)
