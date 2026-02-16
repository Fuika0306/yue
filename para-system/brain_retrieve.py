#!/usr/bin/env python3
"""
神髓記憶檢索器 v2.1 - MiniLM 語義搜尋
"""
import json
import os
import sys
import argparse
from pathlib import Path

# 動態路徑配置
WORKSPACE = os.environ.get('YUE_WORKSPACE', os.path.expanduser('~/.openclaw/workspace'))
MEMORY_DIR = os.path.join(WORKSPACE, 'memory')
INDEX_PATH = os.path.join(MEMORY_DIR, 'index.json')

def load_index():
    """載入記憶索引"""
    if not os.path.exists(INDEX_PATH):
        print(f"❌ 索引文件不存在: {INDEX_PATH}")
        return None
    
    try:
        with open(INDEX_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"❌ 載入索引失敗: {e}")
        return None

def search_memories(query, top_k=5, threshold=0.5):
    """語義搜尋記憶"""
    try:
        from sentence_transformers import SentenceTransformer, util
    except ImportError:
        print("❌ 缺少依賴: sentence-transformers")
        print("請執行: pip3 install -r requirements.txt")
        sys.exit(1)
    
    index = load_index()
    if not index:
        return []
    
    # 載入模型
    model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
    query_vec = model.encode(query, convert_to_tensor=True)
    
    results = []
    for mem in index.get('memories', []):
        try:
            # 對記憶內容編碼
            mem_vec = model.encode(mem.get('content', ''), convert_to_tensor=True)
            score = float(util.cos_sim(query_vec, mem_vec)[0][0])
            
            if score >= threshold:
                results.append({
                    'content': mem.get('content', '')[:100],
                    'state': mem.get('state', 'unknown'),
                    'importance': mem.get('current_importance', 0),
                    'score': score
                })
        except Exception as e:
            continue
    
    # 排序並返回 top_k
    results.sort(key=lambda x: x['score'], reverse=True)
    return results[:top_k]

def main():
    parser = argparse.ArgumentParser(description="玥系統 - 記憶檢索")
    parser.add_argument("query", nargs="+", help="搜尋查詢")
    parser.add_argument("--top-k", type=int, default=5, help="返回結果數量")
    parser.add_argument("--threshold", type=float, default=0.5, help="相似度閾值")
    
    args = parser.parse_args()
    query = " ".join(args.query)
    
    print(f"\n🔍 搜尋記憶: '{query}'\n")
    
    results = search_memories(query, args.top_k, args.threshold)
    
    if not results:
        print("❌ 未找到相關記憶")
        return
    
    print(f"✅ 找到 {len(results)} 條相關記憶\n")
    for i, mem in enumerate(results, 1):
        print(f"{i}. [相似度 {mem['score']:.2f}] {mem['content']}...")
        print(f"   狀態: {mem['state']} | 重要性: {mem['importance']:.2f}\n")

if __name__ == "__main__":
    main()
