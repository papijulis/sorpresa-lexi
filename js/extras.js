/* ======================================================================
   FASE 4 — JARDÍN VIVO
====================================================================== */
function mexicoCityHour() {
  return Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Mexico_City', hour: 'numeric', hour12: false }).format(new Date()));
}
function currentMonthNumber() {
  return Number(getTodayDateString().slice(5, 7)); // respeta el override ?fecha=
}

/* ---- corazones que llueven al escribir "te amo" (easter egg) ---- */
let heartRain = [];
function drawHeartRainItem(h) {
  ctx.save();
  ctx.globalAlpha = h.opacity;
  ctx.translate(h.x, h.y);
  ctx.rotate(h.rot);
  const s = h.size;
  ctx.beginPath();
  ctx.moveTo(0, s * 0.3);
  ctx.bezierCurveTo(0, 0, -s, 0, -s, s * 0.35);
  ctx.bezierCurveTo(-s, s * 0.75, 0, s, 0, s * 1.15);
  ctx.bezierCurveTo(0, s, s, s * 0.75, s, s * 0.35);
  ctx.bezierCurveTo(s, 0, 0, 0, 0, s * 0.3);
  ctx.closePath();
  ctx.fillStyle = h.color;
  ctx.fill();
  ctx.restore();
}
function updateHeartRain(dt) {
  for (let i = heartRain.length - 1; i >= 0; i--) {
    const h = heartRain[i];
    h.y += h.speedY * (dt / 16);
    h.x += h.speedX;
    h.rot += h.rotSpeed * (dt / 16);
    if (h.y > vh + 30) heartRain.splice(i, 1);
  }
}
const HEART_RAIN_COLORS = ['#FB7185', '#E11D48', '#FFD700', '#C084FC'];
function spawnHeartRain() {
  for (let i = 0; i < 32; i++) {
    heartRain.push({
      x: rand(0, vw), y: rand(-240, -20),
      size: rand(9, 17),
      speedY: rand(1.1, 2.3), speedX: rand(-0.3, 0.3),
      rot: rand(-0.3, 0.3), rotSpeed: rand(-0.01, 0.01),
      color: HEART_RAIN_COLORS[Math.floor(rand(0, HEART_RAIN_COLORS.length))],
      opacity: rand(0.8, 1),
    });
  }
}
let teAmoBuffer = '';
let iLoveYouBuffer = '';
window.addEventListener('keydown', (e) => {
  if (e.key.length !== 1) return;
  teAmoBuffer = (teAmoBuffer + e.key.toLowerCase()).slice(-6);
  if (teAmoBuffer.includes('te amo')) {
    teAmoBuffer = '';
    spawnHeartRain();
    showToast('Yo también te amo {i-corazon-lleno}');
    if (window.Infinito) window.Infinito.abrir();
  }
  iLoveYouBuffer = (iLoveYouBuffer + e.key.toLowerCase()).slice(-11);
  if (iLoveYouBuffer.includes('i love you')) {
    iLoveYouBuffer = '';
    if (window.Infinito) window.Infinito.abrir();
  }
});

/* ======================================================================
   CORAZÓN MULTILINGÜE — "te amo" en ~20 idiomas, acomodadas en renglones
   dentro del contorno de un corazón (misma curva paramétrica que
   Constelación). Ya no es un overlay propio: vive en el centro del corazón
   de flores del popup "Infinito" (js/infinito.js lo dibuja con
   buildHeartLangWords) y escribir "i love you" o "te amo" abre ese popup.
   Su layout se calcula una vez por tamaño (costoso); nada corre por cuadro.
====================================================================== */
const HEART_LANG_PHRASES = [
  { lang: 'Español', text: 'Te amo' },
  { lang: 'Inglés', text: 'I love you' },
  { lang: 'Francés', text: "Je t'aime" },
  { lang: 'Italiano', text: 'Ti amo' },
  { lang: 'Portugués', text: 'Eu te amo' },
  { lang: 'Alemán', text: 'Ich liebe dich' },
  { lang: 'Turco', text: 'Seni seviyorum' },
  { lang: 'Ruso', text: 'Я тебя люблю' },
  { lang: 'Coreano', text: '사랑해' },
  { lang: 'Japonés', text: '愛してる' },
  { lang: 'Chino', text: '我爱你' },
  { lang: 'Hindi', text: 'मैं तुमसे प्यार करता हूँ' },
  { lang: 'Griego', text: "Σ'αγαπώ" },
  { lang: 'Neerlandés', text: 'Ik hou van je' },
  { lang: 'Sueco', text: 'Jag älskar dig' },
  { lang: 'Polaco', text: 'Kocham cię' },
  { lang: 'Tailandés', text: 'ฉันรักเธอ' },
  { lang: 'Vietnamita', text: 'Anh yêu em' },
  { lang: 'Indonesio', text: 'Aku cinta kamu' },
  { lang: 'Ucraniano', text: 'Я тебе кохаю' },
];
const HEART_LANG_COLORS = ['#FB7185', '#E11D48', '#FFD700', '#C084FC'];

function heartLangPoint(t, scale) {
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
  return { x: x * scale, y: -y * scale };
}

/* opts (opcional): { cx, cy, scale } coloca el corazón en otro punto/tamaño del
   lienzo (lo usa el popup "Infinito" para centrarlo dentro del corazón de flores) */
function buildHeartLangWords(width, height, opts) {
  const mask = document.createElement('canvas');
  mask.width = Math.max(1, Math.round(width));
  mask.height = Math.max(1, Math.round(height));
  const mctx = mask.getContext('2d');
  const scale = opts ? opts.scale : Math.min(width, height) / 34;
  const cx = opts ? opts.cx : width / 2;
  const cy = opts ? opts.cy : height / 2 - height * 0.04;

  mctx.fillStyle = '#fff';
  mctx.beginPath();
  const steps = 240;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const p = heartLangPoint(t, scale);
    const px = cx + p.x, py = cy + p.y;
    if (i === 0) mctx.moveTo(px, py); else mctx.lineTo(px, py);
  }
  mctx.closePath();
  mctx.fill();

  const data = mctx.getImageData(0, 0, mask.width, mask.height).data;
  function rowExtent(y) {
    const row = Math.min(mask.height - 1, Math.max(0, Math.round(y)));
    const rowStart = row * mask.width * 4;
    let left = -1, right = -1;
    for (let x = 0; x < mask.width; x++) {
      if (data[rowStart + x * 4 + 3] > 128) { if (left === -1) left = x; right = x; }
    }
    return left === -1 ? null : { left, right };
  }

  const refHeight = opts ? scale * 34 * 0.9 : height;
  const lineHeight = Math.max(13, Math.round(refHeight / 20));
  const fontSize = Math.round(lineHeight * 0.58);
  mctx.font = `italic 600 ${fontSize}px 'Playfair Display', serif`;

  const gap = fontSize * 0.55;
  const rows = [];
  let phraseCursor = 0;
  for (let y = lineHeight; y < height - 4; y += lineHeight) {
    const ext = rowExtent(y);
    if (!ext) continue;
    const rowWidth = ext.right - ext.left;
    if (rowWidth < lineHeight * 1.6) continue;

    const items = [];
    let usedWidth = 0;
    let guard = 0;
    while (guard++ < HEART_LANG_PHRASES.length * 2) {
      const phrase = HEART_LANG_PHRASES[phraseCursor % HEART_LANG_PHRASES.length].text;
      const w = mctx.measureText(phrase).width;
      const extra = (items.length ? gap : 0) + w;
      if (items.length && usedWidth + extra > rowWidth) break;
      items.push({ text: phrase, width: w });
      usedWidth += extra;
      phraseCursor++;
    }
    if (!items.length) continue;
    rows.push({ y, ext, rowWidth, items, usedWidth });
  }

  /* la punta del corazón: los últimos renglones con una sola frase salían en el
     orden del ciclo (una corta arriba y una larga en lo más angosto). Se reparten
     de la más larga a la más corta para que sigan la forma del corazón. */
  let tailStart = rows.length;
  while (tailStart > 0 && rows[tailStart - 1].items.length === 1) tailStart--;
  const tail = rows.slice(tailStart);
  if (tail.length > 1) {
    const sorted = tail.map((r) => r.items[0]).sort((a, b) => b.width - a.width);
    tail.forEach((r, i) => { r.items = [sorted[i]]; r.usedWidth = sorted[i].width; });
  }

  const words = [];
  rows.forEach((r, rowIndex) => {
    const color = HEART_LANG_COLORS[rowIndex % HEART_LANG_COLORS.length];
    let x = r.ext.left + (r.rowWidth - r.usedWidth) / 2;
    r.items.forEach((item) => {
      words.push({ x: x + item.width / 2, y: r.y, text: item.text, fontSize, color });
      x += item.width + gap;
    });
  });
  return words;
}

/* ---- temporadas (reutiliza el sistema de pétalos y mariposas) ---- */
function applySeason() {
  const month = currentMonthNumber();
  if (month === 12) {
    SEASON_PALETTE = ['#FFFFFF', '#F5EBE1', '#FDE68A']; // nieve + luces suaves
    setInterval(() => { if (!document.hidden) spawnBokeh(rand(0, vw), rand(0, vh * 0.6), 1); }, 2600);
  } else if (month >= 9 && month <= 11) {
    SEASON_PALETTE = ['#F59E0B', '#B45309', '#D97706']; // otoño: hojas
  } else {
    SEASON_PALETTE = null; // resto del año: paleta dorada/lavanda de siempre
  }
  if (month >= 3 && month <= 5) BUTTERFLY_CAP = 7; // primavera: más mariposas
}
applySeason();

/* ---- cielo nocturno + luna (easter egg: tocarla de noche) ----
   Construye las estrellas una sola vez; qué cielo se muestra (día /
   atardecer / noche) lo decide setCielo() en js/navegacion.js. */
let cieloNocturnoListo = false;
function applyNightMode() {
  const nightLayer = document.getElementById('bg-layer-night');
  const moonEl = document.getElementById('night-moon');
  if (!cieloNocturnoListo) {
    cieloNocturnoListo = true;
    const via = document.createElement('div');
    via.className = 'night-via';
    nightLayer.insertBefore(via, moonEl);
    const total = LIGHT_MODE ? 40 : (vw < 640 ? 64 : 110);
    for (let i = 0; i < total; i++) {
      const star = document.createElement('div');
      const r = Math.random(), tono = Math.random();
      star.className = 'night-star' + (tono < 0.18 ? ' azul' : tono < 0.3 ? ' dorada' : '') + (r < 0.07 ? ' grande' : '');
      const size = r < 0.07 ? rand(2.4, 3.4) : rand(0.8, 2);
      star.style.width = size + 'px';
      star.style.height = size + 'px';
      star.style.left = rand(0, 100) + '%';
      star.style.top = rand(0, 74) + '%';
      star.style.animationDuration = rand(2.4, 5.4).toFixed(2) + 's';
      star.style.animationDelay = rand(0, 3).toFixed(2) + 's';
      nightLayer.insertBefore(star, moonEl);
    }
    const fugaz = document.createElement('div');
    fugaz.className = 'night-fugaz';
    fugaz.setAttribute('aria-hidden', 'true');
    nightLayer.insertBefore(fugaz, moonEl);
  }
  const vieja = nightLayer.querySelector('.night-constellation');
  if (vieja) vieja.remove();
  renderNightConstellation(nightLayer, moonEl);
}

/* Si ya armó la constelación (Rincón de Juegos), queda de fondo en el
   cielo nocturno — reusa getHeartPoints() del propio juego en vez de
   reimplementar la curva del corazón aquí. */
function renderNightConstellation(nightLayer, moonEl) {
  if (!window.JuegoConstelacion || !window.JuegoConstelacion.isCompleted()) return;
  const pts = window.JuegoConstelacion.getHeartPoints(38);
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', '-42 -42 84 84');
  svg.classList.add('night-constellation');
  svg.style.left = '10%';
  svg.style.bottom = '14%';

  const poly = document.createElementNS(svgNS, 'polygon');
  poly.setAttribute('points', pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '));
  poly.setAttribute('fill', 'none');
  poly.setAttribute('stroke', 'rgba(255,215,0,.4)');
  poly.setAttribute('stroke-width', '1');
  svg.appendChild(poly);

  pts.forEach((p, i) => {
    const c = document.createElementNS(svgNS, 'circle');
    c.setAttribute('cx', p.x.toFixed(1));
    c.setAttribute('cy', p.y.toFixed(1));
    c.setAttribute('r', '1.8');
    c.setAttribute('fill', 'rgba(255,230,150,.9)');
    c.style.animationDelay = (i * 0.25).toFixed(2) + 's';
    svg.appendChild(c);
  });

  nightLayer.insertBefore(svg, moonEl);
}
document.getElementById('night-moon').addEventListener('click', () => {
  if (!document.body.classList.contains('night-mode') || document.body.classList.contains('sunset-mode')) return;
  const rect = document.getElementById('night-moon').getBoundingClientRect();
  spawnSparkleBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 30, true);
  openModal({ icon: 'i-luna', title: 'Un secreto de la luna', body: window.MOON_SECRET_TEXT || '' });
});

/* ---- saludo dinámico + frase del día (entrada suave, una vez por visita) ---- */
function renderSaludoYFrase() {
  const hour = mexicoCityHour();
  const saludo = hour < 12 ? 'Buenos días' : (hour < 19 ? 'Buenas tardes' : 'Buenas noches');
  const totalDias = Math.max(0, Math.floor((new Date() - START_DATE) / 86400000));
  const saludoEl = document.getElementById('saludo-dinamico');
  if (saludoEl) saludoEl.textContent = `${saludo}, Lexi. Hoy son ${totalDias} días desde que empezamos a hablar.`;

  const banco = window.FRASES;
  const fraseEl = document.getElementById('frase-del-dia');
  if (fraseEl && banco && banco.length) {
    const frase = banco[dayOfYear(getTodayDateString()) % banco.length];
    fraseEl.textContent = `"${frase.texto}"`;
    setTimeout(() => fraseEl.classList.add('in'), 1000);
  }
}
renderSaludoYFrase();

/* ---- Ritual 11:11 en vivo: si está en el sitio a las 11:11 (am o pm, hora
   de Ciudad de México) aparece la invitación a pedir un deseo, una sola
   vez por cada 11:11 de cada día. ---- */
function mexicoCityHourMinute() {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Mexico_City', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
  const get = (type) => Number((parts.find((p) => p.type === type) || {}).value);
  return { h: get('hour') % 24, m: get('minute') };
}
function check1111(h, m, force) {
  if (m !== 11 || (h !== 11 && h !== 23)) return false;
  const mainEl = document.getElementById('main-content');
  if (!force && mainEl && mainEl.classList.contains('hidden-content')) return false;
  const key = `jardin.1111.${getTodayDateString()}-${h}`;
  if (!force && jardinStorage.get(key)) return false;
  jardinStorage.set(key, '1');
  spawnSparkleBurst(window.innerWidth / 2, window.innerHeight / 2, 80, true);
  openModal({ icon: 'brillo', title: '11:11', body: window.RITUAL_1111_TEXT || 'Son las 11:11. Pide un deseo.' });
  return true;
}
setInterval(() => {
  if (document.hidden) return;
  const t = mexicoCityHourMinute();
  check1111(t.h, t.m);
}, 5000);
setTimeout(() => { const t = mexicoCityHourMinute(); check1111(t.h, t.m); }, 4000);

/* ---- "Te extrañaba" si no entra en varios días ---- */
function checkAusencia() {
  const key = 'jardin.ultimaVisita.v1';
  const today = getTodayDateString();
  const last = jardinStorage.get(key);
  jardinStorage.set(key, today);
  if (!last || last === today) return;
  if (daysBetween(last, today) >= 3) {
    setTimeout(() => showToast('Te extrañaba {lirio-mini}'), 2600);
  }
}
checkAusencia();

/* ---- una flor nueva por cada mes juntos (tope por rendimiento) ---- */
function spawnMonthlyFlowers() {
  const meses = Math.max(0, diffFromStart(new Date()).months);
  const count = Math.min(10, meses);
  for (let i = 0; i < count; i++) {
    spawnLily({
      x: rand(vw * 0.08, vw * 0.92),
      y: rand(vh * 0.15, vh * 0.85),
      size: Math.min(vw, vh) * rand(0.05, 0.09),
      delay: 1500 + i * 260,
      parallax: rand(0.02, 0.06),
    });
  }
}
spawnMonthlyFlowers();

/* ---- línea de tiempo: se ilumina al hacer scroll ---- */
function renderTimeline() {
  const itemsContainer = document.getElementById('timeline-items');
  const fillEl = document.getElementById('timeline-fill');
  const wrap = document.querySelector('.timeline-wrap');
  if (!itemsContainer || !fillEl || !wrap) return;

  // Mapeo best-effort entre fechas de MEMORIES y fotos ya existentes en fotos.js
  const PHOTO_BY_DATE = {
    '2026-06-06': './assets/img/flores-panchito.jpeg',
    '2026-07-03': './assets/img/frutos-rojos.jpeg',
    '2026-07-28': './assets/img/girasoles.jpeg',
    '2026-08-18': './assets/img/fondo-chat.jpeg',
    '2026-09-16': './assets/img/viendo-edgerunners.jpeg',
  };

  const itemEls = (window.MEMORIES || []).map((m) => {
    const el = document.createElement('div');
    el.className = 'timeline-item';
    const photo = PHOTO_BY_DATE[m.date];
    el.innerHTML = `
      <div class="timeline-dot-col">${ico('lirio-mini', 'timeline-flor')}</div>
      <div class="timeline-content">
        <p class="timeline-date">${m.display}</p>
        <p class="timeline-text">${m.text}</p>
        ${photo ? pictureHTML(photo, '', 'class="timeline-photo"') : ''}
      </div>
    `;
    itemsContainer.appendChild(el);
    return el;
  });

  let tlTop = 0, tlHeight = 0, itemTops = [], tlTicking = false;
  function measureTimeline() {
    const y = window.scrollY;
    const rect = wrap.getBoundingClientRect();
    tlTop = rect.top + y;
    tlHeight = rect.height;
    itemTops = itemEls.map((el) => el.getBoundingClientRect().top + y);
    fillEl.style.height = Math.max(0, tlHeight - 16) + 'px';
    updateTimelineFill();
  }
  function updateTimelineFill() {
    tlTicking = false;
    const y = window.scrollY;
    const markerY = y + window.innerHeight * 0.75;
    const filled = clamp(markerY - tlTop, 0, tlHeight);
    fillEl.style.transform = `scaleY(${tlHeight ? filled / tlHeight : 0})`;
    for (let i = 0; i < itemEls.length; i++) {
      const lit = itemTops[i] < markerY;
      if (lit !== itemEls[i].classList.contains('lit')) itemEls[i].classList.toggle('lit', lit);
    }
  }
  function onTimelineScroll() {
    if (!tlTicking) { tlTicking = true; requestAnimationFrame(updateTimelineFill); }
  }
  window.addEventListener('scroll', onTimelineScroll, { passive: true });
  window.addEventListener('resize', measureTimeline);
  window.addEventListener('load', measureTimeline);
  setTimeout(measureTimeline, 1500);
  measureTimeline();
}
renderTimeline();

/* ---- Nuestra banda sonora: lista con dedicatoria + reproducir ---- */
function renderBandaSonora() {
  const list = document.getElementById('banda-sonora-list');
  if (!list) return;
  (window.SONGS || []).forEach((song) => {
    const row = document.createElement('div');
    row.className = 'glass rounded-2xl p-5 flex items-center gap-4';
    row.innerHTML = `
      <button class="banda-play w-9 h-9 rounded-full bg-gradient-to-br from-gold to-gold-amber text-plum-dark flex items-center justify-center shrink-0 text-sm" aria-label="Reproducir ${song.title}">${ico('i-play', 'ico-sm')}</button>
      <div class="min-w-0 text-left">
        <p class="font-display text-base text-parchment">${song.title}</p>
        <p class="font-ui text-xs text-parchment/50 mb-1">${song.artist}</p>
        <p class="font-hand text-sm" style="color:#E9D5FF;">${song.dedicatoria || ''}</p>
      </div>
    `;
    row.querySelector('button').addEventListener('click', () => playDedicatedSong(song.title));
    list.appendChild(row);
  });
}
renderBandaSonora();

/* ---- service worker (Fase 5) — registra sw.js si el navegador lo soporta ---- */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
