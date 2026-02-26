const CACHE_VERSION = "v1";
const STATIC_CACHE_NAME = `static-${CACHE_VERSION}`;
const STATIC_ASSETS = [
    "/index.html",
    "/public/manifest.json",
    "/public/sw.js",
    "/favicon.ico",
    "/src/main.js",
    "/src/config.js",
    "/src/app/backend.js",
    "/src/app/handlers.js",
    "/src/app/html.js",
    "/src/app/store.js",
    "/src/app/ui.js",
    "/src/styles/main.css",
];

self.addEventListener("install", (event) => {
    event.waitUntil((async () => {
        const cache = await caches.open(STATIC_CACHE_NAME);
        await cache.addAll(STATIC_ASSETS);
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
