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
    if (!fs.existsSync(path.join(ROOT, webpPath))) {
      missing.push({ relPath, webpPath, usedIn: [...usedIn].join(', ') });
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
    const absPath = path.join(ROOT, relPath);
    if (fs.existsSync(absPath)) continue; // exact match, case included

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
    if (!fs.existsSync(absPath)) continue;
    if (!/\.(mp3|jpe?g|webp|png|woff2)$/i.test(relPath)) continue;
    const size = fs.statSync(absPath).size;
    if (size < 1024) {
      hasErrors = true;
      console.error(`✗ ./${relPath}  pesa solo ${size} bytes: parece un placeholder vacío`);
    }
  }

  const missingWebp = checkWebpSiblings(referencesByPath);
  for (const { relPath, webpPath, usedIn } of missingWebp) {
    hasErrors = true;
    console.error(`✗ ./${relPath}  (referenciado en: ${usedIn})`);
    console.error(`    falta su hermano .webp: ./${webpPath}`);
  }

  if (hasErrors) {
    console.error(`\ncheck-assets: ${checked.length} ruta(s) revisada(s), hay errores arriba.`);
    process.exit(1);
  }

  console.log(`check-assets: ${checked.length} ruta(s) revisada(s) (incluye hermanos .webp), todas existen con el nombre exacto. ✓`);
  process.exit(0);
}

main();
