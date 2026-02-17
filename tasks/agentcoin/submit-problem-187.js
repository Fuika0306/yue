#!/usr/bin/env node

/**
 * Problem #187 提交工具
 */

const ethers = require('ethers');
const fs = require('fs');

const WALLET = '0xd98c330f25BdD6135F58CEd461C79D754B97A969';
const PROBLEM_MANAGER = '0x7D563ae2881D2fC72f5f4c66334c079B4Cc051c6';
const RPC = 'https://mainnet.base.org';

async function submitProblem187(answer) {
  try {
    console.log('\n📋 Problem #187 提交流程\n');
    
    console.log('1️⃣  驗證答案...');
    if (!answer || answer.toString().length === 0) {
      console.error('❌ 答案無效');
      return;
    }
    const answerStr = String(answer);
    console.log(`   ✅ 答案: ${answerStr}`);
    
    console.log('\n2️⃣  計算哈希...');
    const answerHash = ethers.keccak256(ethers.toUtf8Bytes(answerStr));
    console.log(`   ✅ 哈希: ${answerHash}`);
    
    console.log('\n3️⃣  構建交易...');
    const iface = new ethers.Interface([
      'function submitAnswer(uint256 problemId, bytes32 answerHash)'
    ]);
    const data = iface.encodeFunctionData('submitAnswer', [187, answerHash]);
    console.log(`   ✅ 交易數據: ${data}`);
    
    console.log('\n4️⃣  連接到 Base 主網...');
    const provider = new ethers.JsonRpcProvider(RPC);
    const nonce = await provider.getTransactionCount(WALLET);
    const gasPrice = await provider.getFeeData();
    console.log(`   ✅ Nonce: ${nonce}`);
    console.log(`   ✅ Gas Price: ${gasPrice.gasPrice.toString()} wei`);
    
    console.log('\n5️⃣  估算 Gas...');
    try {
      const gasEstimate = await provider.estimateGas({
        from: WALLET,
        to: PROBLEM_MANAGER,
        data: data
      });
      console.log(`   ✅ Gas 估算: ${gasEstimate.toString()}`);
      
      console.log('\n6️⃣  構建完整交易...');
      const tx = {
        to: PROBLEM_MANAGER,
        from: WALLET,
        data: data,
        nonce: nonce,
        gasLimit: gasEstimate,
        gasPrice: gasPrice.gasPrice,
        chainId: 8453
      };
      console.log(`   ✅ 交易對象已準備`);
      
      console.log('\n📝 交易摘要:');
      console.log(`   問題 ID: 187`);
      console.log(`   答案: ${answerStr}`);
      console.log(`   哈希: ${answerHash}`);
      console.log(`   To: ${PROBLEM_MANAGER}`);
      console.log(`   From: ${WALLET}`);
      console.log(`   Gas: ${gasEstimate.toString()}`);
      
      fs.writeFileSync('/tmp/problem187_tx.json', JSON.stringify({
        problemId: 187,
        answer: answerStr,
        answerHash,
        tx,
        encoded: data
      }, null, 2));
      
      console.log('\n✅ 交易數據已保存到 /tmp/problem187_tx.json');
      console.log('⚠️  需要私鑰簽名才能提交。');
      
      return {
        success: true,
        problemId: 187,
        answer: answerStr,
        answerHash,
        tx
      };
      
    } catch (gasError) {
      console.log(`\n⚠️  Gas 估算失敗: ${gasError.message}`);
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

let answer = process.argv[2];

if (!answer) {
  try {
    const result = JSON.parse(fs.readFileSync('/tmp/problem186_result.json', 'utf8'));
    answer = result.answer;
    console.log('📖 從 /tmp/problem186_result.json 讀取答案');
  } catch (e) {
    console.error('❌ 無法讀取答案');
    console.log('用法: node submit-problem-187.js <answer>');
    process.exit(1);
  }
}

submitProblem187(answer);
