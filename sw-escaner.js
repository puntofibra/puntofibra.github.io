/* Escaner de SIM · service worker
 * Guarda la app para que abra sin cobertura. Las llamadas a Apps Script
 * nunca se cachean: siempre van a la red.
 */
const CACHE = 'escaner-v1';
const ESENCIALES = ['/escaner.html', '/escaner.webmanifest', '/icono-escaner.svg'];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(ESENCIALES); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (ks) {
      return Promise.all(ks.map(function (k) {
        return k === CACHE ? null : caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const propio = url.origin === self.location.origin;
  const zxing = url.hostname === 'unpkg.com';
  if (!propio && !zxing) return;   // Apps Script va directo, sin tocar

  e.respondWith(
    caches.match(req).then(function (guardado) {
      const red = fetch(req).then(function (res) {
        if (res && (res.status === 200 || res.type === 'opaque')) {
          const copia = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copia); });
        }
        return res;
      }).catch(function () { return guardado; });
      return guardado || red;
    })
  );
});
