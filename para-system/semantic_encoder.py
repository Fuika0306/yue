#!/usr/bin/env python3
"""
神髓語義編碼器 - MiniLM 集成版本
"""

import json
import os
import numpy as np
from pathlib import Path

class SemanticEncoder:
    def __init__(self, model_name="sentence-transformers/all-MiniLM-L6-v2"):
        try:
            from sentence_transformers import SentenceTransformer
            self.model = SentenceTransformer(model_name)
            self.available = True
        except ImportError:
            print("Warning: sentence-transformers not available")
            self.available = False
            self.model = None
    
    def encode(self, text):
        """编码文本为向量"""
        if not self.available or self.model is None:
            return None
        return self.model.encode(text, convert_to_tensor=False)
    
    def save_embedding(self, memory_id, content):
        """保存嵌入向量"""
        if not self.available:
            return
        
        embedding_dir = Path.home() / ".openclaw/workspace/memory/embeddings"
        embedding_dir.mkdir(parents=True, exist_ok=True)
        
        vec = self.encode(content)
        if vec is not None:
            np.save(embedding_dir / f"mem_{memory_id}.npy", vec)
    
    def _get_memory_embedding(self, memory):
        """获取记忆的嵌入向量"""
        memory_id = memory.get("id")
        embedding_path = Path.home() / ".openclaw/workspace/memory/embeddings" / f"mem_{memory_id}.npy"
        
        if embedding_path.exists():
            return np.load(embedding_path)
        return None
