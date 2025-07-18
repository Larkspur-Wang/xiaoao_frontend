#!/usr/bin/env node

/**
 * 生产环境问题修复脚本
 * 修复HTTPS、CORS、资源路径等问题
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 生产环境问题修复工具');
console.log('='.repeat(40));

// 检查和修复图标文件名
function fixIconNames() {
  const iconsDir = 'icons';
  if (!fs.existsSync(iconsDir)) {
    console.log('❌ icons目录不存在');
    return false;
  }
  
  console.log('🎨 检查图标文件名...');
  
  const expectedIcons = [
    'icon-72X72.png',
    'icon-96X96.png', 
    'icon-128X128.png',
    'icon-144X144.png',
    'icon-152X152.png',
    'icon-192X192.png',
    'icon-384X384.png',
    'icon-512X512.png'
  ];
  
  let allExists = true;
  expectedIcons.forEach(icon => {
    const iconPath = path.join(iconsDir, icon);
    if (fs.existsSync(iconPath)) {
      console.log(`✅ ${icon}`);
    } else {
      console.log(`❌ ${icon} 缺失`);
      allExists = false;
    }
  });
  
  return allExists;
}

// 检查API配置
function checkAPIConfig() {
  console.log('\n🌐 检查API配置...');
  
  const appJsPath = 'app.js';
  if (!fs.existsSync(appJsPath)) {
    console.log('❌ app.js文件不存在');
    return false;
  }
  
  const content = fs.readFileSync(appJsPath, 'utf8');
  
  if (content.includes("'/api'")) {
    console.log('✅ API代理配置正确');
    return true;
  } else if (content.includes('http://47.117.87.105:8080')) {
    console.log('⚠️  仍在使用HTTP API地址，可能导致HTTPS混合内容错误');
    return false;
  } else {
    console.log('❓ API配置未知');
    return false;
  }
}

// 检查Functions中间件
function checkFunctions() {
  console.log('\n⚡ 检查Cloudflare Functions...');
  
  const middlewarePath = 'functions/_middleware.js';
  if (fs.existsSync(middlewarePath)) {
    console.log('✅ API代理中间件存在');
    
    const content = fs.readFileSync(middlewarePath, 'utf8');
    if (content.includes('47.117.87.105:8080')) {
      console.log('✅ API代理目标配置正确');
      return true;
    } else {
      console.log('❌ API代理目标配置错误');
      return false;
    }
  } else {
    console.log('❌ API代理中间件不存在');
    return false;
  }
}

// 检查Service Worker
function checkServiceWorker() {
  console.log('\n🔧 检查Service Worker...');
  
  const swPath = 'sw.js';
  if (!fs.existsSync(swPath)) {
    console.log('❌ sw.js文件不存在');
    return false;
  }
  
  const content = fs.readFileSync(swPath, 'utf8');
  
  if (content.includes('chrome-extension')) {
    console.log('⚠️  Service Worker可能包含chrome-extension协议处理');
  }
  
  if (content.includes('request.url.startsWith')) {
    console.log('✅ Service Worker包含协议检查');
    return true;
  } else {
    console.log('⚠️  Service Worker缺少协议检查');
    return false;
  }
}

// 生成修复建议
function generateFixSuggestions(issues) {
  if (issues.length === 0) {
    console.log('\n🎉 没有发现问题！');
    return;
  }
  
  console.log('\n🔧 修复建议:');
  
  issues.forEach(issue => {
    console.log(`\n${issue.type}:`);
    console.log(`  问题: ${issue.problem}`);
    console.log(`  解决方案: ${issue.solution}`);
  });
}

// 主检查函数
function runChecks() {
  console.log('🔍 开始检查生产环境问题...\n');
  
  const issues = [];
  
  // 检查图标
  if (!fixIconNames()) {
    issues.push({
      type: '❌ 图标文件问题',
      problem: '图标文件缺失或命名错误',
      solution: '运行 npm run icons 生成图标文件，或手动创建正确命名的图标'
    });
  }
  
  // 检查API配置
  if (!checkAPIConfig()) {
    issues.push({
      type: '❌ API配置问题', 
      problem: 'HTTPS页面请求HTTP API被阻止',
      solution: '确保app.js中使用 "/api" 作为API基础URL，并部署Functions中间件'
    });
  }
  
  // 检查Functions
  if (!checkFunctions()) {
    issues.push({
      type: '❌ API代理问题',
      problem: 'Cloudflare Functions API代理未正确配置',
      solution: '确保functions/_middleware.js文件存在且配置正确'
    });
  }
  
  // 检查Service Worker
  if (!checkServiceWorker()) {
    issues.push({
      type: '❌ Service Worker问题',
      problem: 'Service Worker缓存策略可能导致协议错误',
      solution: '更新Service Worker添加协议检查'
    });
  }
  
  generateFixSuggestions(issues);
  
  if (issues.length === 0) {
    console.log('\n🚀 准备重新部署:');
    console.log('  npm run deploy');
  } else {
    console.log('\n⚠️  请修复上述问题后重新部署');
  }
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('使用方法:');
    console.log('  node fix-production.js        // 检查生产环境问题');
    console.log('  node fix-production.js --help // 显示帮助');
    return;
  }
  
  runChecks();
}

// 运行
main();
