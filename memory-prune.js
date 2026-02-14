#!/usr/bin/env node

/**
 * Memory Prune Script
 * 清理過期的 P2 (Bronze) 記憶，釋放認知空間
 * 運行時間：每天 02:00 GMT+8
 */

const fs = require('fs');
const path = require('path');

const MEMORY_DIR = path.join(__dirname, 'memory');
const INDEX_FILE = path.join(__dirname, 'subagents', 'central_memory_index.json');

// 配置
const CONFIG = {
  P1_VALID_DAYS: 90,      // Silver: 90 天有效期
  P2_VALID_DAYS: 30,      // Bronze: 30 天有效期
  DRY_RUN: false,         // 設為 true 可預覽不實際刪除
};

function getAgeInDays(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  return Math.floor((now - date) / (1000 * 60 * 60 * 24));
}

function pruneMemoryFiles() {
  console.log('🧹 開始清理過期記憶...');
  
  if (!fs.existsSync(MEMORY_DIR)) {
    console.log('❌ memory/ 目錄不存在');
    return { pruned: 0, errors: 0 };
  }

  const files = fs.readdirSync(MEMORY_DIR).filter(f => f.endsWith('.md'));
  let pruned = 0;
  let errors = 0;

  files.forEach(file => {
    const filePath = path.join(MEMORY_DIR, file);
    const stat = fs.statSync(filePath);
    const ageInDays = Math.floor((Date.now() - stat.mtimeMs) / (1000 * 60 * 60 * 24));

    // 保留核心文件
    if (['REFERENCE.md', 'handoff.md'].includes(file)) {
      return;
    }

    // 日期格式檔案：YYYY-MM-DD.md
    const dateMatch = file.match(/^(\d{4})-(\d{2})-(\d{2})\.md$/);
    if (dateMatch) {
      if (ageInDays > CONFIG.P2_VALID_DAYS) {
        console.log(`  ⏳ 清理: ${file} (${ageInDays} 天前)`);
        if (!CONFIG.DRY_RUN) {
          try {
            fs.unlinkSync(filePath);
            pruned++;
          } catch (err) {
            console.error(`  ❌ 刪除失敗: ${file}`, err.message);
            errors++;
          }
        }
      }
    }
  });

  return { pruned, errors };
}

function pruneIndexMemories() {
  console.log('🧠 開始清理索引記憶...');
  
  if (!fs.existsSync(INDEX_FILE)) {
    console.log('❌ central_memory_index.json 不存在');
    return { pruned: 0, errors: 0 };
  }

  try {
    const data = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
    let pruned = 0;

    if (data.learnings && Array.isArray(data.learnings)) {
      const originalCount = data.learnings.length;
      
      data.learnings = data.learnings.filter(learning => {
        const age = getAgeInDays(learning.date);
        if (age > CONFIG.P2_VALID_DAYS) {
          console.log(`  ⏳ 清理學習記錄: ${learning.id} (${age} 天前)`);
          pruned++;
          return false;
        }
        return true;
      });

      if (!CONFIG.DRY_RUN && pruned > 0) {
        fs.writeFileSync(INDEX_FILE, JSON.stringify(data, null, 2));
      }
    }

    return { pruned, errors: 0 };
  } catch (err) {
    console.error('❌ 索引清理失敗:', err.message);
    return { pruned: 0, errors: 1 };
  }
}

// 主程序
async function main() {
  console.log('📋 Memory Prune 開始執行');
  console.log(`⏰ 時間: ${new Date().toISOString()}`);
  console.log(`🔧 模式: ${CONFIG.DRY_RUN ? '預覽' : '實際執行'}\n`);

  const fileResult = pruneMemoryFiles();
  const indexResult = pruneIndexMemories();

  const totalPruned = fileResult.pruned + indexResult.pruned;
  const totalErrors = fileResult.errors + indexResult.errors;

  console.log(`\n✅ 清理完成`);
  console.log(`  📁 檔案清理: ${fileResult.pruned} 個`);
  console.log(`  🧠 索引清理: ${indexResult.pruned} 個`);
  console.log(`  ⚠️  錯誤: ${totalErrors} 個`);
  console.log(`  📊 總計: ${totalPruned} 個記憶已清理`);

  process.exit(totalErrors > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('💥 致命錯誤:', err);
  process.exit(1);
});
