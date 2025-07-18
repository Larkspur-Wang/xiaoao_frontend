# OTIS助手本地PWA测试指南

## 🎯 快速开始

### 1. 环境要求

- Node.js 14+ (推荐使用最新LTS版本)
- 现代浏览器 (Chrome 88+, Firefox 85+, Safari 14+)
- 可选：Git (用于版本控制)

### 2. 安装和启动

#### 方法1：使用npm脚本（推荐）
```bash
# 安装依赖（如果需要）
npm install

# 启动开发服务器（包含API模拟）
npm run dev

# 或者使用
npm start
```

#### 方法2：直接运行测试服务器
```bash
node local-test.js
```

#### 方法3：使用简单HTTP服务器
```bash
# 使用serve
npm run serve

# 或使用Python
python -m http.server 3000
```

### 3. 访问应用

启动成功后，在浏览器中访问：
- **HTTP**: http://localhost:3000
- **HTTPS**: https://localhost:3443 (如果证书生成成功)

### 4. 功能测试

#### 基本功能测试
1. **界面加载测试**
   - 打开 http://localhost:3000
   - 检查页面是否正常加载
   - 验证响应式设计在不同屏幕尺寸下的表现

2. **登录功能测试**
   - 选择用户身份（admin_001 或其他）
   - 点击登录按钮
   - 验证登录状态和用户信息显示

3. **对话功能测试**
   - 创建新会话
   - 发送测试消息
   - 验证消息显示和打字动画
   - 测试流式响应（如果连接到真实API）

4. **历史管理功能测试**
   - 创建多个会话
   - 测试智能标题生成
   - 使用搜索功能查找会话
   - 编辑会话标题
   - 删除会话

#### 界面优化验证
1. **现代化设计检查**
   - 验证消息气泡样式（类似手机AI助手）
   - 检查配色方案和视觉效果
   - 测试打字动画和微交互

2. **移动端体验**
   - 在手机浏览器中测试
   - 验证触摸交互
   - 检查键盘弹出时的界面适配

## 🐛 问题修复说明

### 已修复的问题

1. **会话列表显示问题**
   - ✅ 修复了智能标题生成逻辑
   - ✅ 现在会根据消息内容生成有意义的标题
   - ✅ 如果没有消息，会使用会话ID的简短形式

2. **Service Worker 404错误**
   - ✅ 更新了sw.js文件，包含chat-history.js
   - ✅ 修复了图标路径大小写问题
   - ✅ 改进了缓存策略

3. **PWA安装问题**
   - ✅ 更新了manifest.json配置
   - ✅ 修复了meta标签（添加mobile-web-app-capable）
   - ✅ 更新了主题色为iOS风格

### PWA功能测试

访问 `http://localhost:3000/pwa-test.html` 进行详细的PWA功能测试。

## 🔌 API连接测试

### 1. 本地模拟API测试

本地测试服务器提供了基本的API模拟功能：

```bash
# 启动本地服务器（包含API模拟）
npm run dev
```

模拟的API端点：
- `GET /api/v1/health` - 健康检查
- `POST /api/v1/auth/login` - 用户登录

### 2. 连接真实API测试

要连接到真实的后端API：

1. **修改API地址**
   ```javascript
   // 在 app.js 中修改
   apiClient.setBaseURL('http://47.117.87.105:8080/api/v1');
   ```

2. **测试API连接**
   ```bash
   # 在浏览器控制台执行
   fetch('http://47.117.87.105:8080/api/v1/health')
     .then(r => r.json())
     .then(console.log)
   ```

3. **CORS问题解决**
   如果遇到跨域问题，可以：
   - 使用浏览器扩展禁用CORS
   - 或在后端配置CORS头

### 3. 网络状态检测

应用包含网络状态检测功能：
```javascript
// 检查网络状态
console.log('在线状态:', navigator.onLine);

// 监听网络变化
window.addEventListener('online', () => console.log('网络已连接'));
window.addEventListener('offline', () => console.log('网络已断开'));
```

## �️ 调试工具和技巧

### 1. 浏览器开发者工具

#### 控制台调试
```javascript
// 检查API客户端状态
console.log('API客户端:', apiClient);
console.log('当前用户:', apiClient.user);
console.log('认证令牌:', apiClient.token);

// 检查历史管理器
console.log('历史管理器:', chatHistoryManager);

// 查看当前会话
console.log('当前会话ID:', currentSessionId);
```

#### 网络面板
1. 打开开发者工具 → Network
2. 监控API请求和响应
3. 检查请求头和响应状态

#### Application面板
1. 检查Service Worker状态
2. 查看IndexedDB数据
3. 验证Manifest文件

### 2. 常见问题排查

#### 问题1：页面无法加载
**症状**: 白屏或404错误
**解决方案**:
```bash
# 检查服务器是否启动
netstat -an | grep 3000

# 重新启动服务器
npm run dev
```

#### 问题2：API请求失败
**症状**: 网络错误或CORS错误
**解决方案**:
1. 检查API地址是否正确
2. 验证网络连接
3. 检查CORS配置

#### 问题3：历史功能不工作
**症状**: 搜索或保存失败
**解决方案**:
```javascript
// 检查IndexedDB支持
if ('indexedDB' in window) {
  console.log('IndexedDB支持正常');
} else {
  console.log('浏览器不支持IndexedDB');
}

// 手动初始化历史管理器
chatHistoryManager.init().then(() => {
  console.log('历史管理器初始化成功');
});
```

#### 问题4：PWA安装失败
**症状**: 无法添加到主屏幕
**解决方案**:
1. 确保使用HTTPS（或localhost）
2. 检查Manifest文件
3. 验证Service Worker注册

### 3. 性能监控

#### Lighthouse测试
```bash
# 在Chrome中
1. 打开开发者工具
2. 切换到Lighthouse面板
3. 选择PWA和性能测试
4. 点击"Generate report"
```

#### 手动性能检查
```javascript
// 测量页面加载时间
console.time('页面加载');
window.addEventListener('load', () => {
  console.timeEnd('页面加载');
});

// 监控内存使用
if (performance.memory) {
  console.log('内存使用:', {
    used: Math.round(performance.memory.usedJSHeapSize / 1048576) + 'MB',
    total: Math.round(performance.memory.totalJSHeapSize / 1048576) + 'MB'
  });
}
```

## ��🔍 PWA功能测试清单

### 1. 基本功能测试

- [ ] 访问 `http://localhost:3000`
- [ ] 检查页面是否正常加载
- [ ] 验证所有交互功能

### 2. PWA安装测试

#### Chrome浏览器测试
1. 打开 `chrome://inspect/#service-workers`
2. 访问 `http://localhost:3000`
3. 检查Service Worker是否注册成功
4. 打开DevTools → Application → Service Workers
5. 验证缓存是否工作

#### 移动端测试
1. **Android Chrome**:
   - 访问 `http://localhost:3000`
   - 点击地址栏右侧的菜单
   - 应该看到"添加到主屏幕"选项

2. **iOS Safari**:
   - 访问 `http://localhost:3000`
   - 点击分享按钮
   - 应该看到"添加到主屏幕"选项

### 3. Service Worker测试

```javascript
// 在浏览器控制台执行
// 检查Service Worker状态
navigator.serviceWorker.controller

// 检查缓存
caches.keys().then(keys => console.log('Caches:', keys))

// 检查离线功能
window.addEventListener('offline', () => console.log('进入离线模式'))
```

### 4. Manifest验证

在Chrome DevTools中：
1. 打开 Application → Manifest
2. 检查所有字段是否正确显示
3. 验证图标是否正常加载

## 📱 真机测试

### Android设备测试

1. **USB调试模式**:
   ```bash
   # 安装ADB工具
   adb devices
   adb forward tcp:3000 tcp:3000
   ```

2. **在手机上访问**:
   - 在手机浏览器输入: `http://[电脑IP]:3000`
   - 或使用 `chrome://inspect` 远程调试

### iOS设备测试

1. **使用Safari开发菜单**:
   - 连接iPhone到Mac
     - Safari → 开发 → [设备名称] → localhost:3000

## 🔧 常见问题解决

### 1. Service Worker未注册

**症状**: `navigator.serviceWorker.controller` 返回 `null`

**解决方案**:
```javascript
// 检查是否支持Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('SW registered:', reg))
        .catch(err => console.log('SW error:', err));
}
```

### 2. HTTPS要求

**症状**: PWA功能在HTTP环境下不可用

**解决方案**:
使用mkcert创建本地HTTPS证书：

```bash
# 安装mkcert
brew install mkcert  # macOS
choco install mkcert  # Windows

# 创建证书
mkcert -install
mkcert localhost

# 使用HTTPS服务器
https-server -p 3443 -c-1 --cert localhost.pem --key localhost-key.pem
```

### 3. 图标不显示

**症状**: Manifest中图标404错误

**检查步骤**:
1. 确认 `icons/` 目录存在
2. 检查manifest.json中的路径
3. 验证所有图标文件存在

## 🧪 高级测试

### 1. 离线功能测试

```bash
# 模拟离线状态
# 在Chrome DevTools中：
# Network → Throttling → Offline
```

### 2. 性能测试

使用Lighthouse:
1. Chrome DevTools → Lighthouse
2. 选择 "Progressive Web App"
3. 点击 "Generate report"

### 3. 缓存测试

```javascript
// 测试缓存更新
caches.open('otis-assistant-v2').then(cache => {
    cache.keys().then(requests => {
        console.log('Cached files:', requests.length);
    });
});
```

## 📋 测试清单

### 基本功能
- [ ] 页面加载正常
- [ ] 响应式设计工作
- [ ] 所有交互功能正常

### PWA特性
- [ ] Service Worker注册成功
- [ ] Manifest文件加载正确
- [ ] 图标显示正常
- [ ] 离线功能工作
- [ ] 可以安装到主屏幕

### 移动端测试
- [ ] 触摸交互正常
- [ ] 屏幕适配良好
- [ ] 安装提示出现
- [ ] 启动画面正常

### 性能测试
- [ ] 首屏加载时间 < 3秒
- [ ] Lighthouse分数 > 90
- [ ] 离线访问正常

## 🚀 下一步

完成本地测试后：
1. 替换占位符图标为实际图标
2. 更新API端点配置
3. 部署到Cloudflare Pages
4. 进行生产环境测试

## 📞 技术支持

如果遇到问题：
1. 检查浏览器控制台错误
2. 验证网络连接
3. 确认文件权限和路径
4. 使用Chrome DevTools调试