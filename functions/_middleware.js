// Cloudflare Pages Functions 中间件
// 用于处理PWA相关的路由和缓存

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);

  // 处理CORS预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400'
      }
    });
  }
  
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
  
  // 处理API代理 - 解决HTTPS混合内容问题
  if (url.pathname.startsWith('/api/')) {
    // 处理预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    const apiPath = url.pathname.replace('/api', '');
    const targetUrl = `http://47.117.87.105:8080/api/v1${apiPath}`;

    try {
      // 创建新的请求，复制原始请求的方法、头部和body
      const cleanHeaders = {};
      for (const [key, value] of request.headers.entries()) {
        // 过滤掉可能导致问题的头部
        if (!key.toLowerCase().startsWith('cf-') &&
            !key.toLowerCase().startsWith('x-forwarded-') &&
            key.toLowerCase() !== 'host') {
          cleanHeaders[key] = value;
        }
      }

      const proxyRequest = new Request(targetUrl, {
        method: request.method,
        headers: {
          ...cleanHeaders,
          'Host': '47.117.87.105:8080',
          'User-Agent': 'OTIS-Assistant-PWA/1.0',
          'Accept': 'application/json',
          'Content-Type': request.headers.get('content-type') || 'application/json'
        },
        body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined
      });

      // 发送代理请求
      console.log('代理请求到:', targetUrl);
      const response = await fetch(proxyRequest);
      console.log('API响应状态:', response.status);

      // 创建响应，添加CORS头
      const responseHeaders = {};
      for (const [key, value] of response.headers.entries()) {
        responseHeaders[key] = value;
      }

      const proxyResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...responseHeaders,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
        }
      });

      return proxyResponse;
    } catch (error) {
      console.error('API代理错误:', error);
      return new Response(JSON.stringify({
        error: 'API代理失败',
        message: error.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
  
  // 其他请求正常处理
  return next();
}
