#!/usr/bin/env node
/**
 * 👀玥 - Botcoin Farm 謎題 #73 監控系統
 * 監控項目：
 * 1. 錢包狀態（Gas 餘額、已領取的幣）
 * 2. 謎題 #73 狀態（是否還有人在解、是否已被領取）
 * 3. API 可用性和響應時間
 * 4. 嘗試次數和過期時間
 */

const fs = require('fs');
const path = require('path');

const CONFIG = {
  huntId: 73,
  puzzleName: 'The False Lover',
  publicKey: 'pJ4TH6+qlh7P2HMPMRPM854KLTDqSzntL6lAUmOo89U=',
  walletId: 'b687547f-c221-4dce-ad25-f439a5a434a2',
  apiEndpoint: 'https://botcoin.farm/api',
  expiryTime: new Date('2026-02-14T05:38:38Z'),
  maxAttempts: 3,
  monitorFile: '/root/.openclaw/workspace/subagents/puzzle73-monitor.md'
};

/**
 * 計算剩餘時間
 */
function getTimeRemaining() {
  const now = new Date();
  const diff = CONFIG.expiryTime - now;
  
  if (diff <= 0) return '已過期';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return `${hours}h ${minutes}m ${seconds}s`;
}

/**
 * 檢查 API 可用性
 */
async function checkAPIHealth() {
  const startTime = Date.now();
  try {
    const response = await fetch(`${CONFIG.apiEndpoint}/health`, {
      timeout: 5000
    });
    const responseTime = Date.now() - startTime;
    
    return {
      available: response.ok,
      status: response.status,
      responseTime: responseTime,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      available: false,
      error: error.message,
      responseTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * 檢查謎題狀態
 */
async function checkPuzzleStatus() {
  try {
    const response = await fetch(`${CONFIG.apiEndpoint}/hunts/${CONFIG.huntId}`, {
      timeout: 5000
    });
    
    if (!response.ok) {
      return {
        available: false,
        status: response.status,
        error: `HTTP ${response.status}`,
        timestamp: new Date().toISOString()
      };
    }
    
    const data = await response.json();
    
    return {
      available: true,
      huntId: data.id,
      name: data.name,
      solved: data.solved || false,
      solvedBy: data.solvedBy || null,
      attempts: data.attempts || 0,
      maxAttempts: data.maxAttempts || 3,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      available: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * 檢查錢包狀態
 */
async function checkWalletStatus() {
  try {
    const response = await fetch(`${CONFIG.apiEndpoint}/wallet/${CONFIG.walletId}`, {
      timeout: 5000
    });
    
    if (!response.ok) {
      return {
        available: false,
        status: response.status,
        error: `HTTP ${response.status}`,
        timestamp: new Date().toISOString()
      };
    }
    
    const data = await response.json();
    
    return {
      available: true,
      walletId: data.id,
      gas: data.gas || 0,
      coins: data.coins || 0,
      claimedPuzzles: data.claimedPuzzles || [],
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      available: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * 更新監控文件
 */
function updateMonitorFile(apiHealth, puzzleStatus, walletStatus) {
  const timeRemaining = getTimeRemaining();
  
  const content = `# 👀玥 - 謎題 #73 監控系統

## 監控任務
- **謎題：** #73「${CONFIG.puzzleName}」
- **狀態：** 進行中
- **嘗試次數：** ${puzzleStatus.attempts || 0}/${CONFIG.maxAttempts}
- **過期時間：** 2026-02-14 05:38:38 UTC
- **剩餘時間：** ${timeRemaining}

## 最新檢查結果 (${new Date().toISOString()})

### 1️⃣ 錢包狀態
- **Wallet ID：** ${CONFIG.walletId}
- **Gas 餘額：** ${walletStatus.available ? walletStatus.gas : '❌ 無法獲取'}
- **已領取的幣：** ${walletStatus.available ? walletStatus.coins : '❌ 無法獲取'}
- **已領取謎題：** ${walletStatus.available ? (walletStatus.claimedPuzzles.length > 0 ? walletStatus.claimedPuzzles.join(', ') : '無') : '❌ 無法獲取'}
- **狀態：** ${walletStatus.available ? '✅ 正常' : '⚠️ 異常'}

### 2️⃣ 謎題 #73 狀態
- **謎題名稱：** ${puzzleStatus.name || CONFIG.puzzleName}
- **是否已被領取：** ${puzzleStatus.solved ? '✅ 已被領取' : '❌ 未被領取'}
- **領取者：** ${puzzleStatus.solvedBy || '無'}
- **當前嘗試次數：** ${puzzleStatus.attempts || 0}/${CONFIG.maxAttempts}
- **狀態：** ${puzzleStatus.available ? '✅ 正常' : '⚠️ 異常'}

### 3️⃣ API 可用性
- **API 端點：** ${CONFIG.apiEndpoint}
- **健康狀態：** ${apiHealth.available ? '✅ 正常' : '⚠️ 異常'}
- **HTTP 狀態：** ${apiHealth.status || apiHealth.error}
- **響應時間：** ${apiHealth.responseTime}ms
- **最後檢查：** ${apiHealth.timestamp}

### 4️⃣ 嘗試計數
- **已用次數：** ${puzzleStatus.attempts || 0}/${CONFIG.maxAttempts}
- **剩餘次數：** ${CONFIG.maxAttempts - (puzzleStatus.attempts || 0)}
- **過期倒計時：** ${timeRemaining}
- **最後更新：** ${new Date().toISOString()}

## 異常記錄
${apiHealth.available && puzzleStatus.available && walletStatus.available ? '✅ 無異常' : '⚠️ 檢測到異常'}

## 檢查日誌
- [${new Date().toISOString()}] 定期檢查完成
`;

  fs.writeFileSync(CONFIG.monitorFile, content, 'utf8');
}

/**
 * 主監控循環
 */
async function monitor() {
  console.log(`\n👀玥 監控系統啟動 - ${new Date().toISOString()}`);
  console.log(`謎題 #73「${CONFIG.puzzleName}」\n`);
  
  try {
    const [apiHealth, puzzleStatus, walletStatus] = await Promise.all([
      checkAPIHealth(),
      checkPuzzleStatus(),
      checkWalletStatus()
    ]);
    
    console.log('📊 檢查結果：');
    console.log(`   API 狀態: ${apiHealth.available ? '✅' : '❌'} (${apiHealth.responseTime}ms)`);
    console.log(`   謎題狀態: ${puzzleStatus.available ? '✅' : '❌'}`);
    console.log(`   錢包狀態: ${walletStatus.available ? '✅' : '❌'}`);
    
    if (puzzleStatus.available) {
      console.log(`   嘗試次數: ${puzzleStatus.attempts || 0}/${CONFIG.maxAttempts}`);
      console.log(`   已被領取: ${puzzleStatus.solved ? '✅ 是' : '❌ 否'}`);
    }
    
    if (walletStatus.available) {
      console.log(`   Gas 餘額: ${walletStatus.gas}`);
    }
    
    console.log(`   剩餘時間: ${getTimeRemaining()}\n`);
    
    // 更新監控文件
    updateMonitorFile(apiHealth, puzzleStatus, walletStatus);
    
    // 檢查異常
    if (!apiHealth.available) {
      console.log('⚠️ 警告: API 不可用');
    }
    if (puzzleStatus.available && puzzleStatus.solved) {
      console.log('⚠️ 警告: 謎題已被領取！');
    }
    if (puzzleStatus.available && puzzleStatus.attempts >= CONFIG.maxAttempts) {
      console.log('⚠️ 警告: 嘗試次數已用完！');
    }
    
  } catch (error) {
    console.error('❌ 監控錯誤:', error.message);
  }
}

// 執行監控
monitor().catch(console.error);
