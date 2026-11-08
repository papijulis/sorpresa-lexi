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
/* Infinito no se abre detrás de otro pop-up (quedaría tapado con el foco en un ✕ invisible) */
function capaEncimaDeInfinito() {
  const oculto = (id) => { const el = document.getElementById(id); return !el || el.hidden; };
  const abierta = (id) => { const el = document.getElementById(id); return !!(el && el.classList.contains('open')); };
  return !oculto('rueda') || !oculto('flor-especial') || abierta('app-modal') || abierta('lightbox') ||
    document.documentElement.classList.contains('carta-abierta');
}
window.addEventListener('keydown', (e) => {
  if (typeof e.key !== 'string' || e.key.length !== 1) return;   // keydown sintéticos (autocompletado) pueden venir sin key
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (document.body.classList.contains('locked')) return;          // pantalla de entrada
  teAmoBuffer = (teAmoBuffer + e.key.toLowerCase()).slice(-6);
  if (teAmoBuffer.includes('te amo')) {
    teAmoBuffer = '';
    spawnHeartRain();
    showToast('Yo también te amo {i-corazon-lleno}');
    if (window.Infinito && !capaEncimaDeInfinito()) window.Infinito.abrir();
  }
  iLoveYouBuffer = (iLoveYouBuffer + e.key.toLowerCase()).slice(-11);
  if (iLoveYouBuffer.includes('i love you')) {
    iLoveYouBuffer = '';
    if (window.Infinito && !capaEncimaDeInfinito()) window.Infinito.abrir();
  }
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
  /* primavera: más mariposas (en pausa, no; con modo ligero / movimiento reducido se queda el tope de motor-canvas) */
  if (month >= 3 && month <= 5 && !window.EN_PAUSA && !LIGHT_MODE) BUTTERFLY_CAP = window.innerWidth < 640 ? 4 : 7;
}
applySeason();

/* ---- cielo nocturno + luna (easter egg: tocarla de noche) ----
   Construye las estrellas una sola vez; qué cielo se muestra (día /
   atardecer / noche) lo decide setCielo() en js/navegacion.js. */
let cieloNocturnoListo = false;
/* antes de la luna si vive dentro de la capa; si no (la luna puede salir como hermana de la capa),
   al final — insertBefore con un nodo que no es hijo lanzaría NotFoundError */
function meterEnCielo(nightLayer, nodo, moonEl) {
  if (moonEl && moonEl.parentNode === nightLayer) nightLayer.insertBefore(nodo, moonEl);
  else nightLayer.appendChild(nodo);
}
function applyNightMode() {
  const nightLayer = document.getElementById('bg-layer-night');
  const moonEl = document.getElementById('night-moon');
  if (!cieloNocturnoListo) {
    cieloNocturnoListo = true;
    const via = document.createElement('div');
    via.className = 'night-via';
    meterEnCielo(nightLayer, via, moonEl);
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
      meterEnCielo(nightLayer, star, moonEl);
    }
    const fugaz = document.createElement('div');
    fugaz.className = 'night-fugaz';
    fugaz.setAttribute('aria-hidden', 'true');
    meterEnCielo(nightLayer, fugaz, moonEl);
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
  /* scale multiplica las unidades de la curva (x ±16, y ≈ -11.7..17): 2.3 cabe en el viewBox de ±42 */
  const pts = window.JuegoConstelacion.getHeartPoints(2.3);
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

  meterEnCielo(nightLayer, svg, moonEl);
}
function abrirSecretoLuna() {
  if (!document.body.classList.contains('night-mode') || document.body.classList.contains('sunset-mode')) return;
  const moon = document.getElementById('night-moon');
  if (!moon) return;
  const rect = moon.getBoundingClientRect();
  spawnSparkleBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 30, true);
  openModal({ icon: 'i-luna', title: 'Un secreto de la luna', body: window.MOON_SECRET_TEXT || '' });
}
document.getElementById('night-moon').addEventListener('click', abrirSecretoLuna);
/* <main> (z 10) tapa la luna para el mouse y el dedo: un clic en una zona
   "vacía" del contenido que cae sobre la luna también la abre. */
document.addEventListener('click', (e) => {
  if (e.defaultPrevented || e.button !== 0) return;
  const body = document.body;
  if (!body.classList.contains('night-mode') || body.classList.contains('sunset-mode')) return;
  if (document.documentElement.classList.contains('carta-abierta')) return;
  const mainEl = document.getElementById('main-content');
  if (!mainEl || mainEl.classList.contains('hidden-content')) return;
  const t = e.target;
  if (!(t instanceof Element) || !mainEl.contains(t)) return;   // no closest('main'): #view-infinito tiene su propio <main>
  if (t.closest('button, a[href], [role="button"], [tabindex], canvas, input, textarea, select, label, summary, [contenteditable]')) return;
  const sel = window.getSelection ? window.getSelection() : null;
  if (sel && String(sel).length) return;
  const moon = document.getElementById('night-moon');
  if (!moon) return;
  const r = moon.getBoundingClientRect();
  if (!r.width || !r.height) return;
  if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) abrirSecretoLuna();
});

/* ---- saludo dinámico + frase del día (entrada suave, una vez por visita) ---- */
/* devuelve el elemento de la frase si la pintó (para el fundido de la primera vez) */
function pintarSaludo() {
  const hour = mexicoCityHour();
  const saludo = hour < 12 ? 'Buenos días' : (hour < 19 ? 'Buenas tardes' : 'Buenas noches');
  const totalDias = Math.max(0, Math.floor((new Date() - START_DATE) / 86400000));
  const saludoEl = document.getElementById('saludo-dinamico');
  const texto = `${saludo}, Lexi. Hoy son ${totalDias} días desde que empezamos a hablar.`;
  if (saludoEl && saludoEl.textContent !== texto) saludoEl.textContent = texto;

  const banco = window.FRASES;
  const fraseEl = document.getElementById('frase-del-dia');
  if (fraseEl && banco && banco.length) {
    const frase = banco[dayOfYear(getTodayDateString()) % banco.length];
    if (frase && frase.texto) {
      const fraseTxt = `"${frase.texto}"`;
      if (fraseEl.textContent !== fraseTxt) fraseEl.textContent = fraseTxt;
      return fraseEl;
    }
  }
  return null;
}
function renderSaludoYFrase() {
  const fraseEl = pintarSaludo();
  if (fraseEl) setTimeout(() => fraseEl.classList.add('in'), 1000);
}
renderSaludoYFrase();
/* si la pestaña o la PWA se reanuda otro día, el saludo, los días y la frase se ponen al corriente (sin repetir el fundido) */
function repintarSaludo() { try { pintarSaludo(); } catch (e) {} }
document.addEventListener('visibilitychange', () => { if (!document.hidden) repintarSaludo(); });
window.addEventListener('pageshow', repintarSaludo);

/* ---- Ritual 11:11 en vivo: si está en el sitio a las 11:11 (am o pm, hora
   de Ciudad de México) aparece la invitación a pedir un deseo, una sola
   vez por cada 11:11 de cada día. ---- */
function mexicoCityHourMinute() {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Mexico_City', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
  const get = (type) => Number((parts.find((p) => p.type === type) || {}).value);
  return { h: get('hour') % 24, m: get('minute') };
}
function hayAlgoAbierto1111() {
  const modal = document.getElementById('app-modal');
  if (modal && modal.classList.contains('open')) return true;
  if (typeof activeJuego !== 'undefined' && activeJuego) return true;
  if (document.querySelector('.app-view.open, #lightbox.open')) return true;
  const rueda = document.getElementById('rueda');
  if (rueda && !rueda.hidden) return true;
  const flor = document.getElementById('flor-especial');
  if (flor && !flor.hidden) return true;
  return document.documentElement.classList.contains('carta-abierta');
}
function check1111(h, m) {
  if (m !== 11 || (h !== 11 && h !== 23)) return false;
  const mainEl = document.getElementById('main-content');
  if (mainEl && mainEl.classList.contains('hidden-content')) return false;
  const key = `jardin.1111.${getTodayDateString()}-${h}`;
  if (jardinStorage.get(key)) return false;
  /* algo abierto (carta, juego, rueda, flor, lector, foto): no tapar; sin marcar la clave,
     el intervalo de 5 s vuelve a intentar dentro del mismo minuto */
  if (hayAlgoAbierto1111()) return false;
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
  /* en pausa el jardín deja de sumar flores: se queda con las de los meses que vivimos */
  const count = Math.min(10, window.EN_PAUSA ? Math.min(meses, (window.PAUSA && window.PAUSA.flores) || 5) : meses);
  /* en el teléfono el texto ocupa casi todo el ancho: los lirios del mes van a las orillas
     y más tenues, para que no compitan con los títulos ni con las tarjetas */
  const angosta = vw < 640;
  for (let i = 0; i < count; i++) {
    const rx = angosta ? (i % 2 ? rand(0.86, 0.96) : rand(0.04, 0.14)) : rand(0.08, 0.92);
    const ry = rand(0.15, 0.85), rs = rand(0.05, 0.09);
    spawnLily({
      x: vw * rx, y: vh * ry, size: Math.min(vw, vh) * rs, rx, ry, rs,
      delay: 1500 + i * 260,
      parallax: rand(0.02, 0.06),
      alpha: angosta ? 0.62 : 0.85,
    });
  }
}
spawnMonthlyFlowers();

/* ---- línea de tiempo: se ilumina al hacer scroll ---- */
function renderTimeline() {
  const itemsContainer = document.getElementById('timeline-items');
  const wrap = document.querySelector('.timeline-wrap');
  const svg = document.getElementById('timeline-vine');
  const toggleAll = document.getElementById('tl-toggle-todo');
  if (!itemsContainer || !wrap || !svg) return;

  // Mapeo best-effort entre fechas de MEMORIES y fotos ya existentes en fotos.js
  const PHOTO_BY_DATE = {
    '2026-06-06': './assets/img/flores-panchito.jpeg',
    '2026-07-03': './assets/img/frutos-rojos.jpeg',
    '2026-07-28': './assets/img/girasoles.jpeg',
    '2026-08-18': './assets/img/fondo-chat.jpeg',
    '2026-09-16': './assets/img/viendo-edgerunners.jpeg',
  };
  const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  /* recuerdos agrupados por mes (cronológico); el último mes arranca abierto */
  const grupos = [];
  /* un recuerdo sin fecha válida (edición a mano) se omite en vez de tumbar el resto del archivo */
  (window.MEMORIES || []).filter((m) => m && typeof m.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(m.date)).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)).forEach((m) => {
    const key = m.date.slice(0, 7);
    let g = grupos[grupos.length - 1];
    if (!g || g.key !== key) { g = { key, anio: key.slice(0, 4), mes: Number(key.slice(5, 7)) - 1, items: [] }; grupos.push(g); }
    g.items.push(m);
  });

  const litTargets = [];   // encabezados e ítems que se "encienden" al pasar la marca de lectura
  const mesEls = grupos.map((g, gi) => {
    const mes = document.createElement('section');
    mes.className = 'tl-mes' + (gi === grupos.length - 1 ? ' abierto' : '');
    const panelId = 'tl-panel-' + g.key;
    const btnId = 'tl-btn-' + g.key;
    const n = g.items.length;
    mes.innerHTML = `
      <h3 class="tl-mes-h">
        <button type="button" class="tl-mes-btn" id="${btnId}" aria-expanded="${gi === grupos.length - 1}" aria-controls="${panelId}">
          <span class="timeline-dot-col">${ico('lirio-mini', 'timeline-flor tl-flor-mes')}</span>
          <span class="tl-mes-nom">${MESES[g.mes]} <small>${g.anio}</small></span>
          <span class="tl-mes-cuenta">${n} ${n === 1 ? 'recuerdo' : 'recuerdos'}</span>
          <span class="tl-mes-mas" aria-hidden="true"></span>
        </button>
      </h3>
      <div class="tl-panel" id="${panelId}" role="region" aria-labelledby="${btnId}"><div class="tl-panel-in"></div></div>`;
    const inner = mes.querySelector('.tl-panel-in');
    g.items.forEach((m) => {
      const el = document.createElement('div');
      el.className = 'timeline-item';
      const photo = PHOTO_BY_DATE[m.date];
      el.innerHTML = `
        <div class="timeline-dot-col">${ico('lirio-mini', 'timeline-flor')}</div>
        <div class="timeline-content">
          <p class="timeline-date">${m.display}</p>
          <p class="timeline-text">${m.text}</p>
          ${photo ? pictureHTML(photo, '', 'class="timeline-photo"') : ''}
        </div>`;
      inner.appendChild(el);
      litTargets.push(el);
    });
    itemsContainer.appendChild(mes);
    litTargets.push(mes);
    return mes;
  });

  /* EN PAUSA: después del último mes, la enredadera termina en un lirio cerrado con unas
     palabras de Julio (window.PAUSA.cierre) y la rueda de los perdones, a la vista */
  if (window.EN_PAUSA && window.PAUSA && window.PAUSA.cierre) {
    const cierre = document.createElement('section');
    cierre.className = 'tl-pausa';
    cierre.setAttribute('aria-label', 'En pausa');
    const parrafos = window.PAUSA.cierre.split('\n\n').map((t) => `<p>${t.replace(/</g, '&lt;')}</p>`).join('');
    cierre.innerHTML = `
      <div class="timeline-dot-col">${ico('lirio-linea', 'timeline-flor tl-flor-pausa')}</div>
      <div class="tl-pausa-in">
        <p class="tl-pausa-etq">en pausa</p>
        <div class="tl-pausa-texto font-hand">${parrafos}</div>
        ${window.PAUSA.cierreFirma ? `<p class="tl-pausa-firma font-hand">${window.PAUSA.cierreFirma}</p>` : ''}
        <div class="tl-pausa-rueda"><button type="button" class="rueda-circulo rueda-abrir-extra" aria-label="Para cuando cometo un error: 100 razones para pedir perdón"><span class="font-hand">para cuando cometo un error</span></button></div>
      </div>`;
    itemsContainer.appendChild(cierre);
    litTargets.push(cierre);
    const btn = cierre.querySelector('.rueda-abrir-extra');
    btn.addEventListener('click', () => { if (window.Rueda) window.Rueda.abrir(btn); });
  }

  /* ---- plegar / desplegar ---- */
  function setMes(mes, abrir) {
    mes.classList.toggle('abierto', abrir);
    mes.querySelector('.tl-mes-btn').setAttribute('aria-expanded', String(abrir));
  }
  function actualizarBotonTodo() {
    if (!toggleAll) return;
    const todos = mesEls.every((m) => m.classList.contains('abierto'));
    toggleAll.textContent = todos ? 'Cerrar todos los meses' : 'Abrir todos los meses';
  }
  mesEls.forEach((mes) => {
    mes.querySelector('.tl-mes-btn').addEventListener('click', () => { setMes(mes, !mes.classList.contains('abierto')); actualizarBotonTodo(); });
  });
  if (toggleAll) toggleAll.addEventListener('click', () => {
    const abrir = !mesEls.every((m) => m.classList.contains('abierto'));
    mesEls.forEach((m) => setMes(m, abrir));
    actualizarBotonTodo();
  });
  actualizarBotonTodo();

  /* ---- la enredadera: un tallo que se dibuja con el scroll, con hojas y zarcillos ---- */
  let vineFill = null, decos = [], tlTop = 0, tlHeight = 0, tops = [], lastBuiltH = -1;
  function buildVine(h) {
    lastBuiltH = h;
    svg.setAttribute('viewBox', `0 0 40 ${h}`);
    svg.setAttribute('height', h);
    let d = 'M20 0';
    const paso = 120, amp = 5;
    for (let y = 0, i = 0; y < h; y += paso, i++) {
      const y2 = Math.min(h, y + paso), dir = i % 2 ? -1 : 1;
      d += `C${20 + dir * amp * 2} ${(y + paso * 0.33).toFixed(1)} ${20 - dir * amp * 2} ${(y + paso * 0.66).toFixed(1)} 20 ${y2}`;
    }
    let html = `<path class="tl-vine-track" d="${d}" fill="none"/><path class="tl-vine-fill" d="${d}" pathLength="1" fill="none"/>`;
    decos = [];
    for (let y = 64, k = 0; y < h - 20; y += 78, k++) {
      const lado = k % 2 ? -1 : 1;
      const hoja = k % 3 === 2
        ? '<path class="tl-zarcillo" d="M0 0c6-3 11 1 9 7s-8 4-7-1" fill="none"/>'
        : '<path class="tl-hoja" d="M0 0Q8-7 17 0Q8 7 0 0Z"/>';
      html += `<g transform="translate(20 ${y}) scale(${lado} 1) rotate(${-34 + (k % 2) * 10})"><g class="tl-deco" data-y="${y}">${hoja}</g></g>`;
    }
    svg.innerHTML = html;
    vineFill = svg.querySelector('.tl-vine-fill');
    decos = Array.from(svg.querySelectorAll('.tl-deco')).map((el) => ({ el, y: Number(el.dataset.y), lit: false }));
  }
  function measure() {
    const y = window.scrollY;
    const rect = wrap.getBoundingClientRect();
    tlTop = rect.top + y;
    tlHeight = rect.height;
    tops = litTargets.map((el) => el.getBoundingClientRect().top + y);
    const h = Math.max(40, Math.round(tlHeight));
    if (Math.abs(h - lastBuiltH) > 1) buildVine(h);
    update(y, window.innerHeight);
  }
  function update(y, vh) {
    const E = window.Motor && Motor.estado;
    if (y == null) y = E ? E.y : window.scrollY;
    if (vh == null) vh = E ? E.vh : window.innerHeight;
    const markerY = y + vh * 0.75;
    const filled = clamp(markerY - tlTop, 0, tlHeight);
    if (vineFill) vineFill.style.strokeDashoffset = String(1 - (tlHeight ? filled / tlHeight : 0));
    for (let i = 0; i < decos.length; i++) {
      const lit = decos[i].y < filled;
      if (lit !== decos[i].lit) { decos[i].lit = lit; decos[i].el.classList.toggle('lit', lit); }
    }
    for (let i = 0; i < litTargets.length; i++) {
      const lit = tops[i] < markerY;
      if (lit !== litTargets[i].classList.contains('lit')) litTargets[i].classList.toggle('lit', lit);
    }
  }
  let tlUltimoY = -1;
  Motor.suscribir((E) => { if (E.y !== tlUltimoY) { tlUltimoY = E.y; update(E.y, E.vh); } });   // único lector de scroll: motor.js
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);
  /* al plegar/desplegar cambia el alto: durante la transición solo se ajusta el alto (barato);
     la medición completa y la enredadera se rehacen UNA vez cuando el alto deja de cambiar.
     No depende de transitionend: funciona con reduced-motion (transition:none), cancelaciones,
     fuentes o fotos que cambian el alto. */
  if ('ResizeObserver' in window) {
    let pendiente = false, tFinal = 0;
    new ResizeObserver(() => {
      if (!pendiente) {
        pendiente = true;
        requestAnimationFrame(() => { pendiente = false; tlHeight = wrap.getBoundingClientRect().height; update(); });
      }
      clearTimeout(tFinal);
      tFinal = setTimeout(measure, 120);
    }).observe(wrap);
  }
  setTimeout(measure, 1500);
  measure();
}
renderTimeline();

/* ---- Nuestra banda sonora: selector de discos (reproductor de CD de los de antes) ----
   Se arma solo con SONGS: más canciones = más discos, sin tocar nada aquí. Elegir un
   disco lo pone al centro; Reproducir usa la misma música del sitio (playDedicatedSong /
   bgAudio), así el mini-reproductor del dock y este aparato siempre van juntos. */
function renderBandaSonora() {
  const host = document.getElementById('banda-sonora-list');
  const songs = window.SONGS || [];
  if (!host || !songs.length) return;
  const N = songs.length;
  const pad = (n) => (n < 10 ? '0' + n : '' + n);
  const mmss = (t) => (isFinite(t) && t > 0 ? Math.floor(t / 60) + ':' + pad(Math.floor(t % 60)) : '0:00');
  let foco = currentSongIndex >= 0 ? currentSongIndex : 0;

  const discos = songs.map((song, i) => {
    const rim = (song.title + ' · ' + song.artist + ' · ').toUpperCase();
    return `
      <button type="button" class="cd-disco" data-i="${i}" aria-label="Disco ${i + 1} de ${N}: ${song.title}, ${song.artist}">
        <span class="cd-giro" aria-hidden="true">
          <svg viewBox="0 0 100 100" focusable="false"><defs><path id="cd-ruta-${i}" d="M50 50m-41 0a41 41 0 1 1 82 0a41 41 0 1 1-82 0"/></defs>
            <text class="cd-rim"><textPath href="#cd-ruta-${i}" startOffset="0">${rim.repeat(2)}</textPath></text>
            <use href="#lirio-linea" x="36" y="36" width="28" height="28" class="cd-lirio"/></svg>
        </span>
        <span class="cd-brillo" aria-hidden="true"></span>
        <span class="cd-hueco" aria-hidden="true"></span>
      </button>`;
  }).join('');
  const numeros = songs.map((song, i) => `<button type="button" class="cd-num" data-i="${i}" aria-label="Elegir el disco ${i + 1}: ${song.title}">${i + 1}</button>`).join('');

  host.className = 'cd-aparato tarjeta-flor';
  host.innerHTML = `
    <div class="cd-lcd" aria-hidden="true">
      <div class="cd-lcd-fila"><span>DISCO <b id="cd-n">01</b>/${pad(N)}</span><span id="cd-tiempo">0:00</span></div>
      <p class="cd-lcd-t" id="cd-titulo"></p>
      <p class="cd-lcd-a" id="cd-artista"></p>
      <div class="cd-lcd-barra"><i id="cd-barra"></i></div>
    </div>
    <div class="cd-escenario" role="group" aria-roledescription="carrusel de discos" aria-label="Discos de nuestra banda sonora">${discos}</div>
    <div class="cd-mandos">
      <button type="button" class="cd-btn cd-prev" id="cd-prev" aria-label="Disco anterior">${ico('i-siguiente')}</button>
      <button type="button" class="cd-btn cd-play" id="cd-play" aria-label="Reproducir">${ico('i-play')}</button>
      <button type="button" class="cd-btn cd-next" id="cd-next" aria-label="Disco siguiente">${ico('i-siguiente')}</button>
    </div>
    <div class="cd-numeros">${numeros}</div>
    <p class="cd-dedicatoria font-hand" id="cd-dedicatoria"></p>
    <p class="sr-only" id="cd-estado" role="status" aria-live="polite"></p>`;

  const discoEls = Array.from(host.querySelectorAll('.cd-disco'));
  const numEls = Array.from(host.querySelectorAll('.cd-num'));
  const el = (id) => document.getElementById(id);

  function layout() {
    discoEls.forEach((d, i) => {
      const o = i - foco, vis = Math.abs(o) <= 1;
      d.style.setProperty('--x', (o * 70) + '%');
      d.style.setProperty('--s', o === 0 ? 1 : 0.6);
      d.style.opacity = o === 0 ? 1 : (vis ? 0.5 : 0);
      d.style.zIndex = String(10 - Math.abs(o));
      d.style.visibility = vis ? 'visible' : 'hidden';
      d.setAttribute('aria-current', o === 0 ? 'true' : 'false');
      d.tabIndex = o === 0 ? 0 : -1;
    });
    numEls.forEach((n, i) => n.setAttribute('aria-pressed', String(i === foco)));
    const song = songs[foco];
    el('cd-n').textContent = pad(foco + 1);
    el('cd-titulo').textContent = song.title;
    el('cd-artista').textContent = song.artist;
    el('cd-dedicatoria').textContent = song.dedicatoria || '';
    host.querySelector('.cd-prev').disabled = N < 2;
    host.querySelector('.cd-next').disabled = N < 2;
    sincronizar();
  }
  function sincronizar() {
    const suena = !bgAudio.paused;
    const esta = currentSongIndex === foco;
    discoEls.forEach((d, i) => d.classList.toggle('sonando', suena && i === currentSongIndex));
    const play = el('cd-play');
    play.innerHTML = ico(suena && esta ? 'i-pausa' : 'i-play');
    play.setAttribute('aria-label', suena && esta ? 'Pausar' : 'Reproducir');
    el('cd-estado').textContent = `Disco ${foco + 1} de ${N}: ${songs[foco].title}, ${songs[foco].artist}.` + (suena && esta ? ' Reproduciendo.' : '');
    tiempo();
  }
  function tiempo() {
    const esta = currentSongIndex === foco;
    const t = esta ? bgAudio.currentTime : 0, d = esta ? bgAudio.duration : 0;
    el('cd-tiempo').textContent = mmss(t);
    el('cd-barra').style.width = (esta && isFinite(d) && d > 0 ? Math.min(100, (t / d) * 100) : 0) + '%';
  }
  function ir(i) {
    const n = ((i % N) + N) % N;
    if (n === foco) return;
    /* si el foco estaba en un disco, pasa al nuevo disco central (se mira ANTES de layout(),
       que puede esconder el disco enfocado y soltar el foco a <body>) */
    const teniaFoco = discoEls.indexOf(document.activeElement) !== -1;
    foco = n;
    if (window.Sonidos) window.Sonidos.play('mes');
    layout();
    if (teniaFoco && discoEls[foco]) discoEls[foco].focus({ preventScroll: true });
  }
  function reproducir() {
    if (currentSongIndex === foco) {
      if (bgAudio.paused) playCurrentSong(); else { bgAudio.pause(); updateMiniPlayerIcon(); }
    } else {
      playDedicatedSong(songs[foco].title);
    }
    sincronizar();
  }

  discoEls.forEach((d, i) => d.addEventListener('click', () => { if (i === foco) reproducir(); else ir(i); }));
  numEls.forEach((n, i) => n.addEventListener('click', () => ir(i)));
  el('cd-prev').addEventListener('click', () => ir(foco - 1));
  el('cd-next').addEventListener('click', () => ir(foco + 1));
  el('cd-play').addEventListener('click', reproducir);

  /* deslizar para cambiar de disco (solo táctil/lápiz: con mouse, arrastrar y soltar sobre un disco
     lo cambiaba y el click lo regresaba en el mismo gesto) */
  const escenario = host.querySelector('.cd-escenario');
  let x0 = null;
  escenario.addEventListener('pointerdown', (e) => { x0 = e.pointerType === 'mouse' ? null : e.clientX; });
  escenario.addEventListener('pointerup', (e) => {
    if (x0 === null) return;
    const dx = e.clientX - x0; x0 = null;
    if (Math.abs(dx) > 40) ir(foco + (dx < 0 ? 1 : -1));
  });
  escenario.addEventListener('pointercancel', () => { x0 = null; });
  escenario.addEventListener('pointerleave', () => { x0 = null; });
  escenario.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { ir(foco + 1); e.preventDefault(); }
    else if (e.key === 'ArrowLeft') { ir(foco - 1); e.preventDefault(); }
  });

  /* el aparato sigue a la música (también cuando cambia desde el dock) */
  ['play', 'pause', 'ended'].forEach((ev) => bgAudio.addEventListener(ev, sincronizar));
  bgAudio.addEventListener('loadstart', () => { if (currentSongIndex >= 0) foco = currentSongIndex; layout(); });
  bgAudio.addEventListener('loadedmetadata', tiempo);
  let visible = false;
  bgAudio.addEventListener('timeupdate', () => { if (visible) tiempo(); });
  if ('IntersectionObserver' in window) new IntersectionObserver((en) => { visible = en[0].isIntersecting; if (visible) tiempo(); }, { threshold: 0 }).observe(host);
  else visible = true;
  layout();
}
renderBandaSonora();

/* ---- service worker (Fase 5) — registra sw.js si el navegador lo soporta ---- */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    /* Firefox con almacenamiento bloqueado lanza SecurityError al leer navigator.serviceWorker */
    try { navigator.serviceWorker.register('./sw.js').catch(() => {}); } catch (e) {}
  });
}
