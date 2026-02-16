#!/usr/bin/env python3
"""
memory_distill.py - 将 index.json 中的 Golden 记忆蒸馏到 MEMORY.md

用途：定期同步自动编码的长期记忆到文档形式
触发：cron 每 6 小时（与 checkpoint-memory-llm.sh 同步）
"""

import json
import os
from datetime import datetime
from pathlib import Path

# 動態路徑配置
WORKSPACE = Path(os.environ.get('YUE_WORKSPACE', os.path.expanduser('~/.openclaw/workspace')))
INDEX_FILE = WORKSPACE / "subagents" / "central_memory_index.json"
MEMORY_FILE = WORKSPACE / "MEMORY.md"

def load_index():
    """加载 index.json"""
    if not INDEX_FILE.exists():
        return []
    with open(INDEX_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def extract_golden_memories(memories):
    """提取 Golden 级别的记忆"""
    golden = [m for m in memories if m.get('state') == 'Golden']
    return sorted(golden, key=lambda x: x.get('current_importance', 0), reverse=True)

def format_memory_entry(memory):
    """格式化单条记忆为 Markdown"""
    content = memory.get('content', '')
    actor = memory.get('actor', 'Unknown')
    target = memory.get('target', 'Unknown')
    importance = memory.get('current_importance', 0)
    
    return f"- [{actor}→{target}] {content} (importance: {importance:.2f})"

def distill_to_markdown(golden_memories):
    """生成 Markdown 格式的蒸馏内容"""
    if not golden_memories:
        return ""
    
    lines = [
        "\n## 🧠 自动蒸馏的 Golden 记忆（P0 - 永不淘汰）",
        f"\n**最后蒸馏时间：** {datetime.now().isoformat()}",
        "\n**来源：** brain_encode.py 自动编码 + 语义查重强化",
        "\n"
    ]
    
    for memory in golden_memories[:10]:  # 只保留前 10 条最重要的
        lines.append(format_memory_entry(memory))
    
    return "\n".join(lines)

def update_memory_file(distilled_content):
    """更新 MEMORY.md，在末尾追加蒸馏内容"""
    if not distilled_content:
        return
    
    with open(MEMORY_FILE, 'a', encoding='utf-8') as f:
        f.write(distilled_content)
        f.write("\n\n---\n\n")

def main():
    try:
        memories = load_index()
        golden = extract_golden_memories(memories)
        distilled = distill_to_markdown(golden)
        
        if distilled:
            update_memory_file(distilled)
            print(f"✅ 蒸馏完成：{len(golden)} 条 Golden 记忆已同步到 MEMORY.md")
        else:
            print("⚠️ 没有 Golden 级别的记忆需要蒸馏")
    
    except Exception as e:
        print(f"❌ 蒸馏失败：{e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())
