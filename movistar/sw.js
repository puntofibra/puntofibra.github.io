/* Movistar prepago · service worker (ámbito /movistar/)
 *
 * Regla: el HTML se pide siempre a la red y la caché es solo el respaldo
 * para cuando no hay cobertura. Así una versión nueva entra sola.
 * Si algún día hace falta forzar el vaciado, sube el número de CACHE.
 *
 * Importante: este worker solo toca URLs de /movistar/ y solo borra cachés
 * que empiecen por 'pf-movistar-', para no pisar al resto de aplicaciones
 * que viven en el mismo dominio.
 */
const CACHE = 'pf-movistar-v1';
const ESENCIALES = [
  '/movistar/',
  '/movistar/manifest.webmanifest',
  '/movistar/icono.svg'
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
      return Promise.all(nombres
        .filter(function (n) { return n.indexOf('pf-movistar-') === 0 && n !== CACHE; })
        .map(function (n) { return caches.delete(n); }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.indexOf('/movistar/') !== 0) return;

  e.respondWith(
    fetch(req).then(function (res) {
      const copia = res.clone();
      caches.open(CACHE).then(function (c) { c.put(req, copia); }).catch(function () {});
      return res;
    }).catch(function () {
      return caches.match(req).then(function (hit) {
        return hit || caches.match('/movistar/');
      });
    })
  );
});
