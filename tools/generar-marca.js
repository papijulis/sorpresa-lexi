#!/usr/bin/env node
/* Genera las fuentes SVG de la marca (ícono de la app, ícono "maskable", favicon y
   la imagen para compartir) con la MISMA flor maestra del sitio: lirio de 6 pétalos
   con ∞ debajo. Después se rasterizan con Inkscape (ver comandos al final de la salida).
   Uso: node tools/generar-marca.js */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const f = (n) => +n.toFixed(2);

function petal(len, w) {
  return `M0 0C${f(w * 0.75)} ${f(-len * 0.28)} ${f(w * 0.55)} ${f(-len * 0.72)} 0 ${f(-len)}C${f(-w * 0.55)} ${f(-len * 0.72)} ${f(-w * 0.75)} ${f(-len * 0.28)} 0 0Z`;
}
function lirio(cx, cy, S) {
  const W = S * 0.42; let g = `<g transform="translate(${cx} ${cy})">`;
  g += `<circle r="${f(S * 1.12)}" fill="url(#glow)"/>`;
  for (let i = 0; i < 6; i++) g += `<path d="${petal(S, W)}" transform="rotate(${i * 60})" fill="url(#petal)" stroke="#B45309" stroke-width="${f(S * 0.022)}"/>`;
  for (let i = 0; i < 6; i++) {
    const a = i * 60 + 17.2, L = S * 0.55;
    g += `<g transform="rotate(${f(a)})"><path d="M0 0V${f(-L)}" stroke="#D97706" stroke-width="${f(S * 0.016)}" fill="none"/><circle cy="${f(-L)}" r="${f(S * 0.05)}" fill="#D97706"/></g>`;
  }
  return g + `<circle r="${f(S * 0.14)}" fill="#B45309"/></g>`;
}
function lemniscata(cx, cy, a, n = 140) {
  let d = '';
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2, den = 1 + Math.sin(t) ** 2;
    d += (i ? 'L' : 'M') + f(cx + (a * Math.cos(t)) / den) + ' ' + f(cy + (a * Math.sin(t) * Math.cos(t)) / den);
  }
  return d + 'Z';
}
const DEFS = (w, h, cx, cy) => `<defs>
  <radialGradient id="bg" cx="${cx}%" cy="${cy}%" r="85%"><stop offset="0%" stop-color="#3a1458"/><stop offset="55%" stop-color="#18062B"/><stop offset="100%" stop-color="#090112"/></radialGradient>
  <linearGradient id="petal" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stop-color="#F59E0B"/><stop offset="100%" stop-color="#FEF08A"/></linearGradient>
  <radialGradient id="glow" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#FFE9A8" stop-opacity=".5"/><stop offset="100%" stop-color="#FFE9A8" stop-opacity="0"/></radialGradient>
</defs>`;

function icono({ safe }) {
  const S = safe ? 100 : 128, cy = safe ? 226 : 222, infY = safe ? 392 : 410, a = safe ? 86 : 108;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">\n${DEFS(512, 512, 50, 38)}\n  <rect width="512" height="512" fill="url(#bg)"/>\n  ${lirio(256, cy, S)}\n  <path d="${lemniscata(256, infY, a)}" fill="none" stroke="#FFD700" stroke-width="${safe ? 7 : 9}" stroke-linejoin="round" opacity=".92"/>\n</svg>\n`;
}
function favicon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">\n${DEFS(512, 512, 50, 45)}\n  <rect width="512" height="512" rx="96" fill="url(#bg)"/>\n  ${lirio(256, 262, 190)}\n</svg>\n`;
}
function og() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">\n${DEFS(1200, 630, 38, 45)}\n  <rect width="1200" height="630" fill="url(#bg)"/>\n  ${lirio(300, 290, 150)}\n  <path d="${lemniscata(300, 520, 120)}" fill="none" stroke="#FFD700" stroke-width="8" stroke-linejoin="round" opacity=".92"/>\n` +
`  <text x="560" y="290" font-family="DejaVu Serif, Georgia, serif" font-size="88" font-weight="700" fill="#FDFBF7">Para Lexi</text>\n` +
`  <text x="560" y="290" font-family="DejaVu Serif, Georgia, serif" font-size="88" font-weight="700" fill="#FFD700" opacity="0.9">Para Lexi</text>\n` +
`  <text x="564" y="352" font-family="DejaVu Sans, Arial, sans-serif" font-size="25" fill="#E9D5FF">Un pequeño mundo hecho de flores amarillas,</text>\n` +
`  <text x="564" y="388" font-family="DejaVu Sans, Arial, sans-serif" font-size="25" fill="#E9D5FF">atardeceres y todo lo que siento por ti.</text>\n</svg>\n`;
}
fs.writeFileSync(path.join(ROOT, 'assets/icons/icon-source.svg'), icono({ safe: false }));
fs.writeFileSync(path.join(ROOT, 'assets/icons/icon-maskable-source.svg'), icono({ safe: true }));
fs.writeFileSync(path.join(ROOT, 'assets/icons/favicon-source.svg'), favicon());
fs.writeFileSync(path.join(ROOT, 'assets/img/og-source.svg'), og());
console.log('marca: fuentes SVG generadas. Rasteriza con:');
console.log(`  cd assets/icons && inkscape icon-source.svg -w 192 -h 192 -o icon-192.png && inkscape icon-source.svg -w 512 -h 512 -o icon-512.png`);
console.log(`  inkscape icon-maskable-source.svg -w 192 -h 192 -o icon-maskable-192.png && inkscape icon-maskable-source.svg -w 512 -h 512 -o icon-maskable-512.png`);
console.log(`  inkscape favicon-source.svg -w 32 -h 32 -o favicon-32.png`);
console.log(`  cd ../img && inkscape og-source.svg -w 1200 -h 630 -o /tmp/og.png && convert /tmp/og.png -quality 90 og.jpg`);
