#!/usr/bin/env node

/**
 * API连接测试脚本
 */

const https = require('https');
const http = require('http');

console.log('🔍 API连接测试');
console.log('='.repeat(40));

// 测试直接API连接
function testDirectAPI() {
  return new Promise((resolve, reject) => {
    console.log('📡 测试直接API连接...');
    
    const options = {
      hostname: '47.117.87.105',
      port: 8080,
      path: '/api/v1/health',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`✅ 直接API响应 (${res.statusCode}):`, data);
        resolve({ status: res.statusCode, data });
      });
    });

    req.on('error', (error) => {
      console.log('❌ 直接API连接失败:', error.message);
      reject(error);
    });

    req.setTimeout(5000, () => {
      console.log('⏰ 直接API连接超时');
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.end();
  });
}

// 测试Cloudflare Pages代理
function testPagesProxy() {
  return new Promise((resolve, reject) => {
    console.log('🌐 测试Cloudflare Pages代理...');
    
    const options = {
      hostname: 'bde1ec06.otis-assistant-pwa.pages.dev',
      port: 443,
      path: '/api/health',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`✅ Pages代理响应 (${res.statusCode}):`, data);
        resolve({ status: res.statusCode, data });
      });
    });

    req.on('error', (error) => {
      console.log('❌ Pages代理连接失败:', error.message);
      reject(error);
    });

    req.setTimeout(10000, () => {
      console.log('⏰ Pages代理连接超时');
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.end();
  });
}

// 测试登录API
function testLoginAPI() {
  return new Promise((resolve, reject) => {
    console.log('🔐 测试登录API...');
    
    const postData = JSON.stringify({
      user_id: 'test_user'
    });
    
    const options = {
      hostname: 'otis-assistant-pwa.pages.dev',
      port: 443,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`✅ 登录API响应 (${res.statusCode}):`, data);
        resolve({ status: res.statusCode, data });
      });
    });

    req.on('error', (error) => {
      console.log('❌ 登录API连接失败:', error.message);
      reject(error);
    });

    req.setTimeout(10000, () => {
      console.log('⏰ 登录API连接超时');
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.write(postData);
    req.end();
  });
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始API连接测试...\n');
  
  try {
    // 测试1: 直接API连接
    await testDirectAPI();
    console.log('');
    
    // 测试2: Pages代理健康检查
    await testPagesProxy();
    console.log('');
    
    // 测试3: 登录API
    await testLoginAPI();
    console.log('');
    
    console.log('🎉 所有测试完成！');
    
  } catch (error) {
    console.log('❌ 测试过程中出现错误:', error.message);
  }
  
  console.log('\n💡 如果Pages代理失败，可能需要：');
  console.log('1. 重新部署Functions中间件');
  console.log('2. 检查Cloudflare Pages设置');
  console.log('3. 等待DNS传播完成');
}

// 运行测试
runTests();
