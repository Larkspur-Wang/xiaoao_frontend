#!/usr/bin/env node

/**
 * 开发环境启动脚本
 * 提供友好的开发体验和自动化测试
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 OTIS助手开发环境启动器');
console.log('='.repeat(50));

// 检查Node.js版本
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion < 14) {
  console.log('⚠️  警告: 建议使用Node.js 14或更高版本');
  console.log(`   当前版本: ${nodeVersion}`);
}

// 检查必要文件
const requiredFiles = [
  'index.html',
  'app.js',
  'api-client.js',
  'chat-history.js',
  'styles.css',
  'local-test.js'
];

console.log('📋 检查必要文件...');
let missingFiles = [];

requiredFiles.forEach(file => {
  if (fs.existsSync(path.join(__dirname, file))) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - 文件缺失`);
    missingFiles.push(file);
  }
});

if (missingFiles.length > 0) {
  console.log('\n❌ 发现缺失文件，请检查项目完整性');
  process.exit(1);
}

// 检查端口占用
function checkPort(port) {
  return new Promise((resolve) => {
    const net = require('net');
    const server = net.createServer();

    server.listen(port, (err) => {
      if (err) {
        resolve(false); // 端口被占用
      } else {
        server.once('close', () => {
          resolve(true); // 端口可用
        });
        server.close();
      }
    });

    server.on('error', (err) => {
      resolve(false); // 端口被占用
    });
  });
}

// 查找可用端口
async function findAvailablePort(startPort = 3000) {
  for (let port = startPort; port <= startPort + 10; port++) {
    if (await checkPort(port)) {
      return port;
    }
  }
  throw new Error('无法找到可用端口');
}

// 启动开发服务器
async function startDevServer() {
  console.log('\n🔍 检查端口占用...');

  try {
    const availablePort = await findAvailablePort(3000);
    console.log(`✅ 找到可用端口: ${availablePort}`);

    if (availablePort !== 3000) {
      console.log(`⚠️  端口3000被占用，使用端口${availablePort}`);
    }

    console.log('\n🌐 启动开发服务器...');

    // 设置环境变量传递端口号
    const env = { ...process.env, PORT: availablePort.toString() };

    const server = spawn('node', ['local-test.js'], {
      stdio: 'inherit',
      cwd: __dirname,
      env: env
    });
  
  server.on('error', (error) => {
    console.error('❌ 服务器启动失败:', error.message);
    process.exit(1);
  });
  
    // 等待服务器启动
    setTimeout(() => {
      console.log('\n📱 访问地址:');
      console.log(`   HTTP:  http://localhost:${availablePort}`);
      console.log(`   HTTPS: https://localhost:${availablePort + 443} (如果证书生成成功)`);

      console.log('\n🧪 测试命令:');
      console.log('   在浏览器控制台中运行:');
      console.log('   - quickTest()     // 快速测试');
      console.log('   - testUtils.runAllTests()  // 详细测试');

      console.log('\n📚 功能测试清单:');
      console.log('   1. 界面加载和响应式设计');
      console.log('   2. 用户登录功能');
      console.log('   3. 对话功能和打字动画');
      console.log('   4. 历史会话管理');
      console.log('   5. 搜索和编辑功能');
      console.log('   6. PWA功能测试');

      console.log('\n💡 提示:');
      console.log('   - 使用Ctrl+C停止服务器');
      console.log('   - 修改代码后刷新浏览器即可看到更改');
      console.log('   - 查看LOCAL_TEST.md获取详细测试指南');

      // 尝试自动打开浏览器
      const url = `http://localhost:${availablePort}`;
      if (process.platform === 'win32') {
        exec(`start ${url}`);
      } else if (process.platform === 'darwin') {
        exec(`open ${url}`);
      } else {
        exec(`xdg-open ${url}`);
      }

    }, 2000);

  } catch (error) {
    console.error('❌ 启动失败:', error.message);
    console.log('\n💡 解决方案:');
    console.log('   1. 检查是否有其他程序占用端口');
    console.log('   2. 尝试关闭其他开发服务器');
    console.log('   3. 重启终端后重试');
    process.exit(1);
  }
  
  // 优雅关闭
  process.on('SIGINT', () => {
    console.log('\n\n👋 正在关闭开发服务器...');
    server.kill('SIGINT');
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    server.kill('SIGTERM');
    process.exit(0);
  });
}

// 显示帮助信息
function showHelp() {
  console.log('\n📖 使用说明:');
  console.log('   node start-dev.js        // 启动开发服务器');
  console.log('   node start-dev.js --help // 显示帮助信息');
  console.log('   npm run dev              // 使用npm脚本启动');
  console.log('   npm start                // 使用npm脚本启动');
  
  console.log('\n🔧 开发工具:');
  console.log('   - 本地HTTP服务器 (端口3000)');
  console.log('   - 本地HTTPS服务器 (端口3443)');
  console.log('   - API模拟功能');
  console.log('   - 自动化测试脚本');
  console.log('   - 实时调试工具');
  
  console.log('\n📁 项目结构:');
  console.log('   index.html        // 主页面');
  console.log('   app.js           // 主应用逻辑');
  console.log('   api-client.js    // API客户端');
  console.log('   chat-history.js  // 历史管理');
  console.log('   styles.css       // 样式文件');
  console.log('   local-test.js    // 测试服务器');
  console.log('   test-functions.js // 测试工具');
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }
  
  console.log('✨ 准备启动开发环境...');
  startDevServer();
}

// 运行
main();
