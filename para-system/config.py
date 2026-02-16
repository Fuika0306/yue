#!/usr/bin/env python3
"""
玥系統配置管理 - 集中管理所有配置參數
"""

import os
from pathlib import Path

class Config:
    """系統配置"""
    
    # 工作目錄
    WORKSPACE = Path(os.environ.get('YUE_WORKSPACE', os.path.expanduser('~/.openclaw/workspace')))
    MEMORY_DIR = WORKSPACE / 'memory'
    INDEX_PATH = MEMORY_DIR / 'index.json'
    EMBEDDINGS_DIR = MEMORY_DIR / 'embeddings'
    LOGS_DIR = WORKSPACE / 'logs'
    
    # 模型配置
    SEMANTIC_MODEL = 'sentence-transformers/all-MiniLM-L6-v2'
    VECTOR_DIMENSION = 384  # MiniLM 向量維度
    
    # 相似度閾值
    SIMILARITY_THRESHOLD = 0.85  # 查重閾值
    RETRIEVAL_THRESHOLD = 0.5    # 檢索閾值
    
    # 記憶衰減配置
    SILVER_DECAY_DAYS = 7        # Silver 衰減天數
    BRONZE_DECAY_DAYS = 30       # Bronze 衰減天數
    DECAY_RATE = 0.8             # 衰減率（80% = 衰減 20%）
    DUST_THRESHOLD = 0.05        # Dust 刪除閾值
    
    # 記憶狀態閾值
    GOLDEN_THRESHOLD = 0.85
    SILVER_THRESHOLD = 0.50
    BRONZE_THRESHOLD = 0.20
    
    # 記憶強化配置
    REINFORCEMENT_BOOST = 0.15   # 每次強化增加 15%
    MAX_IMPORTANCE = 2.0         # 重要性上限
    DENSITY_BOOST = 0.2          # 每次強化增加 density
    MAX_DENSITY = 5.0            # density 上限
    
    # 日誌配置
    LOG_LEVEL = 'INFO'           # DEBUG, INFO, WARNING, ERROR
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    LOG_DATE_FORMAT = '%Y-%m-%d %H:%M:%S'
    
    # 並發配置
    LOCK_TIMEOUT = 30            # 文件鎖超時（秒）
    
    @classmethod
    def ensure_dirs(cls):
        """確保所有必要的目錄存在"""
        cls.MEMORY_DIR.mkdir(parents=True, exist_ok=True)
        cls.EMBEDDINGS_DIR.mkdir(parents=True, exist_ok=True)
        cls.LOGS_DIR.mkdir(parents=True, exist_ok=True)
    
    @classmethod
    def to_dict(cls):
        """返回配置字典"""
        return {
            'WORKSPACE': str(cls.WORKSPACE),
            'MEMORY_DIR': str(cls.MEMORY_DIR),
            'INDEX_PATH': str(cls.INDEX_PATH),
            'EMBEDDINGS_DIR': str(cls.EMBEDDINGS_DIR),
            'LOGS_DIR': str(cls.LOGS_DIR),
            'SEMANTIC_MODEL': cls.SEMANTIC_MODEL,
            'VECTOR_DIMENSION': cls.VECTOR_DIMENSION,
            'SIMILARITY_THRESHOLD': cls.SIMILARITY_THRESHOLD,
            'RETRIEVAL_THRESHOLD': cls.RETRIEVAL_THRESHOLD,
            'SILVER_DECAY_DAYS': cls.SILVER_DECAY_DAYS,
            'BRONZE_DECAY_DAYS': cls.BRONZE_DECAY_DAYS,
            'DECAY_RATE': cls.DECAY_RATE,
            'DUST_THRESHOLD': cls.DUST_THRESHOLD,
        }
