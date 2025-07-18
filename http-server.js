#!/usr/bin/env node

/**
 * 简单的HTTP服务器，用于测试HTTP版本的应用
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8080;

console.log('🌐 启动HTTP服务器...');

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname;
  
  // 默认页面
  if (pathname === '/') {
    pathname = '/index.html';
  }
  
  const filePath = path.join(__dirname, pathname);
  
  // 检查文件是否存在
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    let contentType = 'text/html';
    
    switch (ext) {
      case '.js': contentType = 'application/javascript'; break;
      case '.css': contentType = 'text/css'; break;
      case '.json': contentType = 'application/json'; break;
      case '.png': contentType = 'image/png'; break;
      case '.jpg': contentType = 'image/jpeg'; break;
      case '.ico': contentType = 'image/x-icon'; break;
      case '.svg': contentType = 'image/svg+xml'; break;
    }
    
    // 设置CORS头部
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'no-cache');
    
    const fileContent = fs.readFileSync(filePath);
    res.writeHead(200);
    res.end(fileContent);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head><title>404 Not Found</title></head>
      <body>
        <h1>404 - File Not Found</h1>
        <p>The requested file <code>${pathname}</code> was not found.</p>
        <p><a href="/">返回首页</a></p>
      </body>
      </html>
    `);
  }
});

server.listen(PORT, () => {
  console.log(`✅ HTTP服务器运行在: http://localhost:${PORT}`);
  console.log('📱 现在可以测试HTTP版本的应用了！');
  console.log('💡 这个版本可以直接连接你的后端API，不会有Mixed Content问题');
  console.log('');
  console.log('🔗 访问地址:');
  console.log(`   http://localhost:${PORT}`);
  console.log('');
  console.log('⚠️  注意: 这是HTTP服务器，PWA功能可能受限');
  console.log('   如需完整PWA功能，请配置HTTPS后端API');
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n🛑 正在关闭HTTP服务器...');
  server.close(() => {
    console.log('✅ HTTP服务器已关闭');
    process.exit(0);
  });
});

// 错误处理
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ 端口 ${PORT} 已被占用`);
    console.log('请尝试:');
    console.log(`1. 关闭占用端口的程序`);
    console.log(`2. 或修改此脚本中的PORT变量`);
  } else {
    console.error('❌ 服务器错误:', error);
  }
  process.exit(1);
});
