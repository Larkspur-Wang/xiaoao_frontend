// Cloudflare Pages Functions 中间件
// 用于处理PWA相关的路由和缓存

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  
  // 处理Service Worker请求
  if (url.pathname === '/sw.js') {
    const response = await next();
    
    // 确保Service Worker不被缓存
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...response.headers,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/javascript'
      }
    });
    
    return newResponse;
  }
  
  // 处理Manifest文件请求
  if (url.pathname === '/manifest.json') {
    const response = await next();
    
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...response.headers,
        'Cache-Control': 'public, max-age=0, must-revalidate',
        'Content-Type': 'application/manifest+json'
      }
    });
    
    return newResponse;
  }
  
  // 处理API代理（如果需要）
  if (url.pathname.startsWith('/api/')) {
    // 这里可以添加API代理逻辑
    // 目前直接返回404，因为我们使用外部API
    return new Response('API endpoint not found', { status: 404 });
  }
  
  // 其他请求正常处理
  return next();
}
