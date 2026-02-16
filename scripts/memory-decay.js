#!/usr/bin/env node

/**
 * Memory Decay System - 基於引用頻率的記憶衰減
 * 每天運行一次，清理過期的 Silver/Bronze 記憶
 */

const fs = require('fs');
const path = require('path');

const MEMORY_DIR = path.join(__dirname, '../memory');
const ARCHIVE_DIR = path.join(MEMORY_DIR, 'archive');

// 衰減規則
const DECAY_RULES = {
  GOLDEN: null, // 永不衰減
  SILVER: 90 * 24 * 60 * 60 * 1000, // 90 天
  BRONZE: 30 * 24 * 60 * 60 * 1000, // 30 天
};

/**
 * 解析記憶條目的優先級和 ref 日期
 * 格式: [LEVEL][write-date][ref: ref-date] content
 */
function parseMemoryEntry(line) {
  const match = line.match(/^\[([A-Z]+)\]\[([^\]]+)\](?:\[ref:\s*([^\]]+)\])?\s*(.*)/);
  if (!match) return null;

  const [, level, writeDate, refDate, content] = match;
  return {
    level,
    writeDate: new Date(writeDate),
    refDate: refDate ? new Date(refDate) : new Date(writeDate), // 沒有 ref 就用寫入日期
    content,
    original: line,
  };
}

/**
 * 檢查記憶是否應該被淘汰
 */
function shouldDecay(entry, now) {
  if (entry.level === 'GOLDEN') return false;

  const threshold = DECAY_RULES[entry.level];
  if (!threshold) return false;

  const ageMs = now - entry.refDate;
  return ageMs > threshold;
}

/**
 * 更新記憶的 ref 日期
 */
function updateRef(line, newRefDate) {
  const entry = parseMemoryEntry(line);
  if (!entry) return line;

  const dateStr = newRefDate.toISOString().split('T')[0];
  return `[${entry.level}][${entry.writeDate.toISOString().split('T')[0]}][ref: ${dateStr}] ${entry.content}`;
}

/**
 * 掃描並清理記憶文件
 */
function scanAndDecay() {
  if (!fs.existsSync(MEMORY_DIR)) {
    console.log('Memory directory not found');
    return;
  }

  if (!fs.existsSync(ARCHIVE_DIR)) {
    fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
  }

  const now = new Date();
  let stats = {
    scanned: 0,
    decayed: 0,
    archived: 0,
  };

  // 掃描所有 .md 文件
  const files = fs.readdirSync(MEMORY_DIR).filter(f => f.endsWith('.md'));

  files.forEach(file => {
    const filePath = path.join(MEMORY_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    const retained = [];
    const decayedLines = [];

    lines.forEach(line => {
      if (!line.trim()) {
        retained.push(line);
        return;
      }

      const entry = parseMemoryEntry(line);
      if (!entry) {
        retained.push(line);
        return;
      }

      stats.scanned++;

      if (shouldDecay(entry, now)) {
        stats.decayed++;
        decayedLines.push(line);
      } else {
        retained.push(line);
      }
    });

    // 寫回清理後的文件
    if (decayedLines.length > 0) {
      fs.writeFileSync(filePath, retained.join('\n'));

      // 歸檔衰減的記憶
      const archivePath = path.join(ARCHIVE_DIR, `${file}.${now.toISOString().split('T')[0]}`);
      fs.appendFileSync(archivePath, decayedLines.join('\n') + '\n');
      stats.archived++;
    }
  });

  console.log(`[Memory Decay] Scanned: ${stats.scanned}, Decayed: ${stats.decayed}, Archived: ${stats.archived}`);
}

/**
 * 更新記憶的 ref 日期（在記憶被引用時調用）
 */
function touchMemory(filePath, lineNumber) {
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  if (lineNumber >= lines.length) return;

  const today = new Date().toISOString().split('T')[0];
  lines[lineNumber] = updateRef(lines[lineNumber], new Date());

  fs.writeFileSync(filePath, lines.join('\n'));
}

// 主程序
if (require.main === module) {
  scanAndDecay();
}

module.exports = { scanAndDecay, touchMemory, parseMemoryEntry };
