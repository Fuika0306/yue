#!/bin/bash

echo "🧪 測試玥系統..."
echo ""

# 1. 檢查 Python 依賴
echo "1. 檢查 Python 依賴..."
python3 -c "import sentence_transformers; import numpy; print('✅ Python 依賴正常')" 2>/dev/null || echo "❌ Python 依賴缺失"

# 2. 檢查記憶編碼
echo "2. 測試記憶編碼..."
python3 para-system/brain_encode.py "測試記憶" --score 0.8 2>/dev/null && echo "✅ 記憶編碼正常" || echo "❌ 記憶編碼失敗"

# 3. 檢查記憶檢索
echo "3. 測試記憶檢索..."
python3 para-system/brain_retrieve.py "測試" 2>/dev/null && echo "✅ 記憶檢索正常" || echo "❌ 記憶檢索失敗"

# 4. 檢查文件完整性
echo "4. 檢查核心文件..."
for file in MEMORY.md SOUL.md USER.md handoff.md IDENTITY.md TOOLS.md; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file 缺失"
  fi
done

# 5. 檢查 Python 腳本
echo "5. 檢查 Python 腳本..."
for file in para-system/brain_encode.py para-system/brain_retrieve.py para-system/semantic_encoder.py; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file 缺失"
  fi
done

# 6. 檢查 Shell 腳本
echo "6. 檢查 Shell 腳本..."
for file in para-system/daily-summary.sh para-system/nightly-deep-analysis.sh para-system/checkpoint-memory-llm.sh; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file 缺失"
  fi
done

# 7. 檢查配置文件
echo "7. 檢查配置文件..."
for file in requirements.txt package.json .gitignore; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file 缺失"
  fi
done

echo ""
echo "✅ 系統測試完成"
