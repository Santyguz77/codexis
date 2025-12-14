const CACHE_NAME = 'codexis-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://checkout.wompi.co/widget.js'
];

// Instalación del service worker
self.addEventListener('install', event => {
  console.log('[SW] Instalando CODEXIS Service Worker v1...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Guardando archivos en caché...');
        return cache.addAll(urlsToCache).catch(err => {
          console.error('[SW] Error al cachear archivos:', err);
        });
      })
      .then(() => {
        console.log('[SW] Service Worker instalado correctamente');
        return self.skipWaiting();
      })
  );
});

// Activación y limpieza de caché antiguo
self.addEventListener('activate', event => {
  console.log('[SW] Activando Service Worker...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Eliminando caché antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Service Worker activado');
      return self.clients.claim();
    })
  );
});

// Estrategia: Network First, fallback a Cache
self.addEventListener('fetch', event => {
  // Ignorar llamadas a APIs externas (Wompi) y túneles de Cloudflare
  if (event.request.url.includes('wompi.co') || 
      event.request.url.includes('api.') ||
      event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Si la respuesta es válida, guardarla en caché
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Si falla la red, buscar en caché
        return caches.match(event.request).then(response => {
          return response || new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});

// Sincronización en segundo plano
self.addEventListener('sync', event => {
  console.log('[SW] Sincronización en segundo plano:', event.tag);
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  console.log('[SW] Sincronizando datos con el servidor...');
  // Aquí puedes implementar lógica de sincronización
}

// Notificaciones push (opcional para futuras implementaciones)
self.addEventListener('push', event => {
  console.log('[SW] Notificación push recibida');
  const options = {
    body: event.data ? event.data.text() : 'Nueva notificación de CODEXIS',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100]
  };
  
  event.waitUntil(
    self.registration.showNotification('CODEXIS', options)
  );
});
