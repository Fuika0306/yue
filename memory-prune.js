#!/usr/bin/env node

/**
 * 智能记忆淘汰脚本
 * 功能：
 * 1. 读取 MEMORY.md
 * 2. 解析 [P0/P1/P2][YYYY-MM-DD] 格式
 * 3. 淘汰超过30天的P2和超过90天的P1
 * 4. 淘汰的条目移到 archive 文件
 * 5. P0 永不删除
 * 6. 支持 --dry-run 预览模式
 */

const fs = require('fs');
const path = require('path');

const MEMORY_FILE = path.join(__dirname, 'MEMORY.md');
const ARCHIVE_DIR = path.join(__dirname, 'memory', 'archive');
const DRY_RUN = process.argv.includes('--dry-run');

// 配置
const CONFIG = {
  P0_DAYS: Infinity,      // P0 永不淘汰
  P1_DAYS: 90,            // P1 90天有效期
  P2_DAYS: 30,            // P2 30天有效期
  MAX_LINES: 200,         // 记忆文件最大行数
};

// 创建归档目录
if (!fs.existsSync(ARCHIVE_DIR)) {
  fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
}

// 解析日期
function parseDate(dateStr) {
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

// 计算天数差
function daysDiff(date1, date2) {
  const ms = date2.getTime() - date1.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

// 解析记忆行
function parseLine(line) {
  const match = line.match(/^\s*-\s*\[([P0-2])\]\[(\d{4}-\d{2}-\d{2})\]\s+(.+)$/);
  if (!match) return null;
  
  return {
    priority: match[1],
    date: parseDate(match[2]),
    content: match[3],
    original: line,
  };
}

// 判断是否应该淘汰
function shouldPrune(parsed, today) {
  if (!parsed || !parsed.date) return false;
  
  const days = daysDiff(parsed.date, today);
  
  if (parsed.priority === 'P0') return false;
  if (parsed.priority === 'P1') return days > CONFIG.P1_DAYS;
  if (parsed.priority === 'P2') return days > CONFIG.P2_DAYS;
  
  return false;
}

// 主逻辑
function prune() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (!fs.existsSync(MEMORY_FILE)) {
    console.error('❌ MEMORY.md 不存在');
    process.exit(1);
  }
  
  const content = fs.readFileSync(MEMORY_FILE, 'utf-8');
  const lines = content.split('\n');
  
  const keep = [];
  const prune_list = [];
  
  // 第一遍：分类
  for (const line of lines) {
    const parsed = parseLine(line);
    
    if (!parsed) {
      keep.push(line);
      continue;
    }
    
    if (shouldPrune(parsed, today)) {
      prune_list.push(parsed);
    } else {
      keep.push(line);
    }
  }
  
  // 第二遍：如果超过行数上限，继续淘汰最旧的 P1
  if (keep.length > CONFIG.MAX_LINES) {
    const p1_lines = keep
      .map((line, idx) => ({ line, idx, parsed: parseLine(line) }))
      .filter(item => item.parsed && item.parsed.priority === 'P1')
      .sort((a, b) => a.parsed.date - b.parsed.date);
    
    let removed = 0;
    for (const item of p1_lines) {
      if (keep.length - removed <= CONFIG.MAX_LINES) break;
      prune_list.push(item.parsed);
      removed++;
    }
    
    // 重新构建 keep 列表
    const prune_originals = new Set(prune_list.map(p => p.original));
    keep = keep.filter(line => !prune_originals.has(line));
  }
  
  // 输出预览
  console.log(`📊 记忆淘汰预览`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📝 当前行数：${lines.length} | 保留行数：${keep.length} | 淘汰条目：${prune_list.length}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  
  if (prune_list.length > 0) {
    console.log(`\n🗑️  将淘汰的条目：\n`);
    prune_list.forEach((item, idx) => {
      const days = daysDiff(item.date, today);
      console.log(`${idx + 1}. [${item.priority}][${item.date.toISOString().split('T')[0]}] (${days}天前)`);
      console.log(`   ${item.content.substring(0, 60)}${item.content.length > 60 ? '...' : ''}\n`);
    });
  } else {
    console.log(`\n✅ 没有需要淘汰的条目\n`);
  }
  
  if (DRY_RUN) {
    console.log(`\n🔍 [DRY-RUN 模式] 预览完成，未做任何修改`);
    console.log(`\n运行以下命令执行淘汰：`);
    console.log(`  node memory-prune.js\n`);
    return;
  }
  
  // 执行淘汰
  if (prune_list.length > 0) {
    // 写入归档
    const archiveFile = path.join(ARCHIVE_DIR, `pruned-${today.toISOString().split('T')[0]}.md`);
    const archiveContent = prune_list
      .map(item => `- [${item.priority}][${item.date.toISOString().split('T')[0]}] ${item.content}`)
      .join('\n');
    
    fs.appendFileSync(archiveFile, archiveContent + '\n');
    console.log(`\n✅ 已归档到：${archiveFile}`);
  }
  
  // 写回 MEMORY.md
  fs.writeFileSync(MEMORY_FILE, keep.join('\n'));
  console.log(`✅ 已更新 MEMORY.md (${keep.length} 行)\n`);
}

prune();
