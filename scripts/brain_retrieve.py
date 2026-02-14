#!/usr/bin/env python3
"""
神髓記憶檢索器 v2.1 - 語義搜尋 + 調用追蹤
From: Self -> Target: Memory
"""

import json
import os
import sys
import fcntl
from datetime import datetime

try:
    from sentence_transformers import SentenceTransformer, util
    SEMANTIC_AVAILABLE = True
except ImportError:
    SEMANTIC_AVAILABLE = False
    print("Warning: sentence_transformers not available")

MEMORY_DIR = os.path.join(os.path.expanduser("~"), ".openclaw/workspace/memory")
INDEX_PATH = os.path.join(MEMORY_DIR, "index.json")

def load_index():
    if os.path.exists(INDEX_PATH):
        try:
            with open(INDEX_PATH, 'r', encoding='utf-8') as f:
                return json.load(f)
        except json.JSONDecodeError:
            return {"memories": []}
    return {"memories": []}

def save_index(data):
    data["last_sync"] = datetime.now().isoformat()
    with open(INDEX_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def get_embedding_model():
    if SEMANTIC_AVAILABLE:
        try:
            return SentenceTransformer('all-MiniLM-L6-v2')
        except Exception as e:
            print(f"Warning: Failed to load model: {e}")
            return None
    return None

def retrieve_memories(query, top_k=5, threshold=0.5):
    """
    語義搜尋記憶，並追蹤 retrieval_count
    """
    lock_path = os.path.join(MEMORY_DIR, "index.lock")
    os.makedirs(MEMORY_DIR, exist_ok=True)
    
    model = get_embedding_model()
    
    with open(lock_path, 'w') as lock_file:
        try:
            fcntl.flock(lock_file, fcntl.LOCK_EX)
            index = load_index()
            
            if not index["memories"]:
                print("No memories found.")
                return []
            
            results = []
            
            if model and SEMANTIC_AVAILABLE:
                try:
                    query_vec = model.encode(query, convert_to_tensor=True)
                    
                    for mem in index["memories"]:
                        mem_content = mem.get("content", "")
                        if mem_content:
                            mem_vec = model.encode(mem_content, convert_to_tensor=True)
                            score = float(util.cos_sim(query_vec, mem_vec)[0][0])
                            
                            if score >= threshold:
                                results.append((mem, score))
                except Exception as e:
                    print(f"Warning: Semantic search failed: {e}")
                    return []
            
            else:
                # Fallback: 簡單字符串匹配
                import difflib
                for mem in index["memories"]:
                    ratio = difflib.SequenceMatcher(None, query.lower(), mem["content"].lower()).ratio()
                    if ratio >= threshold:
                        results.append((mem, ratio))
            
            # 排序並取 top_k
            results.sort(key=lambda x: x[1], reverse=True)
            results = results[:top_k]
            
            # 更新 retrieval_count
            for mem, score in results:
                mem["retrieval_count"] = mem.get("retrieval_count", 0) + 1
                mem["last_access"] = datetime.now().isoformat()
            
            save_index(index)
            
            # 輸出結果
            print(f"✓ Found {len(results)} memories (threshold: {threshold})")
            print()
            
            for i, (mem, score) in enumerate(results, 1):
                print(f"[{i}] Memory #{mem['id']} | Score: {score:.2f}")
                print(f"    Actor: {mem['actor']} -> Target: {mem['target']}")
                print(f"    State: {mem['state']} | Importance: {mem['current_importance']:.2f}")
                print(f"    Access: {mem['access_count']} | Retrieval: {mem['retrieval_count']}")
                print(f"    Content: {mem['content'][:100]}...")
                print()
            
            return results
        
        finally:
            fcntl.flock(lock_file, fcntl.LOCK_UN)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: brain_retrieve.py <query> [--top-k 5] [--threshold 0.5]")
        sys.exit(1)
    
    query = sys.argv[1]
    top_k = 5
    threshold = 0.5
    
    # 簡單參數解析
    for i, arg in enumerate(sys.argv[2:]):
        if arg == "--top-k" and i + 2 < len(sys.argv):
            top_k = int(sys.argv[i + 3])
        elif arg == "--threshold" and i + 2 < len(sys.argv):
            threshold = float(sys.argv[i + 3])
    
    retrieve_memories(query, top_k, threshold)
