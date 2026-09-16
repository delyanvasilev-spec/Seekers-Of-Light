const CACHE_NAME = 'seekers-sheet-v2.17';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './fontawesome.min.css',
  './icon-192.png',
  './icon-512.png'
];

// Pre-cache the app shell on install.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Clean up old versioned caches on activate.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Stale-while-revalidate for everything, including cross-origin CDN requests
// (Tailwind, Font Awesome, Google Fonts). This means: serve instantly from
// cache if we have it, and quietly refresh the cache in the background for
// next time. First load of any given file still needs network access; after
// that, the sheet works fully offline.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            cache.put(event.request, response.clone());
          }
          return response;
        })
        .catch(() => cached); // offline and not cached yet: nothing we can do

      return cached || networkFetch;
    })
  );
});
