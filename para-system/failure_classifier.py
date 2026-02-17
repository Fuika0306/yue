#!/usr/bin/env python3
"""
失敗分類系統 - 記錄、分類、統計任務失敗
"""

import json
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path
import fcntl

# 配置
WORKSPACE = Path(os.getenv("YUE_WORKSPACE", os.path.expanduser("~/.openclaw/workspace")))
FAILURES_DB = WORKSPACE / "memory" / "failures.json"
REPORTS_DIR = WORKSPACE / "memory" / "failure-reports"

FAILURE_TYPES = {
    "API": "外部 API 問題（404、500、限流、超時）",
    "LOGIC": "邏輯錯誤（算法錯誤、理解偏差）",
    "ENVIRONMENT": "環境問題（依賴缺失、權限不足）",
    "TIMEOUT": "超時問題（網絡、計算）",
    "DATA": "數據問題（格式錯誤、缺失字段）"
}

def ensure_dirs():
    """確保必要目錄存在"""
    WORKSPACE.mkdir(parents=True, exist_ok=True)
    (WORKSPACE / "memory").mkdir(parents=True, exist_ok=True)
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

def load_failures():
    """讀取失敗日誌（帶文件鎖）"""
    ensure_dirs()
    if not FAILURES_DB.exists():
        return []
    
    with open(FAILURES_DB, 'r') as f:
        fcntl.flock(f.fileno(), fcntl.LOCK_SH)
        try:
            return json.load(f)
        finally:
            fcntl.flock(f.fileno(), fcntl.LOCK_UN)

def save_failures(failures):
    """保存失敗日誌（帶文件鎖）"""
    ensure_dirs()
    with open(FAILURES_DB, 'w') as f:
        fcntl.flock(f.fileno(), fcntl.LOCK_EX)
        try:
            json.dump(failures, f, indent=2, ensure_ascii=False)
        finally:
            fcntl.flock(f.fileno(), fcntl.LOCK_UN)

def record_failure(task, failure_type, reason, attempts=None, solution=None):
    """記錄一次失敗"""
    if failure_type not in FAILURE_TYPES:
        print(f"❌ 失敗類型不存在: {failure_type}")
        print(f"   可用類型: {', '.join(FAILURE_TYPES.keys())}")
        return False
    
    failures = load_failures()
    
    failure_id = len(failures) + 1
    record = {
        "id": failure_id,
        "timestamp": datetime.now().isoformat(),
        "task": task,
        "type": failure_type,
        "reason": reason,
        "attempts": attempts or [],
        "solution": solution,
        "resolved": False
    }
    
    failures.append(record)
    save_failures(failures)
    
    print(f"✅ 已記錄失敗 #{failure_id}")
    print(f"   任務: {task}")
    print(f"   類型: {failure_type}")
    print(f"   原因: {reason}")
    return True

def generate_report(days=7):
    """生成失敗統計報告"""
    failures = load_failures()
    
    cutoff = datetime.now() - timedelta(days=days)
    recent = [f for f in failures if datetime.fromisoformat(f["timestamp"]) > cutoff]
    
    # 按類型統計
    by_type = {}
    for f in recent:
        ftype = f["type"]
        by_type[ftype] = by_type.get(ftype, 0) + 1
    
    resolved = sum(1 for f in recent if f["resolved"])
    
    report = f"""# 失敗統計報告

**統計期間：** 最近 {days} 天
**生成時間：** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## 📊 總覽

- 總失敗次數：{len(recent)} 次
- 已解決：{resolved} 次
- 未解決：{len(recent) - resolved} 次
- 解決率：{100 * resolved / len(recent) if recent else 0:.1f}%

## 📈 按類型統計

"""
    
    for ftype in sorted(by_type.keys()):
        count = by_type[ftype]
        report += f"- **{ftype}**: {count} 次 — {FAILURE_TYPES[ftype]}\n"
    
    if recent:
        report += "\n## 📋 詳細記錄\n\n"
        for f in sorted(recent, key=lambda x: x["timestamp"], reverse=True):
            status = "✅ 已解決" if f["resolved"] else "⏳ 未解決"
            report += f"### #{f['id']} {status}\n"
            report += f"- **時間**: {f['timestamp']}\n"
            report += f"- **任務**: {f['task']}\n"
            report += f"- **原因**: {f['reason']}\n"
            if f['solution']:
                report += f"- **解決**: {f['solution']}\n"
            report += "\n"
    
    print(report)
    return report

def generate_weekly_report():
    """生成週報並保存"""
    now = datetime.now()
    week_num = now.isocalendar()[1]
    year = now.isocalendar()[0]
    
    report_file = REPORTS_DIR / f"week-{year}-W{week_num:02d}.md"
    
    report = generate_report(days=7)
    
    with open(report_file, 'w') as f:
        f.write(report)
    
    print(f"\n✅ 週報已保存至 {report_file}")

def main():
    if len(sys.argv) < 2:
        print("使用方式:")
        print("  python3 failure_classifier.py record <任務> <類型> <原因> [--attempts 嘗試1 嘗試2] [--solution 解決方案]")
        print("  python3 failure_classifier.py report [--days 7]")
        print("  python3 failure_classifier.py weekly")
        print("\n失敗類型:")
        for ftype, desc in FAILURE_TYPES.items():
            print(f"  - {ftype}: {desc}")
        return
    
    cmd = sys.argv[1]
    
    if cmd == "record":
        if len(sys.argv) < 5:
            print("❌ 缺少參數")
            print("用法: python3 failure_classifier.py record <任務> <類型> <原因> [--attempts ...] [--solution ...]")
            return
        
        task = sys.argv[2]
        ftype = sys.argv[3]
        reason = sys.argv[4]
        
        attempts = []
        solution = None
        
        i = 5
        while i < len(sys.argv):
            if sys.argv[i] == "--attempts":
                i += 1
                while i < len(sys.argv) and not sys.argv[i].startswith("--"):
                    attempts.append(sys.argv[i])
                    i += 1
            elif sys.argv[i] == "--solution":
                i += 1
                if i < len(sys.argv):
                    solution = sys.argv[i]
                    i += 1
            else:
                i += 1
        
        record_failure(task, ftype, reason, attempts, solution)
    
    elif cmd == "report":
        days = 7
        if "--days" in sys.argv:
            idx = sys.argv.index("--days")
            if idx + 1 < len(sys.argv):
                days = int(sys.argv[idx + 1])
        generate_report(days)
    
    elif cmd == "weekly":
        generate_weekly_report()
    
    else:
        print(f"❌ 未知命令: {cmd}")

if __name__ == "__main__":
    main()
