#!/usr/bin/env python3
"""
向量檢索驗證 - 定期檢查檢索結果的完整性
用途：手動驗證 embedding 搜索是否漏掉相關記憶
"""

import json
import sys
from pathlib import Path
from datetime import datetime

MEMORY_DIR = Path(__file__).parent.parent / "memory"
EMBEDDINGS_DIR = MEMORY_DIR / "embeddings"

def verify_retrieval(query, expected_keywords=None):
    """驗證檢索結果"""
    
    print("\n" + "="*60)
    print("🔍 向量檢索驗證")
    print("="*60)
    print(f"\n查詢: {query}")
    
    if expected_keywords:
        print(f"預期關鍵詞: {', '.join(expected_keywords)}")
    
    print("\n📋 驗證步驟：")
    print("1. 手動掃描 memory/ 目錄下的所有 .md 文件")
    print("2. 找出與查詢相關的記憶")
    print("3. 與系統返回的結果對比")
    print("4. 記錄漏掉的相關記憶")
    
    print("\n" + "-"*60)
    print("📁 掃描記憶文件...")
    print("-"*60)
    
    # 列出所有記憶文件
    md_files = list(MEMORY_DIR.glob("*.md")) + list(MEMORY_DIR.glob("*/*.md"))
    
    if not md_files:
        print("❌ 找不到記憶文件")
        return
    
    print(f"\n找到 {len(md_files)} 個記憶文件：\n")
    
    for i, f in enumerate(md_files[:20], 1):  # 只顯示前 20 個
        rel_path = f.relative_to(MEMORY_DIR)
        size = f.stat().st_size
        print(f"{i:2}. {rel_path} ({size} bytes)")
    
    if len(md_files) > 20:
        print(f"... 還有 {len(md_files) - 20} 個文件")
    
    print("\n" + "-"*60)
    print("✅ 驗證清單")
    print("-"*60)
    print("""
請手動檢查：

1. 【必做】掃描上面列出的文件，找出與查詢相關的記憶
   - 打開相關文件，看內容是否與查詢相關
   - 記錄找到的相關記憶

2. 【對比】與系統返回的結果對比
   - 系統漏掉了哪些相關記憶？
   - 系統返回了哪些不相關的結果？

3. 【記錄】將驗證結果保存到 memory/retrieval-audit.json

驗證結果格式：
{
  "timestamp": "2026-02-16T12:00:00",
  "query": "查詢內容",
  "expected_keywords": ["關鍵詞1", "關鍵詞2"],
  "system_results": [
    {"file": "memory/xxx.md", "score": 0.85, "relevant": true}
  ],
  "manual_findings": [
    {"file": "memory/yyy.md", "reason": "包含相關內容", "missed": true}
  ],
  "summary": "系統漏掉了 X 個相關記憶，誤判了 Y 個不相關結果"
}
    """)
    
    print("="*60 + "\n")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("用法: python3 verify-retrieval.py <query> [keyword1] [keyword2] ...")
        print("例子: python3 verify-retrieval.py '記憶系統' 衰減 Silver Bronze")
        sys.exit(1)
    
    query = sys.argv[1]
    keywords = sys.argv[2:] if len(sys.argv) > 2 else None
    
    verify_retrieval(query, keywords)
