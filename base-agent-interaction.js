const { ethers } = require('ethers');

// Configuration
const BASE_RPC = 'https://mainnet.base.org';
const AGENT_REGISTRY_ADDRESS = '0x5A899d52C9450a06808182FdB1D1e4e23AdFe04D';
const PROBLEM_MANAGER_ADDRESS = '0x7D563ae2881D2fC72f5f4c66334c079B4Cc051c6';
const WALLET_ADDRESS = '0xd98c330f25BdD6135F58CEd461C79D754B97A969';
const PRIVATE_KEY = '0x988ab1aadb8893595137d37312a48389bfaa0eec6e47380ce7e7d46f8cb8982d';

const AGENT_REGISTRY_ABI = [
  'function getAgentId(address agent) public view returns (uint256)'
];

const PROBLEM_MANAGER_ABI = [
  'function getProblem(uint256 problemId) public view returns (bytes32, uint256, uint256, uint256, uint256, uint256, uint256, bytes)',
  'function submitAnswer(uint256 problemId, bytes memory answer) public returns (bool)'
];

async function main() {
  try {
    console.log('🔗 Connecting to Base RPC...');
    const provider = new ethers.JsonRpcProvider(BASE_RPC);
    
    const blockNumber = await provider.getBlockNumber();
    console.log(`✅ Connected to Base. Current block: ${blockNumber}\n`);

    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    console.log(`💼 Wallet: ${wallet.address}\n`);

    const agentRegistry = new ethers.Contract(AGENT_REGISTRY_ADDRESS, AGENT_REGISTRY_ABI, provider);
    const problemManager = new ethers.Contract(PROBLEM_MANAGER_ADDRESS, PROBLEM_MANAGER_ABI, provider);

    // Get Agent ID
    console.log('📖 Reading Agent ID...');
    const agentId = await agentRegistry.getAgentId(WALLET_ADDRESS);
    console.log(`✅ Agent ID: ${agentId}\n`);

    // Search for valid problem
    console.log('🔍 Searching for valid problem...');
    let problemId = null;
    let problemData = null;
    
    // Try a range of problem IDs
    for (let i = 1; i <= 10; i++) {
      try {
        const data = await problemManager.getProblem(BigInt(i));
        const [hash, val1, val2, val3, val4, val5, val6, answerBytes] = data;
        
        // Check if problem has non-zero values
        if (val1 !== 0n || val2 !== 0n || val3 !== 0n || val4 !== 0n || val5 !== 0n || val6 !== 0n) {
          problemId = BigInt(i);
          problemData = data;
          console.log(`✅ Found valid problem at ID: ${problemId}\n`);
          break;
        }
      } catch (e) {
        // Continue searching
      }
    }

    if (!problemId) {
      console.log('❌ No valid problem found in range 1-10');
      process.exit(1);
    }

    const [hash, val1, val2, val3, val4, val5, val6, answerBytes] = problemData;
    console.log(`📊 Problem Details:`);
    console.log(`  Problem ID: ${problemId}`);
    console.log(`  Hash: ${hash}`);
    console.log(`  Values: ${val1}, ${val2}, ${val3}, ${val4}, ${val5}, ${val6}`);
    console.log(`  Answer bytes: ${answerBytes}\n`);

    // Solve the problem
    console.log('🧠 Solving problem...');
    const answer = solveProblem(val1, val2, val3, val4, val5, val6);
    console.log(`✅ Answer: ${answer}\n`);

    // Convert answer to bytes
    const answerBytes32 = ethers.toBeHex(answer, 32);
    console.log(`📤 Submitting answer to blockchain...`);
    console.log(`   Answer (hex): ${answerBytes32}\n`);

    const problemManagerWithSigner = problemManager.connect(wallet);
    
    const tx = await problemManagerWithSigner.submitAnswer(problemId, answerBytes32);
    console.log(`📋 Transaction Hash: ${tx.hash}`);
    
    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed!`);
    console.log(`📦 Block Number: ${receipt.blockNumber}`);
    console.log(`⛽ Gas Used: ${receipt.gasUsed.toString()}`);
    console.log(`✔️  Status: ${receipt.status === 1 ? 'SUCCESS' : 'FAILED'}\n`);

    // Report
    console.log('═══════════════════════════════════════');
    console.log('📊 FINAL REPORT');
    console.log('═══════════════════════════════════════');
    console.log(`Problem ID: ${problemId}`);
    console.log(`Answer: ${answer}`);
    console.log(`Transaction Hash: ${tx.hash}`);
    console.log(`Block Number: ${receipt.blockNumber}`);
    console.log(`Result: ${receipt.status === 1 ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

function solveProblem(val1, val2, val3, val4, val5, val6) {
  const v1 = Number(val1);
  const v2 = Number(val2);
  const v3 = Number(val3);
  const v4 = Number(val4);
  const v5 = Number(val5);
  const v6 = Number(val6);

  console.log(`   Calculating: ${v1} + ${v2} + ${v3} + ${v4} + ${v5} + ${v6}`);
  
  const result = v1 + v2 + v3 + v4 + v5 + v6;
  
  return result;
}

main();
