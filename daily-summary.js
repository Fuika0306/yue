#!/usr/bin/env node

/**
 * 每日总结脚本
 * 功能：
 * 1. 读取今天的日志 (memory/YYYY-MM-DD.md)
 * 2. 提取关键信息（做了什么、学到什么、遇到什么）
 * 3. 生成总结文本
 * 4. 输出到 stdout（供 cron 任务使用）
 */

const fs = require('fs');
const path = require('path');

function getTodayDate() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

function getDailyLogPath() {
  const today = getTodayDate();
  return path.join(__dirname, 'memory', `${today}.md`);
}

function generateSummary() {
  const logPath = getDailyLogPath();
  const today = getTodayDate();
  
  // 如果今天没有日志，返回空总结
  if (!fs.existsSync(logPath)) {
    return `📅 ${today}\n\n没有记录任何活动。`;
  }
  
  const content = fs.readFileSync(logPath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  // 简单的分类提取
  const actions = [];
  const learnings = [];
  const issues = [];
  
  for (const line of lines) {
    if (line.includes('做') || line.includes('完成') || line.includes('执行')) {
      actions.push(line.replace(/^[-*]\s*/, ''));
    } else if (line.includes('学') || line.includes('发现') || line.includes('洞察')) {
      learnings.push(line.replace(/^[-*]\s*/, ''));
    } else if (line.includes('问题') || line.includes('错误') || line.includes('Bug')) {
      issues.push(line.replace(/^[-*]\s*/, ''));
    }
  }
  
  // 生成总结
  let summary = `📅 每日总结 - ${today}\n\n`;
  
  if (actions.length > 0) {
    summary += `✅ 今天做了什么：\n`;
    actions.slice(0, 5).forEach(action => {
      summary += `  • ${action}\n`;
    });
    summary += '\n';
  }
  
  if (learnings.length > 0) {
    summary += `💡 学到的东西：\n`;
    learnings.slice(0, 5).forEach(learning => {
      summary += `  • ${learning}\n`;
    });
    summary += '\n';
  }
  
  if (issues.length > 0) {
    summary += `⚠️ 遇到的问题：\n`;
    issues.slice(0, 5).forEach(issue => {
      summary += `  • ${issue}\n`;
    });
    summary += '\n';
  }
  
  summary += `📊 日志行数：${lines.length}\n`;
  
  return summary;
}

const summary = generateSummary();
console.log(summary);
