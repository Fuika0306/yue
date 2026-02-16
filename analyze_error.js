const ethers = require('ethers');

// Configuration
const RPC_URL = 'https://mainnet.base.org';
const PRIVATE_KEY = '0x988ab1aadb8893595137d37312a48389bfaa0eec6e47380ce7e7d46f8cb8982d';
const CONTRACT_ADDRESS = '0x7D563ae2881D2fC72f5f4c66334c079B4Cc051c6';
const PROBLEM_ID = 181;
const ANSWER_HASH = '0x04c903a1756f0f4dc625215a1050ebb816eb6481ff5eda29bbd6764b48356a17';

// Decode the error selector
const errorSelector = '0xec2b7666';
console.log('Error selector:', errorSelector);
console.log('This appears to be a custom error from the contract.');
console.log('Common error patterns:');
console.log('- Problem already solved');
console.log('- Invalid answer format');
console.log('- Unauthorized caller');
console.log('- Problem does not exist');

// Try to get contract code and ABI
async function analyzeContract() {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const code = await provider.getCode(CONTRACT_ADDRESS);
    console.log('\nContract code length:', code.length);
    console.log('Contract is deployed:', code !== '0x');
    
    // Try to call the function directly without gas estimation
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    // Build the transaction manually
    const iface = new ethers.Interface([
      'function submitAnswer(uint256 problemId, bytes32 answer)'
    ]);
    
    const data = iface.encodeFunctionData('submitAnswer', [PROBLEM_ID, ANSWER_HASH]);
    
    console.log('\nTransaction data:', data);
    console.log('Function selector:', data.slice(0, 10));
    
    // Try to simulate the call
    console.log('\nAttempting to call submitAnswer...');
    const result = await provider.call({
      to: CONTRACT_ADDRESS,
      from: wallet.address,
      data: data
    });
    
    console.log('Call result:', result);
    
  } catch (error) {
    console.error('Analysis error:', error.message);
    if (error.data) {
      console.error('Error data:', error.data);
    }
  }
}

analyzeContract();
