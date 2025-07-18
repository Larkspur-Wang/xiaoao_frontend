#!/usr/bin/env node

/**
 * 图标生成脚本
 * 为PWA生成所需的图标文件
 */

const fs = require('fs');
const path = require('path');

const iconSizes = [36, 48, 72, 96, 128, 144, 152, 192, 384, 512];

// 创建图标目录
const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('🎨 生成PWA图标...');

// 生成SVG图标内容
function generateSVG(size) {
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#007AFF;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0056CC;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad)"/>
  <text x="50%" y="50%" text-anchor="middle" dy="0.3em" fill="white" font-family="Arial, sans-serif" font-size="${Math.floor(size/4)}" font-weight="bold">小奥</text>
</svg>`;
}

// 生成HTML文件用于转换
function generateHTML(size) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; padding: 20px; background: #f0f0f0; }
    .icon { 
      width: ${size}px; 
      height: ${size}px; 
      background: linear-gradient(135deg, #007AFF, #0056CC);
      border-radius: ${size * 0.2}px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-family: Arial, sans-serif;
      font-size: ${Math.floor(size/4)}px;
      font-weight: bold;
      box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
    }
  </style>
</head>
<body>
  <div class="icon">小奥</div>
  <p>右键点击图标 → 另存为图片 → 保存为 icon-${size}X${size}.png</p>
</body>
</html>`;
}

// 生成所有尺寸的图标
iconSizes.forEach(size => {
  // 生成SVG文件
  const svgContent = generateSVG(size);
  const svgPath = path.join(iconsDir, `icon-${size}x${size}.svg`);
  fs.writeFileSync(svgPath, svgContent);
  
  // 生成HTML预览文件
  const htmlContent = generateHTML(size);
  const htmlPath = path.join(iconsDir, `icon-${size}x${size}.html`);
  fs.writeFileSync(htmlPath, htmlContent);
  
  console.log(`✅ 生成 ${size}x${size} 图标文件`);
});

// 生成favicon.ico
const faviconSVG = generateSVG(32);
const faviconPath = path.join(__dirname, 'favicon.svg');
fs.writeFileSync(faviconPath, faviconSVG);

console.log('\n📋 生成完成！');
console.log('\n🔧 下一步操作:');
console.log('1. 打开 icons/ 目录中的 HTML 文件');
console.log('2. 右键点击图标，选择"另存为图片"');
console.log('3. 保存为对应的 PNG 文件名（如 icon-192X192.png）');
console.log('4. 或者使用在线工具将 SVG 转换为 PNG');

console.log('\n🌐 在线转换工具推荐:');
console.log('- https://convertio.co/svg-png/');
console.log('- https://cloudconvert.com/svg-to-png');

console.log('\n📱 PWA 图标要求:');
console.log('- 192x192: 主屏幕图标');
console.log('- 512x512: 启动画面图标');
console.log('- 其他尺寸: 不同设备适配');

// 检查现有图标
console.log('\n🔍 检查现有图标:');
iconSizes.forEach(size => {
  const pngPath = path.join(iconsDir, `icon-${size}X${size}.png`);
  if (fs.existsSync(pngPath)) {
    console.log(`✅ icon-${size}X${size}.png 存在`);
  } else {
    console.log(`❌ icon-${size}X${size}.png 缺失`);
  }
});

console.log('\n💡 提示:');
console.log('完成图标生成后，重新启动开发服务器以应用更改。');
