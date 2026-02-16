#!/usr/bin/env node

/**
 * Problem #187 直接提交 - 簽名並發送交易
 */

const ethers = require('ethers');
const fs = require('fs');

const WALLET_ADDRESS = '0xd98c330f25BdD6135F58CEd461C79D754B97A969';
const PRIVATE_KEY = '0x988ab1aadb8893595137d37312a48389bfaa0eec6e47380ce7e7d46f8cb8982d';
const PROBLEM_MANAGER = '0x7D563ae2881D2fC72f5f4c66334c079B4Cc051c6';
const RPC = 'https://mainnet.base.org';

async function submitProblem187(answer) {
  try {
    console.log('\n🚀 Problem #187 直接提交\n');
    
    const answerStr = String(answer);
    console.log(`📝 答案: ${answerStr}`);
    
    const answerHash = ethers.keccak256(ethers.toUtf8Bytes(answerStr));
    console.log(`🔗 哈希: ${answerHash}`);
    
    // 連接到 RPC
    console.log('\n🔌 連接到 Base 主網...');
    const provider = new ethers.JsonRpcProvider(RPC);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log(`✅ 錢包: ${wallet.address}`);
    
    // 獲取 nonce 和 gas price
    const nonce = await provider.getTransactionCount(wallet.address);
    const feeData = await provider.getFeeData();
    
    console.log(`✅ Nonce: ${nonce}`);
    console.log(`✅ Max Fee Per Gas: ${ethers.formatUnits(feeData.maxFeePerGas, 'gwei')} gwei`);
    
    // 構建交易數據
    const iface = new ethers.Interface([
      'function submitAnswer(uint256 problemId, bytes32 answerHash)'
    ]);
    const data = iface.encodeFunctionData('submitAnswer', [187, answerHash]);
    
    console.log(`\n📋 構建交易...`);
    
    // 估算 gas
    const gasEstimate = await provider.estimateGas({
      from: wallet.address,
      to: PROBLEM_MANAGER,
      data: data
    });
    
    console.log(`✅ Gas 估算: ${gasEstimate.toString()}`);
    
    // 構建交易對象
    const tx = {
      to: PROBLEM_MANAGER,
      from: wallet.address,
      data: data,
      nonce: nonce,
      gasLimit: gasEstimate,
      maxFeePerGas: feeData.maxFeePerGas,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
      chainId: 8453
    };
    
    console.log(`\n✍️  簽名交易...`);
    const signedTx = await wallet.signTransaction(tx);
    console.log(`✅ 交易已簽名`);
    
    console.log(`\n📤 發送交易...`);
    const txResponse = await provider.broadcastTransaction(signedTx);
    console.log(`✅ 交易已廣播: ${txResponse.hash}`);
    
    console.log(`\n⏳ 等待確認...`);
    const receipt = await txResponse.wait(1);
    
    if (receipt) {
      console.log(`\n✅ 交易已確認！`);
      console.log(`   交易哈希: ${receipt.hash}`);
      console.log(`   區塊: ${receipt.blockNumber}`);
      console.log(`   Gas 消耗: ${receipt.gasUsed.toString()}`);
      console.log(`   狀態: ${receipt.status === 1 ? '✅ 成功' : '❌ 失敗'}`);
      
      // 保存結果
      fs.writeFileSync('/tmp/problem187_submitted.json', JSON.stringify({
        problemId: 187,
        answer: answerStr,
        answerHash,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status === 1 ? 'success' : 'failed',
        timestamp: new Date().toISOString()
      }, null, 2));
      
      console.log('\n✅ 結果已保存到 /tmp/problem187_submitted.json');
      
      return {
        success: receipt.status === 1,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } else {
      console.log('⚠️  交易未確認');
      return {
        success: false,
        error: 'Transaction not confirmed'
      };
    }
    
  } catch (error) {
    console.error('\n❌ 錯誤:', error.message);
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
    console.log('📖 從 /tmp/problem186_result.json 讀取答案: ' + answer);
  } catch (e) {
    console.error('❌ 無法讀取答案');
    console.log('用法: node submit-problem-187-direct.js <answer>');
    process.exit(1);
  }
}

submitProblem187(answer);
