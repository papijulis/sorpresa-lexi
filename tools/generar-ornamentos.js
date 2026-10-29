#!/usr/bin/env node
/* Genera la biblioteca de ornamentos e íconos de "Nuestro Jardín" (la firma visual).
   Fuente única de verdad: aquí vive la geometría. Escribe:
     - assets/img/ornamentos.svg   (referencia visual / para rasterizar con Inkscape)
     - js/ornamentos.js            (sprite inyectado en la página + helpers ico()/iconizar(),
                                    funciona también abriendo index.html con file://)
   Uso: node tools/generar-ornamentos.js
   No es un paso de build obligatorio: los dos archivos generados van en el repo. */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const f = (n) => +n.toFixed(2);
const rad = (d) => (d * Math.PI) / 180;

/* ---------- geometría del lirio (la misma del canvas: drawLilyPetalPath) ---------- */
function petalPath(len, width) {
  return `M0 0C${f(width * 0.75)} ${f(-len * 0.28)} ${f(width * 0.55)} ${f(-len * 0.72)} 0 ${f(-len)}` +
         `C${f(-width * 0.55)} ${f(-len * 0.72)} ${f(-width * 0.75)} ${f(-len * 0.28)} 0 0Z`;
}
function leafPath(len, width) {
  return `M0 0Q${f(width)} ${f(-len * 0.5)} 0 ${f(-len)}Q${f(-width)} ${f(-len * 0.5)} 0 0Z`;
}

/* lirio completo con degradado, hojas y estambres (centrado en 50,50) */
function lirio() {
  const S = 40, W = S * 0.42;
  let g = `<g transform="translate(50 52)">`;
  g += `<path d="${leafPath(S * 0.9, S * 0.22)}" transform="rotate(140)" fill="rgba(132,148,79,.55)"/>`;
  g += `<path d="${leafPath(S * 0.8, S * 0.2)}" transform="rotate(-140)" fill="rgba(132,148,79,.45)"/>`;
  for (let i = 0; i < 6; i++) {
    g += `<path d="${petalPath(S, W)}" transform="rotate(${i * 60})" fill="url(#orn-g-petalo)" stroke="rgba(180,83,9,.4)" stroke-width=".9"/>`;
  }
  for (let i = 0; i < 6; i++) {
    const a = i * 60 + 17.2, L = S * 0.55;
    g += `<g transform="rotate(${f(a)})"><path d="M0 0V${f(-L)}" stroke="rgba(217,119,6,.85)" stroke-width="1.2" fill="none"/><circle cy="${f(-L)}" r="${f(S * 0.05)}" fill="#D97706"/></g>`;
  }
  g += `<circle r="${f(S * 0.14)}" fill="#B45309"/></g>`;
  return g;
}
/* lirio de contorno (hereda color con currentColor) */
function lirioLinea(S = 40, sw = 1.8) {
  const W = S * 0.42;
  let g = `<g transform="translate(50 52)" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round">`;
  for (let i = 0; i < 6; i++) g += `<path d="${petalPath(S, W)}" transform="rotate(${i * 60})"/>`;
  g += `<circle r="${f(S * 0.1)}" fill="currentColor" stroke="none"/></g>`;
  return g;
}
/* lirio sólido pequeño para viñetas */
function lirioMini() {
  const S = 42, W = S * 0.46;
  let g = `<g transform="translate(50 52)" fill="currentColor">`;
  for (let i = 0; i < 6; i++) g += `<path d="${petalPath(S, W)}" transform="rotate(${i * 60})"/>`;
  g += `<circle r="${f(S * 0.15)}" fill="var(--lirio-centro, #18062B)"/></g>`;
  return g;
}

/* lemniscata (∞) — viewBox 0 0 100 50 */
function lemniscata(a = 44, cx = 50, cy = 25, n = 120) {
  let d = '';
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2;
    const den = 1 + Math.sin(t) * Math.sin(t);
    const x = cx + (a * Math.cos(t)) / den;
    const y = cy + (a * Math.sin(t) * Math.cos(t)) / den;
    d += (i ? 'L' : 'M') + f(x) + ' ' + f(y);
  }
  return d + 'Z';
}
/* corazón paramétrico — viewBox 0 0 100 100 (misma curva de Constelación) */
function corazonPath(k = 2.7, n = 120) {
  let d = '';
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    d += (i ? 'L' : 'M') + f(50 + x * k) + ' ' + f(50 - 2.5 * k + y * k);
  }
  return d + 'Z';
}

/* ---------- íconos de línea, cuadrícula 24x24 ---------- */
const L = (inner) => `<g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${inner}</g>`;
function rayos(cx, cy, r1, r2, n, off = 0) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const a = rad(off + (i * 360) / n);
    s += `M${f(cx + Math.cos(a) * r1)} ${f(cy + Math.sin(a) * r1)}L${f(cx + Math.cos(a) * r2)} ${f(cy + Math.sin(a) * r2)}`;
  }
  return s;
}
const HEART24 = 'M12 20.2S4.5 15.6 4.5 10a4.1 4.1 0 0 1 7.5-2.3A4.1 4.1 0 0 1 19.5 10c0 5.6-7.500 10.2-7.500 10.2z';

const ICONOS = {
  sol: L(`<circle cx="12" cy="12" r="4.2"/><path d="${rayos(12, 12, 7.2, 9.6, 8)}"/>`),
  luna: L('<path d="M20 14.2A8.5 8.5 0 1 1 9.8 4a6.8 6.8 0 0 0 10.2 10.2z"/>'),
  'luna-solida': `<path d="M20 14.2A8.5 8.5 0 1 1 9.8 4a6.8 6.8 0 0 0 10.2 10.2z" fill="currentColor"/>`,
  atardecer: L('<path d="M6.8 15.5a5.2 5.2 0 0 1 10.4 0"/><path d="M3 15.5h18M6 19h12"/><path d="M12 5.2v2.3M5.4 8.4l1.6 1.6M18.6 8.4L17 10M3.4 12h2M18.6 12h2"/>'),
  sobre: L('<rect x="3" y="5.5" width="18" height="13" rx="2.6"/><path d="M3.6 7.6 12 13.4l8.4-5.8"/>'),
  'sobre-corazon': L('<rect x="3" y="5.5" width="18" height="13" rx="2.6"/><path d="M3.6 7.6 12 13.4l8.4-5.8"/><path d="M12 17.2s-2.2-1.4-2.2-3a1.2 1.2 0 0 1 2.2-.7 1.2 1.2 0 0 1 2.200.7c0 1.600-2.200 3-2.200 3z" fill="currentColor" stroke="none"/>'),
  mando: L('<path d="M7.5 7.5h9A4.500 4.500 0 0 1 21 12l-.9 4.100a2.500 2.500 0 0 1-4.300.800L14.600 15.400H9.400L8.200 16.900a2.500 2.500 0 0 1-4.300-.800L3 12a4.500 4.500 0 0 1 4.500-4.500z"/><path d="M8 10.200v3M6.500 11.700h3"/><circle cx="15.600" cy="10.800" r=".7" fill="currentColor"/><circle cx="17.600" cy="12.600" r=".7" fill="currentColor"/>'),
  vinilo: L('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.2"/><circle cx="12" cy="12" r=".9" fill="currentColor"/><path d="M5.200 9.200a7.200 7.200 0 0 1 3.800-3.600"/>'),
  cupon: L('<path d="M3 8V6.500A1.500 1.500 0 0 1 4.500 5h15A1.500 1.500 0 0 1 21 6.500V8a2.500 2.500 0 0 0 0 4v0a2.500 2.500 0 0 0 0 4v1.500a1.500 1.500 0 0 1-1.500 1.500h-15A1.500 1.500 0 0 1 3 17.500V16a2.500 2.500 0 0 0 0-4v0A2.500 2.500 0 0 0 3 8z"/><path d="M14.500 5.500v13" stroke-dasharray="1.800 2.200"/>'),
  cartas: L('<rect x="3.500" y="6.500" width="10" height="13" rx="2" transform="rotate(-9 8.500 13)"/><rect x="11" y="4" width="10" height="13" rx="2"/><path d="M16 13.400s-2.200-1.300-2.200-2.800a1.200 1.200 0 0 1 2.200-.6 1.200 1.200 0 0 1 2.200.6c0 1.500-2.200 2.800-2.200 2.800z"/>'),
  gota: L('<path d="M12 3.200c3.200 4 6 7 6 10.600a6 6 0 0 1-12 0c0-3.600 2.800-6.600 6-10.600z"/><path d="M9.200 14a3 3 0 0 0 2 2.800"/>'),
  constelacion: L('<path d="M5 17l5.500-8L16 14l4-7"/><circle cx="5" cy="17" r="1.300" fill="currentColor"/><circle cx="10.500" cy="9" r="1.300" fill="currentColor"/><circle cx="16" cy="14" r="1.300" fill="currentColor"/><circle cx="20" cy="7" r="1.300" fill="currentColor"/>'),
  curame: L(`<path d="${HEART24}"/><path d="M12 10v4.400M9.800 12.200h4.400"/>`),
  caceria: L(`<path d="${HEART24}"/><path d="M3.500 20.500 20.500 3.500M17 3.500h3.500V7"/>`),
  corazon: L(`<path d="${HEART24}"/>`),
  'corazon-lleno': `<path d="${HEART24}" fill="currentColor"/>`,
  estrella: L('<path d="M12 3.500c.8 4.400 2.100 5.700 6.500 6.500-4.400.8-5.700 2.100-6.500 6.500-.8-4.400-2.100-5.700-6.500-6.500C9.900 9.200 11.200 7.900 12 3.500z"/><path d="M18.500 15.500v3.600M16.700 17.300h3.600"/>'),
  abrazo: L('<path d="M12 19.500S5 15.600 5 10.800a3.800 3.800 0 0 1 7-2 3.800 3.800 0 0 1 7 2c0 4.800-7 8.700-7 8.700z"/><path d="M4 14.500c2 3.200 5 4.800 8 4.800s6-1.600 8-4.800"/>'),
  beso: L('<path d="M3.500 12c2-3.200 5-3.600 8.500-1.800 3.500-1.800 6.500-1.400 8.500 1.800-2 4-5.500 6-8.500 6s-6.500-2-8.500-6z"/><path d="M3.800 12.200c2.600.9 5.400.9 8.200.9s5.600 0 8.200-.9"/>'),
  tv: L('<rect x="3" y="5" width="18" height="12" rx="2.400"/><path d="M8.500 20.500h7M12 17v3.500"/><path d="M9.500 8.800l5 2.200-5 2.200z" fill="currentColor"/>'),
  huella: L('<path d="M9 21c-2 0-3-1.500-2.500-3.500C7 15 8 13.500 9.500 12.500s3.500-.5 4 1.500c.5 2-.5 4.500-2 6-1 .9-1.700 1-2.500 1z"/><circle cx="10" cy="7" r="1.500"/><circle cx="14" cy="6" r="1.400"/><circle cx="17" cy="8" r="1.300"/><circle cx="7" cy="9" r="1.300"/>'),
  tazon: L('<path d="M4 11h16a8 8 0 0 1-16 0z"/><path d="M8 20h8M9 3.500c-1 1.200 1 2.200 0 3.500M13 3.500c-1 1.200 1 2.200 0 3.500"/>'),
  claqueta: L('<path d="M3.500 10.500h17V19a1.500 1.500 0 0 1-1.500 1.500H5A1.500 1.500 0 0 1 3.500 19z"/><path d="M3.500 10.500l-.8-4.200 16.200-3 .8 4.200M7 7.700l2.200 3.800M12 6.800l2.200 3.800"/>'),
  cubiertos: L('<path d="M6.500 3.500v6.300a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V3.500M8.500 3.500V20.500"/><path d="M16.500 3.500c-2 1.700-2.800 4-2.800 7h2.800zM16.500 10.500v10"/>'),
  carro: L('<path d="M4 15.500l1.600-5a2 2 0 0 1 1.900-1.400h9a2 2 0 0 1 1.900 1.400l1.600 5"/><rect x="3" y="15.500" width="18" height="3.500" rx="1.500"/><circle cx="7.500" cy="17.300" r=".8" fill="currentColor"/><circle cx="16.500" cy="17.300" r=".8" fill="currentColor"/>'),
  dado: L('<rect x="4" y="4" width="16" height="16" rx="3.500"/><circle cx="8.700" cy="8.700" r="1" fill="currentColor"/><circle cx="15.300" cy="15.300" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/>'),
  casa: L('<path d="M3.500 11.500 12 4l8.500 7.500"/><path d="M5.500 10.500V20h13v-9.500"/><path d="M10 20v-5.500h4V20"/>'),
  vela: L('<path d="M8.500 10.500h7V20a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1z"/><path d="M12 10.500V9"/><path d="M12 2.800c2 2 3 3.500 3 5a3 3 0 0 1-6 0c0-1.500 1-3 3-5z" fill="currentColor" stroke="none"/>'),
  sonido: L('<path d="M4 9.500v5h3.500L12 18.500v-13L7.500 9.500z"/><path d="M15.500 9a4 4 0 0 1 0 6M18 6.500a8 8 0 0 1 0 11"/>'),
  'sonido-off': L('<path d="M4 9.500v5h3.500L12 18.500v-13L7.500 9.500z"/><path d="M16 9.500l5 5M21 9.500l-5 5"/>'),
  nota: L('<path d="M9 17.500V5.500l10-2v12"/><circle cx="6.500" cy="17.500" r="2.500"/><circle cx="16.500" cy="15.500" r="2.500"/>'),
  siguiente: L('<path d="M5 6v12M9.500 6l9 6-9 6z" />'),
  play: `<path d="M8 5.500v13l11-6.500z" fill="currentColor"/>`,
  pausa: `<rect x="6.500" y="5" width="4" height="14" rx="1.200" fill="currentColor"/><rect x="13.500" y="5" width="4" height="14" rx="1.200" fill="currentColor"/>`,
  cerrar: L('<path d="M6 6l12 12M18 6L6 18"/>'),
  candado: L('<rect x="5" y="10.500" width="14" height="10" rx="2.500"/><path d="M8 10.500V8a4 4 0 0 1 8 0v2.500"/>'),
  reloj: L('<circle cx="12" cy="12" r="8.500"/><path d="M12 7v5l3.200 2"/>'),
  regalo: L('<rect x="3.500" y="9" width="17" height="11" rx="1.800"/><path d="M3 9h18M12 9v11M12 9c-2.500 0-4.500-1-4.500-2.800a1.800 1.800 0 0 1 3-1.300C11.700 5.800 12 7.500 12 9zM12 9c2.500 0 4.500-1 4.500-2.800a1.800 1.800 0 0 0-3-1.300C12.300 5.800 12 7.500 12 9z"/>'),
  sandglass: L('<path d="M6.500 3.500h11M6.500 20.500h11M7.500 3.500c0 4 4.500 5.500 4.500 8.500s-4.500 4.500-4.500 8.500M16.500 3.500c0 4-4.500 5.500-4.500 8.500s4.500 4.500 4.500 8.500"/>'),
  palomita: L('<path d="M5 12.800l4.600 4.600L19 7.500"/>'),
  mariposa: L('<path d="M12 12C9 6.500 4.500 6 3.500 9.500 3 12 6 13.500 12 12zM12 12c-4 .5-7 3-5.500 6 1.200 2 4.500 1 5.500-6z"/><path d="M12 12c3-5.500 7.500-6 8.500-2.500.5 2.500-2.500 4-8.500 2.500zM12 12c4 .5 7 3 5.500 6-1.200 2-4.500 1-5.500-6z"/><path d="M12 8.500v8.500M10.500 6.800 12 8.500l1.500-1.700"/>'),
};

/* ---------- símbolos "firma" con viewBox propio ---------- */
const SIMBOLOS = [
  ['lirio', '0 0 100 100', lirio()],
  ['lirio-linea', '0 0 100 100', lirioLinea()],
  ['lirio-mini', '0 0 100 100', lirioMini()],
  ['infinito', '0 0 100 50', `<path d="${lemniscata()}" pathLength="100" fill="none" stroke="currentColor" stroke-width="3.200" stroke-linejoin="round"/>`],
  ['infinito-flor', '0 0 100 50',
    `<path d="${lemniscata()}" pathLength="100" fill="none" stroke="currentColor" stroke-width="2.800" stroke-linejoin="round"/>` +
    `<g transform="translate(50 25) scale(.2)" fill="var(--fondo-ornamento, #18062B)" stroke="currentColor" stroke-width="7" stroke-linejoin="round">` +
    [0, 1, 2, 3, 4, 5].map((i) => `<path d="${petalPath(40, 17)}" transform="rotate(${i * 60})"/>`).join('') + `</g>`],
  ['corazon-firma', '0 0 100 100', `<path d="${corazonPath()}" pathLength="100" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>`],
  ['brillo', '0 0 100 100', '<path d="M50 4C55 36 64 45 96 50 64 55 55 64 50 96 45 64 36 55 4 50 36 45 45 36 50 4z" fill="currentColor"/>'],
  /* divisor ornamental: dos líneas que se desvanecen + flor al centro (viewBox 0 0 400 28) */
  ['divisor', '0 0 400 28',
    `<path class="orn-trazo" d="M10 14H168" pathLength="100" fill="none" stroke="currentColor" stroke-width="1.400" stroke-linecap="round"/>` +
    `<path class="orn-trazo" d="M390 14H232" pathLength="100" fill="none" stroke="currentColor" stroke-width="1.400" stroke-linecap="round"/>` +
    `<g class="orn-flor" transform="translate(200 14) scale(.2)" fill="none" stroke="currentColor" stroke-width="7" stroke-linejoin="round">` +
    [0, 1, 2, 3, 4, 5].map((i) => `<path d="${petalPath(46, 19)}" transform="rotate(${i * 60})"/>`).join('') +
    `<circle r="5" fill="currentColor" stroke="none"/></g>` +
    `<circle cx="180" cy="14" r="1.600" fill="currentColor"/><circle cx="220" cy="14" r="1.600" fill="currentColor"/>`],
];

/* ---------- ensamblado ---------- */
const DEFS = `<defs>` +
  `<linearGradient id="orn-g-petalo" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="-40"><stop offset="0" stop-color="#F59E0B"/><stop offset="1" stop-color="#FEF08A"/></linearGradient>` +
  `</defs>`;

let symbols = '';
SIMBOLOS.forEach(([id, vb, inner]) => { symbols += `<symbol id="${id}" viewBox="${vb}">${inner}</symbol>`; });
Object.keys(ICONOS).forEach((id) => { symbols += `<symbol id="i-${id}" viewBox="0 0 24 24">${ICONOS[id]}</symbol>`; });

const svgFile = `<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute">\n${DEFS}\n${symbols.replace(/<symbol/g, '\n<symbol')}\n</svg>\n`;
fs.writeFileSync(path.join(ROOT, 'assets/img/ornamentos.svg'), svgFile);

const DIVISOR_INLINE = `<svg class="orn-divisor-svg" viewBox="0 0 400 28" aria-hidden="true" focusable="false">` +
  `<path class="orn-trazo" d="M10 14H168" pathLength="100" fill="none" stroke="currentColor" stroke-width="1.400" stroke-linecap="round"/>` +
  `<path class="orn-trazo" d="M390 14H232" pathLength="100" fill="none" stroke="currentColor" stroke-width="1.400" stroke-linecap="round"/>` +
  `<g class="orn-flor" transform="translate(200 14) scale(.2)" fill="none" stroke="currentColor" stroke-width="7" stroke-linejoin="round">` +
  [0, 1, 2, 3, 4, 5].map((i) => `<path d="${petalPath(46, 19)}" transform="rotate(${i * 60})"/>`).join('') +
  `<circle r="5" fill="currentColor" stroke="none"/></g>` +
  `<circle class="orn-punto" cx="180" cy="14" r="1.600" fill="currentColor"/><circle class="orn-punto" cx="220" cy="14" r="1.600" fill="currentColor"/></svg>`;

const PRELOADER_INLINE = `<svg class="orn-lirio-carga" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><g transform="translate(50 52)">` +
  [0, 1, 2, 3, 4, 5].map((i) => `<g transform="rotate(${i * 60})"><path class="petalo" style="--i:${i}" d="${petalPath(40, 16.8)}" fill="url(#orn-g-petalo)" stroke="rgba(180,83,9,.4)" stroke-width=".9"/></g>`).join('') +
  [0, 1, 2, 3, 4, 5].map((i) => `<g transform="rotate(${f(i * 60 + 17.2)})" class="estambre"><path d="M0 0V-22" stroke="rgba(217,119,6,.85)" stroke-width="1.200" fill="none"/><circle cy="-22" r="2" fill="#D97706"/></g>`).join('') +
  `<circle class="centro" r="5.600" fill="#B45309"/></g></svg>`;

const lista = SIMBOLOS.map((s) => s[0]).concat(Object.keys(ICONOS).map((i) => 'i-' + i));
const js = `/* GENERADO por tools/generar-ornamentos.js — no editar a mano.
   Biblioteca de ornamentos e íconos SVG de "Nuestro Jardín" (la firma visual).
   Se inyecta al inicio del <body> para que funcione también con file://.
   Uso: ico('lirio'), ico('i-sobre', 'ico-grande'), iconizar('Te amo {i-corazon}'). */
(function () {
  var SPRITE = ${JSON.stringify(DEFS + symbols)};
  window.ORNAMENTOS = ${JSON.stringify(lista)};
  function inyectar() {
    if (document.getElementById('orn-sprite')) return;
    var host = document.createElement('div');
    host.innerHTML = '<svg id="orn-sprite" xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">' + SPRITE + '</svg>';
    document.body.insertBefore(host.firstChild, document.body.firstChild);
  }
  function rellenar() {
    var c = document.querySelectorAll('[data-orn-carga]');
    for (var i = 0; i < c.length; i++) if (!c[i].firstChild) c[i].innerHTML = window.ornPreloader();
  }
  if (document.body) inyectar(); else document.addEventListener('DOMContentLoaded', inyectar);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', rellenar); else rellenar();

  /* HTML de un ícono del sprite */
  window.ico = function (id, extra) {
    return '<svg class="ico' + (extra ? ' ' + extra : '') + '" aria-hidden="true" focusable="false"><use href="#' + id + '"/></svg>';
  };
  /* valor de un ícono: id del sprite → SVG; cualquier otro texto se escapa tal cual */
  window.iconoHTML = function (v, extra) {
    if (window.ORNAMENTOS.indexOf(v) > -1) return window.ico(v, extra);
    var d = document.createElement('div'); d.textContent = v == null ? '' : v; return d.innerHTML;
  };
  /* divisor ornamental con el trazo que se dibuja con el scroll (inline para poder animarlo) */
  window.ornDivisor = function () { return ${JSON.stringify(DIVISOR_INLINE)}; };
  /* flor de la precarga: los 6 pétalos florecen uno tras otro */
  window.ornPreloader = function () { return ${JSON.stringify(PRELOADER_INLINE)}; };
  /* "{i-corazon}" dentro de un texto → el SVG correspondiente */
  window.iconizar = function (texto) {
    return String(texto).replace(/\\{([a-z0-9-]+)\\}/g, function (m, id) { return window.ico(id); });
  };
})();
`;
fs.writeFileSync(path.join(ROOT, 'js/ornamentos.js'), js);
console.log(`ornamentos: ${lista.length} símbolos → assets/img/ornamentos.svg y js/ornamentos.js`);
