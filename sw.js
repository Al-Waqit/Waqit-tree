const CACHE_NAME = 'waqit-tree-v1';
const urlsToCache = [
  './index.html',
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
  // Network-first for Firebase/API calls, cache-first for static assets
  if (event.request.url.indexOf('firebaseio.com') !== -1 ||
      event.request.url.indexOf('firebasejs') !== -1 ||
      event.request.url.indexOf('gstatic.com') !== -1) {
    return; // let these go straight to network, don't intercept
  }
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request).catch(function(){
        return caches.match('./index.html');
      });
    })
  );
});
