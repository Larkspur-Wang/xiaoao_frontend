#!/usr/bin/env node

/**
 * 端口清理工具
 * 用于清理被占用的端口
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const port = process.argv[2] || '3000';

console.log(`🔍 检查端口 ${port} 的占用情况...`);

async function killPort(port) {
  try {
    if (process.platform === 'win32') {
      // Windows
      const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
      if (stdout) {
        console.log('发现占用端口的进程:');
        console.log(stdout);
        
        // 提取PID
        const lines = stdout.trim().split('\n');
        const pids = new Set();
        
        lines.forEach(line => {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 5) {
            const pid = parts[parts.length - 1];
            if (pid && pid !== '0') {
              pids.add(pid);
            }
          }
        });
        
        if (pids.size > 0) {
          console.log(`\n🔪 终止进程 PID: ${Array.from(pids).join(', ')}`);
          
          for (const pid of pids) {
            try {
              await execAsync(`taskkill /PID ${pid} /F`);
              console.log(`✅ 已终止进程 ${pid}`);
            } catch (error) {
              console.log(`❌ 无法终止进程 ${pid}: ${error.message}`);
            }
          }
        }
      } else {
        console.log(`✅ 端口 ${port} 未被占用`);
      }
    } else {
      // Unix/Linux/macOS
      const { stdout } = await execAsync(`lsof -ti:${port}`);
      if (stdout.trim()) {
        const pids = stdout.trim().split('\n');
        console.log(`发现占用端口的进程 PID: ${pids.join(', ')}`);
        
        for (const pid of pids) {
          try {
            await execAsync(`kill -9 ${pid}`);
            console.log(`✅ 已终止进程 ${pid}`);
          } catch (error) {
            console.log(`❌ 无法终止进程 ${pid}: ${error.message}`);
          }
        }
      } else {
        console.log(`✅ 端口 ${port} 未被占用`);
      }
    }
  } catch (error) {
    if (error.message.includes('command not found') || error.message.includes('not recognized')) {
      console.log(`⚠️  无法检查端口占用情况`);
      console.log('请手动检查并关闭占用端口的程序');
    } else {
      console.log(`✅ 端口 ${port} 未被占用`);
    }
  }
}

async function main() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log('使用方法:');
    console.log('  node kill-port.js [端口号]');
    console.log('  node kill-port.js 3000    // 清理端口3000');
    console.log('  node kill-port.js --help  // 显示帮助');
    return;
  }
  
  await killPort(port);
  
  console.log('\n💡 提示:');
  console.log('  现在可以重新启动开发服务器:');
  console.log('  npm run dev');
}

main().catch(console.error);
