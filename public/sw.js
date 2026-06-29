// sw.js
export const APP_VERSION = "v1.3.1";
const STATIC_CACHE_NAME = `static-${APP_VERSION}`;
const FETCH_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
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
    "https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js",
    "https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css",
    "https://code.jquery.com/jquery-4.0.0.min.js",
    "https://cdn.jsdelivr.net/npm/chart.js",
    "https://cdn.jsdelivr.net/npm/chartjs-plugin-annotation",
    "https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns"
];

// wrap fetch with an AbortController-based timeout
const fetchWithTimeout = (request, timeoutMs = FETCH_TIMEOUT_MS) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    // preserve original request options while injecting the abort signal
    const fetchPromise = fetch(request, { signal: controller.signal });

    return fetchPromise.finally(() => clearTimeout(timeoutId));
};

self.addEventListener("install", (event) => {
    event.waitUntil((async () => {
        const cache = await caches.open(STATIC_CACHE_NAME);
        // use fetchWithTimeout for each asset during install
        await Promise.all(
            STATIC_ASSETS.map(async (url) => {
                const response = await fetchWithTimeout(url);
                await cache.put(url, response);
            })
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
        await self.clients.claim();
    })());
});

// apply timeout to all outgoing fetches intercepted by the service worker
self.addEventListener("fetch", (event) => {
    event.respondWith((async () => {
        // check cache first
        const cached = await caches.match(event.request);
        if (cached) return cached;

        // fall back to network with timeout
        return fetchWithTimeout(event.request);
    })());
});
