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
function pictureHTML(src, alt, extraImgAttrs) {
  const webpSrc = src.replace(/\.jpe?g$/i, '.webp');
  const dims = IMG_DIMENSIONS[src.split('/').pop()];
  const dimAttrs = dims ? ` width="${dims.w}" height="${dims.h}"` : '';
  return `<picture><source srcset="${webpSrc}" type="image/webp"><img src="${src}" alt="${alt || ''}" loading="lazy"${dimAttrs} ${extraImgAttrs || ''}></picture>`;
}

/* localStorage with an in-memory fallback (private mode, quota, etc).
   Used by every feature that needs to remember progress across visits
   (frasco de razones, y lo que venga en fases futuras: buzón, cupones…). */
function createSafeStorage() {
  let memory = {};
  let ok = true;
  try {
    const probe = '__jardin_probe__';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
  } catch (e) { ok = false; }
  return {
    get(key) {
      if (ok) { try { return localStorage.getItem(key); } catch (e) { ok = false; } }
      return Object.prototype.hasOwnProperty.call(memory, key) ? memory[key] : null;
    },
    set(key, value) {
      if (ok) { try { localStorage.setItem(key, value); return; } catch (e) { ok = false; } }
      memory[key] = value;
    },
  };
}
const jardinStorage = createSafeStorage();

