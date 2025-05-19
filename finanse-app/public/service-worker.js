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
        '/assets/index-Br6ce5j3.js',
        '/assets/index-CFaJS2W2.js'
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
