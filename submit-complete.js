#!/usr/bin/env node

/**
 * AgentCoin 完整提交流程
 * 包括：求解 → 計算哈希 → 構建交易 → 簽名 → 提交
 */

const ethers = require('ethers');
const fs = require('fs');

const AGENT_ID = 2480;
const WALLET = '0xd98c330f25BdD6135F58CEd461C79D754B97A969';
const PROBLEM_MANAGER = '0x7D563ae2881D2fC72f5f4c66334c079B4Cc051c6';
const RPC = 'https://mainnet.base.org';

// 求解器邏輯
function solveProblem(template) {
  const parsed = template.replace(/{AGENT_ID}/g, String(AGENT_ID));
  
  if (/sequence/.test(parsed) && /digit/.test(parsed)) {
    const match = parsed.match(/N\s*=\s*\(AGENT_ID\s+mod\s+(\d+)\)\s*\+\s*(\d+)/);
    if (match) {
      const modVal = parseInt(match[1]);
      const addVal = parseInt(match[2]);
      const N = (AGENT_ID % modVal) + addVal;
      
      const sequence = [N];
      for (let i = 0; i < 9; i++) {
        const current = sequence[sequence.length - 1];
        const digitSum = String(current).split('').reduce((sum, d) => sum + parseInt(d), 0);
        sequence.push(current + digitSum);
      }
      
      const S = sequence.reduce((a, b) => a + b, 0);
      
      const modMatch = parsed.match(/mod\s*\(AGENT_ID\s+mod\s+(\d+)\s*\+\s*(\d+)\)/);
      if (modMatch) {
        const modBase = parseInt(modMatch[1]);
        const modAdd = parseInt(modMatch[2]);
        const modulo = (AGENT_ID % modBase) + modAdd;
        return String(S % modulo);
      }
    }
  }
  
  return null;
}

async function submitAnswer(problemId, template) {
  try {
    console.log('\n📋 開始提交流程\n');
    
    // 1. 求解
    console.log('1️⃣  求解問題...');
    const answer = solveProblem(template);
    if (!answer) {
      console.error('❌ 無法求解問題');
      return;
    }
    console.log(`   ✅ 答案: ${answer}`);
    
    // 2. 計算哈希
    console.log('\n2️⃣  計算哈希...');
    const answerHash = ethers.keccak256(ethers.toUtf8Bytes(answer));
    console.log(`   ✅ 哈希: ${answerHash}`);
    
    // 3. 構建交易
    console.log('\n3️⃣  構建交易...');
    const iface = new ethers.Interface([
      'function submitAnswer(uint256 problemId, bytes32 answerHash)'
    ]);
    const data = iface.encodeFunctionData('submitAnswer', [problemId, answerHash]);
    console.log(`   ✅ 交易數據: ${data}`);
    
    // 4. 連接到 RPC
    console.log('\n4️⃣  連接到 Base 主網...');
    const provider = new ethers.JsonRpcProvider(RPC);
    const nonce = await provider.getTransactionCount(WALLET);
    const gasPrice = await provider.getFeeData();
    console.log(`   ✅ Nonce: ${nonce}`);
    console.log(`   ✅ Gas Price: ${gasPrice.gasPrice.toString()} wei`);
    
    // 5. 估算 Gas
    console.log('\n5️⃣  估算 Gas...');
    const gasEstimate = await provider.estimateGas({
      from: WALLET,
      to: PROBLEM_MANAGER,
      data: data
    });
    console.log(`   ✅ Gas 估算: ${gasEstimate.toString()}`);
    
    // 6. 構建完整交易
    console.log('\n6️⃣  構建完整交易...');
    const tx = {
      to: PROBLEM_MANAGER,
      from: WALLET,
      data: data,
      nonce: nonce,
      gasLimit: gasEstimate,
      gasPrice: gasPrice.gasPrice,
      chainId: 8453  // Base 主網 Chain ID
    };
    console.log(`   ✅ 交易對象已準備`);
    
    // 7. 顯示交易摘要
    console.log('\n📝 交易摘要:');
    console.log(`   問題 ID: ${problemId}`);
    console.log(`   答案: ${answer}`);
    console.log(`   哈希: ${answerHash}`);
    console.log(`   To: ${PROBLEM_MANAGER}`);
    console.log(`   From: ${WALLET}`);
    console.log(`   Gas: ${gasEstimate.toString()}`);
    console.log(`   Gas Price: ${gasPrice.gasPrice.toString()}`);
    
    console.log('\n⚠️  需要私鑰簽名才能提交。');
    console.log('   使用 ethers.Wallet.sign() 或 web3.py 完成簽名。');
    
    // 保存交易數據供後續使用
    fs.writeFileSync('/tmp/agentcoin_tx.json', JSON.stringify({
      problemId,
      answer,
      answerHash,
      tx,
      encoded: data
    }, null, 2));
    
    console.log('\n✅ 交易數據已保存到 /tmp/agentcoin_tx.json');
    
  } catch (error) {
    console.error('❌ 錯誤:', error.message);
  }
}

// 測試：Problem #181
const template181 = `Given AGENT_ID = {AGENT_ID}, let N = (AGENT_ID mod 1000) + 1000.
Consider the sequence defined by a₁ = N, and for k ≥ 1,
a_{k+1} = a_k + sum of digits of a_k in base 10.
Let S be the sum of the first 10 terms of this sequence.
Compute S mod (AGENT_ID mod 97 + 3).`;

submitAnswer(181, template181);
