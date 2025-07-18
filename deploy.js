#!/usr/bin/env node

/**
 * Cloudflare Pages 部署脚本
 * 自动处理部署流程和错误
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 OTIS助手 - Cloudflare Pages 部署工具');
console.log('='.repeat(50));

// 检查必要文件
function checkRequiredFiles() {
  const requiredFiles = [
    'index.html',
    'manifest.json',
    'sw.js',
    'styles.css',
    'app.js',
    'api-client.js',
    'chat-history.js'
  ];
  
  console.log('📋 检查必要文件...');
  
  const missingFiles = [];
  requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file}`);
      missingFiles.push(file);
    }
  });
  
  if (missingFiles.length > 0) {
    console.log(`\n❌ 缺少必要文件: ${missingFiles.join(', ')}`);
    process.exit(1);
  }
  
  console.log('✅ 所有必要文件都存在\n');
}

// 检查图标文件
function checkIcons() {
  const iconsDir = 'icons';
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
  
  console.log('🎨 检查图标文件...');
  
  if (!fs.existsSync(iconsDir)) {
    console.log('⚠️  icons目录不存在，将跳过图标检查');
    return;
  }
  
  let missingIcons = 0;
  requiredIcons.forEach(icon => {
    const iconPath = path.join(iconsDir, icon);
    if (fs.existsSync(iconPath)) {
      console.log(`✅ ${icon}`);
    } else {
      console.log(`⚠️  ${icon} (缺失)`);
      missingIcons++;
    }
  });
  
  if (missingIcons > 0) {
    console.log(`\n⚠️  缺少 ${missingIcons} 个图标文件，但不影响部署`);
  }
  
  console.log('');
}

// 执行部署
function deploy() {
  console.log('🌐 开始部署到Cloudflare Pages...');
  console.log('使用命令: npx wrangler pages deploy .\n');
  
  const deployProcess = spawn('npx', ['wrangler', 'pages', 'deploy', '.'], {
    stdio: 'inherit',
    shell: true
  });
  
  deployProcess.on('close', (code) => {
    if (code === 0) {
      console.log('\n🎉 部署成功！');
      console.log('\n📋 后续步骤:');
      console.log('1. 访问Cloudflare Pages Dashboard查看部署状态');
      console.log('2. 配置自定义域名（可选）');
      console.log('3. 测试PWA功能');
      console.log('4. 在移动设备上测试安装功能');
    } else {
      console.log('\n❌ 部署失败');
      console.log('\n🔧 可能的解决方案:');
      console.log('1. 检查Wrangler登录状态: npx wrangler auth list');
      console.log('2. 重新登录: npx wrangler login');
      console.log('3. 检查项目名称是否冲突');
      console.log('4. 尝试手动在Cloudflare Dashboard中创建Pages项目');
      
      process.exit(code);
    }
  });
  
  deployProcess.on('error', (error) => {
    console.error('\n❌ 部署过程中出现错误:', error.message);
    console.log('\n💡 建议:');
    console.log('1. 确保已安装Node.js和npm');
    console.log('2. 检查网络连接');
    console.log('3. 尝试更新Wrangler: npm install -g wrangler@latest');
    process.exit(1);
  });
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('使用方法:');
    console.log('  node deploy.js           // 执行部署');
    console.log('  node deploy.js --help    // 显示帮助');
    console.log('  node deploy.js --check   // 仅检查文件');
    return;
  }
  
  if (args.includes('--check')) {
    checkRequiredFiles();
    checkIcons();
    console.log('✅ 检查完成，文件准备就绪');
    return;
  }
  
  // 执行完整的部署流程
  checkRequiredFiles();
  checkIcons();
  deploy();
}

// 运行
main();
