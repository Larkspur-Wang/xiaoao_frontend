const CACHE_NAME = 'otis-assistant-v3';
const STATIC_CACHE_NAME = 'otis-static-v3';
const DYNAMIC_CACHE_NAME = 'otis-dynamic-v3';

// 需要缓存的静态资源
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/api-client.js',
  '/chat-history.js',
  '/manifest.json',
  '/icons/icon-72X72.png',
  '/icons/icon-96X96.png',
  '/icons/icon-128X128.png',
  '/icons/icon-144X144.png',
  '/icons/icon-152X152.png',
  '/icons/icon-192X192.png',
  '/icons/icon-384X384.png',
  '/icons/icon-512X512.png'
];

// 安装Service Worker并缓存资源
self.addEventListener('install', event => {
  console.log('Service Worker: 开始安装...');
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE_NAME).then(cache => {
        console.log('Service Worker: 缓存静态资源', STATIC_ASSETS);
        return cache.addAll(STATIC_ASSETS);
      }),
      caches.open(DYNAMIC_CACHE_NAME)
    ]).then(() => {
      console.log('Service Worker: 安装完成');
    }).catch(error => {
      console.error('Service Worker: 安装失败', error);
    })
  );
  self.skipWaiting();
});

// 激活Service Worker并清理旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => 
            cacheName !== STATIC_CACHE_NAME && 
            cacheName !== DYNAMIC_CACHE_NAME
          )
          .map(cacheName => caches.delete(cacheName))
      );
    })
  );
  self.clients.claim();
});

// 网络优先策略
const networkFirst = async (request) => {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('离线模式 - 内容不可用', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
};

// 缓存优先策略
const cacheFirst = async (request) => {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return new Response('离线模式 - 内容不可用', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
};

// 拦截请求
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 跳过非GET请求
  if (request.method !== 'GET') {
    return;
  }
  
  // API请求使用网络优先
  if (url.pathname.includes('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }
  
  // 静态资源使用缓存优先
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }
  
  // 其他资源使用网络优先
  event.respondWith(networkFirst(request));
});

// 处理后台同步（如果有）
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // 这里可以添加后台同步逻辑
      console.log('执行后台同步...')
    );
  }
});

// 推送通知处理
self.addEventListener('push', event => {
  const options = {
    body: '您有新的电梯消息',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('OTIS电梯助手', options)
  );
});



