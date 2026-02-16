#!/usr/bin/env python3
"""
工作日誌自動更新 - 記錄子代理任務
用途：自動添加任務記錄到 work-log.md
"""

import sys
from datetime import datetime
from pathlib import Path

WORKLOG_FILE = Path(__file__).parent.parent / "subagents" / "work-log.md"

def append_task(agent, task_desc, result, tokens=0):
    """添加任務到工作日誌"""
    
    if not WORKLOG_FILE.exists():
        print(f"❌ 找不到 {WORKLOG_FILE}")
        return False
    
    # 格式化時間戳
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
    
    # 構建日誌行
    status_emoji = "✅" if result.lower() == "success" else "❌"
    log_line = f"- [{timestamp}] {status_emoji} {agent}: {task_desc}"
    if tokens > 0:
        log_line += f" ({tokens} tokens)"
    log_line += "\n"
    
    try:
        with open(WORKLOG_FILE, 'a', encoding='utf-8') as f:
            f.write(log_line)
        print(f"✅ 已添加到工作日誌: {agent} - {task_desc}")
        return True
    except Exception as e:
        print(f"❌ 寫入失敗: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("用法: python3 update-work-log.py <agent> <task> <success|failure> [tokens]")
        print("例子: python3 update-work-log.py 空 '分析系統日誌' success 3200")
        sys.exit(1)
    
    agent = sys.argv[1]
    task = sys.argv[2]
    result = sys.argv[3]
    tokens = int(sys.argv[4]) if len(sys.argv) > 4 else 0
    
    append_task(agent, task, result, tokens)
