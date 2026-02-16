#!/usr/bin/env python3
"""
玥系統日誌管理 - 統一的分級日誌系統
"""

import logging
import sys
from pathlib import Path
from config import Config

class LoggerManager:
    """日誌管理器"""
    
    _loggers = {}
    
    @classmethod
    def get_logger(cls, name, log_file=None):
        """獲取或創建日誌記錄器"""
        if name in cls._loggers:
            return cls._loggers[name]
        
        # 確保日誌目錄存在
        Config.ensure_dirs()
        
        # 創建日誌記錄器
        logger = logging.getLogger(name)
        logger.setLevel(logging.DEBUG)
        
        # 移除已有的處理器（避免重複）
        logger.handlers.clear()
        
        # 控制台處理器（INFO 級別）
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.INFO)
        console_formatter = logging.Formatter(
            '%(levelname)s - %(message)s'
        )
        console_handler.setFormatter(console_formatter)
        logger.addHandler(console_handler)
        
        # 文件處理器（DEBUG 級別）
        if log_file is None:
            log_file = Config.LOGS_DIR / f"{name}.log"
        
        try:
            file_handler = logging.FileHandler(log_file, encoding='utf-8')
            file_handler.setLevel(logging.DEBUG)
            file_formatter = logging.Formatter(Config.LOG_FORMAT, Config.LOG_DATE_FORMAT)
            file_handler.setFormatter(file_formatter)
            logger.addHandler(file_handler)
        except Exception as e:
            logger.warning(f"Failed to create file handler for {log_file}: {e}")
        
        cls._loggers[name] = logger
        return logger

# 便捷函數
def get_logger(name):
    """獲取日誌記錄器"""
    return LoggerManager.get_logger(name)

# 預定義的日誌記錄器
brain_encode_logger = get_logger('brain_encode')
brain_retrieve_logger = get_logger('brain_retrieve')
memory_decay_logger = get_logger('memory_decay')
semantic_encoder_logger = get_logger('semantic_encoder')
