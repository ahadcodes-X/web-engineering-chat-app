// sw.js (Service Worker)

const CACHE_NAME = 'chatter-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/chat.html',
    '/style.css',
    '/auth.js',
    '/client.js',
    '/fonts/UT Silver Glass Demo.woff2',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/socket.io/socket.io.js'
];

// Install the service worker and cache all the app files
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// Serve cached files when offline
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // If we find a match in the cache, return it
                if (response) {
                    return response;
                }
                // Otherwise, try to fetch it from the network
                return fetch(event.request);
            }
        )
    );
});