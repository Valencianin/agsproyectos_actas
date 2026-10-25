/* Guarda la aplicación en el iPad para poder usarla en obra sin cobertura. */
var VERSION = 'actas-ags-v6';
var ARCHIVOS = ['./', './index.html', './manifest.webmanifest', './obras.json', './jspdf.umd.min.js', './pdf.js', './icono-192.png', './icono-512.png'];

self.addEventListener('install', function(evento){
  evento.waitUntil(
    caches.open(VERSION).then(function(cache){ return cache.addAll(ARCHIVOS); })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(evento){
  evento.waitUntil(
    caches.keys().then(function(claves){
      return Promise.all(claves.map(function(c){
        if(c !== VERSION) return caches.delete(c);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

/* Sirve desde la copia guardada y, si hay red, la refresca por detrás. */
self.addEventListener('fetch', function(evento){
  if(evento.request.method !== 'GET') return;
  evento.respondWith(
    caches.match(evento.request).then(function(guardado){
      var red = fetch(evento.request).then(function(respuesta){
        if(respuesta && respuesta.status === 200 && respuesta.type === 'basic'){
          var copia = respuesta.clone();
          caches.open(VERSION).then(function(cache){ cache.put(evento.request, copia); });
        }
        return respuesta;
      }).catch(function(){ return guardado; });
      return guardado || red;
    })
  );
});
