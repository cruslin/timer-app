/* Network-first: always pick up the latest deploy when online, fall back to the
   cached copy when offline. Query strings (?view=projector) are ignored for
   cache matching so every window loads the same cached page. */
const CACHE = 'timer-app';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', e => {
  const req = e.request;
  if(req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;

  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const res = await fetch(req, {cache: 'no-cache'});
      if(res.ok) cache.put(req, res.clone());
      return res;
    } catch(err) {
      const hit = await cache.match(req, {ignoreSearch: true});
      if(hit) return hit;
      if(req.mode === 'navigate') {
        const page = await cache.match('index.html', {ignoreSearch: true});
        if(page) return page;
      }
      throw err;
    }
  })());
});
