#!/usr/bin/env python3
"""
子代理性能追蹤 - 查看腳本
用途：顯示子代理的性能統計
"""

import json
import sys
from pathlib import Path
from datetime import datetime, timedelta

PERF_FILE = Path(__file__).parent.parent / "subagents" / "performance.json"

def show_performance(agent=None, days=7):
    """顯示性能統計"""
    
    if not PERF_FILE.exists():
        print(f"❌ 找不到 {PERF_FILE}")
        return
    
    try:
        with open(PERF_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"❌ 讀取失敗: {e}")
        return
    
    print("\n" + "="*60)
    print("📊 子代理性能統計")
    print("="*60)
    
    if agent:
        # 顯示單個子代理
        if agent not in data["agents"]:
            print(f"❌ 未知子代理: {agent}")
            return
        
        a = data["agents"][agent]
        print(f"\n🔹 {a['name']}")
        print(f"   模型: {a['model']}")
        print(f"   總任務: {a['total_tasks']} 次")
        print(f"   成功: {a['success']} 次")
        print(f"   失敗: {a['failure']} 次")
        print(f"   成功率: {a['success_rate']}%")
        print(f"   平均 tokens: {a['avg_tokens']}")
        print(f"   總 tokens: {a['total_tokens']}")
        if a['last_task']:
            print(f"   最後任務: {a['last_task']}")
            print(f"   更新時間: {a['last_updated']}")
    else:
        # 顯示所有子代理
        for agent_key, a in data["agents"].items():
            status = "🟢" if a['success_rate'] >= 90 else "🟡" if a['success_rate'] >= 70 else "🔴"
            print(f"\n{status} {a['name']}")
            print(f"   任務: {a['total_tasks']} | 成功: {a['success']} | 失敗: {a['failure']}")
            print(f"   成功率: {a['success_rate']}% | 平均 tokens: {a['avg_tokens']}")
            if a['last_task']:
                print(f"   最後: {a['last_task']} ({a['last_updated']})")
    
    # 最近 N 天的任務
    if data["history"]:
        cutoff = datetime.fromisoformat(data["history"][-1]["timestamp"]) - timedelta(days=days)
        recent = [h for h in data["history"] if datetime.fromisoformat(h["timestamp"]) > cutoff]
        
        if recent:
            print(f"\n📈 最近 {days} 天的任務")
            print("-" * 60)
            for h in recent[-10:]:  # 只顯示最後 10 個
                status = "✅" if h["success"] else "❌"
                ts = datetime.fromisoformat(h["timestamp"]).strftime("%m-%d %H:%M")
                print(f"{status} [{ts}] {h['agent']}: {h['task']} ({h['tokens']} tokens)")
    
    print("\n" + "="*60 + "\n")

if __name__ == "__main__":
    agent = sys.argv[1] if len(sys.argv) > 1 else None
    days = int(sys.argv[2]) if len(sys.argv) > 2 else 7
    show_performance(agent, days)
