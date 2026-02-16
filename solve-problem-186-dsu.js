#!/usr/bin/env node

/**
 * Problem #186 求解器 - 電話網絡連通性
 * Project Euler Problem 186
 * 
 * 使用 Disjoint-Set Union (DSU) 找出何時 99% 用戶連接到總理網絡
 */

const ethers = require('ethers');
const fs = require('fs');

const AGENT_ID = 2480;
const TOTAL_USERS = 1000000;
const TARGET_CONNECTED = 990000; // 99% of 1,000,000
const PM_NUMBER = 524287;

/**
 * Lagged Fibonacci Generator
 */
class FibonacciGenerator {
  constructor() {
    this.s = new Array(55);
    this.k = 0;
    this.initializeSequence();
  }

  initializeSequence() {
    // 初始化 s[-54] 到 s[0]
    for (let i = -54; i <= 0; i++) {
      const val = (100003 - 200003 * i + 300007 * i * i * i) % 1000000;
      this.s[(i + 55) % 55] = val;
    }
  }

  next() {
    // s[k] = (s[k-24] + s[k-55]) mod 10^6
    const idx = this.k % 55;
    const prev24 = (this.k - 24 + 55) % 55;
    const prev55 = (this.k - 55 + 55) % 55;
    
    this.s[idx] = (this.s[prev24] + this.s[prev55]) % 1000000;
    this.k++;
    
    return this.s[idx];
  }
}

/**
 * Disjoint-Set Union (Union-Find)
 */
class DSU {
  constructor(n) {
    this.parent = new Array(n);
    this.size = new Array(n).fill(1);
    
    for (let i = 0; i < n; i++) {
      this.parent[i] = i;
    }
  }

  find(x) {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x]); // 路徑壓縮
    }
    return this.parent[x];
  }

  union(x, y) {
    const px = this.find(x);
    const py = this.find(y);
    
    if (px === py) {
      return false; // 已在同一分量
    }
    
    // 按大小合併（啟發式合併）
    if (this.size[px] < this.size[py]) {
      this.parent[px] = py;
      this.size[py] += this.size[px];
    } else {
      this.parent[py] = px;
      this.size[px] += this.size[py];
    }
    
    return true;
  }

  getComponentSize(x) {
    return this.size[this.find(x)];
  }
}

/**
 * 求解 Problem #186
 */
function solveProblem186() {
  console.log('🔍 求解 Problem #186 - 電話網絡連通性\n');
  
  const startTime = Date.now();
  
  // 初始化
  const dsu = new DSU(TOTAL_USERS);
  const fib = new FibonacciGenerator();
  
  let successfulCalls = 0;
  let callAttempts = 0;
  
  console.log(`📊 目標: 連接 ${TARGET_CONNECTED} 個用戶到總理 (${PM_NUMBER})`);
  console.log(`⏳ 開始模擬通話...\n`);
  
  // 模擬通話
  while (true) {
    const caller = fib.next();
    const called = fib.next();
    callAttempts++;
    
    // 只有當 caller ≠ called 時才是成功通話
    if (caller !== called) {
      dsu.union(caller, called);
      successfulCalls++;
    }
    
    // 每 100,000 次嘗試檢查一次進度
    if (callAttempts % 100000 === 0) {
      const pmComponent = dsu.getComponentSize(PM_NUMBER);
      const progress = (pmComponent / TARGET_CONNECTED * 100).toFixed(2);
      console.log(`   嘗試: ${callAttempts} | 成功通話: ${successfulCalls} | 總理分量: ${pmComponent} (${progress}%)`);
    }
    
    // 檢查是否達到目標
    const pmComponentSize = dsu.getComponentSize(PM_NUMBER);
    if (pmComponentSize >= TARGET_CONNECTED) {
      console.log(`\n✅ 達到目標！`);
      console.log(`   成功通話: ${successfulCalls}`);
      console.log(`   總理分量大小: ${pmComponentSize}`);
      break;
    }
    
    // 安全檢查：防止無限循環
    if (callAttempts > 10000000) {
      console.log('⚠️  達到最大嘗試次數');
      break;
    }
  }
  
  const elapsed = Date.now() - startTime;
  
  console.log(`\n⏱️  計算耗時: ${elapsed} ms`);
  
  return {
    answer: successfulCalls,
    pmComponentSize: dsu.getComponentSize(PM_NUMBER),
    callAttempts: callAttempts,
    elapsed: elapsed
  };
}

/**
 * 計算答案哈希
 */
function computeHash(answer) {
  const answerStr = String(answer);
  return ethers.keccak256(ethers.toUtf8Bytes(answerStr));
}

// 執行求解
console.log('🚀 Problem #186 求解器\n');
console.log('=' .repeat(50));

const result = solveProblem186();

console.log('\n' + '='.repeat(50));
console.log('📝 最終結果\n');
console.log(`答案: ${result.answer}`);
console.log(`總理分量大小: ${result.pmComponentSize}`);
console.log(`通話嘗試: ${result.callAttempts}`);

const hash = computeHash(result.answer);
console.log(`\n哈希: ${hash}`);

// 保存結果
fs.writeFileSync('/tmp/problem186_dsu_result.json', JSON.stringify({
  problemId: 186,
  answer: result.answer,
  pmComponentSize: result.pmComponentSize,
  callAttempts: result.callAttempts,
  answerHash: hash,
  elapsed: result.elapsed,
  timestamp: new Date().toISOString()
}, null, 2));

console.log('\n✅ 結果已保存到 /tmp/problem186_dsu_result.json');
