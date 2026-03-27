import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

// Remove caches de versões antigas automaticamente
cleanupOutdatedCaches()

// Pré-cacheia todos os assets do build (injetado pelo vite-plugin-pwa)
precacheAndRoute(self.__WB_MANIFEST)

// Fontes do Google — cache por 1 ano
registerRoute(
  ({ url }) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 })],
  })
)

// Firebase Auth API — tenta rede, cai no cache se offline
registerRoute(
  ({ url }) => url.hostname === 'identitytoolkit.googleapis.com',
  new NetworkFirst({ cacheName: 'firebase-auth', networkTimeoutSeconds: 5 })
)

// Firestore — tenta rede primeiro, cache como fallback
registerRoute(
  ({ url }) => url.hostname === 'firestore.googleapis.com',
  new NetworkFirst({
    cacheName: 'firestore',
    networkTimeoutSeconds: 4,
    plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 })],
  })
)

// Navegação SPA — serve o index.html para qualquer rota interna
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new StaleWhileRevalidate({ cacheName: 'pages' })
)
