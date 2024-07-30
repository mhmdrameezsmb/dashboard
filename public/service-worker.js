const CACHE_NAME = 'alsan-gym-cache-v1';
const urlsToCache = [
  '/',
  '/styles.css',
  '/scripts.js',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Add other assets you want to cache
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});
