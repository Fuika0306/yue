#!/usr/bin/env python3
"""
神髓記憶編碼器 v2.1 - 整合 MiniLM 語義查重與調用追蹤
From: Self -> Target: Memory
"""

import json
import os
import datetime
import argparse
import sys
import fcntl
import re

# 導入語義編碼器
try:
    from sentence_transformers import SentenceTransformer, util
    SEMANTIC_AVAILABLE = True
except ImportError:
    SEMANTIC_AVAILABLE = False
    print("Warning: sentence_transformers not available, falling back to difflib")

# Constants
MEMORY_DIR = os.path.join(os.path.expanduser("~"), ".openclaw/workspace/memory")
INDEX_PATH = os.path.join(MEMORY_DIR, "index.json")
EMBEDDINGS_DIR = os.path.join(MEMORY_DIR, "embeddings")

def ensure_dirs():
    os.makedirs(MEMORY_DIR, exist_ok=True)
    os.makedirs(EMBEDDINGS_DIR, exist_ok=True)

def load_index():
    if os.path.exists(INDEX_PATH):
        try:
            with open(INDEX_PATH, 'r', encoding='utf-8') as f:
                return json.load(f)
        except json.JSONDecodeError:
            backup_path = INDEX_PATH + ".corrupt"
            if os.path.exists(backup_path):
                os.remove(backup_path)
            os.rename(INDEX_PATH, backup_path)
            print(f"Error reading {INDEX_PATH}. Corrupt file moved to {backup_path}. Initializing new index.")
    
    ensure_dirs()
    return {"memories": [], "last_sync": datetime.datetime.now().isoformat()}

def save_index(data):
    data["last_sync"] = datetime.datetime.now().isoformat()
    with open(INDEX_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def get_s_factor(domain):
    factors = {
        "World": 0.95,
        "Role": 0.995,
        "User": 1.0
    }
    return factors.get(domain, 0.95)

def parse_relation(content):
    """解析 From: Actor -> Target: Project 標籤"""
    match = re.search(r"From:\s*(\w+)\s*->\s*Target:\s*([\w/]+)", content)
    if match:
        return match.group(1), match.group(2)
    return None, None

def update_state(mem):
    """根據 current_importance 更新記憶狀態"""
    importance = mem.get("current_importance", 0.5)
    if importance >= 0.85:
        mem["state"] = "Golden"
    elif importance >= 0.50:
        mem["state"] = "Silver"
    elif importance >= 0.20:
        mem["state"] = "Bronze"
    else:
        mem["state"] = "Dust"

def get_embedding_model():
    """初始化 MiniLM 模型"""
    if SEMANTIC_AVAILABLE:
        try:
            return SentenceTransformer('all-MiniLM-L6-v2')
        except Exception as e:
            print(f"Warning: Failed to load MiniLM model: {e}")
            return None
    return None

def check_semantic_duplicate(content, memories, model, threshold=0.75):
    """
    使用 MiniLM 檢查語義重複
    Returns: (matched_memory, similarity_score) 或 (None, 0)
    """
    if not memories or model is None:
        return None, 0
    
    best_match = None
    best_score = 0
    
    try:
        query_vec = model.encode(content, convert_to_tensor=True)
        
        for mem in memories:
            mem_content = mem.get("content", "")
            if mem_content:
                mem_vec = model.encode(mem_content, convert_to_tensor=True)
                score = float(util.cos_sim(query_vec, mem_vec)[0][0])
                
                if score > best_score and score >= threshold:
                    best_score = score
                    best_match = mem
    except Exception as e:
        print(f"Warning: Semantic check failed: {e}")
        return None, 0
    
    return best_match, best_score

def encode_memory(content, actor=None, target=None, domain="Role", importance=0.5):
    """編碼記憶到 index.json"""
    lock_path = os.path.join(MEMORY_DIR, "index.lock")
    ensure_dirs()
    
    model = get_embedding_model()
    
    with open(lock_path, 'w') as lock_file:
        try:
            # 並發鎖
            fcntl.flock(lock_file, fcntl.LOCK_EX)
            index = load_index()
            
            # 自動檢測關係標籤
            auto_actor, auto_target = parse_relation(content)
            actor = actor or auto_actor or "Unknown"
            target = target or auto_target or "General"
            
            # !REMEMBER 邏輯
            if "!REMEMBER" in content:
                importance = 1.0
                domain = "User"
            
            s_factor = get_s_factor(domain)
            
            # === 語義查重（MiniLM）===
            similar_mem, similarity = check_semantic_duplicate(
                content, index["memories"], model, threshold=0.75
            )
            
            if similar_mem and similarity >= 0.75:
                # 強化現有記憶
                similar_mem["last_access"] = datetime.datetime.now().isoformat()
                similar_mem["access_count"] = similar_mem.get("access_count", 0) + 1
                
                # 動態增加 density（刻骨銘心效果）
                similar_mem["density"] = round(similar_mem.get("density", 0) + 0.2, 2)
                
                # 重要性提升（每次強化 +15%，上限 2.0）
                similar_mem["current_importance"] = min(
                    2.0, similar_mem["current_importance"] + importance * 0.15
                )
                
                # 更新狀態
                update_state(similar_mem)
                save_index(index)
                
                print(f"✓ Memory #{similar_mem['id']} Reinforced")
                print(f"  Similarity: {similarity:.2f}")
                print(f"  Access count: {similar_mem['access_count']}")
                print(f"  Density: {similar_mem['density']}")
                print(f"  Importance: {similar_mem['current_importance']:.2f}")
                print(f"  State: {similar_mem['state']}")
                
                return similar_mem
            
            else:
                # Fallback: 使用 difflib（無 MiniLM 時）
                import difflib
                for mem in index["memories"]:
                    ratio = difflib.SequenceMatcher(None, mem["content"], content).ratio()
                    if ratio > 0.95:
                        mem["last_access"] = datetime.datetime.now().isoformat()
                        mem["access_count"] = mem.get("access_count", 0) + 1
                        mem["current_importance"] = min(2.0, mem["current_importance"] + importance * 0.1)
                        update_state(mem)
                        save_index(index)
                        
                        print(f"✓ Memory #{mem['id']} Reinforced (difflib)")
                        print(f"  Similarity: {ratio:.2f}")
                        return mem
            
            # === 新記憶 ===
            density_from_len = round(len(content) / 500.0, 2)
            density_from_importance = importance * 0.8 if importance > 0.8 else 0
            initial_density = max(density_from_len, density_from_importance)
            
            # ID Logic
            max_id = 0
            if index["memories"]:
                max_id = max(m["id"] for m in index["memories"])
            
            # 初始狀態
            state = "Silver"
            if importance >= 0.85:
                state = "Golden"
            elif importance < 0.20:
                state = "Dust"
            elif importance < 0.50:
                state = "Bronze"
            
            new_memory = {
                "id": max_id + 1,
                "content": content,
                "actor": actor,
                "target": target,
                "domain": domain,
                "initial_importance": importance,
                "current_importance": importance,
                "s_factor": s_factor,
                "density": initial_density,
                "access_count": 0,
                "retrieval_count": 0,
                "last_access": datetime.datetime.now().isoformat(),
                "creation_date": datetime.datetime.now().isoformat(),
                "state": state
            }
            
            index["memories"].append(new_memory)
            save_index(index)
            
            print(f"✓ New memory #{new_memory['id']} encoded")
            print(f"  Actor: {actor} -> Target: {target}")
            print(f"  Domain: {domain} (s_factor: {s_factor})")
            print(f"  Initial density: {initial_density}")
            print(f"  State: {state}")
            
            return new_memory
        
        finally:
            fcntl.flock(lock_file, fcntl.LOCK_UN)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Octagram Brain Encode v2.1 - Semantic Edition")
    parser.add_argument("content", nargs="+", help="Content to encode")
    parser.add_argument("--actor", help="Source actor (Self|空|剀|玥|User)")
    parser.add_argument("--target", help="Target project (Core|Subagents|Task|Memory)")
    parser.add_argument("--domain", choices=["World", "Role", "User"], default="Role")
    parser.add_argument("--score", type=float, default=0.5, help="Initial importance (0.0-1.0)")
    
    args = parser.parse_args()
    content_str = " ".join(args.content)
    
    encode_memory(content_str, args.actor, args.target, args.domain, args.score)
