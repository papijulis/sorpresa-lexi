#!/usr/bin/env node
/**
 * check-assets.js — verifica que toda ruta ./assets/... referenciada en el
 * código exista en disco con el nombre EXACTO (mayúsculas/minúsculas),
 * porque GitHub Pages corre en Linux (sensible a mayúsculas) aunque el
 * desarrollo local a veces no lo sea.
 *
 * Uso: node tools/check-assets.js
 * Sin dependencias — solo módulos core de Node.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SCAN_EXTENSIONS = new Set(['.html', '.js']);
const SKIP_DIRS = new Set(['.git', 'node_modules', 'assets']);

// Matches ./assets/... or /assets/... (and bare assets/...) up to the next
// quote, backtick, parenthesis or whitespace.
const ASSET_PATH_RE = /\.?\/?assets\/[A-Za-z0-9_\-./]+\.[A-Za-z0-9]+/g;

function walk(dir, files) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else if (SCAN_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(full);
    }
  }
  return files;
}

function findExistingCaseInsensitive(relPath) {
  // Walks the path segment by segment, so we can tell the user exactly
  // which segment's case is wrong (or if the file is missing entirely).
  const segments = relPath.split('/').filter(Boolean);
  let dir = ROOT;
  let resolved = '';
  for (const segment of segments) {
    let entries;
    try {
      entries = fs.readdirSync(dir);
    } catch {
      return null;
    }
    const exactMatch = entries.includes(segment);
    const caseInsensitiveMatch = entries.find((e) => e.toLowerCase() === segment.toLowerCase());
    if (exactMatch) {
      dir = path.join(dir, segment);
      resolved += '/' + segment;
    } else if (caseInsensitiveMatch) {
      return { realCase: resolved + '/' + caseInsensitiveMatch, exact: false };
    } else {
      return null;
    }
  }
  return { realCase: resolved, exact: true };
}

function existeExacto(relPath) {
  // Comparación exacta por segmentos: readdirSync devuelve el nombre real en disco,
  // así que detecta errores de mayúsculas también en APFS/NTFS (que existsSync no).
  let dir = ROOT;
  for (const segment of relPath.split('/').filter((s) => s && s !== '.')) {
    let entries;
    try { entries = fs.readdirSync(dir); } catch { return false; }
    if (!entries.includes(segment)) return false;
    dir = path.join(dir, segment);
  }
  return true;
}

// Referencias que el escaneo de 'assets/' no ve: <script>/<link> de los HTML
// (./js/..., ./contenido/...), el precache de sw.js, los iconos del manifest,
// los url(...) de los CSS y los módulos de Three.js que js/flor-especial.js
// arma en tiempo de ejecución. Devuelve { refs: Map(ruta -> Set(origen)), errores }.
function collectExtraReferences() {
  const refs = new Map();
  const errores = [];
  const leer = (rel) => {
    try { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }
    catch { errores.push(`✗ ./${rel}  no se pudo leer (¿falta el archivo?)`); return null; }
  };
  const limpiar = (u) => u.split(/[?#]/)[0];
  const agregar = (raw, origen) => {
    let p = path.posix.normalize(limpiar(raw)).replace(/^\.\//, '').replace(/^\/+/, '');
    if (!p || p === '.' || p === './') return;
    if (p === '..' || p.startsWith('../')) {
      errores.push(`✗ ${raw}  (referenciado en: ${origen})\n    la ruta sale de la carpeta del repo`);
      return;
    }
    if (!refs.has(p)) refs.set(p, new Set());
    refs.get(p).add(origen);
  };
  const esExterna = (u) => /^(#|data:|[a-z][a-z0-9+.-]*:|\/\/)/i.test(u);

  // (a) todo src/href local de index.html y editor.html
  for (const html of ['index.html', 'editor.html']) {
    const txt = leer(html);
    if (txt == null) continue;
    for (const m of txt.matchAll(/\b(?:src|href)\s*=\s*"([^"]+)"/g)) {
      if (esExterna(m[1]) || m[1].includes('${')) continue;
      agregar(m[1], html);
    }
  }

  // (b) precache de sw.js, y que todo JS/CSS que carga index.html esté precacheado
  const sw = leer('sw.js');
  const swUrls = sw == null ? [] : [...sw.matchAll(/'(\.\/[^']*)'/g)].map((m) => m[1]).filter((u) => u !== './');
  swUrls.forEach((u) => agregar(u, 'sw.js'));
  const index = leer('index.html');
  if (index != null && sw != null) {
    const swSet = new Set(swUrls.map(limpiar));
    for (const m of index.matchAll(/<(?:script|link)\b[^>]*\b(?:src|href)\s*=\s*"(\.\/[^"]+\.(?:js|css))(?:[?#][^"]*)?"/g)) {
      if (!swSet.has(m[1])) errores.push(`✗ ${m[1]}  lo carga index.html pero no está en el precache de sw.js`);
    }
  }

  // (c) iconos del manifest
  const manifest = leer('manifest.webmanifest');
  if (manifest != null) {
    try {
      for (const ic of JSON.parse(manifest).icons || []) {
        if (ic && typeof ic.src === 'string' && !esExterna(ic.src)) agregar(ic.src, 'manifest.webmanifest');
      }
    } catch (e) {
      errores.push(`✗ ./manifest.webmanifest  no es JSON válido: ${e.message}`);
    }
  }

  // (d) url(...) relativas de los CSS
  let cssFiles = [];
  try { cssFiles = fs.readdirSync(path.join(ROOT, 'assets/css')).filter((f) => f.endsWith('.css')); } catch {}
  for (const css of cssFiles) {
    const txt = leer('assets/css/' + css);
    if (txt == null) continue;
    for (const m of txt.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) {
      const u = m[1].trim();
      if (!u || esExterna(u)) continue;
      agregar(u.startsWith('/') ? u : path.posix.join('assets/css', u), 'assets/css/' + css);
    }
  }

  // (e) módulos de Three.js (rutas armadas en tiempo de ejecución en js/flor-especial.js)
  ['assets/vendor/three.module.min.js', 'assets/vendor/OrbitControls.js']
    .forEach((r) => agregar(r, 'js/flor-especial.js (import dinámico)'));

  return { refs, errores };
}

// Fase 5: cada .jpeg/.jpg de galería bajo assets/img/ (fuera de
// originales/) debe tener un hermano .webp — pictureHTML() en index.html
// lo deriva con un simple reemplazo de extensión en tiempo de ejecución,
// así que nunca aparece como ruta literal y el escaneo de arriba no lo
// detectaría solo. og.jpg queda afuera a propósito: solo lo leen los
// crawlers de redes sociales vía metatags, nunca pasa por pictureHTML().
const WEBP_EXEMPT = new Set(['assets/img/og.jpg']);
function checkWebpSiblings(referencesByPath) {
  const missing = [];
  for (const [relPath, usedIn] of referencesByPath) {
    if (!/^assets\/img\//.test(relPath)) continue;
    if (/^assets\/img\/originales\//.test(relPath)) continue;
    if (WEBP_EXEMPT.has(relPath)) continue;
    if (!/\.jpe?g$/i.test(relPath)) continue;
    const webpPath = relPath.replace(/\.jpe?g$/i, '.webp');
    const webpAbs = path.join(ROOT, webpPath);
    const usedInStr = [...usedIn].join(', ');
    if (!existeExacto(webpPath)) {
      missing.push({ relPath, webpPath, usedIn: usedInStr });
    } else {
      const size = fs.statSync(webpAbs).size;
      if (size < 1024) missing.push({ relPath, webpPath, usedIn: usedInStr, size });
    }
  }
  return missing;
}

function main() {
  const files = walk(ROOT, []);
  const referencesByPath = new Map(); // normalized asset path -> Set of files referencing it

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const matches = content.match(ASSET_PATH_RE) || [];
    for (const raw of matches) {
      const normalized = raw.replace(/^\.?\//, ''); // -> "assets/..."
      if (!referencesByPath.has(normalized)) referencesByPath.set(normalized, new Set());
      referencesByPath.get(normalized).add(path.relative(ROOT, file));
    }
  }

  let hasErrors = false;
  const checked = [...referencesByPath.keys()].sort();

  for (const relPath of checked) {
    if (existeExacto(relPath)) continue; // exact match, case included

    hasErrors = true;
    const usedIn = [...referencesByPath.get(relPath)].join(', ');
    const match = findExistingCaseInsensitive(relPath);
    if (match && !match.exact) {
      console.error(`✗ ./${relPath}  (referenciado en: ${usedIn})`);
      console.error(`    el archivo existe pero con otro nombre: .${match.realCase}`);
    } else {
      console.error(`✗ ./${relPath}  (referenciado en: ${usedIn})`);
      console.error(`    no se encontró ningún archivo con ese nombre`);
    }
  }

  // Archivos "fantasma": existen pero están vacíos o son placeholders (así estuvieron
  // los mp3 de las canciones: 2 bytes). Cualquier asset binario < 1 KB es sospechoso.
  for (const relPath of checked) {
    const absPath = path.join(ROOT, relPath);
    if (!existeExacto(relPath)) continue;
    if (!/\.(mp3|jpe?g|webp|png|woff2)$/i.test(relPath)) continue;
    const size = fs.statSync(absPath).size;
    if (size < 1024) {
      hasErrors = true;
      console.error(`✗ ./${relPath}  pesa solo ${size} bytes: parece un placeholder vacío`);
    }
  }

  const missingWebp = checkWebpSiblings(referencesByPath);
  for (const { relPath, webpPath, usedIn, size } of missingWebp) {
    hasErrors = true;
    console.error(`✗ ./${relPath}  (referenciado en: ${usedIn})`);
    if (typeof size === 'number') {
      console.error(`    su hermano ./${webpPath} pesa solo ${size} bytes: parece un placeholder vacío`);
    } else {
      console.error(`    falta su hermano .webp: ./${webpPath}`);
    }
  }

  // Rutas que el escaneo de 'assets/' no ve (scripts, hojas de estilo, sw.js,
  // manifest, url() de CSS, Three.js). Solo las que no se revisaron ya arriba.
  const extra = collectExtraReferences();
  for (const err of extra.errores) {
    hasErrors = true;
    console.error(err);
  }
  const extraChecked = [...extra.refs.keys()].filter((p) => !referencesByPath.has(p)).sort();
  for (const relPath of extraChecked) {
    const usedIn = [...extra.refs.get(relPath)].join(', ');
    if (existeExacto(relPath)) {
      // Mismo filtro de "placeholder vacío" que arriba: solo binarios, nunca .js/.css/.svg.
      if (!/\.(mp3|jpe?g|webp|png|woff2)$/i.test(relPath)) continue;
      const size = fs.statSync(path.join(ROOT, relPath)).size;
      if (size < 1024) {
        hasErrors = true;
        console.error(`✗ ./${relPath}  pesa solo ${size} bytes: parece un placeholder vacío`);
      }
      continue;
    }
    hasErrors = true;
    const match = findExistingCaseInsensitive(relPath);
    console.error(`✗ ./${relPath}  (referenciado en: ${usedIn})`);
    if (match && !match.exact) {
      console.error(`    el archivo existe pero con otro nombre: .${match.realCase}`);
    } else {
      console.error(`    no se encontró ningún archivo con ese nombre`);
    }
  }
  const total = checked.length + extraChecked.length;

  if (hasErrors) {
    console.error(`\ncheck-assets: ${total} ruta(s) revisada(s), hay errores arriba.`);
    process.exit(1);
  }

  console.log(`check-assets: ${total} ruta(s) revisada(s) (incluye hermanos .webp, scripts, estilos, sw.js y manifest), todas existen con el nombre exacto. ✓`);
  process.exit(0);
}

main();
