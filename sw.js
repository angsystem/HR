/* ANG HR PWA cache — 2026-08-21 shared config freshness */
'use strict';

const CACHE_VERSION = 'ang-hr-20260821-config-network-first-v1';
const SHELL_CACHE = CACHE_VERSION + '-shell';
const RUNTIME_CACHE = CACHE_VERSION + '-runtime';
const APP_SHELL = [
  './',
  './index.html',
  './config.js',
  './line-mini-app-entry.js',
  './organization.html',
  './organization-chart.js',
  './organization-chart.css',
  './organization-launcher.js',
  './auth-backend-redirect.js',
  './ang_deep_link_receiver.js',
  './facebook-auth.js',
  './manager-welcome.js',
  './manager-welcome.css',
  './social-login-providers.css',
  './index-card-rules.js',
  './viewport-lock.js',
  './index-card-rules.css',
  './manifest.webmanifest',
  './assets/index-EmailLink60-v2.js',
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

    // HTML shell fallback is valid only for page navigations. Returning
    // index.html for a stylesheet/script request causes the browser to reject
    // the resource because the MIME type/content is wrong.
    if (request.mode === 'navigate') {
      const shell = await caches.match('./index.html');
      if (shell) return shell;
    }
    return Response.error();
  }
}

async function networkFirstConfig(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const exact = await caches.match(request);
    if (exact) return exact;
    const shellConfig = await caches.match('./config.js');
    return shellConfig || Response.error();
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

  // Authentication/provider settings and loader versions must not lag one
  // navigation behind after a deployment. Prefer the latest config, while
  // retaining the precached base config as an offline fallback.
  if (url.pathname.endsWith('/config.js')) {
    event.respondWith(networkFirstConfig(request));
    return;
  }

  // The shared RWD guard changes independently of standalone page scripts.
  // Always check the network first so Employee/Admin do not render one load
  // behind after a Safe Area or breakpoint fix.
  if (url.pathname.endsWith('/web-rwd-tablet-guard-20260816.css')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Large opening videos are intentionally not cached by the service worker.
  if (/\.(?:mp4|mov|webm)(?:$|\?)/i.test(url.pathname)) return;

  if (/\.(?:js|css|png|jpg|jpeg|webp|svg|ico|json|webmanifest)(?:$|\?)/i.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});