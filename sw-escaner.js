/* Antiguo service worker de la raíz de puntofibra.github.io.
 *
 * Reclamaba todo el dominio ("/") y por eso pisaba al resto de aplicaciones.
 * Ya no cachea nada: borra sus cachés antiguas, se da de baja y recarga las
 * pestañas abiertas. El escáner usa ahora /escaner/sw.js.
 * No toca las cachés nuevas, que empiezan por 'pf-'.
 *
 * No borres este archivo: tiene que seguir ahí hasta que todos los móviles
 * que tenían el worker viejo hayan pasado por aquí al menos una vez.
 */
self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil((async function () {
    try {
      const nombres = await caches.keys();
      await Promise.all(nombres
        .filter(function (n) { return n.indexOf('pf-') !== 0; })
        .map(function (n) { return caches.delete(n); }));
    } catch (err) { /* da igual */ }
    try { await self.registration.unregister(); } catch (err) { /* da igual */ }
    try {
      const ventanas = await self.clients.matchAll({ type: 'window' });
      ventanas.forEach(function (c) { c.navigate(c.url); });
    } catch (err) { /* da igual */ }
  })());
});
