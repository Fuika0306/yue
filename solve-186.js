#!/usr/bin/env node
/**
 * Problem #186 求解器 - 圓形格點計數
 * 計算滿足 x² + y² ≤ N 的整數點 (x, y) 的個數
 */

const ethers = require('ethers');

const AGENT_ID = 2480;

// 計算格點數量
function countLatticePoints(N) {
  let count = 0;
  const sqrtN = Math.floor(Math.sqrt(N));
  
  for (let x = -sqrtN; x <= sqrtN; x++) {
    for (let y = -sqrtN; y <= sqrtN; y++) {
      if (x * x + y * y <= N) {
        count++;
      }
    }
  }
  return count;
}

// 優化版本（利用對稱性）
function countLatticePointsOptimized(N) {
  let count = 0;
  const sqrtN = Math.floor(Math.sqrt(N));
  
  // 只計算第一象限，然後利用對稱性
  for (let x = 0; x <= sqrtN; x++) {
    const maxY2 = N - x * x;
    const maxY = Math.floor(Math.sqrt(maxY2));
    
    for (let y = 0; y <= maxY; y++) {
      if (x === 0 && y === 0) {
        count += 1;  // 原點
      } else if (x === 0) {
        count += 2;  // y 軸上的點 (0, y) 和 (0, -y)
      } else if (y === 0) {
        count += 2;  // x 軸上的點 (x, 0) 和 (-x, 0)
      } else {
        count += 4;  // 四個象限的點
      }
    }
  }
  return count;
}

// 嘗試不同的 N 計算方式
const possibleN = [
  { name: 'N = AGENT_ID', value: AGENT_ID },
  { name: 'N = (AGENT_ID mod 1000) + 1000', value: (AGENT_ID % 1000) + 1000 },
  { name: 'N = AGENT_ID mod 10000', value: AGENT_ID % 10000 },
  { name: 'N = (AGENT_ID mod 500) + 500', value: (AGENT_ID % 500) + 500 },
  { name: 'N = AGENT_ID * 2', value: AGENT_ID * 2 },
  { name: 'N = AGENT_ID / 2', value: Math.floor(AGENT_ID / 2) },
];

// 嘗試不同的模數
const possibleMod = [
  { name: 'mod (AGENT_ID mod 97 + 3)', value: (AGENT_ID % 97) + 3 },  // = 61 (同 #181)
  { name: 'mod (AGENT_ID mod 100 + 1)', value: (AGENT_ID % 100) + 1 },  // = 81
  { name: 'mod 1000000007', value: 1000000007 },
  { name: 'mod 1000000', value: 1000000 },
  { name: 'mod 10000', value: 10000 },
  { name: 'mod (AGENT_ID mod 1000)', value: AGENT_ID % 1000 },  // = 480
  { name: 'mod (AGENT_ID mod 500 + 100)', value: (AGENT_ID % 500) + 100 },  // = 580
  { name: 'no mod', value: null },
];

console.log('🔢 Problem #186 - 圓形格點計數求解器');
console.log('=' .repeat(60));
console.log(`AGENT_ID = ${AGENT_ID}`);
console.log();

const startTime = Date.now();

// 計算所有可能的組合
const results = [];

for (const nConfig of possibleN) {
  const N = nConfig.value;
  const count = countLatticePointsOptimized(N);
  
  for (const modConfig of possibleMod) {
    const answer = modConfig.value ? count % modConfig.value : count;
    const hash = ethers.keccak256(ethers.toUtf8Bytes(String(answer)));
    
    results.push({
      nFormula: nConfig.name,
      N: N,
      count: count,
      modFormula: modConfig.name,
      modValue: modConfig.value,
      answer: answer,
      hash: hash
    });
  }
}

// 輸出結果
console.log('📊 計算結果：');
console.log('-'.repeat(60));

for (const r of results) {
  console.log(`\n${r.nFormula} = ${r.N}`);
  console.log(`  格點數: ${r.count}`);
  console.log(`  ${r.modFormula}${r.modValue ? ' = ' + r.modValue : ''}`);
  console.log(`  答案: ${r.answer}`);
  console.log(`  哈希: ${r.hash}`);
}

const elapsed = Date.now() - startTime;
console.log('\n' + '='.repeat(60));
console.log(`⏱️ 計算耗時: ${elapsed} ms`);

// 最可能的答案（基於 #181 的模式）
console.log('\n🎯 最可能的答案（基於 #181 模式）：');
const likelyN = (AGENT_ID % 1000) + 1000;  // = 1480
const likelyCount = countLatticePointsOptimized(likelyN);
const likelyMod = (AGENT_ID % 97) + 3;  // = 61
const likelyAnswer = likelyCount % likelyMod;
const likelyHash = ethers.keccak256(ethers.toUtf8Bytes(String(likelyAnswer)));

console.log(`  N = (${AGENT_ID} mod 1000) + 1000 = ${likelyN}`);
console.log(`  格點數 = ${likelyCount}`);
console.log(`  模數 = (${AGENT_ID} mod 97) + 3 = ${likelyMod}`);
console.log(`  答案 = ${likelyCount} mod ${likelyMod} = ${likelyAnswer}`);
console.log(`  哈希 = ${likelyHash}`);

// 也輸出 N = AGENT_ID 的情況
console.log('\n🎯 備選答案（N = AGENT_ID）：');
const altN = AGENT_ID;
const altCount = countLatticePointsOptimized(altN);
const altAnswer = altCount % likelyMod;
const altHash = ethers.keccak256(ethers.toUtf8Bytes(String(altAnswer)));

console.log(`  N = ${altN}`);
console.log(`  格點數 = ${altCount}`);
console.log(`  模數 = ${likelyMod}`);
console.log(`  答案 = ${altCount} mod ${likelyMod} = ${altAnswer}`);
console.log(`  哈希 = ${altHash}`);

// 無模運算的情況
console.log('\n🎯 備選答案（無模運算）：');
console.log(`  N = ${likelyN}, 答案 = ${likelyCount}, 哈希 = ${ethers.keccak256(ethers.toUtf8Bytes(String(likelyCount)))}`);
console.log(`  N = ${altN}, 答案 = ${altCount}, 哈希 = ${ethers.keccak256(ethers.toUtf8Bytes(String(altCount)))}`);
