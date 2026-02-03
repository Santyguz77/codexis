const CACHE_NAME = 'suscripciones-v2';
const urlsToCache = [
  './',
  'index.html',
  'app.js',
  'manifest.json',
  'pago.html',
  'icon-192.svg',
  'icon-512.svg'
];

// Instalación del service worker
self.addEventListener('install', event => {
  console.log('[SW] Instalando Service Worker Suscripciones...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async cache => {
        console.log('[SW] Guardando archivos en caché...');
        const results = await Promise.allSettled(
          urlsToCache.map(url => cache.add(url))
        );
        const failed = results.filter(r => r.status === 'rejected');
        if (failed.length > 0) {
          console.warn('[SW] Algunos archivos no se pudieron cachear:', failed.length);
        }
      })
      .then(() => {
        console.log('[SW] Service Worker instalado');
        return self.skipWaiting();
      })
  );
});

// Activación y limpieza de caché antiguo
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estrategia: Network First, fallback a Cache
self.addEventListener('fetch', event => {
  // No cachear llamadas a la API
  if (event.request.url.includes('/api/')) {
    return event.respondWith(fetch(event.request));
  }
  
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// Escuchar mensajes para mostrar notificaciones
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title, options);
  }
});

// Manejar clics en notificaciones
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        if (clientList.length > 0) {
          return clientList[0].focus();
        }
        return clients.openWindow('/');
      })
  );
});

// Push notifications
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Recordatorio de Suscripción';
  const options = {
    body: data.body || 'Tienes pagos pendientes',
    icon: 'icon-192.svg',
    badge: 'icon-192.svg',
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: [
      { action: 'view', title: 'Ver detalles' },
      { action: 'dismiss', title: 'Descartar' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});
