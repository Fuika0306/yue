#!/usr/bin/env node

/**
 * AgentCoin 求解器 - Node.js 版本
 * 支持數學、邏輯、字符串類型的問題
 */

const ethers = require('ethers');

const AGENT_ID = 2480;

class ProblemSolver {
  static parseTemplate(template) {
    return template.replace(/{AGENT_ID}/g, String(AGENT_ID));
  }

  static detectType(template) {
    const lower = template.toLowerCase();
    
    if (/sequence|sum|digit|modulo|mod|fibonacci|arithmetic/.test(lower)) {
      return "math";
    } else if (/count|how many|condition|satisfy|logic/.test(lower)) {
      return "logic";
    } else if (/string|character|length|replace|concat/.test(lower)) {
      return "string";
    }
    return "generic";
  }

  static solveMath(template) {
    // 數字和序列問題
    if (/sequence/.test(template) && /digit/.test(template)) {
      // 提取 N 的計算
      const match = template.match(/N\s*=\s*\(AGENT_ID\s+mod\s+(\d+)\)\s*\+\s*(\d+)/);
      if (match) {
        const modVal = parseInt(match[1]);
        const addVal = parseInt(match[2]);
        const N = (AGENT_ID % modVal) + addVal;
        
        // 生成序列：a_1 = N, a_{k+1} = a_k + sum_of_digits(a_k)
        const sequence = [N];
        for (let i = 0; i < 9; i++) {
          const current = sequence[sequence.length - 1];
          const digitSum = String(current).split('').reduce((sum, d) => sum + parseInt(d), 0);
          sequence.push(current + digitSum);
        }
        
        // 計算和
        const S = sequence.reduce((a, b) => a + b, 0);
        
        // 提取模數
        const modMatch = template.match(/mod\s*\(AGENT_ID\s+mod\s+(\d+)\s*\+\s*(\d+)\)/);
        if (modMatch) {
          const modBase = parseInt(modMatch[1]);
          const modAdd = parseInt(modMatch[2]);
          const modulo = (AGENT_ID % modBase) + modAdd;
          const answer = S % modulo;
          return String(answer);
        }
      }
    }
    
    return null;
  }

  static solveLogic(template) {
    // 待實現
    return null;
  }

  static solveString(template) {
    // 待實現
    return null;
  }

  static solve(template) {
    const parsed = this.parseTemplate(template);
    const type = this.detectType(parsed);
    
    if (type === "math") {
      return this.solveMath(parsed);
    } else if (type === "logic") {
      return this.solveLogic(parsed);
    } else if (type === "string") {
      return this.solveString(parsed);
    }
    
    return null;
  }

  static computeHash(answer) {
    const answerStr = String(answer);
    return ethers.keccak256(ethers.toUtf8Bytes(answerStr));
  }
}

// 測試
if (require.main === module) {
  const template181 = `Given AGENT_ID = {AGENT_ID}, let N = (AGENT_ID mod 1000) + 1000.
Consider the sequence defined by a₁ = N, and for k ≥ 1,
a_{k+1} = a_k + sum of digits of a_k in base 10.
Let S be the sum of the first 10 terms of this sequence.
Compute S mod (AGENT_ID mod 97 + 3).`;

  console.log('🧪 測試 Problem #181');
  console.log(`類型: ${ProblemSolver.detectType(template181)}`);
  
  const answer = ProblemSolver.solve(template181);
  console.log(`答案: ${answer}`);
  
  if (answer === "57") {
    console.log('✅ 答案正確！');
    
    const hash = ProblemSolver.computeHash(answer);
    console.log(`哈希: ${hash}`);
    
    const expectedHash = "0x04c903a1756f0f4dc625215a1050ebb816eb6481ff5eda29bbd6764b48356a17";
    if (hash === expectedHash) {
      console.log('✅ 哈希驗證成功！');
    } else {
      console.log(`⚠️  哈希不匹配`);
      console.log(`  期望: ${expectedHash}`);
      console.log(`  實際: ${hash}`);
    }
  } else {
    console.log(`❌ 答案錯誤（期望 57，得到 ${answer}）`);
  }
}

module.exports = ProblemSolver;
