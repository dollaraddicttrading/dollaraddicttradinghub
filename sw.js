/* =========================================
   DOLLARADDICT Enhanced Service Worker (sw.js)
   Strategy: Stale-While-Revalidate (Fast & Up-to-Date)
   ========================================= */

// 1. Core Configuration (Req. for Pillar 3)
const CACHE_NAME = 'dollaraddict-trading-v1.1'; // Bump version if critical assets change

// *** PILLAR 3: ESSENTIAL ASSET LIST (PWA Foundation) ***
// We must include all files the website needs for basic offline function.
const APP_FILES = [
    './',
    './index.html',
    './style.css',               // NEW: Essential for Tiktok/Suite look
    './script.js',              // NEW: Essential for PWA/Clock/Suite function
    './manifest.json',           // Required for install prompt
    './icons/icon-192.png',      // Req. for Pillar 1/2
    './icons/icon-512.png',      // Req. for installation

    // FontAwesome is external, so we cache it dynamically instead of pre-caching.
    // 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'

    // ... As you build ./tools/bots.html etc., add them here ...
];

/* =========================================
   Installation Lifecycle (Existing + Skip)
   ========================================= */
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('DOLLARADDICT PWA: Precaching critical static assets...');
                // Uses addAll to cache all critical files during installation
                return cache.addAll(APP_FILES);
            })
    );
    
    // Forces the waiting service worker to become active immediately (existing)
    self.skipWaiting();
});

/* =========================================
   Activation Lifecycle (Existing + Claim)
   ========================================= */
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                // Filter and delete old caches that don't match CACHE_NAME
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => {
                        console.log('DOLLARADDICT PWA: Clearing old cache: ', key);
                        return caches.delete(key);
                    })
            );
        })
    );
    
    // Ensures all open tabs/clients are immediately controlled by this worker (existing)
    self.clients.claim();
});

/* =========================================
   Fetch Lifecycle (NEW Strategy: Stale-While-Revalidate)
   ========================================= */
self.addEventListener('fetch', (event) => {
    // Only intercept standard GET requests (existing)
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // A. Instant response: If found in cache, serve it immediately (making app FAST)
                const fetchPromise = fetch(event.request).then((networkResponse) => {
                    // B. Background check: We must have a valid response to update the cache
                    if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                        // If network fails (e.g., truly offline), just return the network object
                        return networkResponse; 
                    }
                    
                    // C. Background update: Clone the network response and update the cache for NEXT time
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, networkResponse.clone());
                    });
                    
                    // Return the network response as the ultimate source of truth
                    return networkResponse;
                }).catch(() => {
                    // D. Network Failure: If fetch() completely fails (e.g. no connection)
                    // We already served the cachedResponse, so nothing else is needed here
                    // If cachedResponse also didn't exist, this fails gracefully.
                });

                // The return value determines what is shown. 
                // cachedResponse will be served immediately, and fetchPromise handles the background.
                return cachedResponse || fetchPromise;
            })
    );
});