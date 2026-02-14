#!/usr/bin/env python3

"""
Brain Server - 記憶向量服務
常駐後台運行，把 MiniLM 模型保持在記憶體中
其他腳本透過 HTTP 請求來編碼和檢索
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import json
import os
from typing import List, Dict, Any
import logging

# 配置日誌
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Brain Server", version="1.0")

# 全局模型（啟動時加載一次）
model = None

class EncodeRequest(BaseModel):
    texts: List[str]

class EncodeResponse(BaseModel):
    embeddings: List[List[float]]
    count: int

class RetrieveRequest(BaseModel):
    query: str
    memories: List[Dict[str, Any]]
    top_k: int = 5
    threshold: float = 0.5

class RetrieveResponse(BaseModel):
    results: List[Dict[str, Any]]
    count: int

@app.on_event("startup")
async def startup_event():
    """啟動時加載模型"""
    global model
    logger.info("🧠 Brain Server 啟動中...")
    try:
        model = SentenceTransformer('all-MiniLM-L6-v2')
        logger.info("✅ 向量模型已加載到記憶體")
    except Exception as e:
        logger.error(f"❌ 模型加載失敗: {e}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """關閉時清理"""
    logger.info("🛑 Brain Server 關閉中...")

@app.get("/health")
async def health_check():
    """健康檢查"""
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "service": "Brain Server v1.0"
    }

@app.post("/encode", response_model=EncodeResponse)
async def encode(request: EncodeRequest):
    """
    編碼文本為向量
    
    輸入：
    {
        "texts": ["文本1", "文本2", ...]
    }
    
    輸出：
    {
        "embeddings": [[...], [...], ...],
        "count": 2
    }
    """
    if model is None:
        raise HTTPException(status_code=503, detail="模型未加載")
    
    try:
        embeddings = model.encode(request.texts, convert_to_tensor=False)
        return EncodeResponse(
            embeddings=embeddings.tolist(),
            count=len(request.texts)
        )
    except Exception as e:
        logger.error(f"編碼失敗: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/retrieve", response_model=RetrieveResponse)
async def retrieve(request: RetrieveRequest):
    """
    檢索相似的記憶
    
    輸入：
    {
        "query": "查詢文本",
        "memories": [
            {"id": 1, "content": "記憶1"},
            {"id": 2, "content": "記憶2"},
            ...
        ],
        "top_k": 5,
        "threshold": 0.5
    }
    
    輸出：
    {
        "results": [
            {"id": 1, "content": "記憶1", "score": 0.85},
            ...
        ],
        "count": 3
    }
    """
    if model is None:
        raise HTTPException(status_code=503, detail="模型未加載")
    
    try:
        # 編碼查詢
        query_embedding = model.encode(request.query, convert_to_tensor=False)
        
        # 編碼所有記憶
        memory_contents = [m.get("content", "") for m in request.memories]
        memory_embeddings = model.encode(memory_contents, convert_to_tensor=False)
        
        # 計算相似度
        from sklearn.metrics.pairwise import cosine_similarity
        similarities = cosine_similarity([query_embedding], memory_embeddings)[0]
        
        # 排序並篩選
        results = []
        for idx, score in enumerate(similarities):
            if score >= request.threshold:
                result = request.memories[idx].copy()
                result["score"] = float(score)
                results.append(result)
        
        # 按相似度排序，取 top_k
        results.sort(key=lambda x: x["score"], reverse=True)
        results = results[:request.top_k]
        
        return RetrieveResponse(
            results=results,
            count=len(results)
        )
    except Exception as e:
        logger.error(f"檢索失敗: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/batch-encode")
async def batch_encode(request: EncodeRequest):
    """
    批量編碼（支持大量文本）
    """
    if model is None:
        raise HTTPException(status_code=503, detail="模型未加載")
    
    try:
        embeddings = model.encode(request.texts, convert_to_tensor=False, batch_size=32)
        return {
            "embeddings": embeddings.tolist(),
            "count": len(request.texts),
            "batch_size": 32
        }
    except Exception as e:
        logger.error(f"批量編碼失敗: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    logger.info("🚀 Brain Server 啟動在 http://localhost:8000")
    logger.info("📚 API 文檔：http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000)
