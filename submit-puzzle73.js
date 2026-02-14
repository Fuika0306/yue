#!/usr/bin/env node
/**
 * Botcoin Farm 謎題 #73 答案提交腳本
 * The False Lover
 */

const nacl = require('tweetnacl');
const { decodeBase64, encodeBase64 } = require('tweetnacl-util');

// 謎題 #73 配置（使用 @NickMieleProbs 錢包）
const CONFIG = {
  huntId: 73,
  publicKey: 'pJ4TH6+qlh7P2HMPMRPM854KLTDqSzntL6lAUmOo89U=',
  secretKey: 'iSEVdXAuzkCakMtfo5bWXyt7Bq3W+0qajziZ1Rx0DzyknhMfr6qWHs/Ycw8xE8zzngotMOpLOe0vqUBSY6jz1Q==',
  walletId: '76d56743-ab1e-443a-afe7-20591d40fd9d',
  twitterHandle: '@NickMieleProbs',
  apiEndpoint: 'https://botcoin.farm/api/hunts/solve'
};

/**
 * 使用 tweetnacl 簽名交易
 */
function signTransaction(transaction, secretKey) {
  const message = JSON.stringify(transaction);
  const messageBytes = new TextEncoder().encode(message);
  const secretKeyBytes = decodeBase64(secretKey);
  const signature = nacl.sign.detached(messageBytes, secretKeyBytes);
  return encodeBase64(signature);
}

/**
 * 提交答案到 Botcoin Farm
 */
async function submitAnswer(answer) {
  if (!answer) {
    throw new Error('答案不能為空');
  }

  const transaction = {
    type: 'solve',
    huntId: CONFIG.huntId,
    answer: answer.trim(),
    publicKey: CONFIG.publicKey,
    timestamp: Date.now()
  };

  const signature = signTransaction(transaction, CONFIG.secretKey);

  console.log('📤 提交參數:');
  console.log(`   謎題 ID: ${CONFIG.huntId}`);
  console.log(`   謎題名稱: The False Lover`);
  console.log(`   答案: ${answer.trim()}`);
  console.log(`   錢包: ${CONFIG.twitterHandle}`);
  console.log(`   時間戳: ${transaction.timestamp}`);
  console.log(`   公鑰: ${CONFIG.publicKey.slice(0, 16)}...`);
  console.log('');

  const response = await fetch(CONFIG.apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ transaction, signature })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`API 錯誤 (${response.status}): ${JSON.stringify(data)}`);
  }

  return data;
}

// 主程序
async function main() {
  const answer = process.argv[2];

  if (!answer) {
    console.log('用法: node submit-puzzle73.js <答案>');
    console.log('示例: node submit-puzzle73.js "Simon Leviev"');
    console.log('');
    console.log('謎題 #73 - The False Lover');
    console.log('嘗試次數: 0/3');
    console.log('過期時間: 2026-02-14 05:38:38 UTC');
    process.exit(1);
  }

  console.log('🎯 Botcoin Farm 謎題 #73 答案提交\n');
  console.log('謎題: The False Lover');
  console.log('');

  try {
    const result = await submitAnswer(answer);
    console.log('✅ 服務器響應:');
    console.log(JSON.stringify(result, null, 2));

    if (result.correct) {
      console.log('\n🎉 答案正確！');
      console.log(`   獲得獎勵: ${result.reward || 'N/A'}`);
    } else if (result.error) {
      console.log('\n⚠️ ', result.error);
    } else {
      console.log('\n❌ 答案錯誤，請重試');
    }
  } catch (error) {
    console.error('\n❌ 提交失敗:', error.message);
    process.exit(1);
  }
}

main();
