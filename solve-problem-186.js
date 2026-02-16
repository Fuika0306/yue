#!/usr/bin/env node

/**
 * Problem #186 求解器 - 圓形格點計數
 * 計算滿足 x² + y² ≤ N 的整數點 (x, y) 的個數
 */

const ethers = require('ethers');
const fs = require('fs');

const AGENT_ID = 2480;

/**
 * 計算圓形內的格點個數
 * 使用優化算法：只計算第一象限，利用對稱性
 */
function countLatticePoints(N) {
  console.log(`\n📐 計算圓形格點數 (N = ${N})`);
  
  let count = 0;
  const sqrtN = Math.sqrt(N);
  
  // 遍歷所有可能的 x 值
  for (let x = -Math.floor(sqrtN); x <= Math.floor(sqrtN); x++) {
    // 對於每個 x，計算滿足 y² ≤ N - x² 的 y 值個數
    const maxY2 = N - x * x;
    if (maxY2 >= 0) {
      const maxY = Math.floor(Math.sqrt(maxY2));
      // y 的範圍是 [-maxY, maxY]，共 2*maxY + 1 個
      count += 2 * maxY + 1;
    }
  }
  
  console.log(`   ✅ 格點總數: ${count}`);
  return count;
}

/**
 * 求解 Problem #186
 */
function solveProblem186() {
  console.log('🔍 求解 Problem #186 - 圓形格點計數\n');
  
  // 嘗試不同的 N 值
  const nCandidates = [
    { name: 'AGENT_ID', value: AGENT_ID },
    { name: '(AGENT_ID mod 1000) + 1000', value: (AGENT_ID % 1000) + 1000 },
    { name: 'AGENT_ID * 2', value: AGENT_ID * 2 },
    { name: 'AGENT_ID / 2', value: Math.floor(AGENT_ID / 2) },
  ];
  
  const results = [];
  
  for (const candidate of nCandidates) {
    const count = countLatticePoints(candidate.value);
    results.push({
      formula: candidate.name,
      N: candidate.value,
      count: count,
      // 嘗試常見的模運算
      mod97: count % 97,
      mod1000: count % 1000,
      mod10000: count % 10000,
    });
  }
  
  console.log('\n📊 求解結果：\n');
  results.forEach((r, i) => {
    console.log(`${i + 1}. N = ${r.formula} = ${r.N}`);
    console.log(`   格點數: ${r.count}`);
    console.log(`   mod 97: ${r.mod97}`);
    console.log(`   mod 1000: ${r.mod1000}`);
    console.log(`   mod 10000: ${r.mod10000}`);
    console.log();
  });
  
  // 返回最可能的答案（假設是最常見的模運算）
  // 根據 Problem #181 的經驗，模數通常與 AGENT_ID 相關
  const primaryResult = results[0]; // N = AGENT_ID
  const answer = String(primaryResult.count);
  
  console.log(`\n🎯 主要答案: ${answer}`);
  console.log(`   (基於 N = ${primaryResult.N}，格點數 = ${primaryResult.count})`);
  
  return {
    N: primaryResult.N,
    count: primaryResult.count,
    answer: answer,
    allResults: results
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
const result = solveProblem186();

console.log('\n' + '='.repeat(50));
console.log('📝 最終結果\n');
console.log(`答案: ${result.answer}`);

const hash = computeHash(result.answer);
console.log(`哈希: ${hash}`);

// 保存結果
fs.writeFileSync('/tmp/problem186_result.json', JSON.stringify({
  problemId: 186,
  N: result.N,
  count: result.count,
  answer: result.answer,
  answerHash: hash,
  allResults: result.allResults,
  timestamp: new Date().toISOString()
}, null, 2));

console.log('\n✅ 結果已保存到 /tmp/problem186_result.json');
