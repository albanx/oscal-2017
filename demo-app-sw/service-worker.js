const PRECACHE = 'precache-v1';
const RUNTIME = 'runtime';
const LAST_SEARCH = 'last-search';

const FALLBACK =
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="180" stroke-linejoin="round">' +
    '  <path stroke="#DDD" stroke-width="25" d="M99,18 15,162H183z"/>' +
    '  <path stroke-width="17" fill="#FFF" d="M99,18 15,162H183z" stroke="#eee"/>' +
    '  <path d="M91,70a9,9 0 0,1 18,0l-5,50a4,4 0 0,1-8,0z" fill="#aaa"/>' +
    '  <circle cy="138" r="9" cx="100" fill="#aaa"/>' +
    '</svg>';

// A list of local resources we always want to be cached. This is the application shell.
const PRECACHE_URLS = [
    'index.html',
    './',
    'css/styles.css',
    'css/materialize.min.css',
    'js/app.js',
    'js/jquery-2.1.1.min.js',
    'js/materialize.min.js',
    'http://fonts.googleapis.com/icon?family=Material+Icons'
];

// The install handler takes care of precaching the resources we always need.
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(PRECACHE)
            .then(cache => cache.addAll(PRECACHE_URLS))
            .then(self.skipWaiting())
    );
});

// The activate handler takes care of cleaning up old caches.
self.addEventListener('activate', event => {
    console.log('Service worker activate');
    const currentCaches = [PRECACHE, RUNTIME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
        }).then(cachesToDelete => {
            return Promise.all(cachesToDelete.map(cacheToDelete => {
                console.log('deleting cache', cacheToDelete);
                return caches.delete(cacheToDelete);
            }));
        }).then(() => self.clients.claim())
    );
});

// The fetch handler serves responses for same-origin resources from a cache.
// If no response is found, it populates the runtime cache with the response
// from the network before returning it to the page.
self.addEventListener('fetch', event => {

    //local resources
    if(event.request.url.startsWith(self.location.origin)) {
        event.respondWith(
            caches.match(event.request).then(cachedResponse => {

                //if it already cached return it to avoid reload from network
                if(cachedResponse) {
                    return cachedResponse;
                }

                console.log('Caching application shell');
                return caches.open(RUNTIME).then(cache => {
                    return fetch(event.request).then(response => {
                        // Put a copy of the response in the runtime cache.
                        return cache.put(event.request, response.clone()).then(() => {
                            return response;
                        });
                    });
                });
            })
        );
    } else {
        event.respondWith(
            caches.open(LAST_SEARCH).then(cache => {
                return fetch(event.request).then(response => {
                    console.log('Caching the last search');
                    return cache.put(event.request, response.clone()).then(() => {
                        return response;
                    });
                }).catch(function(e) {
                    console.log('No Internet connection. Loading from cache.');
                    return caches.open(LAST_SEARCH).then(function (cache) {
                        return cache.match(event.request).then(function (matching) {
                            return matching || Promise.reject('request-not-in-cache');
                        });
                    });
                });
            }).catch(function() {
                console.log('No cache and no connection, fallback');
                return Promise.resolve(
                    new Response(FALLBACK, { headers: {'Content-Type': 'image/svg+xml'}})
                );
            })
        );
    }
});
