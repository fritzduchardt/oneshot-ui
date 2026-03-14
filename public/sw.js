// sw.js
export const APP_VERSION = "v1.1.5";
const STATIC_CACHE_NAME = `static-${APP_VERSION}`;
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
    "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.5.0/chart.umd.min.js"
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
