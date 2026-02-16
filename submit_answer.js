const ethers = require('ethers');

// Configuration
const RPC_URL = 'https://mainnet.base.org';
const PRIVATE_KEY = '0x988ab1aadb8893595137d37312a48389bfaa0eec6e47380ce7e7d46f8cb8982d';
const CONTRACT_ADDRESS = '0x7D563ae2881D2fC72f5f4c66334c079B4Cc051c6';
const PROBLEM_ID = 181;
const ANSWER_HASH = '0x04c903a1756f0f4dc625215a1050ebb816eb6481ff5eda29bbd6764b48356a17';

// Contract ABI for submitAnswer function
const CONTRACT_ABI = [
  {
    "inputs": [
      {"internalType": "uint256", "name": "problemId", "type": "uint256"},
      {"internalType": "bytes32", "name": "answer", "type": "bytes32"}
    ],
    "name": "submitAnswer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

async function submitAnswer() {
  try {
    console.log('🔗 Connecting to Base chain...');
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    
    // Verify connection
    const network = await provider.getNetwork();
    console.log(`✓ Connected to chain: ${network.name} (ID: ${network.chainId})`);
    
    // Create wallet from private key
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    console.log(`✓ Wallet address: ${wallet.address}`);
    
    // Get current balance
    const balance = await provider.getBalance(wallet.address);
    console.log(`✓ Wallet balance: ${ethers.formatEther(balance)} ETH`);
    
    // Create contract instance
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
    console.log(`✓ Contract address: ${CONTRACT_ADDRESS}`);
    
    // Prepare transaction
    console.log('\n📝 Preparing transaction...');
    console.log(`   Problem ID: ${PROBLEM_ID}`);
    console.log(`   Answer Hash: ${ANSWER_HASH}`);
    
    // Estimate gas
    const gasEstimate = await contract.submitAnswer.estimateGas(PROBLEM_ID, ANSWER_HASH);
    console.log(`✓ Estimated gas: ${gasEstimate.toString()}`);
    
    // Submit answer
    console.log('\n🚀 Submitting answer...');
    const tx = await contract.submitAnswer(PROBLEM_ID, ANSWER_HASH);
    console.log(`✓ Transaction sent: ${tx.hash}`);
    
    // Wait for confirmation
    console.log('\n⏳ Waiting for confirmation...');
    const receipt = await tx.wait();
    
    if (receipt && receipt.status === 1) {
      console.log('\n✅ Transaction confirmed!');
      console.log(`   Transaction Hash: ${receipt.hash}`);
      console.log(`   Block Number: ${receipt.blockNumber}`);
      console.log(`   Gas Used: ${receipt.gasUsed.toString()}`);
      console.log(`   Status: Success`);
      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } else {
      console.log('\n❌ Transaction failed!');
      return {
        success: false,
        txHash: receipt?.hash,
        status: receipt?.status
      };
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the submission
submitAnswer().then(result => {
  console.log('\n📊 Final Result:');
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.success ? 0 : 1);
});
