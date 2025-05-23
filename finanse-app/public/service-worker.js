self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open('finanse-cache-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.webmanifest',
        '/assets/icon-192.png',
        '/assets/icon-512.png',
        '/assets/index-DUEJBVpI.css',
        '/assets/index-OpwuvtDC.js'
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return (
        cachedResponse ||
        fetch(event.request).catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        })
      );
    })
  );
});
