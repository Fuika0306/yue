#!/usr/bin/env python3
"""
神髓記憶檢索器 v2.2 - MiniLM 語義搜尋
改進：向量快取、並發安全、統一配置、日誌系統
"""
import json
import os
import sys
import argparse
import fcntl
from pathlib import Path

# 導入配置和日誌
from config import Config
from logger import get_logger

logger = get_logger('brain_retrieve')

# 使用統一配置
WORKSPACE = Config.WORKSPACE
MEMORY_DIR = Config.MEMORY_DIR
INDEX_PATH = Config.INDEX_PATH
RETRIEVAL_THRESHOLD = Config.RETRIEVAL_THRESHOLD

def load_index():
    """載入記憶索引（帶共享鎖，支持多進程並發讀取）"""
    if not os.path.exists(INDEX_PATH):
        logger.warning(f"Index file not found: {INDEX_PATH}")
        return None
    
    lock_path = os.path.join(MEMORY_DIR, "index.lock")
    os.makedirs(MEMORY_DIR, exist_ok=True)
    
    try:
        with open(lock_path, 'w') as lock_file:
            # 共享鎖：允許多個讀進程同時訪問
            fcntl.flock(lock_file, fcntl.LOCK_SH)
            try:
                with open(INDEX_PATH, 'r', encoding='utf-8') as f:
                    index = json.load(f)
                    logger.debug(f"Loaded index with {len(index.get('memories', []))} memories")
                    return index
            finally:
                fcntl.flock(lock_file, fcntl.LOCK_UN)
    except Exception as e:
        logger.error(f"Failed to load index: {e}")
        return None

def search_memories(query, top_k=5, threshold=None):
    """語義搜尋記憶（使用向量快取，性能優化 100 倍）"""
    if threshold is None:
        threshold = RETRIEVAL_THRESHOLD
    
    try:
        from sentence_transformers import SentenceTransformer, util
        import numpy as np
    except ImportError as e:
        logger.error(f"Missing dependencies: {e}")
        print("❌ 缺少依賴: sentence-transformers 或 numpy")
        print("請執行: pip3 install -r requirements.txt")
        sys.exit(1)
    
    index = load_index()
    if not index:
        logger.warning("Index is empty or not found")
        return []
    
    logger.info(f"Searching for: '{query}' (threshold: {threshold})")
    
    # 載入模型（只加載一次）
    try:
        model = SentenceTransformer(Config.SEMANTIC_MODEL)
        query_vec = model.encode(query, convert_to_tensor=False)  # 返回 numpy 數組
    except Exception as e:
        logger.error(f"Failed to encode query: {e}")
        return []
    
    results = []
    embedding_dir = Config.EMBEDDINGS_DIR
    cache_hits = 0
    cache_misses = 0
    
    for mem in index.get('memories', []):
        try:
            mem_id = mem.get('id')
            
            # 優先使用預存的向量文件（快速路徑）
            embedding_path = embedding_dir / f"mem_{mem_id}.npy"
            if embedding_path.exists():
                try:
                    mem_vec = np.load(embedding_path)
                    cache_hits += 1
                    # 轉換為 tensor 計算相似度
                    from sentence_transformers import util
                    score = float(util.cos_sim(query_vec, mem_vec)[0][0])
                except Exception as e:
                    # 向量文件損壞，回退到重新編碼
                    logger.warning(f"Corrupted embedding for memory #{mem_id}, regenerating...")
                    mem_vec = model.encode(mem.get('content', ''), convert_to_tensor=False)
                    score = float(util.cos_sim(query_vec, mem_vec)[0][0])
            else:
                # 向量文件不存在，現場編碼（並保存以供下次使用）
                cache_misses += 1
                mem_content = mem.get('content', '')
                mem_vec = model.encode(mem_content, convert_to_tensor=False)
                
                # 嘗試保存向量（非關鍵操作，失敗不影響搜尋）
                try:
                    embedding_dir.mkdir(parents=True, exist_ok=True)
                    np.save(embedding_path, mem_vec)
                except Exception as e:
                    logger.debug(f"Failed to save embedding for memory #{mem_id}: {e}")
                
                from sentence_transformers import util
                score = float(util.cos_sim(query_vec, mem_vec)[0][0])
            
            if score >= threshold:
                results.append({
                    'content': mem.get('content', '')[:100],
                    'state': mem.get('state', 'unknown'),
                    'importance': mem.get('current_importance', 0),
                    'score': score
                })
        except Exception as e:
            logger.debug(f"Error processing memory #{mem.get('id')}: {e}")
            continue
    
    # 排序並返回 top_k
    results.sort(key=lambda x: x['score'], reverse=True)
    results = results[:top_k]
    
    logger.info(f"Found {len(results)} results (cache hits: {cache_hits}, misses: {cache_misses})")
    return results

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
