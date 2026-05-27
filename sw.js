const CACHE = 'git-runner-v1';
const ASSETS = [
  './',
  './index.html',
  './assets/css/style.css',
  './assets/js/game.js',
  './assets/js/config.js',
  './assets/img/player.png',
  './manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});

self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
