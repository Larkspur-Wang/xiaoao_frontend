#!/usr/bin/env node

/**
 * 快速修复脚本
 * 解决常见的开发问题
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 OTIS助手问题修复工具');
console.log('='.repeat(40));

// 检查并修复文件
function checkAndFix() {
  const issues = [];
  const fixes = [];
  
  // 1. 检查Service Worker文件
  if (!fs.existsSync('sw.js')) {
    issues.push('❌ Service Worker文件缺失');
  } else {
    fixes.push('✅ Service Worker文件存在');
  }
  
  // 2. 检查manifest.json
  if (!fs.existsSync('manifest.json')) {
    issues.push('❌ Manifest文件缺失');
  } else {
    try {
      const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
      if (manifest.theme_color === '#007AFF') {
        fixes.push('✅ Manifest主题色已更新');
      } else {
        issues.push('⚠️ Manifest主题色需要更新');
      }
    } catch (error) {
      issues.push('❌ Manifest文件格式错误');
    }
  }
  
  // 3. 检查图标文件
  const iconSizes = ['72X72', '96X96', '128X128', '144X144', '152X152', '192X192', '384X384', '512X512'];
  let missingIcons = 0;
  
  iconSizes.forEach(size => {
    const iconPath = path.join('icons', `icon-${size}.png`);
    if (!fs.existsSync(iconPath)) {
      missingIcons++;
    }
  });
  
  if (missingIcons === 0) {
    fixes.push('✅ 所有图标文件存在');
  } else {
    issues.push(`❌ 缺失 ${missingIcons} 个图标文件`);
  }
  
  // 4. 检查关键JavaScript文件
  const jsFiles = ['app.js', 'api-client.js', 'chat-history.js'];
  jsFiles.forEach(file => {
    if (fs.existsSync(file)) {
      fixes.push(`✅ ${file} 存在`);
    } else {
      issues.push(`❌ ${file} 缺失`);
    }
  });
  
  // 5. 检查HTML文件中的meta标签
  if (fs.existsSync('index.html')) {
    const html = fs.readFileSync('index.html', 'utf8');
    if (html.includes('mobile-web-app-capable')) {
      fixes.push('✅ PWA meta标签已修复');
    } else {
      issues.push('⚠️ 需要添加mobile-web-app-capable标签');
    }
  }
  
  return { issues, fixes };
}

// 生成测试图标（如果缺失）
function generateTestIcons() {
  const iconsDir = 'icons';
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }
  
  const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];
  
  // 创建简单的SVG图标
  iconSizes.forEach(size => {
    const iconPath = path.join(iconsDir, `icon-${size}X${size}.png`);
    if (!fs.existsSync(iconPath)) {
      // 创建一个简单的SVG，然后说明需要转换为PNG
      const svgContent = `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#007AFF"/>
  <text x="50%" y="50%" text-anchor="middle" dy="0.3em" fill="white" font-family="Arial" font-size="${Math.floor(size/4)}" font-weight="bold">小奥</text>
</svg>`;
      
      const svgPath = path.join(iconsDir, `icon-${size}x${size}.svg`);
      fs.writeFileSync(svgPath, svgContent.trim());
      console.log(`📝 创建SVG图标: ${svgPath}`);
      console.log(`   请将SVG转换为PNG: ${iconPath}`);
    }
  });
}

// 显示修复建议
function showFixSuggestions(issues) {
  if (issues.length === 0) {
    console.log('🎉 没有发现问题！');
    return;
  }
  
  console.log('\n🔧 修复建议:');
  
  issues.forEach(issue => {
    console.log(`  ${issue}`);
    
    if (issue.includes('Service Worker')) {
      console.log('     解决方案: 确保sw.js文件存在且包含正确内容');
    }
    
    if (issue.includes('图标文件')) {
      console.log('     解决方案: 运行 generateTestIcons() 生成测试图标');
    }
    
    if (issue.includes('meta标签')) {
      console.log('     解决方案: 在index.html中添加 <meta name="mobile-web-app-capable" content="yes">');
    }
    
    if (issue.includes('Manifest')) {
      console.log('     解决方案: 检查manifest.json文件格式和内容');
    }
  });
}

// 运行检查
function runCheck() {
  console.log('🔍 检查项目文件...\n');
  
  const { issues, fixes } = checkAndFix();
  
  console.log('✅ 正常项目:');
  fixes.forEach(fix => console.log(`  ${fix}`));
  
  if (issues.length > 0) {
    console.log('\n❌ 发现问题:');
    issues.forEach(issue => console.log(`  ${issue}`));
    
    showFixSuggestions(issues);
    
    console.log('\n🛠️ 自动修复:');
    console.log('  正在生成缺失的图标文件...');
    generateTestIcons();
  }
  
  console.log('\n📋 下一步:');
  console.log('  1. 启动开发服务器: npm run dev');
  console.log('  2. 访问: http://localhost:3000');
  console.log('  3. PWA测试: http://localhost:3000/pwa-test.html');
  console.log('  4. 在浏览器控制台运行: quickTest()');
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('使用方法:');
    console.log('  node fix-issues.js        // 检查并修复问题');
    console.log('  node fix-issues.js --help // 显示帮助');
    return;
  }
  
  runCheck();
}

// 运行
main();
