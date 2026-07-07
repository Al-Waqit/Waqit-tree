const CACHE_NAME = 'waqit-tree-v3';
const urlsToCache = [
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(urlsToCache);
    }).catch(function(err){
      console.log('Cache install error:', err);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(name) {
          return name !== CACHE_NAME;
        }).map(function(name) {
          return caches.delete(name);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  // Never intercept Firebase/API calls
  if (event.request.url.indexOf('firebaseio.com') !== -1 ||
      event.request.url.indexOf('firebasejs') !== -1 ||
      event.request.url.indexOf('gstatic.com') !== -1) {
    return;
  }

  // Network-first for the HTML page itself, so updates are picked up immediately.
  // Falls back to cache only if the network request fails (offline).
  var isPageRequest = event.request.mode === 'navigate' ||
      event.request.url.indexOf('index.html') !== -1 ||
      event.request.url.endsWith('/');

  if (isPageRequest) {
    event.respondWith(
      fetch(event.request, {cache: 'no-store'}).then(function(response) {
        var copy = response.clone();
        caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, copy); });
        return response;
      }).catch(function(){
        return caches.match(event.request).then(function(r){ return r || caches.match('./index.html'); });
      })
    );
    return;
  }

  // Cache-first for static assets (icons, manifest) that rarely change.
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});
