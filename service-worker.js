// Service Worker para Codexis Taller
const CACHE_NAME = 'codexis-taller-v1';
const CACHE_VERSION = '1.0.0';

// Archivos esenciales para funcionar offline
const ESSENTIAL_FILES = [
  '/',
  '/index.html',
  '/orden.html',
  '/order.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Archivos de imágenes y recursos adicionales
const OPTIONAL_FILES = [
  '/image.png'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Cache abierto, guardando archivos esenciales...');
      // Guardar archivos esenciales
      return cache.addAll(ESSENTIAL_FILES).catch(err => {
        console.error('[SW] Error al guardar archivos esenciales:', err);
      });
    }).then(() => {
      // Intentar guardar archivos opcionales sin fallar si no existen
      return caches.open(CACHE_NAME).then(cache => {
        return Promise.all(
          OPTIONAL_FILES.map(url => {
            return cache.add(url).catch(err => {
              console.warn('[SW] No se pudo guardar archivo opcional:', url);
            });
          })
        );
      });
    }).then(() => {
      console.log('[SW] Service Worker instalado correctamente');
      return self.skipWaiting(); // Activar inmediatamente
    })
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activando Service Worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Eliminar caches antiguos
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Service Worker activado');
      return self.clients.claim(); // Tomar control inmediatamente
    })
  );
});

// Estrategia de cache: Network First, fallback a Cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo cachear peticiones GET del mismo origen
  if (request.method !== 'GET') {
    return;
  }

  // No cachear llamadas a la API (servidor Cloudflare/Hostinger)
  if (url.pathname.startsWith('/api/') || url.hostname.includes('trycloudflare.com') || url.hostname.includes('hostinger')) {
    // Network only para API - nunca cachear datos del servidor
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(JSON.stringify({ 
          error: 'Sin conexión', 
          offline: true 
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // Para archivos estáticos: Network First, Cache Fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Si la respuesta es válida, guardarla en cache
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Si falla la red, buscar en cache
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log('[SW] Sirviendo desde cache:', request.url);
            return cachedResponse;
          }
          
          // Si es una navegación y no hay cache, mostrar página offline
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          
          return new Response('Sin conexión y sin cache disponible', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});

// Sincronización en segundo plano (cuando vuelve la conexión)
self.addEventListener('sync', (event) => {
  console.log('[SW] Sincronización en segundo plano:', event.tag);
  
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncPendingOrders());
  }
});

// Función para sincronizar órdenes pendientes
async function syncPendingOrders() {
  // Aquí puedes implementar lógica para enviar datos pendientes
  console.log('[SW] Sincronizando órdenes pendientes...');
  
  try {
    // Obtener datos pendientes del IndexedDB si los hay
    // y enviarlos al servidor
    return Promise.resolve();
  } catch (err) {
    console.error('[SW] Error en sincronización:', err);
    throw err;
  }
}

// Mensajes desde la aplicación
self.addEventListener('message', (event) => {
  console.log('[SW] Mensaje recibido:', event.data);
  
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
  
  if (event.data.action === 'clearCache') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      }).then(() => {
        event.ports[0].postMessage({ success: true });
      })
    );
  }
});

console.log('[SW] Service Worker cargado, versión:', CACHE_VERSION);
