/* ======================================================================
   CANVAS FX ENGINE — single unified hardware-accelerated canvas
====================================================================== */
const canvas = document.getElementById('fx-canvas');
const ctx = canvas.getContext('2d', { alpha: true });
const cursorCanvas = document.getElementById('cursor-canvas');
const cursorCtx = cursorCanvas.getContext('2d', { alpha: true });
let vw = 0, vh = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);

function resizeCanvas() {
  dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 640 ? 1.5 : 2);
  vw = window.innerWidth;
  vh = window.innerHeight;
  canvas.width = vw * dpr;
  canvas.height = vh * dpr;
  canvas.style.width = vw + 'px';
  canvas.style.height = vh + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  cursorCanvas.width = vw * dpr;
  cursorCanvas.height = vh * dpr;
  cursorCanvas.style.width = vw + 'px';
  cursorCanvas.style.height = vh + 'px';
  cursorCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

/* scrollY cacheado: leerlo en cada cuadro (updateLily) forzaba un recálculo
   de layout por flor. Se actualiza solo al hacer scroll. */
let scrollYCache = window.scrollY || 0;
window.addEventListener('scroll', () => { scrollYCache = window.scrollY || 0; }, { passive: true });
let resizeQueued = false;
window.addEventListener('resize', () => {
  if (resizeQueued) return;
  resizeQueued = true;
  requestAnimationFrame(() => {
    resizeQueued = false;
    if (window.innerWidth !== vw || window.innerHeight !== vh) resizeCanvas();
  });
});
resizeCanvas();

let isSunset = false;
let isNight = false; // cielo de noche (js/navegacion.js → setCielo)
let SEASON_PALETTE = null; // set from the current month (Fase 4 — temporadas), see end of script

/* Fase 5 — modo ligero automático: si prefiere menos movimiento, o si
   los primeros segundos miden menos de 40fps, se reducen los topes de
   partículas y se apaga el shadowBlur (caro en canvas). */
const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let LIGHT_MODE = REDUCED_MOTION;
let PARTICLE_CAP = LIGHT_MODE ? 25 : 55;
let FIREFLY_CAP = LIGHT_MODE ? 8 : 18;
if (LIGHT_MODE) document.body.classList.add('light-mode');
function applyLightMode() {
  if (LIGHT_MODE) return;
  LIGHT_MODE = true;
  document.body.classList.add('light-mode');
  PARTICLE_CAP = 25;
  FIREFLY_CAP = 8;
  BUTTERFLY_CAP = Math.min(BUTTERFLY_CAP, 2);
}

let particles = [];
let sparkles = [];
let topSparkles = [];
let bokehs = [];
let blooms = [];
let butterflies = [];
let fireflies = [];
let birds = [];
let lastPetalSpawn = 0;

/* ---- wind ---- */
let windCurrent = 0, windTarget = 0;
setInterval(() => { windTarget = rand(-1.6, 1.6); }, 5600);

/* ---- petals ---- */
function spawnPetal() {
  const palette = isSunset ? ['#F59E0B', '#FB7185', '#FFD700'] : isNight ? ['#DCE3FF', '#A9B6FF', '#FBE7A1'] : (SEASON_PALETTE || ['#FFD700', '#FACC15', '#E9D5FF']);
  particles.push({
    x: rand(0, vw),
    y: isSunset ? vh + 20 : -20,
    size: rand(6, 13),
    speedY: rand(0.4, 1.1) * (isSunset ? -1 : 1) * (isNight ? 0.7 : 1),
    speedX: rand(-0.4, 0.4),
    rot: rand(0, Math.PI * 2),
    rotSpeed: rand(-0.02, 0.02),
    color: palette[Math.floor(rand(0, palette.length))],
    opacity: rand(0.5, 0.95),
    sway: rand(0, Math.PI * 2),
  });
}
function drawPetal(p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot);
  ctx.globalAlpha = p.opacity;
  ctx.fillStyle = p.color;
  ctx.beginPath();
  ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
function updateParticles(t) {
  windCurrent += (windTarget - windCurrent) * 0.02;
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.y += p.speedY;
    p.x += p.speedX + windCurrent * 0.6 + Math.sin(t / 900 + p.sway) * 0.3;
    p.rot += p.rotSpeed + windCurrent * 0.004;
    if ((!isSunset && p.y > vh + 20) || (isSunset && p.y < -20) || p.x < -30 || p.x > vw + 30) {
      particles.splice(i, 1);
    }
  }
  if (particles.length < (isNight ? Math.round(PARTICLE_CAP * 0.6) : PARTICLE_CAP) && t - lastPetalSpawn > 260) { spawnPetal(); lastPetalSpawn = t; }
}

/* ---- botanical bezier lily ---- */
function drawLilyPetalPath(len, width, c = ctx) {
  c.beginPath();
  c.moveTo(0, 0);
  c.bezierCurveTo(width * 0.75, -len * 0.28, width * 0.55, -len * 0.72, 0, -len);
  c.bezierCurveTo(-width * 0.55, -len * 0.72, -width * 0.75, -len * 0.28, 0, 0);
  c.closePath();
}
function drawLeaf(len, width, c = ctx) {
  c.beginPath();
  c.moveTo(0, 0);
  c.quadraticCurveTo(width, -len * 0.5, 0, -len);
  c.quadraticCurveTo(-width, -len * 0.5, 0, 0);
  c.closePath();
}
/* Dibuja la flor completa centrada en (0,0) del contexto c. Se usa directo
   mientras florece (2.2 s) y una sola vez para generar el sprite cacheado. */
function paintLilyShape(c, size, hue, withLeaves) {
  if (withLeaves) {
    c.save(); c.rotate(Math.PI * 0.78); c.fillStyle = 'rgba(132,148,79,0.5)'; drawLeaf(size * 0.9, size * 0.22, c); c.fill(); c.restore();
    c.save(); c.rotate(-Math.PI * 0.78); c.fillStyle = 'rgba(132,148,79,0.42)'; drawLeaf(size * 0.8, size * 0.2, c); c.fill(); c.restore();
  }
  const petals = 6;
  for (let i = 0; i < petals; i++) {
    const angle = (i / petals) * Math.PI * 2 + hue;
    c.save();
    c.rotate(angle);
    drawLilyPetalPath(size, size * 0.42, c);
    const grad = c.createLinearGradient(0, 0, 0, -size);
    grad.addColorStop(0, '#F59E0B');
    grad.addColorStop(1, '#FEF08A');
    c.fillStyle = grad;
    c.fill();
    c.strokeStyle = 'rgba(180,83,9,0.35)';
    c.lineWidth = 1;
    c.stroke();
    c.restore();
  }
  const stamens = 6;
  for (let i = 0; i < stamens; i++) {
    const angle = (i / stamens) * Math.PI * 2 + hue + 0.3;
    const stLen = size * 0.55;
    c.save();
    c.rotate(angle);
    c.strokeStyle = 'rgba(217,119,6,0.8)';
    c.lineWidth = 1.4;
    c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -stLen); c.stroke();
    c.beginPath(); c.arc(0, -stLen, size * 0.05, 0, Math.PI * 2); c.fillStyle = '#D97706'; c.fill();
    c.restore();
  }
  c.beginPath();
  c.arc(0, 0, size * 0.14, 0, Math.PI * 2);
  c.fillStyle = '#B45309';
  c.fill();
}
function buildLilySprite(b) {
  const R = Math.ceil(b.size * 1.15);
  const off = document.createElement('canvas');
  off.width = off.height = Math.max(1, Math.round(R * 2 * dpr));
  const c = off.getContext('2d');
  c.scale(dpr, dpr);
  c.translate(R, R);
  paintLilyShape(c, b.size, b.hue, true);
  b.sprite = off;
  b.spriteR = R;
}
function drawLily(b) {
  if (b.progress <= 0) return;
  const p = Math.min(1, b.progress);
  const y = b.renderY !== undefined ? b.renderY : b.y;
  const baseAlpha = (b.alpha !== undefined ? b.alpha : 1) * (isNight ? 0.8 : 1); // de noche los lirios brillan menos

  if (p >= 1) {
    if (!b.sprite) buildLilySprite(b);
    const k = b.pulse || 1;
    const half = b.spriteR * k;
    ctx.globalAlpha = baseAlpha;
    ctx.drawImage(b.sprite, b.x - half, y - half, half * 2, half * 2);
    ctx.globalAlpha = 1;
    return;
  }
  const ease = 1 - Math.pow(1 - p, 3);
  const size = b.size * ease * b.pulse;
  ctx.save();
  ctx.translate(b.x, y);
  ctx.globalAlpha = Math.min(1, p * 1.4) * baseAlpha;
  paintLilyShape(ctx, size, b.hue, p > 0.25);
  ctx.restore();
}
function updateLily(b, dt) {
  if (b.delay > 0) { b.delay -= dt; return; }
  if (b.progress < 1) {
    b.progress += dt / 2200;
  } else {
    b.pulse = 1 + Math.sin(performance.now() / 1400 + b.hue * 10) * 0.03;
    b.idleTimer -= dt;
    if (b.idleTimer <= 0) {
      const angle = rand(0, Math.PI * 2);
      const dist = b.size * 0.6;
      spawnSparkleBurst(b.x + Math.cos(angle) * dist, (b.renderY || b.y) + Math.sin(angle) * dist, 4, true);
      b.idleTimer = rand(900, 1800);
    }
  }
  const offset = clamp(scrollYCache * b.parallax, -140, 140);
  b.renderY = b.y - offset;
}
function spawnLily({ x, y, size, delay = 0, parallax = 0.02, alpha = 1 }) {
  blooms.push({ x, y, size, progress: 0, delay, hue: rand(-0.15, 0.15), pulse: 1, idleTimer: 900, parallax, renderY: y, alpha });
}

/* ---- sparkles + bokeh ---- */
/* Cuando el canvas principal está pausado (cartas, juegos, vistas abiertas)
   los destellos de premio se dibujan en la capa superior (#cursor-canvas,
   encima de todo) para que se vean al ganar un juego. */
function spawnSparkleBurst(x, y, count, rising = false) {
  /* los destellos que suben son premios: grandes → arpegio + vibración larga; chicos → notita + toque */
  if (rising && window.Sonidos) window.Sonidos.play(count >= 12 ? 'premio' : 'corazon');
  if (rising && window.Haptica) window.Haptica.vibrar(count >= 30 ? [20, 40, 30] : 12);
  const target = (rafId === null && !document.hidden) ? topSparkles : sparkles;
  for (let i = 0; i < count; i++) {
    const angle = rising ? rand(-Math.PI * 0.75, -Math.PI * 0.25) : rand(0, Math.PI * 2);
    const speed = rising ? rand(0.3, 0.9) : rand(0.6, 3.2);
    target.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (rising ? rand(0.2, 0.5) : rand(0.5, 1.5)),
      life: 1,
      decay: rising ? rand(0.006, 0.011) : rand(0.004, 0.01),
      size: rand(1.5, 3.5),
    });
  }
  if (target === topSparkles) startTopLayer();
}
function spawnBokeh(x, y, count) {
  for (let i = 0; i < count; i++) {
    bokehs.push({
      x: x + rand(-60, 60), y: y + rand(-60, 60),
      size: rand(18, 42), life: 1, decay: rand(0.004, 0.008),
      color: Math.random() < 0.5 ? 'rgba(255,215,0,0.35)' : 'rgba(168,85,247,0.28)',
    });
  }
}
function updateSparkles() {
  for (let i = sparkles.length - 1; i >= 0; i--) {
    const s = sparkles[i];
    s.x += s.vx; s.y += s.vy; s.vy += 0.01; s.life -= s.decay;
    if (s.life <= 0) sparkles.splice(i, 1);
  }
  for (let i = bokehs.length - 1; i >= 0; i--) {
    const bk = bokehs[i];
    bk.life -= bk.decay;
    if (bk.life <= 0) bokehs.splice(i, 1);
  }
}
function drawSparkle(s) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, s.life);
  ctx.fillStyle = '#FFD700';
  if (!LIGHT_MODE) { ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 8; }
  ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function drawBokeh(bk) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, bk.life) * 0.6;
  ctx.filter = 'blur(6px)';
  ctx.fillStyle = bk.color;
  ctx.beginPath(); ctx.arc(bk.x, bk.y, bk.size, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

/* ---- butterflies (purple/violet, orbit around lilies) ---- */
const BUTTERFLY_COLORS = ['#A855F7', '#7E22CE', '#C084FC', '#D8B4FE'];
function spawnButterfly() {
  const eligible = blooms.filter((b) => b.progress > 0.4);
  if (!eligible.length) return;
  const target = eligible[Math.floor(rand(0, eligible.length))];
  butterflies.push({
    target,
    angle: rand(0, Math.PI * 2),
    radius: rand(45, 120),
    speed: rand(0.012, 0.03) * (Math.random() < 0.5 ? 1 : -1),
    flap: rand(0, Math.PI * 2),
    flapSpeed: rand(0.16, 0.26),
    size: rand(7, 12),
    color: BUTTERFLY_COLORS[Math.floor(rand(0, BUTTERFLY_COLORS.length))],
    life: 1,
    age: 0,
    maxLife: rand(9000, 17000),
    bobAmp: rand(6, 16),
  });
}
let BUTTERFLY_CAP = LIGHT_MODE ? 2 : 4; // sube en primavera (Fase 4 — temporadas), ver final del script
/* teléfonos: menos partículas (pantalla chica, batería) */
if (window.innerWidth < 640 && !LIGHT_MODE) { PARTICLE_CAP = 32; FIREFLY_CAP = 10; BUTTERFLY_CAP = 3; }
setInterval(() => { if (butterflies.length < BUTTERFLY_CAP && Math.random() < 0.7) spawnButterfly(); }, 3200);

function updateButterflies(dt) {
  for (let i = butterflies.length - 1; i >= 0; i--) {
    const b = butterflies[i];
    b.age += dt;
    b.angle += b.speed * dt * 0.06;
    b.flap += b.flapSpeed * dt * 0.06;
    const ty = b.target.renderY !== undefined ? b.target.renderY : b.target.y;
    b.x = b.target.x + Math.cos(b.angle) * b.radius;
    b.y = ty + Math.sin(b.angle) * b.radius * 0.55 - Math.sin(b.age / 500) * b.bobAmp * 0.3;
    if (b.age > b.maxLife) b.life -= 0.012;
    if (b.life <= 0) butterflies.splice(i, 1);
  }
}
function drawButterfly(b) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, b.life);
  ctx.translate(b.x, b.y);
  const flap = Math.sin(b.flap);
  const wingScale = 0.6 + Math.abs(flap) * 0.4;
  ctx.fillStyle = '#3b0764';
  ctx.beginPath(); ctx.ellipse(0, 0, b.size * 0.12, b.size * 0.4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = b.color;
  ctx.save(); ctx.rotate(-0.35); ctx.scale(1, wingScale);
  ctx.beginPath(); ctx.ellipse(-b.size * 0.55, -b.size * 0.1, b.size * 0.55, b.size * 0.4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.save(); ctx.rotate(0.35); ctx.scale(1, wingScale);
  ctx.beginPath(); ctx.ellipse(b.size * 0.55, -b.size * 0.1, b.size * 0.55, b.size * 0.4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.restore();
}

/* ---- fireflies (atardecer y noche) ---- */
function spawnFirefly() {
  fireflies.push({ x: rand(0, vw), y: rand(vh * 0.2, vh), vx: rand(-0.15, 0.15), vy: rand(-0.2, -0.05), phase: rand(0, Math.PI * 2) });
}
function updateFireflies(t) {
  /* atardecer y noche: todas; de día, unas pocas solo mientras se ve la portada */
  const tope = (isSunset || isNight) ? FIREFLY_CAP : (scrollYCache < vh * 0.9 ? Math.round(FIREFLY_CAP * 0.35) : 0);
  if (fireflies.length < tope && Math.random() < 0.05) spawnFirefly();
  for (let i = fireflies.length - 1; i >= 0; i--) {
    const f = fireflies[i];
    f.x += f.vx; f.y += f.vy;
    if (f.y < -10 || f.x < -10 || f.x > vw + 10) fireflies.splice(i, 1);
  }
}
function drawFirefly(f, t) {
  const glow = 0.4 + Math.sin(t / 400 + f.phase) * 0.4;
  ctx.save();
  ctx.globalAlpha = Math.max(0.05, glow);
  const luz = isNight ? '#FBE7A1' : '#FFD700';
  ctx.fillStyle = luz;
  if (!LIGHT_MODE) { ctx.shadowColor = luz; ctx.shadowBlur = 10; }
  ctx.beginPath(); ctx.arc(f.x, f.y, 2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

/* ---- birds (subtle, sunset only) ---- */
function spawnBird() {
  birds.push({ x: -40, y: rand(vh * 0.08, vh * 0.28), speed: rand(0.6, 1.1), flap: 0, size: rand(6, 10) });
}
setInterval(() => { if (isSunset && birds.length < 2 && Math.random() < 0.4) spawnBird(); }, 6000);
function updateBirds(dt) {
  for (let i = birds.length - 1; i >= 0; i--) {
    const b = birds[i];
    b.x += b.speed * (dt * 0.06);
    b.flap += dt * 0.01;
    if (b.x > vw + 40) birds.splice(i, 1);
  }
}
function drawBird(b) {
  const wing = Math.sin(b.flap) * b.size * 0.6;
  ctx.save();
  ctx.strokeStyle = 'rgba(20,10,25,0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(b.x - b.size, b.y + wing);
  ctx.quadraticCurveTo(b.x, b.y - wing, b.x + b.size, b.y + wing);
  ctx.stroke();
  ctx.restore();
}

/* ---- capa superior (#cursor-canvas, z-index 200): rastro de pétalos del
   cursor + destellos de premio cuando el canvas principal está pausado ----
   Tiene su propio requestAnimationFrame, independiente del loop principal
   (que se pausa con cartas, juegos y vistas abiertas), y solo corre mientras
   haya algo que dibujar. El cursor nativo nunca se oculta. El rastro usa
   pointermove (mouse o lápiz), así funciona también en laptops con pantalla
   táctil, donde (pointer: fine) puede dar falso. */
let cursorTrail = [];
let topPetals = []; // pétalos que salen al tocar (js/micro.js) — se dibujan en la capa superior
/* pétalos que brotan al tocar algo (los llama js/micro.js); con movimiento reducido no hacen nada */
function spawnPetalTouch(x, y, n, colores) {
  if (REDUCED_MOTION || document.hidden) return;
  const cuantos = LIGHT_MODE ? Math.ceil(n / 2) : n;
  for (let i = 0; i < cuantos; i++) {
    const a = rand(-Math.PI * 0.95, -Math.PI * 0.05);
    const v = rand(0.7, 2.1);
    topPetals.push({
      x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, rot: rand(0, Math.PI * 2), vr: rand(-0.12, 0.12),
      size: rand(3.6, 7), life: 1, dur: rand(700, 1150), color: colores[Math.floor(rand(0, colores.length))],
    });
  }
  if (topPetals.length > 60) topPetals.splice(0, topPetals.length - 60);
  startTopLayer();
}

let topRaf = null;
let topLast = 0;
const isDesktopPointer = window.matchMedia('(pointer: fine)').matches;
const TRAIL_LIFE_MS = 480;
function drawTopLayer() {
  if (cursorTrail.length) {
    const paleta = isSunset ? ['#FB7185', '#F59E0B', '#FFD700'] : isNight ? ['#DCE3FF', '#A9B6FF', '#FBE7A1'] : ['#FFD700', '#FACC15', '#E9D5FF', '#FB7185'];
    cursorTrail.forEach((c) => {
      cursorCtx.fillStyle = paleta[c.col % paleta.length];
      cursorCtx.globalAlpha = Math.max(0, c.life) * 0.6;
      cursorCtx.beginPath();
      cursorCtx.ellipse(c.x, c.y, 4.2 * c.life + 1, 2 * c.life + 0.6, c.rot, 0, Math.PI * 2);
      cursorCtx.fill();
    });
  }
  if (topPetals.length) {
    topPetals.forEach((p) => {
      cursorCtx.save();
      cursorCtx.translate(p.x, p.y);
      cursorCtx.rotate(p.rot);
      cursorCtx.globalAlpha = Math.max(0, Math.min(1, p.life * 1.3)) * 0.9;
      cursorCtx.fillStyle = p.color;
      cursorCtx.beginPath();
      cursorCtx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
      cursorCtx.fill();
      cursorCtx.restore();
    });
  }
  if (topSparkles.length) {
    cursorCtx.fillStyle = '#FFD700';
    topSparkles.forEach((sp) => {
      const a = Math.max(0, sp.life);
      cursorCtx.globalAlpha = a * 0.35;
      cursorCtx.beginPath(); cursorCtx.arc(sp.x, sp.y, sp.size * 2.2, 0, Math.PI * 2); cursorCtx.fill();
      cursorCtx.globalAlpha = a;
      cursorCtx.beginPath(); cursorCtx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2); cursorCtx.fill();
    });
  }
  cursorCtx.globalAlpha = 1;
}
function topFrame(t) {
  topRaf = null;
  const dt = topLast ? Math.min(t - topLast, 64) : 16;
  topLast = t;
  for (let i = cursorTrail.length - 1; i >= 0; i--) {
    cursorTrail[i].life -= dt / TRAIL_LIFE_MS;
    cursorTrail[i].y += dt * 0.018; // el rastro cae un poquito, como pétalos
    if (cursorTrail[i].life <= 0) cursorTrail.splice(i, 1);
  }
  for (let i = topPetals.length - 1; i >= 0; i--) {
    const p = topPetals[i];
    p.x += p.vx * dt * 0.06; p.y += p.vy * dt * 0.06; p.vy += 0.0016 * dt; p.vx *= 0.985;
    p.rot += p.vr * dt * 0.06; p.life -= dt / p.dur;
    if (p.life <= 0) topPetals.splice(i, 1);
  }
  for (let i = topSparkles.length - 1; i >= 0; i--) {
    const sp = topSparkles[i];
    const k = dt / 16.67;
    sp.x += sp.vx * k; sp.y += sp.vy * k; sp.vy += 0.01 * k; sp.life -= sp.decay * k;
    if (sp.life <= 0) topSparkles.splice(i, 1);
  }
  cursorCtx.clearRect(0, 0, vw, vh);
  if (cursorTrail.length || topSparkles.length || topPetals.length) {
    drawTopLayer();
    topRaf = requestAnimationFrame(topFrame);
  } else {
    topLast = 0;
  }
}
function startTopLayer() {
  if (!topRaf && !document.hidden) topRaf = requestAnimationFrame(topFrame);
}
window.addEventListener('pointermove', (e) => {
  if (e.pointerType === 'touch') return;
  if (cursorTrail.length > 40) cursorTrail.shift();
  cursorTrail.push({ x: e.clientX, y: e.clientY, life: 1, rot: rand(0, Math.PI), col: Math.floor(rand(0, 4)) });
  startTopLayer();
}, { passive: true });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    cursorTrail = []; topSparkles = []; topPetals = [];
    if (topRaf) { cancelAnimationFrame(topRaf); topRaf = null; }
    topLast = 0;
    cursorCtx.clearRect(0, 0, vw, vh);
  }
});
/* si el cursor sale de la ventana, el rastro se desvanece solo (no se queda pegado) */
document.documentElement.addEventListener('pointerleave', () => { cursorTrail.length = 0; });

/* ---- main render loop ---- */
let lastFrame = performance.now();
let fpsSampleStart = null;
let fpsSampleFrames = 0;
let fpsDecided = LIGHT_MODE; // si ya entró en modo ligero por prefers-reduced-motion, no hace falta medir
function sampleFpsAndMaybeGoLight(t) {
  if (fpsDecided) return;
  if (fpsSampleStart === null) { fpsSampleStart = t; fpsSampleFrames = 0; }
  fpsSampleFrames++;
  const elapsed = t - fpsSampleStart;
  if (elapsed > 3000) {
    const avgFps = fpsSampleFrames / (elapsed / 1000);
    if (avgFps < 40) applyLightMode();
    fpsDecided = true;
  }
}

function loop(t) {
  const dt = t - lastFrame;
  lastFrame = t;
  sampleFpsAndMaybeGoLight(t);
  ctx.clearRect(0, 0, vw, vh);

  updateParticles(t);
  particles.forEach(drawPetal);

  bokehs.forEach(drawBokeh);

  blooms.forEach((b) => updateLily(b, dt));
  blooms.forEach(drawLily);

  updateButterflies(dt);
  butterflies.forEach(drawButterfly);

  updateFireflies(t);
  fireflies.forEach((f) => drawFirefly(f, t));

  updateBirds(dt);
  birds.forEach(drawBird);

  updateSparkles();
  sparkles.forEach(drawSparkle);

  updateHeartRain(dt);
  heartRain.forEach(drawHeartRainItem);


  updateAudioBars();

  rafId = requestAnimationFrame(loop);
}
let rafId = requestAnimationFrame(loop);

/* Motivos para pausar el canvas principal: la pestaña oculta
   (visibilitychange), o una vista de pantalla completa tapándolo del
   todo (El Buzón, Juegos) — en ambos casos nadie lo está viendo, así
   que no tiene sentido seguir dibujando 60 veces por segundo. */
const canvasPauseReasons = new Set();
function updateCanvasPauseState() {
  if (canvasPauseReasons.size > 0) {
    if (rafId) {
      cancelAnimationFrame(rafId); rafId = null;
      sparkles.length = 0; // los destellos del fondo no deben quedar congelados ni reaparecer después
    }
  } else if (!rafId) {
    lastFrame = performance.now(); // evita un dt gigante por el tiempo en pausa
    rafId = requestAnimationFrame(loop);
  }
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) canvasPauseReasons.add('hidden'); else canvasPauseReasons.delete('hidden');
  updateCanvasPauseState();
});

/* hero + secondary lilies bloom on load.
   Fase 5 — arreglo visual conocido: el lirio del hero se superponía al
   texto "Lexi" y le quitaba legibilidad. Más chico y con menos opacidad
   para que quede de fondo, no encima. */
spawnLily({ x: vw / 2, y: vh / 2, size: Math.min(vw, vh) * 0.12, delay: 300, parallax: 0.02, alpha: 0.4 });
spawnLily({ x: vw * 0.14, y: vh * 0.24, size: Math.min(vw, vh) * 0.08, delay: 700, parallax: 0.05 });
spawnLily({ x: vw * 0.86, y: vh * 0.78, size: Math.min(vw, vh) * 0.09, delay: 1000, parallax: 0.04 });

