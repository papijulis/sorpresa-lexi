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
    showToast('Yo también te amo 💕');
    openHeartLanguages();
  }
  iLoveYouBuffer = (iLoveYouBuffer + e.key.toLowerCase()).slice(-11);
  if (iLoveYouBuffer.includes('i love you')) {
    iLoveYouBuffer = '';
    openHeartLanguages();
  }
});

/* ======================================================================
   EASTER EGG: CORAZÓN MULTILINGÜE — se activa al escribir "i love you"
   (paralelo a "te amo" → lluvia de corazones, arriba). Arma un corazón
   relleno de la frase "te amo" en ~20 idiomas, acomodadas en renglones
   dentro del contorno del corazón (misma curva paramétrica que
   Constelación — ver js/juegos/constelacion.js). El layout de palabras
   se calcula una sola vez por apertura/resize (costoso); la animación
   por cuadro solo actualiza opacidad/posición de cada palabra ya
   calculada (barato). Pausa su propio requestAnimationFrame al cerrar o
   si la pestaña se oculta, y con prefers-reduced-motion dibuja una sola
   vez, sin animar.
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
const HEART_LANG_ENTRANCE_MS = 650;
const HEART_LANG_STAGGER_MS = 14;

const heartLangOverlay = document.getElementById('heart-languages');
const heartLangCanvas = document.getElementById('heart-languages-canvas');
const heartLangCloseBtn = document.getElementById('heart-languages-close');
const heartLangCtx = heartLangCanvas.getContext('2d');
let heartLangWords = [];
let heartLangLayoutKey = '';
let heartLangW = 0, heartLangH = 0;
let heartLangRaf = null;
let heartLangOpenedAt = 0;
let heartLangListeners = [];

function heartLangPoint(t, scale) {
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
  return { x: x * scale, y: -y * scale };
}

function buildHeartLangWords(width, height) {
  const mask = document.createElement('canvas');
  mask.width = Math.max(1, Math.round(width));
  mask.height = Math.max(1, Math.round(height));
  const mctx = mask.getContext('2d');
  const cx = width / 2;
  const cy = height / 2 - height * 0.04;
  const scale = Math.min(width, height) / 34;

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

  const lineHeight = Math.max(13, Math.round(height / 20));
  const fontSize = Math.round(lineHeight * 0.58);
  mctx.font = `italic 600 ${fontSize}px 'Playfair Display', serif`;

  const words = [];
  let phraseCursor = 0;
  let rowIndex = 0;
  for (let y = lineHeight; y < height - 4; y += lineHeight) {
    const ext = rowExtent(y);
    if (!ext) continue;
    const rowWidth = ext.right - ext.left;
    if (rowWidth < lineHeight * 1.6) continue;

    const gap = fontSize * 0.55;
    const lineItems = [];
    let usedWidth = 0;
    let guard = 0;
    while (guard++ < HEART_LANG_PHRASES.length * 2) {
      const phrase = HEART_LANG_PHRASES[phraseCursor % HEART_LANG_PHRASES.length].text;
      const w = mctx.measureText(phrase).width;
      const extra = (lineItems.length ? gap : 0) + w;
      if (lineItems.length && usedWidth + extra > rowWidth) break;
      lineItems.push({ text: phrase, width: w });
      usedWidth += extra;
      phraseCursor++;
    }
    if (!lineItems.length) continue;

    const color = HEART_LANG_COLORS[rowIndex % HEART_LANG_COLORS.length];
    let x = ext.left + (rowWidth - usedWidth) / 2;
    lineItems.forEach((item) => {
      words.push({ x: x + item.width / 2, y, text: item.text, fontSize, color });
      x += item.width + gap;
    });
    rowIndex++;
  }
  return words;
}

function drawHeartLang(t) {
  heartLangCtx.clearRect(0, 0, heartLangW, heartLangH);
  const elapsed = t - heartLangOpenedAt;

  heartLangWords.forEach((w, i) => {
    const delay = LIGHT_MODE ? 0 : i * HEART_LANG_STAGGER_MS;
    const entranceDur = LIGHT_MODE ? 1 : HEART_LANG_ENTRANCE_MS;
    const local = elapsed - delay;
    if (local < 0) return;
    const progress = Math.min(1, local / entranceDur);
    const eased = 1 - Math.pow(1 - progress, 3);
    const shimmer = (LIGHT_MODE || progress < 1) ? 1 : (0.78 + 0.22 * Math.sin(t / 1700 + i));
    const opacity = eased * shimmer;
    const lift = (1 - eased) * 9;

    heartLangCtx.save();
    heartLangCtx.globalAlpha = Math.max(0, Math.min(1, opacity));
    heartLangCtx.fillStyle = w.color;
    heartLangCtx.font = `italic 600 ${w.fontSize}px 'Playfair Display', serif`;
    heartLangCtx.textAlign = 'center';
    heartLangCtx.textBaseline = 'middle';
    heartLangCtx.fillText(w.text, w.x, w.y + lift);
    heartLangCtx.restore();
  });

  if (LIGHT_MODE) return; // una sola pasada, sin loop continuo
  heartLangRaf = requestAnimationFrame(drawHeartLang);
}

function resizeHeartLang() {
  const rect = heartLangCanvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  heartLangCanvas.width = Math.max(1, Math.round(rect.width * dpr));
  heartLangCanvas.height = Math.max(1, Math.round(rect.height * dpr));
  heartLangCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  heartLangW = rect.width; heartLangH = rect.height;

  const key = Math.round(rect.width) + 'x' + Math.round(rect.height);
  if (key !== heartLangLayoutKey) {
    heartLangLayoutKey = key;
    heartLangWords = buildHeartLangWords(rect.width, rect.height);
  }
}

function openHeartLanguages() {
  heartLangOverlay.classList.add('open');
  canvasPauseReasons.add('heart-lang');
  updateCanvasPauseState();
  resizeHeartLang();
  heartLangOpenedAt = performance.now();

  if (heartLangRaf) cancelAnimationFrame(heartLangRaf);
  heartLangRaf = requestAnimationFrame(drawHeartLang);

  const onResize = () => resizeHeartLang();
  window.addEventListener('resize', onResize);
  heartLangListeners.push(() => window.removeEventListener('resize', onResize));

  const onVisibility = () => {
    if (document.hidden) {
      if (heartLangRaf) { cancelAnimationFrame(heartLangRaf); heartLangRaf = null; }
    } else if (!heartLangRaf && !LIGHT_MODE) {
      heartLangRaf = requestAnimationFrame(drawHeartLang);
    }
  };
  document.addEventListener('visibilitychange', onVisibility);
  heartLangListeners.push(() => document.removeEventListener('visibilitychange', onVisibility));
}

function closeHeartLanguages() {
  heartLangOverlay.classList.remove('open');
  canvasPauseReasons.delete('heart-lang');
  updateCanvasPauseState();
  if (heartLangRaf) { cancelAnimationFrame(heartLangRaf); heartLangRaf = null; }
  heartLangListeners.splice(0).forEach((fn) => fn());
}
heartLangCloseBtn.addEventListener('click', closeHeartLanguages);
heartLangOverlay.addEventListener('click', (e) => { if (e.target === heartLangOverlay) closeHeartLanguages(); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && heartLangOverlay.classList.contains('open')) closeHeartLanguages();
});

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

/* ---- cielo nocturno + luna (easter egg: tocarla de noche) ---- */
function applyNightMode() {
  const hour = mexicoCityHour();
  const isNight = hour >= 20 || hour < 6;
  if (!isNight) return;
  document.body.classList.add('night-mode');
  const nightLayer = document.getElementById('bg-layer-night');
  const moonEl = document.getElementById('night-moon');
  for (let i = 0; i < 36; i++) {
    const star = document.createElement('div');
    star.className = 'night-star';
    const size = rand(1, 2.6);
    star.style.width = size + 'px';
    star.style.height = size + 'px';
    star.style.left = rand(0, 100) + '%';
    star.style.top = rand(0, 68) + '%';
    star.style.animationDelay = rand(0, 3).toFixed(2) + 's';
    nightLayer.insertBefore(star, moonEl);
  }
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
applyNightMode();

document.getElementById('night-moon').addEventListener('click', () => {
  if (!document.body.classList.contains('night-mode') || document.body.classList.contains('sunset-mode')) return;
  const rect = document.getElementById('night-moon').getBoundingClientRect();
  spawnSparkleBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 30, true);
  openModal({ icon: '🌙', title: 'Un secreto de la luna', body: window.MOON_SECRET_TEXT || '' });
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
  openModal({ icon: '✨', title: '11:11', body: window.RITUAL_1111_TEXT || 'Son las 11:11. Pide un deseo.' });
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
    setTimeout(() => showToast('Te extrañaba 🌷'), 2600);
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
      <div class="timeline-dot-col"><div class="timeline-dot"></div></div>
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
      <button class="banda-play w-9 h-9 rounded-full bg-gradient-to-br from-gold to-gold-amber text-plum-dark flex items-center justify-center shrink-0 text-sm" aria-label="Reproducir ${song.title}">▶</button>
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
