// Service Worker Toolbox
importScripts('js/lib/sw-toolbox/sw-toolbox.js');

// Offline Google Analytics
importScripts('js/lib/sw-offline-google-analytics.js');
goog.offlineGoogleAnalytics.initialize();

// Files to precache
const precacheFiles = [
    './',
    './index.html',
    './article.html',
    './latest.html',
    './latest.html?notification=true',
    './saved.html',

    './css/main.css',
    'https://maxcdn.bootstrapcdn.com/font-awesome/4.3.0/css/font-awesome.min.css',
    'https://fonts.googleapis.com/css?family=Inconsolata|Lora:400,400i,700|Source+Sans+Pro:400,700',

    './js/bundle.js',
    './js/article.js',
    './js/home.js',
    './js/latest.js',
    './js/saved.js',

    './img/profile.png'
];
toolbox.precache(precacheFiles);

// Install and Activate events
self.addEventListener('install', (event) => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

// Fetch events
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => response || fetch(event.request))
    );
});

// Push notifications
self.addEventListener('push', (event) => {
    console.log('Push message received', event);
    const title = 'New article on bitsofco.de';
    event.waitUntil(
        self.registration.showNotification(title, {
            body: 'Click to read the latest article',
            icon: './img/icon128.png',
            tag: 'new-article'
        })
    );
});

self.addEventListener('notificationclick', function (event) {
    console.log('Notification click: tag', event.notification.tag);
    event.notification.close();
    const url = './latest.html?notification=true';
    event.waitUntil(
        clients.matchAll({ type: 'window'}).then(function (windowClients) {
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url === url && 'focus' in client) return client.focus()
            }
            if (clients.openWindow) return clients.openWindow(url)
        })
    );
});