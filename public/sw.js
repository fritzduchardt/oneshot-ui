// sw.js
export const APP_VERSION = "v1.3.11";
const STATIC_CACHE_NAME = `static-${APP_VERSION}`;
const DYNAMIC_CACHE_NAME = `dynamic-${APP_VERSION}`;
const STATIC_ASSETS = [
    "/index.html",
    "/favicon.ico",
    "/js/main.js",
    "/js/config.js",
    "/js/app/backend.js",
    "/js/app/handlers.js",
    "/js/app/dom.js",
    "/js/app/keys.js",
    "/js/app/history.js",
    "/js/app/msgs.js",
    "/js/app/sound.js",
    "/js/app/store.js",
    "/js/app/ui.js",
    "/js/app/formats/html.js",
    "/js/app/formats/text.js",
    "/styles/main.css",
    "/assets/turtle/icon-192.png",
    "/assets/turtle/icon-512.png",
    // Keep CDN resources in static cache but handle fetch accordingly
    "https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js",
    "https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css",
    "https://code.jquery.com/jquery-4.0.0.min.js",
    "https://cdn.jsdelivr.net/npm/chart.js",
    "https://cdn.jsdelivr.net/npm/chartjs-plugin-annotation",
    "https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns"
];

self.addEventListener("install", (event) => {
    event.waitUntil((async () => {
        const cache = await caches.open(STATIC_CACHE_NAME);
        // Use allSettled for CDN assets to avoid install failure if some fail
        const results = await Promise.allSettled(
            STATIC_ASSETS.map(url => cache.add(url).catch(e => console.warn('Failed to cache', url, e)))
        );
        await self.skipWaiting();
    })());
});

// clean up old cache items
self.addEventListener("activate", (event) => {
    event.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(
            keys
                .filter((key) => key.startsWith("static-") && key !== STATIC_CACHE_NAME)
                .map((key) => caches.delete(key))
        );
        // Also clean up dynamic caches from old versions
        const dynamicKeys = keys.filter(key => key.startsWith("dynamic-") && key !== DYNAMIC_CACHE_NAME);
        await Promise.all(dynamicKeys.map(key => caches.delete(key)));
        await self.clients.claim();
    })());
});

// Fetch event: network-first for dynamic requests, cache-first for static assets
self.addEventListener("fetch", (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // For static assets (including CDN) use cache-first
    if (isStaticAsset(event.request.url)) {
        event.respondWith(cacheFirst(event.request));
    } else {
        // For all other requests (e.g., API calls) use network-first with cache fallback
        event.respondWith(networkFirst(event.request));
    }
});

function isStaticAsset(url) {
    const urlObj = new URL(url);
    // Check if URL ends with any of the static asset paths or is a CDN URL
    return (
        urlObj.pathname.startsWith('/index.html') ||
        urlObj.pathname.startsWith('/favicon.ico') ||
        urlObj.pathname.startsWith('/js/') ||
        urlObj.pathname.startsWith('/styles/') ||
        urlObj.pathname.startsWith('/assets/') ||
        url.includes('cdn.jsdelivr.net') ||
        url.includes('code.jquery.com')
    );
}

async function cacheFirst(request) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }
    // If not in cache, fetch from network and cache the response
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE_NAME);
            // Cache only same-origin or CDN responses
            if (request.url.startsWith(self.location.origin) || request.url.includes('cdn.jsdelivr.net') || request.url.includes('code.jquery.com')) {
                cache.put(request, networkResponse.clone());
            }
        }
        return networkResponse;
    } catch (error) {
        // If offline, return a fallback (e.g., index.html for navigations)
        if (request.mode === 'navigate') {
            const fallback = await caches.match('/index.html');
            if (fallback) return fallback;
        }
        throw error;
    }
}

async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        // Cache successful responses for later offline use
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        // If network fails, try cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        // For navigation requests, serve index.html as fallback
        if (request.mode === 'navigate') {
            const fallback = await caches.match('/index.html');
            if (fallback) return fallback;
        }
        throw error;
    }
}
