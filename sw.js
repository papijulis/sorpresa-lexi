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
   - Fotos, íconos y demás estáticos: cache-first bajo demanda (se guardan
     la primera vez que se piden, no se precargan todas de entrada —
     mantiene la primera visita ligera). Los juegos (js/juegos/*.js) son
     parte del shell (network-first); cualquier otro .js/.css/.html va
     network-first en la caché runtime. assets/vendor/ (Three.js) es
     cache-first. assets/img/originales/ NUNCA se cachea.
   - Sube CACHE_VERSION cuando cambies qué se precachea; las versiones
     viejas se borran solas en "activate". */

const CACHE_VERSION = 'v35';
const SHELL_CACHE = `jardin-shell-${CACHE_VERSION}`;
const CONTENIDO_CACHE = `jardin-contenido-${CACHE_VERSION}`;
const RUNTIME_CACHE = `jardin-runtime-${CACHE_VERSION}`;
const ALL_CACHES = [SHELL_CACHE, CONTENIDO_CACHE, RUNTIME_CACHE];

const SHELL_URLS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/css/infinito.css',
  './js/corazon-palabras.js',
  './js/rueda.js',
  './js/flor-especial.js',
  './js/infinito.js',
  './assets/css/utilities.css',
  './assets/css/tokens.css',
  './assets/css/ornamentos.css',
  './assets/css/navegacion.css',
  './assets/css/portada.css',
  './assets/css/capitulos.css',
  './assets/css/tipografia.css',
  './assets/css/linea-tiempo.css',
  './assets/css/cd.css',
  './assets/css/movimiento.css',
  './assets/css/cartas-final.css',
  './assets/css/rueda.css',
  './assets/css/flor-especial.css',
  './assets/css/base.css',
  './assets/css/componentes.css',
  './assets/css/vistas.css',
  './assets/css/jardin.css',
  './assets/css/pausa.css',
  './assets/css/botones.css',
  './assets/css/movil.css',
  './js/ornamentos.js',
  './js/nucleo.js',
  './js/pausa.js',
  './js/motor-canvas.js',
  './js/ui.js',
  './js/audio.js',
  './js/secciones.js',
  './js/buzon-juegos.js',
  './js/extras.js',
  './js/sonidos.js',
  './js/gestos.js',
  './js/micro.js',
  './js/motor.js',
  './js/flujo.js',
  './js/barra.js',
  './js/tarjetas.js',
  './js/cartas-final.js',
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
  './contenido/idiomas.js',
  './contenido/rueda.js',
];

/* Precache tolerante: cada archivo por separado. Con addAll (todo o nada) un solo 404 o un
   corte de red dejaba la versión nueva sin instalar y a Lexi con la vieja para siempre.
   Three.js (≈ 700 KB) NO se precachea: solo lo usa "una flor especial" y se guarda la
   primera vez que se abre (cache-first del runtime). */
async function precachear(nombre, urls) {
  const cache = await caches.open(nombre);
  await Promise.allSettled(urls.map(async (u) => {
    try {
      const r = await fetch(u, { cache: 'reload' });
      if (r && r.ok) { await cache.put(u, r); return; }
    } catch (e) {}
    /* no se pudo bajar: conservar la copia de una versión anterior antes de que "activate" la borre */
    try {
      const viejo = await caches.match(u);
      if (viejo) await cache.put(u, viejo);
    } catch (e) {}
  }));
}
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      await precachear(SHELL_CACHE, SHELL_URLS);
      await precachear(CONTENIDO_CACHE, CONTENIDO_URLS);
      self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      // solo las cachés propias (jardin-*): el origen papijulis.github.io lo comparten otros proyectos
      await Promise.all(names.filter((n) => n.startsWith('jardin-') && !ALL_CACHES.includes(n)).map((n) => caches.delete(n)));
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

/* network-first con tiempo límite: con señal débil, si hay copia guardada se usa a los 4 s (la
   página) o 12 s (los demás archivos) en vez de esperar indefinidamente, o si la red responde con
   error (404/5xx, p. ej. durante un despliegue); la respuesta de red, si llega después, igual
   actualiza la caché */
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const esNav = request.mode === 'navigate';
  // La página se guarda sin la query (?fbclid, ?utm_, ?fecha): una sola copia, y sin conexión
  // también abre con parámetros en la URL
  let clave = request;
  if (esNav) { const u = new URL(request.url); u.search = ''; u.hash = ''; clave = u.href; }
  // Archivos (no la página): no-cache = siempre revalida con el servidor (con ETag cuesta un 304)
  // en vez de usar la caché HTTP de 10 min de GitHub Pages, que mezclaba index.html nuevo con
  // js/*.js viejos
  const red = (esNav ? fetch(request) : fetch(request, { cache: 'no-cache' })).then((response) => {
    if (response && response.ok && !response.redirected) cache.put(clave, response.clone()).catch(() => {});
    return response;
  });
  red.catch(() => {});   // si gana el reloj y luego falla la red, no es un error sin atender
  const esInicio = esNav && new URL(request.url).pathname.endsWith('/');
  const cached = (await cache.match(clave)) || (esInicio ? await cache.match('./index.html') : undefined);
  if (!cached) return red;
  // nunca esperar para siempre: con una red colgada un <script> bloqueante dejaría la página en blanco
  const limite = esNav ? 4000 : 12000;
  let reloj;
  const tiempo = new Promise((res) => { reloj = setTimeout(() => res(cached), limite); });
  try {
    const r = await Promise.race([red, tiempo]);
    clearTimeout(reloj);
    if (r && (r.ok || r.type === 'opaqueredirect')) return r;
    return cached; // 404/5xx de la red: mejor la copia buena
  } catch (e) {
    clearTimeout(reloj);
    return cached;
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
  // Three.js r160 y OrbitControls (versión fija, ~700 KB): cache-first; se renuevan solo al subir CACHE_VERSION
  if (url.pathname.includes('/assets/vendor/')) {
    event.respondWith(cacheFirst(req, RUNTIME_CACHE));
    return;
  }
  if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname.endsWith('.html')) {
    event.respondWith(networkFirst(req, RUNTIME_CACHE));
    return;
  }
  // Todo lo demás (fotos, iconos y otros estáticos que no son JS/CSS/HTML):
  // cache-first bajo demanda, se va guardando conforme se usa.
  event.respondWith(cacheFirst(req, RUNTIME_CACHE));
});
