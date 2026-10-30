/**
 * sw.js - Service Worker для оффлайн-доступа к конспектам ФПМ (Zero-CDN PWA)
 * Кэширует app shell (HTML, стили, скрипты, автономные шрифты) и зашифрованные blobs
 */

const CACHE_NAME = 'fpm-conspects-v6.0';
const APP_SHELL = [
  './',
  'index.html',
  'styles/main.css',
  'styles/components.css',
  'app/app.js',
  'app/crypto.js',
  'app/search.js',
  'app/admin.js',
  'app/vault-3d.js',
  'app/marginalia.js',
  'manifest.json',
  'fonts/unbounded-variable.woff2',
  'fonts/golos-text-variable.woff2',
  'fonts/cormorant-garamond-cyrillic.woff2',
  'fonts/cormorant-garamond-latin.woff2'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        APP_SHELL.map((url) => {
          return cache.add(url).catch((err) => {
            console.warn('[SW] Optional prefetch skip:', url, err.message);
          });
        })
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Network-First with Cache fallback for seamless offline resilience
  e.respondWith(
    fetch(e.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(e.request);
      })
  );
});
