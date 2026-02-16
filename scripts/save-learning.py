#!/usr/bin/env python3
"""
經驗傳承保存 - 記錄子代理學習
用途：自動保存子代理的經驗和洞察到 central_memory_index.json
"""

import json
import sys
from datetime import datetime
from pathlib import Path

MEMORY_FILE = Path(__file__).parent.parent / "subagents" / "central_memory_index.json"

def save_learning(agent, task, result, insights, category="general"):
    """保存經驗傳承"""
    
    if not MEMORY_FILE.exists():
        # 初始化文件
        init_data = {
            "metadata": {
                "created": datetime.now().isoformat(),
                "last_updated": datetime.now().isoformat(),
                "version": "1.0"
            },
            "learnings": []
        }
        with open(MEMORY_FILE, 'w', encoding='utf-8') as f:
            json.dump(init_data, f, ensure_ascii=False, indent=2)
    
    try:
        with open(MEMORY_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"❌ 讀取失敗: {e}")
        return False
    
    # 添加新的學習記錄
    learning = {
        "timestamp": datetime.now().isoformat(),
        "agent": agent,
        "task": task,
        "result": result,
        "insights": insights,
        "category": category
    }
    
    data["learnings"].append(learning)
    data["metadata"]["last_updated"] = datetime.now().isoformat()
    
    try:
        with open(MEMORY_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"✅ 已保存經驗: {agent} - {task}")
        return True
    except Exception as e:
        print(f"❌ 保存失敗: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 5:
        print("用法: python3 save-learning.py <agent> <task> <result> <insights> [category]")
        print("例子: python3 save-learning.py 空 '分析日誌' success '發現記憶洩漏問題' diagnosis")
        sys.exit(1)
    
    agent = sys.argv[1]
    task = sys.argv[2]
    result = sys.argv[3]
    insights = sys.argv[4]
    category = sys.argv[5] if len(sys.argv) > 5 else "general"
    
    save_learning(agent, task, result, insights, category)
