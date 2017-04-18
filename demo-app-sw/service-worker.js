const PRECACHE = 'precache-v1';
const RUNTIME = 'runtime';

// A list of local resources we always want to be cached.
const PRECACHE_URLS = [
    'index.html',
    './', // Alias for index.html
    'css/styles.css',
    'css/materialize.min.css',
    'js/app.js',
    'js/jquery-2.1.1.min.js',
    'js/materialize.min.js'
];

// The install handler takes care of precaching the resources we always need.
self.addEventListener('install', event => {
    console.log('Service worker install');
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
            console.log('cacheNames', cacheNames);
            return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
        }).then(cachesToDelete => {
            return Promise.all(cachesToDelete.map(cacheToDelete => {
                return caches.delete(cacheToDelete);
            }));
        }).then(() => self.clients.claim())
    );
});

// The fetch handler serves responses for same-origin resources from a cache.
// If no response is found, it populates the runtime cache with the response
// from the network before returning it to the page.
self.addEventListener('fetch', event => {

    // Skip cross-origin requests, like those for Google Analytics.
    if(event.request.url.startsWith(self.location.origin)) {
        console.log('Service worker fetch from cache', event.request.url);

        event.respondWith(
            caches.match(event.request).then(cachedResponse => {
                if(cachedResponse) {
                    return cachedResponse;
                }

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
        console.log('fetch from network', event.request.url);
    }
});
