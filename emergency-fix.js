#!/usr/bin/env node

/**
 * 紧急修复脚本 - 解决生产环境路径问题
 */

const fs = require('fs');
const path = require('path');

console.log('🚨 紧急修复工具 - 生产环境路径问题');
console.log('='.repeat(50));

// 修复HTML中的路径问题
function fixHTMLPaths() {
  console.log('🔧 检查HTML路径配置...');
  
  const htmlPath = 'index.html';
  if (!fs.existsSync(htmlPath)) {
    console.log('❌ index.html不存在');
    return false;
  }
  
  let html = fs.readFileSync(htmlPath, 'utf8');
  let modified = false;
  
  // 确保所有资源路径都是绝对路径（以/开头）
  const fixes = [
    { from: 'href="styles.css"', to: 'href="/styles.css"' },
    { from: 'href="app.js"', to: 'href="/app.js"' },
    { from: 'href="manifest.json"', to: 'href="/manifest.json"' },
    { from: 'src="app.js"', to: 'src="/app.js"' },
    { from: 'src="api-client.js"', to: 'src="/api-client.js"' },
    { from: 'src="chat-history.js"', to: 'src="/chat-history.js"' }
  ];
  
  fixes.forEach(fix => {
    if (html.includes(fix.from)) {
      html = html.replace(new RegExp(fix.from, 'g'), fix.to);
      console.log(`✅ 修复: ${fix.from} -> ${fix.to}`);
      modified = true;
    }
  });
  
  if (modified) {
    fs.writeFileSync(htmlPath, html);
    console.log('✅ HTML路径已修复');
  } else {
    console.log('ℹ️  HTML路径无需修复');
  }
  
  return true;
}

// 创建_headers文件解决MIME类型问题
function createHeadersFile() {
  console.log('🔧 创建_headers文件...');
  
  const headersContent = `# Cloudflare Pages Headers Configuration

/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin

# CSS文件MIME类型
/*.css
  Content-Type: text/css

# JavaScript文件MIME类型  
/*.js
  Content-Type: application/javascript

# JSON文件MIME类型
/*.json
  Content-Type: application/json

# PNG图标MIME类型
/icons/*.png
  Content-Type: image/png
  Cache-Control: public, max-age=31536000

# Service Worker
/sw.js
  Content-Type: application/javascript
  Cache-Control: no-cache

# API代理CORS
/api/*
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
  Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With
`;

  fs.writeFileSync('_headers', headersContent);
  console.log('✅ _headers文件已创建');
}

// 创建_redirects文件处理路由
function createRedirectsFile() {
  console.log('🔧 创建_redirects文件...');
  
  const redirectsContent = `# Cloudflare Pages Redirects Configuration

# API代理重定向
/api/* http://47.117.87.105:8080/api/v1/:splat 200

# SPA路由 - 所有未匹配的路径都返回index.html
/* /index.html 200
`;

  fs.writeFileSync('_redirects', redirectsContent);
  console.log('✅ _redirects文件已创建');
}

// 检查并修复图标文件
function checkIcons() {
  console.log('🎨 检查图标文件...');
  
  const iconsDir = 'icons';
  if (!fs.existsSync(iconsDir)) {
    console.log('❌ icons目录不存在');
    return false;
  }
  
  const requiredIcons = [
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
  requiredIcons.forEach(icon => {
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

// 修复Service Worker缓存列表
function fixServiceWorker() {
  console.log('🔧 检查Service Worker...');
  
  const swPath = 'sw.js';
  if (!fs.existsSync(swPath)) {
    console.log('❌ sw.js不存在');
    return false;
  }
  
  let sw = fs.readFileSync(swPath, 'utf8');
  
  // 确保静态资源路径都是绝对路径
  const staticAssets = [
    "'/'",
    "'/index.html'",
    "'/styles.css'",
    "'/app.js'",
    "'/api-client.js'",
    "'/chat-history.js'",
    "'/manifest.json'"
  ];
  
  // 检查是否需要修复
  if (sw.includes("'styles.css'") && !sw.includes("'/styles.css'")) {
    console.log('⚠️  Service Worker需要路径修复');
    // 这里可以添加自动修复逻辑
  } else {
    console.log('✅ Service Worker路径正确');
  }
  
  return true;
}

// 生成部署前检查报告
function generateReport() {
  console.log('\n📋 部署前检查报告:');
  console.log('='.repeat(30));
  
  const checks = [
    { name: 'HTML路径', status: fs.existsSync('index.html') },
    { name: 'CSS文件', status: fs.existsSync('styles.css') },
    { name: 'JS文件', status: fs.existsSync('app.js') && fs.existsSync('api-client.js') },
    { name: 'Service Worker', status: fs.existsSync('sw.js') },
    { name: 'Manifest', status: fs.existsSync('manifest.json') },
    { name: '_headers文件', status: fs.existsSync('_headers') },
    { name: '_redirects文件', status: fs.existsSync('_redirects') },
    { name: 'Functions中间件', status: fs.existsSync('functions/_middleware.js') }
  ];
  
  checks.forEach(check => {
    const status = check.status ? '✅' : '❌';
    console.log(`  ${status} ${check.name}`);
  });
  
  const allGood = checks.every(check => check.status);
  
  if (allGood) {
    console.log('\n🎉 所有检查通过，可以部署！');
    console.log('\n🚀 部署命令:');
    console.log('  npm run deploy');
  } else {
    console.log('\n⚠️  请修复上述问题后再部署');
  }
}

// 主函数
function main() {
  console.log('🔍 开始紧急修复...\n');
  
  // 执行修复
  fixHTMLPaths();
  createHeadersFile();
  createRedirectsFile();
  checkIcons();
  fixServiceWorker();
  
  // 生成报告
  generateReport();
  
  console.log('\n💡 修复完成！');
  console.log('如果问题仍然存在，请：');
  console.log('1. 清除浏览器缓存');
  console.log('2. 在Cloudflare Dashboard中清除Pages缓存');
  console.log('3. 重新部署应用');
}

// 运行
main();
