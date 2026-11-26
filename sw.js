//Offline support
//Name of cache
const CACHE_NAME = "codesphere-portal-v9";

//The HTML pages
//every page must exist on the server. If even one gives a 404, cache.addAll() fails and the server worker will not install
const FILES_TO_CACHE = [
    "/index.html",
    "/employees.html",
    "/register.html",
    "/departments.html",
    "/training.html",
    "/style.css",
    "/employee-data.js",
    "/employee-model.js",
    "/employees-export.js",
    "/register.js",
    "/adaptive.js",
    "/departments.js",
    "/training.js",
    "/html5-apis.js",
    "/notification.js",
    "/worker.js",
    "/stats.js",
    "/dist/bundle.js"
];
 
// INSTALL: runs once when the browser first sees this file.
// Open the cache and save all the files in it.
self.addEventListener("install", function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.addAll(FILES_TO_CACHE);
        })
    );
    // Do not wait for old tabs to close before becoming active.
    self.skipWaiting();
});
 
// ACTIVATE: runs after install. Delete caches from older versions
// and take control of the open pages straight away.
self.addEventListener("activate", function (event) {
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames
                    .filter(function (name) {
                        return name !== CACHE_NAME;
                    })
                    .map(function (name) {
                        return caches.delete(name);
                    })
            );
        }).then(function () {
            return self.clients.claim();
        })
    );
});
 
// FETCH: runs for every request the pages make.
// Try the network first, so you always see your latest code while
// developing. If the network fails (offline), use the cached copy.
self.addEventListener("fetch", function (event) {
    const request = event.request;
 
    // Only handle normal page and file requests.
    if (request.method !== "GET") {
        return;
    }
 
    event.respondWith(
        fetch(request)
            .then(function (response) {
                // Keep the cached copy fresh whenever the network works.
                if (response.status === 200 && request.url.startsWith(self.location.origin)) {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then(function (cache) {
                        cache.put(request, copy);
                    });
                }
                return response;
            })
            .catch(function () {
                // Offline: look in the cache.
                return caches.match(request).then(function (cached) {
                    if (cached) {
                        return cached;
                    }
                    // A page we never cached (for example the "/" address):
                    // fall back to the home page.
                    if (request.mode === "navigate") {
                        return caches.match("/index.html");
                    }
                    return Response.error();
                });
            })
    );
});