#!/usr/bin/env python3
"""
記憶衰減器 v1.1 - 實現 Silver/Bronze 時間衰減機制
改進：統一配置、日誌系統、完整錯誤處理
每日執行一次，自動降低舊記憶的重要性
"""

import json
import os
import sys
import datetime
import argparse
import fcntl
from pathlib import Path

# 導入配置和日誌
from config import Config
from logger import get_logger

logger = get_logger('memory_decay')

# 使用統一配置
MEMORY_DIR = Config.MEMORY_DIR
INDEX_PATH = Config.INDEX_PATH
SILVER_DECAY_DAYS = Config.SILVER_DECAY_DAYS
BRONZE_DECAY_DAYS = Config.BRONZE_DECAY_DAYS
DECAY_RATE = Config.DECAY_RATE
DUST_THRESHOLD = Config.DUST_THRESHOLD

def load_index():
    """載入記憶索引"""
    if not os.path.exists(INDEX_PATH):
        logger.warning(f"Index file not found: {INDEX_PATH}")
        return None
    
    try:
        with open(INDEX_PATH, 'r', encoding='utf-8') as f:
            index = json.load(f)
            logger.debug(f"Loaded index with {len(index.get('memories', []))} memories")
            return index
    except json.JSONDecodeError as e:
        logger.error(f"Index file corrupted: {e}")
        return None

def save_index(data):
    """保存記憶索引"""
    data["last_sync"] = datetime.datetime.now().isoformat()
    try:
        with open(INDEX_PATH, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        logger.debug(f"Saved index with {len(data.get('memories', []))} memories")
    except Exception as e:
        logger.error(f"Failed to save index: {e}")
        raise

def parse_date(date_str):
    """解析 ISO 格式的日期字符串"""
    try:
        return datetime.datetime.fromisoformat(date_str)
    except (ValueError, TypeError):
        return None

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

def apply_decay(dry_run=False):
    """
    應用記憶衰減
    
    衰減規則：
    - Golden: 永不衰減
    - Silver: 7 天後每天衰減 20%
    - Bronze: 30 天後每天衰減 20%
    - Dust: 自動刪除
    """
    lock_path = os.path.join(MEMORY_DIR, "index.lock")
    os.makedirs(MEMORY_DIR, exist_ok=True)
    
    with open(lock_path, 'w') as lock_file:
        try:
            fcntl.flock(lock_file, fcntl.LOCK_EX)
            
            index = load_index()
            if not index:
                return
            
            now = datetime.datetime.now()
            stats = {
                "total": len(index["memories"]),
                "decayed": 0,
                "deleted": 0,
                "unchanged": 0
            }
            
            memories_to_keep = []
            
            for mem in index.get("memories", []):
                mem_id = mem.get("id", "?")
                state = mem.get("state", "Unknown")
                old_importance = mem.get("current_importance", 0.5)
                
                # Golden 記憶永不衰減
                if state == "Golden":
                    stats["unchanged"] += 1
                    memories_to_keep.append(mem)
                    logger.debug(f"Memory #{mem_id} (Golden) unchanged")
                    continue
                
                # 計算距離上次訪問的天數
                last_access_str = mem.get("last_access")
                last_access = parse_date(last_access_str)
                
                if not last_access:
                    # 如果沒有 last_access，使用 creation_date
                    last_access_str = mem.get("creation_date")
                    last_access = parse_date(last_access_str)
                
                if not last_access:
                    # 如果都沒有，跳過
                    logger.warning(f"Memory #{mem_id} has no timestamp, skipping")
                    stats["unchanged"] += 1
                    memories_to_keep.append(mem)
                    continue
                
                days_since_access = (now - last_access).days
                
                # Silver 衰減：7 天後開始衰減
                if state == "Silver" and days_since_access >= SILVER_DECAY_DAYS:
                    # 計算衰減次數（每天衰減一次）
                    decay_times = days_since_access - SILVER_DECAY_DAYS + 1
                    new_importance = old_importance * (DECAY_RATE ** decay_times)
                    mem["current_importance"] = round(new_importance, 4)
                    update_state(mem)
                    stats["decayed"] += 1
                    
                    logger.info(f"Memory #{mem_id} (Silver) decayed: {old_importance:.4f} → {new_importance:.4f} (days: {days_since_access})")
                    memories_to_keep.append(mem)
                
                # Bronze 衰減：30 天後開始衰減
                elif state == "Bronze" and days_since_access >= BRONZE_DECAY_DAYS:
                    decay_times = days_since_access - BRONZE_DECAY_DAYS + 1
                    new_importance = old_importance * (DECAY_RATE ** decay_times)
                    mem["current_importance"] = round(new_importance, 4)
                    update_state(mem)
                    stats["decayed"] += 1
                    
                    logger.info(f"Memory #{mem_id} (Bronze) decayed: {old_importance:.4f} → {new_importance:.4f} (days: {days_since_access})")
                    memories_to_keep.append(mem)
                
                # Dust 自動刪除
                elif state == "Dust" or mem.get("current_importance", 0) < DUST_THRESHOLD:
                    stats["deleted"] += 1
                    logger.info(f"Memory #{mem_id} deleted (importance: {old_importance:.4f})")
                
                else:
                    stats["unchanged"] += 1
                    memories_to_keep.append(mem)
            
            # 更新索引
            index["memories"] = memories_to_keep
            
            if not dry_run:
                save_index(index)
            
            # 打印統計
            print(f"\n✅ 衰減完成")
            print(f"   總記憶數: {stats['total']}")
            print(f"   已衰減: {stats['decayed']}")
            print(f"   已刪除: {stats['deleted']}")
            print(f"   未變化: {stats['unchanged']}")
            
            if dry_run:
                print(f"\n⚠️  這是 DRY RUN，未實際保存任何更改")
            
            return stats
        
        finally:
            fcntl.flock(lock_file, fcntl.LOCK_UN)

def main():
    global SILVER_DECAY_DAYS, BRONZE_DECAY_DAYS
    
    parser = argparse.ArgumentParser(description="玥系統 - 記憶衰減器")
    parser.add_argument("--dry-run", action="store_true", help="模擬運行，不實際保存")
    parser.add_argument("--silver-days", type=int, default=SILVER_DECAY_DAYS, help="Silver 衰減天數")
    parser.add_argument("--bronze-days", type=int, default=BRONZE_DECAY_DAYS, help="Bronze 衰減天數")
    
    args = parser.parse_args()
    
    # 更新全局配置
    SILVER_DECAY_DAYS = args.silver_days
    BRONZE_DECAY_DAYS = args.bronze_days
    
    logger.info(f"Memory decay started")
    logger.info(f"Silver decay: {SILVER_DECAY_DAYS} days, Bronze decay: {BRONZE_DECAY_DAYS} days")
    logger.info(f"Decay rate: {DECAY_RATE * 100:.0f}%")
    
    if args.dry_run:
        logger.info("DRY RUN mode - no changes will be saved")
    
    apply_decay(dry_run=args.dry_run)

if __name__ == "__main__":
    main()
