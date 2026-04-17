const CACHE_NAME = 'edilnord-v1';
const ASSETS = [
  '/',
  '/index.html'
];

// Installazione — mette in cache le risorse principali
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Attivazione — rimuove cache vecchie
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — rete prima, poi cache come fallback
self.addEventListener('fetch', event => {
  // Non intercettare richieste API/webhook
  if (event.request.url.includes('n8n.') ||
      event.request.url.includes('api.') ||
      event.request.url.includes('webhook') ||
      event.request.url.includes('googleapis')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Aggiorna la cache con la risposta fresca
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline — usa la cache
        return caches.match(event.request);
      })
  );
});
