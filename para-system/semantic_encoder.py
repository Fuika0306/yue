#!/usr/bin/env python3
"""
神髓語義編碼器 - MiniLM 集成版本
改進：完整的錯誤處理、日誌記錄、向量驗證
"""

import json
import os
import numpy as np
from pathlib import Path

# 導入配置和日誌
from config import Config
from logger import get_logger

logger = get_logger('semantic_encoder')

class SemanticEncoder:
    def __init__(self, model_name=None):
        if model_name is None:
            model_name = Config.SEMANTIC_MODEL
        
        try:
            from sentence_transformers import SentenceTransformer
            self.model = SentenceTransformer(model_name)
            self.available = True
            self.model_name = model_name
            logger.info(f"Loaded model: {model_name}")
        except ImportError as e:
            logger.warning(f"sentence-transformers not available ({e})")
            self.available = False
            self.model = None
            self.model_name = model_name
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            self.available = False
            self.model = None
            self.model_name = model_name
    
    def encode(self, text):
        """編碼文本為向量"""
        if not self.available or self.model is None:
            logger.warning("Model not available for encoding")
            return None
        
        if not text or not isinstance(text, str):
            logger.warning("Invalid text input for encoding")
            return None
        
        try:
            vec = self.model.encode(text, convert_to_tensor=False)
            logger.debug(f"Encoded text ({len(text)} chars) to vector (dim: {len(vec)})")
            return vec
        except Exception as e:
            logger.error(f"Error encoding text: {e}")
            return None
    
    def save_embedding(self, memory_id, content):
        """保存嵌入向量"""
        if not self.available:
            logger.warning("Model not available, cannot save embedding")
            return False
        
        if not memory_id or not content:
            logger.warning("Missing memory_id or content for embedding")
            return False
        
        try:
            embedding_dir = Config.EMBEDDINGS_DIR
            embedding_dir.mkdir(parents=True, exist_ok=True)
            
            vec = self.encode(content)
            if vec is None:
                logger.error(f"Failed to encode memory #{memory_id}")
                return False
            
            # 驗證向量維度
            if len(vec) != Config.VECTOR_DIMENSION:
                logger.warning(f"Unexpected vector dimension {len(vec)} for memory #{memory_id} (expected {Config.VECTOR_DIMENSION})")
            
            embedding_path = embedding_dir / f"mem_{memory_id}.npy"
            np.save(embedding_path, vec)
            logger.debug(f"Saved embedding for memory #{memory_id}")
            return True
        
        except Exception as e:
            logger.error(f"Error saving embedding for memory #{memory_id}: {e}")
            return False
    
    def _get_memory_embedding(self, memory):
        """獲取記憶的嵌入向量"""
        if not memory or not isinstance(memory, dict):
            logger.warning("Invalid memory object")
            return None
        
        memory_id = memory.get("id")
        if not memory_id:
            logger.warning("Memory missing ID")
            return None
        
        try:
            embedding_dir = Config.EMBEDDINGS_DIR
            embedding_path = embedding_dir / f"mem_{memory_id}.npy"
            
            if not embedding_path.exists():
                logger.debug(f"Embedding not found for memory #{memory_id}")
                return None
            
            vec = np.load(embedding_path)
            
            # 驗證向量
            if vec is None or len(vec) == 0:
                logger.error(f"Corrupted embedding for memory #{memory_id}")
                return None
            
            logger.debug(f"Loaded embedding for memory #{memory_id}")
            return vec
        
        except Exception as e:
            logger.error(f"Error loading embedding for memory #{memory_id}: {e}")
            return None
