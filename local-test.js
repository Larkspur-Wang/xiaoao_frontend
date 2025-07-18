/**
 * 本地PWA测试服务器
 * 运行: node local-test.js
 */
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// 配置
const HTTP_PORT = process.env.PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;

// 创建图标目录
const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

// MIME类型映射
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.manifest': 'application/manifest+json',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2'
};

/**
 * 获取文件MIME类型
 */
function getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * API模拟响应
 */
function handleAPIRequest(req, res, url) {
    const urlPath = url.pathname;

    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // 模拟API响应
    if (urlPath === '/api/v1/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '2.0.0-local-test',
            services: {
                database: { status: 'healthy', response_time_ms: 1.0 },
                super_assistant: { status: 'healthy', details: { tools_loaded: 15 } }
            }
        }));
        return;
    }

    if (urlPath === '/api/v1/auth/login' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const data = JSON.parse(body);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                message: '登录成功',
                data: {
                    access_token: 'mock_token_' + Date.now(),
                    user: {
                        user_id: data.user_id,
                        name: data.user_id === 'admin_001' ? '管理员' : '用户',
                        role: data.user_id === 'admin_001' ? 'admin' : 'user'
                    }
                }
            }));
        });
        return;
    }

    // 其他API请求返回404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'API endpoint not found in mock server' }));
}

/**
 * 处理HTTP请求
 */
function handleRequest(req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);

    // 检查是否是API请求
    if (url.pathname.startsWith('/api/')) {
        handleAPIRequest(req, res, url);
        return;
    }

    let filePath = path.join(__dirname, url.pathname === '/' ? '/index.html' : url.pathname);

    // 安全路径检查
    if (!filePath.startsWith(__dirname)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
        // SPA路由支持
        if (path.extname(filePath) === '') {
            filePath = path.join(__dirname, 'index.html');
        } else {
            res.writeHead(404);
            res.end('File not found');
            return;
        }
    }

    // 检查是否是文件
    if (!fs.statSync(filePath).isFile()) {
        res.writeHead(404);
        res.end('File not found');
        return;
    }

    const contentType = getContentType(filePath);

    try {
        const content = fs.readFileSync(filePath);
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
    } catch (error) {
        console.error('Error serving file:', error);
        res.writeHead(500);
        res.end('Server error');
    }
}

/**
 * 创建简单的HTTPS证书
 */
function createSelfSignedCert() {
    const certPath = path.join(__dirname, 'localhost.pem');
    const keyPath = path.join(__dirname, 'localhost-key.pem');
    
    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
        return { cert: fs.readFileSync(certPath), key: fs.readFileSync(keyPath) };
    }
    
    console.log('正在生成自签名证书...');
    
    // 使用openssl生成自签名证书
    const cmd = `openssl req -x509 -newkey rsa:4096 -keyout localhost-key.pem -out localhost.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"`;
    
    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.error('生成证书失败:', error);
            console.log('将使用HTTP服务器代替');
            return false;
        }
        console.log('证书生成完成');
    });
    
    return null;
}

/**
 * 创建测试图标
 */
function createTestIcons() {
    const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];
    
    iconSizes.forEach(size => {
        const iconPath = path.join(iconsDir, `icon-${size}x${size}.png`);
        if (!fs.existsSync(iconPath)) {
            // 创建简单的彩色图标
            const { createCanvas } = require('canvas');
            if (!createCanvas) {
                console.log('Canvas未安装，跳过图标生成');
                return;
            }
            
            const canvas = createCanvas(size, size);
            const ctx = canvas.getContext('2d');
            
            // 绘制背景
            ctx.fillStyle = '#1e88e5';
            ctx.fillRect(0, 0, size, size);
            
            // 绘制文字
            ctx.fillStyle = '#ffffff';
            ctx.font = `${Math.floor(size/4)}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('小奥', size/2, size/2);
            
            const buffer = canvas.toBuffer('image/png');
            fs.writeFileSync(iconPath, buffer);
            console.log(`创建图标: icon-${size}x${size}.png`);
        }
    });
}

/**
 * 启动服务器
 */
function startServers() {
    // HTTP服务器
    const httpServer = http.createServer(handleRequest);
    httpServer.listen(HTTP_PORT, () => {
        console.log(`🚀 HTTP服务器运行在: http://localhost:${HTTP_PORT}`);
        console.log(`📱 移动端测试: http://localhost:${HTTP_PORT}`);
    });
    
    // 尝试启动HTTPS服务器
    const cert = createSelfSignedCert();
    if (cert) {
        const httpsServer = https.createServer(cert, handleRequest);
        httpsServer.listen(HTTPS_PORT, () => {
            console.log(`🔒 HTTPS服务器运行在: https://localhost:${HTTPS_PORT}`);
            console.log(`📱 移动端PWA测试: https://localhost:${HTTPS_PORT}`);
        });
    }
}

/**
 * 检查依赖
 */
function checkDependencies() {
    try {
        require('canvas');
        createTestIcons();
    } catch (e) {
        console.log('安装canvas以生成图标: npm install canvas');
        console.log('暂时跳过图标生成');
    }
    
    startServers();
}

// 启动
checkDependencies();

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n👋 服务器已停止');
    process.exit(0);
});