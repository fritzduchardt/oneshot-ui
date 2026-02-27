// sw.js
export const APP_VERSION = "v1.0.3";
const STATIC_CACHE_NAME = `static-${APP_VERSION}`;
const STATIC_ASSETS = [
    "/index.html",
    "/manifest.json",
    "/favicon.ico",
    "/js/sw.js",
    "/js/main.js",
    "/js/config.js",
    "/js/backend.js",
    "/js/handlers.js",
    "/js/html.js",
    "/js/store.js",
    "/js/ui.js",
    "/styles/main.css",
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
