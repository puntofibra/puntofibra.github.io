/* Escáner de SIM · service worker
 *
 * Regla: el HTML se pide siempre a la red y la caché es solo el respaldo
 * para cuando no hay cobertura. Así una versión nueva entra sola.
 * Si algún día hace falta forzar el vaciado, sube el número de CACHE.
 */
const CACHE = 'escaner-v2';
const ESENCIALES = [
  '/escaner.html',
  '/escaner.webmanifest',
  '/icono-escaner.svg'
];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(ESENCIALES).catch(function () { /* si algo falla, seguimos */ });
    })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (nombres) {
      return Promise.all(nombres.map(function (n) {
        return n === CACHE ? null : caches.delete(n);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // el backend y ZXing, a su aire

  const esHTML = req.mode === 'navigate' ||
    (req.headers.get('accept') || '').indexOf('text/html') >= 0;

  if (esHTML) {
    // red primero: siempre la última versión si hay cobertura
    e.respondWith(
      fetch(req).then(function (r) {
        const copia = r.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copia); });
        return r;
      }).catch(function () {
        return caches.match(req).then(function (r) {
          return r || caches.match('/escaner.html');
        });
      })
    );
    return;
  }

  // el resto (icono, manifest): caché primero, que no cambia casi nunca
  e.respondWith(
    caches.match(req).then(function (r) {
      return r || fetch(req).then(function (resp) {
        const copia = resp.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copia); });
        return resp;
      });
    })
  );
});
