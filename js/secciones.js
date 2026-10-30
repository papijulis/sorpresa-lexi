/* ======================================================================
   LOVE CLOCK
====================================================================== */
/* El contador NUNCA se detiene: siempre se calcula como ahora − 28 de mayo de
   2026 en hora de Ciudad de México (no en la zona del dispositivo), a partir
   de Date, no sumando 1 por tic; así no se desfasa si la pestaña estuvo en
   segundo plano, el teléfono se bloqueó o la PWA estuvo cerrada. Sin fecha de
   fin ni clearInterval. */
const MX_WALL_FMT = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'America/Mexico_City', hourCycle: 'h23',
  year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
});
function mexicoWallMs(date) {
  const p = {};
  MX_WALL_FMT.formatToParts(date).forEach((x) => { p[x.type] = Number(x.value); });
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
}
function diffFromStart(now) {
  const wallNow = mexicoWallMs(now);
  const n = new Date(wallNow);
  let months = (n.getUTCFullYear() - 2026) * 12 + (n.getUTCMonth() - 4);
  let anchor = Date.UTC(2026, 4 + months, 28);
  if (anchor > wallNow) { months -= 1; anchor = Date.UTC(2026, 4 + months, 28); }
  let ms = Math.max(0, wallNow - anchor);
  const days = Math.floor(ms / 86400000); ms -= days * 86400000;
  const hours = Math.floor(ms / 3600000); ms -= hours * 3600000;
  const minutes = Math.floor(ms / 60000); ms -= minutes * 60000;
  const seconds = Math.floor(ms / 1000);
  return { months: Math.max(0, months), days, hours, minutes, seconds };
}
function tickClock() {
  const d = diffFromStart(new Date());
  document.getElementById('clock-months').textContent = d.months;
  document.getElementById('clock-days').textContent = d.days;
  document.getElementById('clock-hours').textContent = d.hours;
  document.getElementById('clock-minutes').textContent = d.minutes;
  document.getElementById('clock-seconds').textContent = d.seconds;
}
tickClock();
setInterval(() => { if (!document.hidden) tickClock(); }, 1000);
/* al volver a la pestaña (o a la PWA) se actualiza al instante */
document.addEventListener('visibilitychange', () => { if (!document.hidden) tickClock(); });
window.addEventListener('pageshow', tickClock);
/* el ∞ junto al contador abre el popup "Infinito" (js/infinito.js), desde donde se tocó */
document.getElementById('clock-infinity-link').addEventListener('click', (e) => {
  e.preventDefault();
  if (window.Infinito) window.Infinito.abrir(e);
});
window.addEventListener('focus', tickClock);
document.getElementById('badge-1111').addEventListener('click', () => {
  openModal({ icon: 'brillo', title: '11:11', body: WISH_1111_TEXT });
});

/* ======================================================================
   MEMORY CALENDAR
====================================================================== */
let calIndex = 0;
const calTitle = document.getElementById('cal-title');
const calGrid = document.getElementById('cal-grid');
const calPrev = document.getElementById('cal-prev');
const calNext = document.getElementById('cal-next');
const memoriesByDate = {};
MEMORIES.forEach((m) => { memoriesByDate[m.date] = m; });

function renderCalendar() {
  const { year, month, label } = MONTHS_SEQUENCE[calIndex];
  calTitle.textContent = label;
  calGrid.innerHTML = '';
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let i = 0; i < firstWeekday; i++) calGrid.appendChild(document.createElement('div'));
  for (let day = 1; day <= daysInMonth; day++) {
    const key = `${year}-${pad2(month + 1)}-${pad2(day)}`;
    const memory = memoriesByDate[key];
    const cell = document.createElement('div');
    cell.className = 'day-cell rounded-lg flex flex-col items-center justify-center relative font-ui text-[11px] sm:text-xs ' +
      (memory ? 'bg-white/10 cursor-pointer hover:bg-white/20' : 'bg-white/[0.02] text-parchment/30');
    cell.innerHTML = `<span>${day}</span>`;
    if (memory) {
      const heart = document.createElement('span');
      heart.innerHTML = ico('i-corazon-lleno', 'ico-sm');
      heart.className = 'text-sm leading-none mt-0.5 ' + (memory.special ? 'heart-special' : '');
      heart.style.color = memory.special ? 'var(--dorado-500)' : 'rgba(var(--pergamino-rgb), .35)';
      cell.appendChild(heart);
      cell.addEventListener('click', () => openModal({ icon: memory.special ? 'i-corazon-lleno' : 'i-corazon', title: memory.display, body: memory.text }));
    }
    calGrid.appendChild(cell);
  }
}
calPrev.addEventListener('click', () => { calIndex = Math.max(0, calIndex - 1); renderCalendar(); });
calNext.addEventListener('click', () => { calIndex = Math.min(MONTHS_SEQUENCE.length - 1, calIndex + 1); renderCalendar(); });
renderCalendar();

document.getElementById('random-memory-btn').addEventListener('click', () => {
  const m = MEMORIES[Math.floor(rand(0, MEMORIES.length))];
  const [y, mo] = m.date.split('-').map(Number);
  const foundIdx = MONTHS_SEQUENCE.findIndex((ms) => ms.year === y && ms.month === mo - 1);
  if (foundIdx !== -1) { calIndex = foundIdx; renderCalendar(); }
  openModal({ icon: m.special ? 'i-corazon-lleno' : 'i-corazon', title: m.display, body: m.text });
});

/* ======================================================================
   VOICE NOTE PLAYER (real eq via analyser, auto-pauses soundtrack)
====================================================================== */
const voicePlayBtn = document.getElementById('voice-play');
const voicePlayIcon = document.getElementById('voice-play-icon');
const voiceCurrent = document.getElementById('voice-current');
const voiceDuration = document.getElementById('voice-duration');
const voiceWave = document.getElementById('voice-wave');
const voiceFallbackNote = document.getElementById('voice-fallback-note');
const voiceWaveBars = buildBars(voiceWave, 22);

function formatTime(sec) {
  if (!isFinite(sec) || isNaN(sec)) return '--:--';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${pad2(s)}`;
}
voiceAudio.addEventListener('loadedmetadata', () => { voiceDuration.textContent = formatTime(voiceAudio.duration); });
voiceAudio.addEventListener('timeupdate', () => { voiceCurrent.textContent = formatTime(voiceAudio.currentTime); });
voiceAudio.addEventListener('error', () => { voiceFallbackNote.classList.remove('hidden'); });
voiceAudio.addEventListener('ended', () => {
  voicePlayIcon.innerHTML = ico('i-play');
  if (!useRealEq) voiceWaveBars.forEach((b) => b.classList.remove('playing'));
});
voicePlayBtn.addEventListener('click', () => {
  if (voiceAudio.paused) {
    pauseBgAudioForVoiceNote();
    setupAnalysers();
    voiceAudio.play().catch(() => { voiceFallbackNote.classList.remove('hidden'); });
    voicePlayIcon.innerHTML = ico('i-pausa');
    if (!useRealEq) voiceWaveBars.forEach((b) => b.classList.add('playing'));
  } else {
    voiceAudio.pause();
    voicePlayIcon.innerHTML = ico('i-play');
    if (!useRealEq) voiceWaveBars.forEach((b) => b.classList.remove('playing'));
  }
});

/* ======================================================================
   REASON JAR — 100 razones descubribles + hitos (25/50/75/100) + secreta
====================================================================== */
const jarBtn = document.getElementById('jar-btn');
const jarEl = document.getElementById('jar');
const jarCounter = document.getElementById('jar-counter');
const jarHeartsGroup = document.getElementById('jar-hearts');
const jarGlowProgress = document.getElementById('jar-glow-progress');
const jarRingFill = document.getElementById('jar-ring-fill');
const jarRingCount = document.getElementById('jar-ring-count');
const jarRingTotal = document.getElementById('jar-ring-total');
const jarSecretBtn = document.getElementById('jar-secret-btn');

const JAR_STORAGE_KEY = 'jardin.frasco.v1';
const JAR_RING_CIRCUMFERENCE = 314.159; // 2 * PI * r(50) — matches the SVG circle above
const JAR_HEART_COLORS = ['var(--dorado-500)', 'var(--amatista-500)', 'var(--rosa-400)'];
const JAR_MAX_HEARTS = 42; // hand-placed 9 + up to 33 more as the frasco fills

const discoverableIndices = REASONS.map((_, i) => i).filter((i) => !REASONS[i].secret);
const secretIndex = REASONS.findIndex((r) => r.secret);

function shuffledOnce(arr) {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand(0, i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function loadJarState() {
  const empty = { order: shuffledOnce(discoverableIndices), pointer: 0, milestones: [], secretUnlocked: false };
  const raw = jardinStorage.get(JAR_STORAGE_KEY);
  if (!raw) return empty;

  let parsed;
  try { parsed = JSON.parse(raw); } catch (e) { return empty; }
  if (!parsed || !Array.isArray(parsed.order)) return empty;

  // Keep her progress even if Julio added/removed razones since her last visit:
  // drop stale indices, then append any new ones (shuffled) at the back of the queue.
  const validSet = new Set(discoverableIndices);
  let order = parsed.order.filter((v) => validSet.has(v));
  const already = new Set(order);
  const missing = discoverableIndices.filter((i) => !already.has(i));
  if (missing.length) order = order.concat(shuffledOnce(missing));

  return {
    order,
    pointer: Math.max(0, Math.min(order.length, parsed.pointer | 0)),
    milestones: Array.isArray(parsed.milestones) ? parsed.milestones : [],
    secretUnlocked: !!parsed.secretUnlocked,
  };
}
function saveJarState() { jardinStorage.set(JAR_STORAGE_KEY, JSON.stringify(jarState)); }

let jarState = loadJarState();
const JAR_TOTAL = jarState.order.length;
let jarHeartsRendered = 9; // the hand-placed hearts already in the markup

function jarProgress() { return JAR_TOTAL > 0 ? jarState.pointer / JAR_TOTAL : 0; }

function growJarHearts(progress) {
  const target = Math.min(JAR_MAX_HEARTS, 9 + Math.round(progress * (JAR_MAX_HEARTS - 9)));
  while (jarHeartsRendered < target) {
    const size = rand(11, 18) * 1.05;
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    el.setAttribute('href', '#i-corazon-lleno');
    el.setAttribute('x', rand(54, 146).toFixed(1));
    el.setAttribute('y', (rand(74, 242) - size * 0.85).toFixed(1));
    el.setAttribute('width', size.toFixed(1));
    el.setAttribute('height', size.toFixed(1));
    el.setAttribute('class', 'jar-heart-float');
    el.style.animationDelay = rand(0, 3).toFixed(2) + 's';
    el.style.color = JAR_HEART_COLORS[Math.floor(rand(0, JAR_HEART_COLORS.length))];
    jarHeartsGroup.appendChild(el);
    jarHeartsRendered++;
  }
}

function updateJarVisuals() {
  const progress = jarProgress();
  jarGlowProgress.style.opacity = (0.12 + progress * 0.55).toFixed(2);
  jarGlowProgress.style.transform = `scale(${(1 + progress * 0.22).toFixed(3)})`;
  growJarHearts(progress);

  jarRingFill.style.strokeDashoffset = (JAR_RING_CIRCUMFERENCE * (1 - progress)).toFixed(2);
  jarRingCount.textContent = jarState.pointer;
  jarRingTotal.textContent = JAR_TOTAL;
  jarCounter.textContent = `${jarState.pointer} de ${JAR_TOTAL} razones descubiertas`;

  jarBtn.innerHTML = iconizar(jarState.pointer >= JAR_TOTAL
    ? (jarState.secretUnlocked ? 'Ya las encontré todas {i-corazon-lleno}' : 'Encontré las 100... espera la sorpresa')
    : 'Tomar una razón de por qué eres mi todo');
  jarSecretBtn.classList.toggle('hidden', !jarState.secretUnlocked);
}
updateJarVisuals();

function spawnGoldRain() {
  for (let i = 0; i < 60; i++) spawnPetal();
  spawnSparkleBurst(vw / 2, vh * 0.25, 50, false);
  spawnBokeh(vw / 2, vh * 0.3, 8);
}

function playDedicatedSong(title) {
  const idx = SONGS.findIndex((s) => s.title === title);
  if (idx === -1) return;
  currentSongIndex = idx;
  bgAudio.src = SONGS[idx].src;
  bgAudio.currentTime = 0;
  playCurrentSong();
  miniTitle.textContent = SONGS[idx].title;
  miniPlayer.classList.remove('hidden-player');
}

function milestoneBodyHTML(hito) {
  const p = hito.premio;
  const frase = `<p class="font-hand text-lg" style="color:#B45309;">${hito.frase}</p>`;
  if (p.tipo === 'foto') {
    let html = frase + pictureHTML(p.src, p.caption || '', 'style="width:100%;max-height:260px;object-fit:cover;border-radius:14px;margin-top:14px;box-shadow:0 14px 30px rgba(0,0,0,.45);"');
    if (p.caption) html += `<p class="font-hand text-base mt-2" style="color:#3B2A1A;">${p.caption}</p>`;
    return html;
  }
  if (p.tipo === 'cancion') {
    return frase + `<p class="font-ui text-xs mt-3" style="color:#7E22CE;">${ico('i-nota', 'ico-sm')} Sonando para ti: <strong>${p.valor}</strong></p>`;
  }
  if (p.tipo === 'carta') {
    return frase + `<p class="font-hand text-lg mt-4 whitespace-pre-line" style="color:#3B2A1A;">${p.texto}</p>`;
  }
  if (p.tipo === 'final') {
    return frase + `<p class="font-hand text-lg mt-4 whitespace-pre-line" style="color:#7E22CE;">${REASONS[secretIndex].texto}</p>`;
  }
  return '';
}

function triggerMilestone(hito) {
  if (hito.premio.tipo === 'cancion') playDedicatedSong(hito.premio.valor);
  if (hito.premio.tipo === 'final') {
    spawnGoldRain();
    jarState.secretUnlocked = true;
    saveJarState();
    updateJarVisuals();
  }
  const rect = jarEl.getBoundingClientRect();
  const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
  spawnSparkleBurst(cx, cy, hito.premio.tipo === 'final' ? 140 : 60, true);
  spawnBokeh(cx, cy, hito.premio.tipo === 'final' ? 8 : 4);
}

function openSecretReason() {
  openModal({ icon: 'brillo', title: 'La Razón 101', body: REASONS[secretIndex].texto });
}
jarSecretBtn.addEventListener('click', openSecretReason);

jarBtn.addEventListener('click', () => {
  if (window.Sonidos) window.Sonidos.play('corazon');
  jarEl.classList.remove('shake-anim');
  void jarEl.offsetWidth;
  jarEl.classList.add('shake-anim');

  if (jarState.pointer >= JAR_TOTAL) {
    if (jarState.secretUnlocked) openSecretReason();
    else showToast('Tu sorpresa final ya casi está lista...');
    return;
  }

  const idx = jarState.order[jarState.pointer];
  jarState.pointer++;

  const hito = window.HITOS.find((h) => h.en === jarState.pointer && !jarState.milestones.includes(h.en));
  if (hito) jarState.milestones.push(hito.en);
  saveJarState();
  updateJarVisuals();

  setTimeout(() => {
    if (hito) {
      triggerMilestone(hito);
      openModal({
        icon: hito.premio.tipo === 'final' ? 'brillo' : 'i-sobre-corazon',
        title: hito.premio.tipo === 'final' ? 'Encontraste las 100 razones' : 'Una razón por la que eres mi todo',
        bodyHTML: `<span>${REASONS[idx].texto}</span><div style="margin-top:18px;padding-top:18px;border-top:1px solid rgba(0,0,0,.12);">${milestoneBodyHTML(hito)}</div>`,
      });
    } else {
      openModal({ icon: 'i-sobre-corazon', title: 'Una razón por la que eres mi todo', body: REASONS[idx].texto });
    }
  }, 280);
});

/* ======================================================================
   POLAROID GALLERY — 3D cursor tilt + staggered scroll entrance
====================================================================== */
function renderPolaroidGrid(gridEl, photos) {
  photos.forEach((p, i) => {
    const rotateBase = rand(-7, 7);
    const card = document.createElement('div');
    card.className = 'polaroid reveal w-32 sm:w-40';
    card.style.transitionDelay = (i * 90) + 'ms';
    card.style.transform = `rotate(${rotateBase.toFixed(1)}deg)`;
    card.innerHTML = `
      ${pictureHTML(p.src, p.caption, `onerror="this.replaceWith(Object.assign(document.createElement('div'), { className: 'img-fallback' }))"`)}
      <p class="font-hand text-center text-base mt-3" style="color:#3B2A1A;">${p.caption}</p>
    `;
    if (isDesktopPointer) {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `rotate(${rotateBase.toFixed(1)}deg) rotateX(${(-py * 16).toFixed(2)}deg) rotateY(${(px * 16).toFixed(2)}deg) translateY(-6px) scale(1.06)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = `rotate(${rotateBase.toFixed(1)}deg)`;
      });
    }
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      if (p.src.includes('flores-panchito')) {
        card.classList.remove('panchito-wiggle');
        void card.offsetWidth;
        card.classList.add('panchito-wiggle');
        const rect = card.getBoundingClientRect();
        if (typeof spawnSparkleBurst === 'function') spawnSparkleBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 16, true);
      }
      openLightbox(p.src, p.caption, photos, i);
    });
    gridEl.appendChild(card);
    revealObserver.observe(card);
  });
}

renderPolaroidGrid(document.getElementById('favorite-photos-grid'), FAVORITE_PHOTOS);
renderPolaroidGrid(document.getElementById('polaroid-grid'), POLAROIDS);

/* ======================================================================
   LOVE LETTER — sequential "ink appearing" reveal
====================================================================== */
const letterContainerEl = document.getElementById('letter-container');
const letterBodyEl = document.getElementById('letter-body');
const letterLabelEl = document.getElementById('letter-label');
const letterWishBlockEl = document.getElementById('letter-wish-block');
const letterSwitchBtn = document.getElementById('letter-switch');

/* Pergamino con dos cartas: la original (config.js → LETTER) y
   "Para seguir escribiendo" (cartas.js → CARTA_FINAL). La vela del deseo
   pertenece solo a la primera. */
const letterBackBtn = document.getElementById('letter-back');
const LETTER_SEQ = [
  { label: 'Carta del Capítulo 1 · 21 de septiembre de 2026', texto: LETTER, conVela: true },
  { label: (window.CARTA_FINAL && window.CARTA_FINAL.titulo) || 'Para seguir escribiendo', texto: (window.CARTA_FINAL && window.CARTA_FINAL.texto) || '', conVela: false },
  { label: (window.CARTA_PARA_LEXI && window.CARTA_PARA_LEXI.titulo) || 'Para Lexi', texto: (window.CARTA_PARA_LEXI && window.CARTA_PARA_LEXI.texto) || '', conVela: false },
].filter((l) => l.texto);
const LETTER_NEXT_TEXT = (window.CARTA_FINAL && window.CARTA_FINAL.botonIda) || 'Leer una carta más';
const LETTER_BACK_FIRST = (window.CARTA_FINAL && window.CARTA_FINAL.botonVuelta) || 'Volver a la primera carta';
let letterCurrent = 0;
let letterBusy = false;
let letterRevealed = false;
let letterPEls = [];
let letterTimers = [];

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
function buildLetterParagraphs(texto) {
  letterBodyEl.innerHTML = '';
  letterPEls = [];
  const paragraphs = texto.split('\n\n');
  paragraphs.forEach((para, i) => {
    const p = document.createElement('p');
    const isLast = i === paragraphs.length - 1;
    p.className = (isLast ? 'font-hand text-2xl sm:text-3xl mt-8 text-right ' : 'mb-5 whitespace-pre-line ') + 'ink-hidden';
    p.textContent = para;
    letterBodyEl.appendChild(p);
    letterPEls.push(p);
  });
}
function playLetterInk() {
  letterTimers.forEach(clearTimeout);
  letterTimers = [];
  if (prefersReducedMotion()) { letterPEls.forEach((p) => p.classList.add('ink-in')); return; }
  letterPEls.forEach((p, i) => letterTimers.push(setTimeout(() => p.classList.add('ink-in'), i * 380)));
}
function revealLetterSequentially() {
  if (letterRevealed) return;
  letterRevealed = true;
  playLetterInk();
}
/* navegación del pergamino: flechas redondas + "Carta N de M"; en la primera/última se desactiva la que no aplica */
function updateLetterButtons() {
  const last = letterCurrent === LETTER_SEQ.length - 1;
  const backText = letterCurrent === 1 ? LETTER_BACK_FIRST : 'Volver a la carta anterior';
  letterSwitchBtn.disabled = last;
  letterSwitchBtn.setAttribute('aria-label', LETTER_NEXT_TEXT);
  letterSwitchBtn.title = LETTER_NEXT_TEXT;
  letterBackBtn.disabled = letterCurrent === 0;
  letterBackBtn.setAttribute('aria-label', backText);
  letterBackBtn.title = backText;
  document.getElementById('letter-nav-n').textContent = `Carta ${letterCurrent + 1} de ${LETTER_SEQ.length}`;
}
function goToLetter(target) {
  if (letterBusy || target < 0 || target >= LETTER_SEQ.length) return;
  letterBusy = true;
  letterSwitchBtn.disabled = true;
  letterBackBtn.disabled = true;
  letterBodyEl.setAttribute('aria-live', 'polite');
  letterRevealed = true;
  letterTimers.forEach(clearTimeout);
  letterTimers = [];
  const reduced = prefersReducedMotion();
  letterPEls.forEach((p) => p.classList.remove('ink-in'));
  letterWishBlockEl.style.transition = reduced ? 'none' : 'opacity .6s ease';
  letterWishBlockEl.style.opacity = '0';

  setTimeout(() => {
    letterCurrent = target;
    const data = LETTER_SEQ[letterCurrent];
    letterLabelEl.textContent = data.label;
    buildLetterParagraphs(data.texto);
    letterWishBlockEl.classList.toggle('hidden', !data.conVela);
    if (data.conVela) requestAnimationFrame(() => { letterWishBlockEl.style.opacity = '1'; });
    updateLetterButtons();
    const rect = letterContainerEl.getBoundingClientRect();
    if (rect.top < 0 || rect.top > window.innerHeight * 0.4) {
      letterContainerEl.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    }
    setTimeout(() => {
      playLetterInk();
      letterBusy = false;
      updateLetterButtons();
    }, 30);
  }, reduced ? 50 : 750);
}
letterSwitchBtn.addEventListener('click', () => goToLetter(letterCurrent + 1));
letterBackBtn.addEventListener('click', () => goToLetter(letterCurrent - 1));

buildLetterParagraphs(LETTER_SEQ[0].texto);
updateLetterButtons();
const letterObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => { if (entry.isIntersecting) { revealLetterSequentially(); letterObserver.disconnect(); } });
}, { threshold: 0.2 });
letterObserver.observe(letterContainerEl);

/* ======================================================================
   HERO TITLE — letter-by-letter reveal (fires once journey unlocks)
====================================================================== */
const heroLexiEl = document.getElementById('hero-lexi');
let heroRevealed = false;
function revealHeroTitle() {
  if (heroRevealed) return;
  heroRevealed = true;
  const text = 'Lexi';
  heroLexiEl.innerHTML = '';
  text.split('').forEach((ch, i) => {
    const span = document.createElement('span');
    span.className = 'char-in';
    span.style.animationDelay = (i * 90) + 'ms';
    span.textContent = ch;
    heroLexiEl.appendChild(span);
  });
}

/* ======================================================================
   11:11 WISH RITUAL (longer sparkle trails + bokeh)
====================================================================== */
const wishCandle = document.getElementById('wish-candle');
const wishFinal = document.getElementById('wish-final');
let wishUsed = false;
wishCandle.addEventListener('click', () => {
  if (wishUsed) return;
  wishUsed = true;
  const rect = wishCandle.getBoundingClientRect();
  const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
  spawnSparkleBurst(cx, cy, 170);
  spawnBokeh(cx, cy, 7);
  wishCandle.style.opacity = '0.35';
  wishCandle.style.pointerEvents = 'none';
  setTimeout(() => {
    wishFinal.classList.remove('hidden');
    requestAnimationFrame(() => { wishFinal.style.opacity = '1'; });
  }, 900);
});

