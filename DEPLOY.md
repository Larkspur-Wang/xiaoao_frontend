# OTIS电梯助手小奥 - 部署指南

## 🚨 部署错误修复

### 错误1: `Missing entry-point to Worker script`
**原因**: Wrangler需要明确指定静态资源目录
**解决方案**: 使用Pages专用命令

### 错误2: `A request to the Cloudflare API (/workers/scripts/...) failed`
**原因**: Wrangler尝试部署为Workers而不是Pages
**解决方案**: 使用正确的Pages部署命令

## ✅ 正确的部署命令

```bash
# 推荐方式1: 使用npm脚本
npm run deploy

# 推荐方式2: 直接使用Pages命令
npx wrangler pages deploy .

# 推荐方式3: 指定项目名称
npx wrangler pages deploy . --project-name=otis-assistant-pwa

# ❌ 错误方式（不要使用）
# npx wrangler deploy --assets=.  # 这会尝试部署为Workers
```

## 快速部署到Cloudflare Pages

### 方法一：直接部署（最简单）

1. **准备图标文件**
   在 `icons/` 目录下创建以下图标文件：
   - icon-72x72.png
   - icon-96x96.png
   - icon-128x128.png
   - icon-144x144.png
   - icon-152x152.png
   - icon-192x192.png
   - icon-384x384.png
   - icon-512x512.png

2. **部署到Cloudflare Pages**
   1. 访问 [Cloudflare Pages](https://pages.cloudflare.com)
   2. 点击 "Create a project"
   3. 选择 "Upload assets"
   4. 上传整个项目文件夹
   5. 设置构建命令：留空（直接部署）
   6. 设置输出目录：`.`
   7. 点击 "Deploy site"

### 方法二：使用Git仓库部署

1. **初始化Git仓库**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **推送到GitHub**
   ```bash
   git remote add origin https://github.com/your-username/otis-assistant-pwa.git
   git push -u origin main
   ```

3. **连接到Cloudflare Pages**
   1. 访问 [Cloudflare Pages](https://pages.cloudflare.com)
   2. 点击 "Create a project"
   3. 选择 "GitHub" 并授权
   4. 选择 `otis-assistant-pwa` 仓库
   5. 设置构建命令：留空
   6. 设置输出目录：`.`
   7. 点击 "Deploy site"

### 方法三：使用Wrangler CLI部署

1. **安装Wrangler**
   ```bash
   npm install -g wrangler
   ```

2. **登录Cloudflare**
   ```bash
   wrangler login
   ```

3. **部署项目**
   ```bash
   wrangler pages deploy .
   ```

## 自定义域名配置

### 添加自定义域名

1. 在Cloudflare Pages控制台中，选择你的项目
2. 点击 "Custom domains"
3. 添加你的域名（如：`assistant.otis.com`）
4. 按照提示配置DNS记录

### SSL/TLS设置

1. 在Cloudflare Dashboard中，选择你的域名
2. 进入 "SSL/TLS" 设置
3. 设置SSL模式为 "Full" 或 "Full (strict)"
4. 启用 "Always Use HTTPS"

## 环境变量配置

### API端点配置

如果需要配置不同的API端点，可以创建环境变量：

1. 在Cloudflare Pages控制台中，选择你的项目
2. 点击 "Settings" > "Environment variables"
3. 添加以下变量：
   - `API_BASE_URL`: https://your-api-domain.com/api/v1

## 性能优化

### 启用Cloudflare CDN

Cloudflare Pages自动使用Cloudflare CDN，无需额外配置。

### 缓存策略

项目已经配置：
- 静态资源缓存1年
- 动态内容缓存1小时
- Service Worker缓存策略优化

## PWA配置验证

### 检查PWA功能

1. 部署完成后，访问你的网站
2. 打开Chrome DevTools > Application > Manifest
3. 验证所有字段是否正确
4. 测试Service Worker注册
5. 测试离线功能

### 安装测试

1. 在移动设备上访问网站
2. 应该看到"添加到主屏幕"提示
3. 安装后应该像原生应用一样运行

## 故障排除

### 常见问题

1. **图标不显示**
   - 确保所有图标文件存在且路径正确
   - 检查manifest.json中的图标路径

2. **Service Worker未注册**
   - 检查浏览器是否支持Service Worker
   - 检查HTTPS是否启用（localhost除外）

3. **API请求失败**
   - 检查API端点是否正确
   - 确保CORS配置正确
   - 检查网络连接

### 调试工具

使用Chrome DevTools的Application面板：
- 检查Service Worker状态
- 查看缓存内容
- 验证Manifest配置
- 测试离线功能

## 更新部署

### 更新代码

1. **直接上传更新**
   - 重新压缩项目文件
   - 在Cloudflare Pages控制台上传新版本

2. **Git仓库更新**
   - 推送更新到GitHub
   - Cloudflare Pages会自动部署

3. **Wrangler更新**
   ```bash
   wrangler pages deploy .
   ```

## 监控和分析

### 使用Cloudflare Analytics

1. 在Cloudflare Pages控制台中查看分析数据
2. 监控访问量、性能和错误率

### 添加Google Analytics（可选）

在index.html的<head>中添加：
```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## 安全建议

1. **HTTPS强制**：确保所有流量使用HTTPS
2. **内容安全策略**：在_headers文件中配置CSP
3. **API保护**：使用API密钥和速率限制
4. **输入验证**：在客户端和服务器端都进行验证

## 联系方式

如有问题，请联系开发团队。