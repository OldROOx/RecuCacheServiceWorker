// Service Worker - TaskMaster PWA
const CACHE_NAME = 'taskmaster-v1';

console.log('🔧 Service Worker cargado');

// INSTALACIÓN
self.addEventListener('install', event => {
    console.log('🔧 SW: Instalando...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 SW: Cache abierto');
                return cache.addAll([
                    './',
                    './index.html',
                    'data:text/html,<h1>Offline</h1><p>App funciona sin conexión</p>'
                ]);
            })
            .then(() => {
                console.log('✅ SW: Archivos cacheados');
                return self.skipWaiting();
            })
    );
});

// ACTIVACIÓN
self.addEventListener('activate', event => {
    console.log('🚀 SW: Activando...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ SW: Eliminando cache viejo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('✅ SW: Activado correctamente');
            return self.clients.claim();
        })
    );
});

// INTERCEPTAR PETICIONES (Cache First)
self.addEventListener('fetch', event => {
    console.log('🌐 SW: Petición a:', event.request.url);

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    console.log('📦 SW: Desde cache');
                    return response;
                }

                console.log('🌐 SW: Desde red');
                return fetch(event.request).then(response => {
                    if (response && response.status === 200) {
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, responseToCache);
                            console.log('💾 SW: Cacheado');
                        });
                    }
                    return response;
                });
            })
            .catch(() => {
                console.log('❌ SW: Error, mostrando offline');
                return caches.match('data:text/html,<h1>Offline</h1><p>App funciona sin conexión</p>');
            })
    );
});

// BACKGROUND SYNC
self.addEventListener('sync', event => {
    console.log('🔄 SW: Background sync:', event.tag);
    if (event.tag === 'background-sync') {
        event.waitUntil(syncData());
    }
});

function syncData() {
    console.log('📡 SW: Sincronizando datos...');
    return new Promise(resolve => {
        setTimeout(() => {
            console.log('✅ SW: Sync completado');
            resolve();
        }, 1000);
    });
}

// PUSH NOTIFICATIONS
self.addEventListener('push', event => {
    console.log('🔔 SW: Push recibido');

    const options = {
        body: event.data ? event.data.text() : 'Nueva notificación',
        icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="%232196f3"%3E%3Crect width="64" height="64"/%3E%3Ctext y=".9em" font-size="40" fill="%23fff"%3ET%3C/text%3E%3C/svg%3E',
        vibrate: [100, 50, 100]
    };

    event.waitUntil(
        self.registration.showNotification('TaskMaster PWA', options)
    );
});

// CLICK EN NOTIFICACIÓN
self.addEventListener('notificationclick', event => {
    console.log('👆 SW: Click en notificación');
    event.notification.close();
    event.waitUntil(clients.openWindow('./'));
});

console.log('✅ SW: Inicializado correctamente');
