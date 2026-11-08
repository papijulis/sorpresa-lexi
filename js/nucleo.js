/* ======================================================================
   DATA — ahora vive en contenido/*.js:
   MEMORIES, REASONS, SONGS, POLAROIDS, FAVORITE_PHOTOS, LETTER,
   START_DATE, MONTHS_SEQUENCE, WISH_1111_TEXT, SUNSET_TOAST_TEXT
====================================================================== */
function rand(min, max) { return Math.random() * (max - min) + min; }
function pad2(n) { return n < 10 ? '0' + n : '' + n; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

/* Fase 5 — optimización de fotos: cada .jpeg en assets/img/ tiene un
   hermano .webp (ver tools/optimize-images.py). IMG_DIMENSIONS evita el
   salto de layout (CLS) dando el width/height real antes de que cargue
   la imagen. Usado tanto por el script principal como por
   js/juegos/memorama.js (solo dentro de start(), nunca al nivel
   superior del archivo, porque ese módulo carga antes que este script). */
const IMG_DIMENSIONS = {
  'flores-panchito.jpeg': { w: 760, h: 428 },
  'fondo-chat.jpeg': { w: 570, h: 760 },
  'frutos-rojos.jpeg': { w: 570, h: 760 },
  'girasoles-ella.jpeg': { w: 760, h: 428 },
  'girasoles.jpeg': { w: 570, h: 760 },
  'lirios-jarron.jpeg': { w: 428, h: 760 },
  'lirios-rosas-2.jpeg': { w: 428, h: 760 },
  'lirios-rosas.jpeg': { w: 565, h: 760 },
  'ramo-feito-ella.jpeg': { w: 716, h: 760 },
  'viendo-edgerunners.jpeg': { w: 570, h: 760 },
};
function escaparAttr(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }
function pictureHTML(src, alt, extraImgAttrs) {
  const webpSrc = src.replace(/\.jpe?g$/i, '.webp');
  const dims = IMG_DIMENSIONS[src.split('/').pop()];
  const dimAttrs = dims ? ` width="${dims.w}" height="${dims.h}"` : '';
  return `<picture><source srcset="${webpSrc}" type="image/webp"><img src="${src}" alt="${escaparAttr(alt)}" loading="lazy"${dimAttrs} ${extraImgAttrs || ''}></picture>`;
}

/* Un elemento que no es <button> pero se abre al tocarlo (día del calendario, sobre del
   Buzón, polaroid): también con teclado (Enter / Espacio) y con nombre para lectores. */
function hacerClicable(el, fn, etiqueta) {
  el.setAttribute('role', 'button');
  el.tabIndex = 0;
  if (etiqueta) el.setAttribute('aria-label', etiqueta);
  el.addEventListener('click', fn);
  el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(e); } });
}

/* localStorage with an in-memory fallback (private mode, quota, etc).
   Used by every feature that needs to remember progress across visits
   (frasco de razones, y lo que venga en fases futuras: buzón, cupones…). */
function createSafeStorage() {
  /* la memoria es una capa encima del disco: lo que no se pudo escribir se lee de memoria y todo
     lo demás se sigue leyendo de localStorage (antes, un solo fallo de escritura —cuota llena—
     dejaba de leer el progreso guardado el resto de la sesión) */
  const memory = {};
  return {
    get(key) {
      if (Object.prototype.hasOwnProperty.call(memory, key)) return memory[key];
      try { return localStorage.getItem(key); } catch (e) { return null; }
    },
    set(key, value) {
      try { localStorage.setItem(key, value); delete memory[key]; return; } catch (e) {}
      memory[key] = value;
    },
  };
}
const jardinStorage = createSafeStorage();

/* claves de "una vez por día" (11:11, celebración del 28): se borran las de hace más de 60 días */
(function podarClaves() {
  try {
    const limite = Date.now() - 60 * 86400000;
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (!k || !/^jardin\.(1111|mesiversario\.celebrado)\./.test(k)) continue;
      const m = k.match(/(\d{4}-\d{2}-\d{2})/);
      if (m && new Date(m[1] + 'T00:00:00').getTime() < limite) localStorage.removeItem(k);
    }
  } catch (e) { /* sin localStorage: nada que podar */ }
})();

