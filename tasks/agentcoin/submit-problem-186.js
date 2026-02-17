#!/usr/bin/env node

/**
 * Problem #186 完整提交流程
 * 包括：求解 → 計算哈希 → 構建交易 → 簽名 → 提交
 */

const ethers = require('ethers');
const fs = require('fs');

const AGENT_ID = 2480;
const WALLET = '0xd98c330f25BdD6135F58CEd461C79D754B97A969';
const PROBLEM_MANAGER = '0x7D563ae2881D2fC72f5f4c66334c079B4Cc051c6';
const RPC = 'https://mainnet.base.org';

async function submitProblem186(answer) {
  try {
    console.log('\n📋 Problem #186 提交流程\n');
    
    // 1. 驗證答案
    console.log('1️⃣  驗證答案...');
    if (!answer || answer.toString().length === 0) {
      console.error('❌ 答案無效');
      return;
    }
    const answerStr = String(answer);
    console.log(`   ✅ 答案: ${answerStr}`);
    
    // 2. 計算哈希
    console.log('\n2️⃣  計算哈希...');
    const answerHash = ethers.keccak256(ethers.toUtf8Bytes(answerStr));
    console.log(`   ✅ 哈希: ${answerHash}`);
    
    // 3. 構建交易
    console.log('\n3️⃣  構建交易...');
    const iface = new ethers.Interface([
      'function submitAnswer(uint256 problemId, bytes32 answerHash)'
    ]);
    const data = iface.encodeFunctionData('submitAnswer', [186, answerHash]);
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
    try {
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
      console.log(`   問題 ID: 186`);
      console.log(`   答案: ${answerStr}`);
      console.log(`   哈希: ${answerHash}`);
      console.log(`   To: ${PROBLEM_MANAGER}`);
      console.log(`   From: ${WALLET}`);
      console.log(`   Gas: ${gasEstimate.toString()}`);
      console.log(`   Gas Price: ${gasPrice.gasPrice.toString()}`);
      
      // 保存交易數據
      fs.writeFileSync('/tmp/problem186_tx.json', JSON.stringify({
        problemId: 186,
        answer: answerStr,
        answerHash,
        tx,
        encoded: data
      }, null, 2));
      
      console.log('\n✅ 交易數據已保存到 /tmp/problem186_tx.json');
      console.log('⚠️  需要私鑰簽名才能提交。');
      
      return {
        success: true,
        problemId: 186,
        answer: answerStr,
        answerHash,
        tx
      };
      
    } catch (gasError) {
      console.log(`\n⚠️  Gas 估算失敗: ${gasError.message}`);
      console.log('   可能原因：');
      console.log('   1. 答案不正確');
      console.log('   2. 問題已過期或已解決');
      console.log('   3. Agent 沒有權限提交');
      
      return {
        success: false,
        error: gasError.message
      };
    }
    
  } catch (error) {
    console.error('❌ 錯誤:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// 從命令行參數或文件讀取答案
let answer = process.argv[2];

if (!answer) {
  // 嘗試從結果文件讀取
  try {
    const result = JSON.parse(fs.readFileSync('/tmp/problem186_result.json', 'utf8'));
    answer = result.answer;
    console.log('📖 從 /tmp/problem186_result.json 讀取答案');
  } catch (e) {
    console.error('❌ 無法讀取答案');
    console.log('用法: node submit-problem-186.js <answer>');
    process.exit(1);
  }
}

submitProblem186(answer);
