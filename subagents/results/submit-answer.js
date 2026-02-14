#!/usr/bin/env node
/**
 * Botcoin Farm 谜题答案提交脚本
 * 用于谜题 #52
 */

const nacl = require('tweetnacl');
const { decodeBase64, encodeBase64 } = require('tweetnacl-util');

// 配置
const CONFIG = {
  huntId: 52,
  publicKey: 'pJ4TH6+qlh7P2HMPMRPM854KLTDqSzntL6lAUmOo89U=',
  secretKey: 'iSEVdXAuzkCakMtfo5bWXyt7Bq3W+0qajziZ1Rx0DzyknhMfr6qWHs/Ycw8xE8zzngotMOpLOe0vqUBSY6jz1Q==',
  apiEndpoint: 'https://botcoin.farm/api/hunts/solve'
};

/**
 * 使用 tweetnacl 签名交易
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
    throw new Error('答案不能为空');
  }

  const transaction = {
    type: 'solve',
    huntId: CONFIG.huntId,
    answer: answer,
    publicKey: CONFIG.publicKey,
    timestamp: Date.now()
  };

  const signature = signTransaction(transaction, CONFIG.secretKey);

  console.log('📤 提交参数:');
  console.log(`   谜题 ID: ${CONFIG.huntId}`);
  console.log(`   答案: ${answer}`);
  console.log(`   时间戳: ${transaction.timestamp}`);
  console.log(`   公钥: ${CONFIG.publicKey.slice(0, 16)}...`);

  const response = await fetch(CONFIG.apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ transaction, signature })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`API 错误 (${response.status}): ${JSON.stringify(data)}`);
  }

  return data;
}

// 主程序
async function main() {
  const answer = process.argv[2];

  if (!answer) {
    console.log('用法: node submit-answer.js <答案>');
    console.log('示例: node submit-answer.js "my_answer"');
    process.exit(1);
  }

  console.log('🎯 Botcoin Farm 谜题 #52 答案提交\n');

  try {
    const result = await submitAnswer(answer);
    console.log('\n✅ 服务器响应:');
    console.log(JSON.stringify(result, null, 2));

    if (result.correct) {
      console.log('\n🎉 答案正确！');
    } else if (result.error) {
      console.log('\n⚠️ ', result.error);
    } else {
      console.log('\n❌ 答案错误，请重试');
    }
  } catch (error) {
    console.error('\n❌ 提交失败:', error.message);
    process.exit(1);
  }
}

main();
