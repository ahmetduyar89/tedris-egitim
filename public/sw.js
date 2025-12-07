// Service Worker for Push Notifications
// This file handles push notifications when the app is in the background

const CACHE_NAME = 'tedris-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/icon-192x192.png',
    '/badge-72x72.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching app shell');
                return cache.addAll(urlsToCache);
            })
            .catch((error) => {
                console.error('[SW] Cache installation failed:', error);
            })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
    console.log('[SW] Push notification received:', event);

    let notificationData = {
        title: 'TEDRİS',
        body: 'Yeni bir bildiriminiz var',
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        vibrate: [200, 100, 200],
        data: {}
    };

    if (event.data) {
        try {
            const data = event.data.json();
            notificationData = {
                ...notificationData,
                ...data
            };
        } catch (e) {
            notificationData.body = event.data.text();
        }
    }

    const promiseChain = self.registration.showNotification(
        notificationData.title,
        {
            body: notificationData.body,
            icon: notificationData.icon,
            badge: notificationData.badge,
            vibrate: notificationData.vibrate,
            data: notificationData.data,
            actions: [
                {
                    action: 'open',
                    title: 'Aç',
                    icon: '/icon-open.png'
                },
                {
                    action: 'close',
                    title: 'Kapat',
                    icon: '/icon-close.png'
                }
            ],
            tag: notificationData.data.type || 'general',
            requireInteraction: false,
            renotify: true
        }
    );

    event.waitUntil(promiseChain);
});

// Notification click event - handle user interaction
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event);

    event.notification.close();

    if (event.action === 'close') {
        return;
    }

    // Determine URL to open
    let urlToOpen = '/';

    if (event.notification.data) {
        const { type, actionUrl, entityType, entityId } = event.notification.data;

        if (actionUrl) {
            urlToOpen = actionUrl;
        } else if (type === 'assignment' || type === 'test' || type === 'homework') {
            urlToOpen = '/student-dashboard';
        } else if (type === 'lesson') {
            urlToOpen = '/student-dashboard';
        } else if (type === 'achievement') {
            urlToOpen = '/student-dashboard';
        }
    }

    // Open or focus the app
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Check if there's already a window open
                for (let i = 0; i < clientList.length; i++) {
                    const client = clientList[i];
                    if (client.url.includes(urlToOpen) && 'focus' in client) {
                        return client.focus();
                    }
                }

                // If no window is open, open a new one
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

// Background sync event (for offline support)
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync:', event.tag);

    if (event.tag === 'sync-notifications') {
        event.waitUntil(syncNotifications());
    }
});

// Sync notifications when back online
async function syncNotifications() {
    try {
        // Fetch pending notifications from server
        const response = await fetch('/api/notifications/pending');
        const notifications = await response.json();

        // Show each notification
        for (const notification of notifications) {
            await self.registration.showNotification(notification.title, {
                body: notification.body,
                icon: '/icon-192x192.png',
                badge: '/badge-72x72.png',
                data: notification.data
            });
        }
    } catch (error) {
        console.error('[SW] Error syncing notifications:', error);
    }
}

// Message event - handle messages from the app
self.addEventListener('message', (event) => {
    console.log('[SW] Message received:', event.data);

    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data.type === 'SHOW_NOTIFICATION') {
        const { title, options } = event.data;
        self.registration.showNotification(title, options);
    }
});

console.log('[SW] Service Worker loaded');
