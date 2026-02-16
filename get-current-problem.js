#!/usr/bin/env node

const ethers = require('ethers');

const RPC = 'https://mainnet.base.org';
const PROBLEM_MANAGER = '0x7D563ae2881D2fC72f5f4c66334c079B4Cc051c6';

// ProblemManager ABI - 只需要讀取函數
const ABI = [
  'function currentProblemId() public view returns (uint256)',
  'function getProblem(uint256 id) public view returns (tuple(uint256 id, string template, uint256 difficulty, uint256 createdAt, uint256 deadline, bool active))',
  'function getLatestProblem() public view returns (tuple(uint256 id, string template, uint256 difficulty, uint256 createdAt, uint256 deadline, bool active))'
];

async function getCurrentProblem() {
  try {
    const provider = new ethers.JsonRpcProvider(RPC);
    const contract = new ethers.Contract(PROBLEM_MANAGER, ABI, provider);
    
    console.log('🔗 連接到 Base 主網...');
    
    // 嘗試獲取當前問題 ID
    let problemId;
    try {
      problemId = await contract.currentProblemId();
      console.log(`✅ 當前問題 ID: ${problemId}`);
    } catch (e) {
      console.log('⚠️  無法讀取 currentProblemId，嘗試 getLatestProblem...');
      const problem = await contract.getLatestProblem();
      problemId = problem.id;
      console.log(`✅ 最新問題 ID: ${problemId}`);
      console.log(`📋 模板: ${problem.template}`);
      console.log(`🎯 難度: ${problem.difficulty}`);
      return;
    }
    
    // 獲取問題詳情
    const problem = await contract.getProblem(problemId);
    console.log(`\n📋 問題詳情:`);
    console.log(`  ID: ${problem.id}`);
    console.log(`  模板: ${problem.template}`);
    console.log(`  難度: ${problem.difficulty}`);
    console.log(`  截止: ${new Date(Number(problem.deadline) * 1000).toISOString()}`);
    console.log(`  活躍: ${problem.active}`);
    
  } catch (error) {
    console.error('❌ 錯誤:', error.message);
    process.exit(1);
  }
}

getCurrentProblem();
