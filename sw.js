/* Service worker — Fase 5.
   - "Shell" (HTML/CSS/motor JS): network-first con precache de respaldo —
     siempre intenta traer la versión nueva (así los arreglos llegan de
     inmediato) y solo si no hay red sirve la copia guardada, para que
     el sitio siga abriendo sin conexión. Las fuentes (.woff2, nunca
     cambian) sí son cache-first.
   - El audio no se intercepta: el navegador pide rangos (Range) y manejar
     eso a mano en el SW rompe el seek; lo cachea el navegador solo.
   - contenido/*.js: network-first (igual que el shell). Antes era
     stale-while-revalidate, y en la primera visita tras una actualización
     se veía el index.html nuevo con contenido viejo; ahora siempre llega
     lo más reciente y, sin red, se sirve la copia guardada.
   - Fotos/audio/juegos: cache-first bajo demanda (se guardan la primera
     vez que se piden, no se precargan todas de entrada — mantiene la
     primera visita ligera). assets/img/originales/ NUNCA se cachea.
   - Sube CACHE_VERSION cuando cambies qué se precachea; las versiones
     viejas se borran solas en "activate". */

const CACHE_VERSION = 'v18';
const SHELL_CACHE = `jardin-shell-${CACHE_VERSION}`;
const CONTENIDO_CACHE = `jardin-contenido-${CACHE_VERSION}`;
const RUNTIME_CACHE = `jardin-runtime-${CACHE_VERSION}`;
const ALL_CACHES = [SHELL_CACHE, CONTENIDO_CACHE, RUNTIME_CACHE];

const SHELL_URLS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/css/infinito.css',
  './js/infinito.js',
  './assets/css/utilities.css',
  './assets/css/tokens.css',
  './assets/css/ornamentos.css',
  './assets/css/navegacion.css',
  './assets/css/portada.css',
  './assets/css/capitulos.css',
  './assets/css/tipografia.css',
  './assets/css/linea-tiempo.css',
  './assets/css/base.css',
  './assets/css/componentes.css',
  './assets/css/vistas.css',
  './assets/css/jardin.css',
  './assets/css/movil.css',
  './js/ornamentos.js',
  './js/nucleo.js',
  './js/motor-canvas.js',
  './js/ui.js',
  './js/audio.js',
  './js/secciones.js',
  './js/buzon-juegos.js',
  './js/extras.js',
  './js/portada.js',
  './js/capitulos.js',
  './js/navegacion.js',
  './js/escenas.js',
  './assets/fonts/Inter-latin-300-700-normal.woff2',
  './assets/fonts/CormorantGaramond-latin-300-700-normal.woff2',
  './assets/fonts/PlayfairDisplay-latin-400-900-normal.woff2',
  './assets/fonts/PlayfairDisplay-latin-400-900-italic.woff2',
  './js/juegos/cupones.js',
  './js/juegos/memorama.js',
  './js/juegos/lluvia-lirios.js',
  './js/juegos/caceria.js',
  './js/juegos/constelacion.js',
  './js/juegos/curame.js',
];

const CONTENIDO_URLS = [
  './contenido/config.js',
  './contenido/recuerdos.js',
  './contenido/razones.js',
  './contenido/canciones.js',
  './contenido/fotos.js',
  './contenido/cartas.js',
  './contenido/frases.js',
  './contenido/cupones.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const shell = await caches.open(SHELL_CACHE);
      await shell.addAll(SHELL_URLS);
      const contenido = await caches.open(CONTENIDO_CACHE);
      await contenido.addAll(CONTENIDO_URLS);
      self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((n) => !ALL_CACHES.includes(n)).map((n) => caches.delete(n)));
      self.clients.claim();
    })()
  );
});

function isContenidoRequest(url) {
  return url.pathname.includes('/contenido/') && url.pathname.endsWith('.js');
}
function isOriginalesRequest(url) {
  return url.pathname.includes('/assets/img/originales/');
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || networkPromise;
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch (e) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw e;
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.ok && response.status === 200) cache.put(request, response.clone());
    return response;
  } catch (e) {
    return cached; // undefined si tampoco había nada — deja que falle normal
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  let url;
  try {
    url = new URL(req.url);
  } catch (e) {
    return;
  }
  if (url.origin !== self.location.origin) return; // no tocar fuentes externas, CDNs, etc.
  if (isOriginalesRequest(url)) return; // nunca cachear los originales sin optimizar
  if (req.headers.has('range') || url.pathname.endsWith('.mp3')) return; // audio: lo maneja el navegador

  if (isContenidoRequest(url)) {
    event.respondWith(networkFirst(req, CONTENIDO_CACHE));
    return;
  }
  if (SHELL_URLS.some((p) => url.pathname.endsWith(p.replace('./', '/')))) {
    const isFont = url.pathname.endsWith('.woff2');
    event.respondWith(isFont ? cacheFirst(req, SHELL_CACHE) : networkFirst(req, SHELL_CACHE));
    return;
  }
  if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname.endsWith('.html')) {
    event.respondWith(networkFirst(req, RUNTIME_CACHE));
    return;
  }
  // Todo lo demás (fotos, audio, iconos, juegos extra): cache-first bajo
  // demanda, se va guardando conforme se usa.
  event.respondWith(cacheFirst(req, RUNTIME_CACHE));
});
