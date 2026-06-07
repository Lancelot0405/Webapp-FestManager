const CACHE_NAME = 'festmanager-v3';

self.addEventListener('install', e => {
  // Kích hoạt SW mới ngay lập tức, không chờ tab cũ đóng
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  // Xóa toàn bộ cache cũ khi SW mới kích hoạt
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('supabase')) return;

  // Với HTML: luôn lấy từ network trước (network-first), fallback về cache
  // Với JS/CSS/assets: dùng cache-first nhưng update cache ngầm
  const isHTML = e.request.headers.get('accept')?.includes('text/html');

  if (isHTML) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(cached => {
        const fetchPromise = fetch(e.request).then(res => {
          caches.open(CACHE_NAME).then(c => c.put(e.request, res.clone()));
          return res;
        });
        return cached || fetchPromise;
      })
    );
  }
});

self.addEventListener('push', e => {
  const data = e.data?.json() ?? {};
  e.waitUntil(
    self.registration.showNotification(data.title ?? 'FestManager', {
      body: data.body ?? '',
      icon: '/icons/icon.svg',
      badge: '/icons/icon.svg',
      data: data.url ?? '/',
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data));
});
