/**
 * QuizNexus - Service Worker (Offline Support)
 */

const CACHE_NAME = 'quiznexus-v1.0.0';
const ASSETS = [
  '/',
  '/index.html',
  '/login.html',
  '/signup.html',
  '/dashboard.html',
  '/quiz.html',
  '/result.html',
  '/leaderboard.html',
  '/profile.html',
  '/settings.html',
  '/admin-login.html',
  '/admin-dashboard.html',
  '/manage-quiz.html',
  '/users.html',
  '/analytics.html',
  '/css/style.css',
  '/css/responsive.css',
  '/css/animations.css',
  '/js/app.js',
  '/js/auth.js',
  '/js/dashboard.js',
  '/js/quiz.js',
  '/js/result.js',
  '/js/leaderboard.js',
  '/js/profile.js',
  '/js/settings.js',
  '/js/admin.js',
  '/js/storage.js',
  '/js/theme.js',
  '/js/chart.js',
  '/assets/images/logo.png',
  '/assets/images/favicon.ico'
];

// Install Event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Caching assets...');
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => self.clients.claim())
  );
});

// Fetch Event
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request)
          .then(response => {
            if (!response || response.status !== 200) {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                try {
                  cache.put(event.request, responseToCache);
                } catch (e) {}
              });
            return response;
          });
      })
  );
});