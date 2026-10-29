/**
 * sw.js - Service Worker для оффлайн-доступа к конспектам
 * Кэширует app shell (HTML, стили, скрипты, шрифты) и зашифрованные blobs
 */

const CACHE_NAME = 'fpm-conspects-v3.0';
const APP_SHELL = [
  './',
  'index.html',
  'styles/main.css',
  'styles/components.css',
  'app/app.js',
  'app/crypto.js',
  'app/search.js',
  'app/admin.js',
  'manifest.json',
  'metadata.bin',
  'fonts/unbounded-variable.woff2',
  'fonts/golos-text-variable.woff2'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Кэшируем оболочку приложения, пропуская несуществующие файлы шрифтов
      return Promise.all(
        APP_SHELL.map((url) => {
          return cache.add(url).catch(() => {
            // Игнорируем отсутствие необязательных файлов (например, если шрифты еще не скачаны)
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
  // Для запросов blobs/ и shell: Network-First с фоллбэком на Cache
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
