#!/usr/bin/env node

/**
 * AgentCoin 快速提交工具
 * 用法: node submit-answer.js <problemId> <answer>
 */

const ethers = require('ethers');

const AGENT_ID = 2480;
const WALLET = '0xd98c330f25BdD6135F58CEd461C79D754B97A969';
const PROBLEM_MANAGER = '0x7D563ae2881D2fC72f5f4c66334c079B4Cc051c6';
const RPC = 'https://mainnet.base.org';

async function submitAnswer(problemId, answer) {
  try {
    // 計算答案哈希
    const answerStr = String(answer);
    const answerHash = ethers.keccak256(ethers.toUtf8Bytes(answerStr));
    
    console.log(`\n📝 提交信息`);
    console.log(`  問題 ID: ${problemId}`);
    console.log(`  答案: ${answerStr}`);
    console.log(`  哈希: ${answerHash}`);
    
    // 構建交易數據
    // submitAnswer(uint256 problemId, bytes32 answerHash)
    const iface = new ethers.Interface([
      'function submitAnswer(uint256 problemId, bytes32 answerHash)'
    ]);
    
    const data = iface.encodeFunctionData('submitAnswer', [problemId, answerHash]);
    
    console.log(`\n🔗 交易數據`);
    console.log(`  To: ${PROBLEM_MANAGER}`);
    console.log(`  Data: ${data}`);
    console.log(`\n⚠️  需要簽名並發送交易。使用 ethers.js 或 web3.py 完成。`);
    
    return {
      problemId,
      answer: answerStr,
      answerHash,
      to: PROBLEM_MANAGER,
      data
    };
  } catch (error) {
    console.error('❌ 錯誤:', error.message);
    process.exit(1);
  }
}

// 命令行執行
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('用法: node submit-answer.js <problemId> <answer>');
  console.log('例子: node submit-answer.js 182 57');
  process.exit(1);
}

submitAnswer(parseInt(args[0]), args[1]).then(result => {
  console.log('\n✅ 準備完成，可以提交交易。');
});
