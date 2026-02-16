#!/usr/bin/env python3
"""
子代理任務執行器 - 帶錯誤恢復和日誌
用途：安全地執行子代理任務，防止數據丟失
"""

import json
import sys
import traceback
from datetime import datetime
from pathlib import Path

LOG_DIR = Path(__file__).parent.parent / "subagents" / "logs"
LOG_DIR.mkdir(exist_ok=True)

def log_task(agent, task, status, error=None, result=None):
    """記錄任務執行情況"""
    
    timestamp = datetime.now().isoformat()
    log_entry = {
        "timestamp": timestamp,
        "agent": agent,
        "task": task,
        "status": status,  # success, failure, timeout
        "error": error,
        "result": result
    }
    
    # 寫入日誌文件
    log_file = LOG_DIR / f"subagent-{datetime.now().strftime('%Y%m%d')}.jsonl"
    
    try:
        with open(log_file, 'a', encoding='utf-8') as f:
            f.write(json.dumps(log_entry, ensure_ascii=False) + "\n")
        return True
    except Exception as e:
        print(f"❌ 日誌寫入失敗: {e}")
        return False

def execute_subagent_task(agent, task_desc, model=None, timeout=300):
    """
    執行子代理任務（帶錯誤恢復）
    
    Args:
        agent: 子代理名稱 (空/剀/衛)
        task_desc: 任務描述
        model: 模型（可選，使用默認值）
        timeout: 超時時間（秒）
    
    Returns:
        (success: bool, result: str, error: str)
    """
    
    print(f"\n{'='*60}")
    print(f"🚀 執行子代理任務")
    print(f"{'='*60}")
    print(f"子代理: {agent}")
    print(f"任務: {task_desc}")
    print(f"超時: {timeout}s")
    
    try:
        # 這裡應該調用 sessions_spawn，但為了演示，我們先返回模板
        print(f"\n📝 任務模板（複製粘貼到代碼中執行）：")
        print(f"""
sessions_spawn({{
  label: "{agent.lower()}",
  model: "{model or 'auto'}",
  task: `
    阅读 subagents/{agent}-*.md 了解你的身份。
    
    任務：{task_desc}
    
    完成後輸出經驗傳承。
  `,
  runTimeoutSeconds: {timeout}
}})
        """)
        
        # 記錄任務開始
        log_task(agent, task_desc, "started")
        
        print(f"\n✅ 任務已記錄，等待執行...")
        print(f"{'='*60}\n")
        
        return True, "Task queued", None
        
    except TimeoutError as e:
        error_msg = f"任務超時 ({timeout}s)"
        print(f"⏱️ {error_msg}")
        log_task(agent, task_desc, "timeout", error=error_msg)
        return False, None, error_msg
        
    except Exception as e:
        error_msg = f"{type(e).__name__}: {str(e)}"
        print(f"❌ 執行失敗: {error_msg}")
        print(f"\n詳細錯誤：")
        traceback.print_exc()
        log_task(agent, task_desc, "failure", error=error_msg)
        return False, None, error_msg

def get_task_logs(agent=None, days=7):
    """查看任務日誌"""
    
    print(f"\n{'='*60}")
    print(f"📋 子代理任務日誌")
    print(f"{'='*60}\n")
    
    log_files = list(LOG_DIR.glob("subagent-*.jsonl"))
    
    if not log_files:
        print("❌ 找不到日誌文件")
        return
    
    total_tasks = 0
    success_count = 0
    failure_count = 0
    timeout_count = 0
    
    for log_file in sorted(log_files)[-days:]:
        print(f"\n📅 {log_file.name}")
        print("-" * 60)
        
        try:
            with open(log_file, 'r', encoding='utf-8') as f:
                for line in f:
                    entry = json.loads(line)
                    
                    if agent and entry['agent'] != agent:
                        continue
                    
                    total_tasks += 1
                    status = entry['status']
                    
                    if status == 'success':
                        success_count += 1
                        emoji = "✅"
                    elif status == 'failure':
                        failure_count += 1
                        emoji = "❌"
                    elif status == 'timeout':
                        timeout_count += 1
                        emoji = "⏱️"
                    else:
                        emoji = "⏳"
                    
                    ts = entry['timestamp'].split('T')[1][:5]
                    print(f"{emoji} [{ts}] {entry['agent']}: {entry['task'][:40]}")
                    
                    if entry['error']:
                        print(f"   錯誤: {entry['error']}")
        
        except Exception as e:
            print(f"❌ 讀取失敗: {e}")
    
    print(f"\n{'='*60}")
    print(f"📊 統計")
    print(f"{'='*60}")
    print(f"總任務: {total_tasks}")
    print(f"成功: {success_count}")
    print(f"失敗: {failure_count}")
    print(f"超時: {timeout_count}")
    print(f"{'='*60}\n")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("用法:")
        print("  python3 run-subagent.py <agent> <task> [model] [timeout]")
        print("  python3 run-subagent.py logs [agent] [days]")
        print("\n例子:")
        print("  python3 run-subagent.py 空 '分析系統日誌' claude-opus-4-6-thinking 300")
        print("  python3 run-subagent.py logs 空 7")
        sys.exit(1)
    
    if sys.argv[1] == "logs":
        agent = sys.argv[2] if len(sys.argv) > 2 else None
        days = int(sys.argv[3]) if len(sys.argv) > 3 else 7
        get_task_logs(agent, days)
    else:
        agent = sys.argv[1]
        task = sys.argv[2]
        model = sys.argv[3] if len(sys.argv) > 3 else None
        timeout = int(sys.argv[4]) if len(sys.argv) > 4 else 300
        
        success, result, error = execute_subagent_task(agent, task, model, timeout)
        
        if not success:
            sys.exit(1)
