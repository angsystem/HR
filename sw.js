/* ANG HR PWA cache — 2026-07-22 index card rules */
'use strict';

const CACHE_VERSION = 'ang-hr-v0.7.0-20260722-viewport-lock-v1';
const SHELL_CACHE = CACHE_VERSION + '-shell';
const RUNTIME_CACHE = CACHE_VERSION + '-runtime';
const APP_SHELL = [
  './',
  './index.html',
  './config.js',
  './facebook-auth.js',
  './manager-welcome.js',
  './manager-welcome.css',
  './social-login-providers.css',
  './index-card-rules.js',
  './viewport-lock.js',
  './index-card-rules.css',
  './manifest.webmanifest',
  './assets/index-DwNMzswZ.js',
  './assets/index-C1fEYMkG.css',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      Promise.allSettled(APP_SHELL.map((url) => cache.add(new Request(url, { cache: 'reload' }))))
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key.startsWith('ang-hr-') && key !== SHELL_CACHE && key !== RUNTIME_CACHE)
        .map((key) => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return caches.match('./index.html');
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const update = fetch(request).then((response) => {
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);
  return cached || update || Response.error();
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  // Large opening videos are intentionally not cached by the service worker.
  if (/\.(?:mp4|mov|webm)(?:$|\?)/i.test(url.pathname)) return;

  if (/\.(?:js|css|png|jpg|jpeg|webp|svg|ico|json|webmanifest)(?:$|\?)/i.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
