/* ======================================================================
   FECHA "HOY" — America/Mexico_City, con override ?fecha=YYYY-MM-DD
   (documentado en CLAUDE.md; ignorado si no se pasa, nunca afecta a Lexi
   salvo que ella misma ponga el parámetro en la URL).
====================================================================== */
function mexicoCityDateString(date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date);
}
const URL_FECHA_OVERRIDE = (() => {
  const raw = new URLSearchParams(location.search).get('fecha');
  return raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
})();
function getTodayDateString() {
  return URL_FECHA_OVERRIDE || mexicoCityDateString(new Date());
}
function daysBetween(dateStrA, dateStrB) {
  const a = new Date(dateStrA + 'T00:00:00');
  const b = new Date(dateStrB + 'T00:00:00');
  return Math.round((b - a) / 86400000);
}
function dayOfYear(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const start = new Date(d.getFullYear(), 0, 1);
  return Math.floor((d - start) / 86400000);
}

/* ======================================================================
   EL BUZÓN — sobres con fecha de apertura, mesiversarios, abre-cuando,
   cápsulas del tiempo
====================================================================== */
const BUZON_STORAGE_KEY = 'jardin.buzon.v1';
const TIPO_META = {
  mesiversario: { icon: '🌙', color: '#FFD700' },
  'abre-cuando': { icon: '💌', color: '#FB7185' },
  capsula: { icon: '⏳', color: '#A855F7' },
  sorpresa: { icon: '🎁', color: '#F59E0B' },
};
const SELLO_META = { lirio: '🌼', corazon: '❤️', estrella: '⭐' };

function loadBuzonState() {
  const raw = jardinStorage.get(BUZON_STORAGE_KEY);
  if (!raw) return { leidas: [] };
  try {
    const parsed = JSON.parse(raw);
    return { leidas: Array.isArray(parsed.leidas) ? parsed.leidas : [] };
  } catch (e) {
    return { leidas: [] };
  }
}
function saveBuzonState() { jardinStorage.set(BUZON_STORAGE_KEY, JSON.stringify(buzonState)); }
let buzonState = loadBuzonState();

function cartaIsOpenable(carta) {
  if (carta.desbloqueaCon) {
    try {
      const raw = jardinStorage.get(`jardin.${carta.desbloqueaCon}.v1`);
      return !!(raw && JSON.parse(raw).completada);
    } catch (e) {
      return false;
    }
  }
  return getTodayDateString() >= carta.apertura;
}

const viewBuzon = document.getElementById('view-buzon');
const buzonGrid = document.getElementById('buzon-grid');
const buzonDot = document.getElementById('buzon-dot');
const buzonToggleBtn = document.getElementById('buzon-toggle');
const buzonCloseBtn = document.getElementById('buzon-close');

function updateBuzonDot() {
  const hasUnread = window.CARTAS.some((c) => cartaIsOpenable(c) && !buzonState.leidas.includes(c.id));
  buzonDot.classList.toggle('hidden', !hasUnread);
}

function showCartaModal(carta) {
  const meta = TIPO_META[carta.tipo] || TIPO_META.sorpresa;
  let html = `<div class="letter-detail-text font-hand text-lg sm:text-xl leading-relaxed">${carta.texto}</div>`;
  if (carta.foto) {
    html += pictureHTML(carta.foto, '', 'style="width:100%;max-height:260px;object-fit:cover;border-radius:14px;margin-top:16px;box-shadow:0 14px 30px rgba(0,0,0,.45);"');
  }
  if (carta.cancion) {
    html += `<button id="carta-play-song" class="font-ui text-xs mt-4 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors" style="color:${meta.color};">🎵 Escuchar «${carta.cancion}»</button>`;
  }
  if (window.NOTA_CARTA) {
    html += `<p class="font-hand text-sm mt-5" style="color:rgba(253,251,247,.55);">${window.NOTA_CARTA}</p>`;
  }
  openModal({ icon: meta.icon, title: carta.titulo, bodyHTML: html });
  if (carta.cancion) {
    const btn = document.getElementById('carta-play-song');
    if (btn) btn.addEventListener('click', () => playDedicatedSong(carta.cancion));
  }
}

function openCarta(carta, cardEl) {
  cardEl.classList.add('cracking');
  if (!buzonState.leidas.includes(carta.id)) {
    buzonState.leidas.push(carta.id);
    saveBuzonState();
  }
  setTimeout(() => {
    showCartaModal(carta);
    renderBuzon();
  }, 420);
}

function renderBuzon() {
  const today = getTodayDateString();
  buzonGrid.innerHTML = '';
  window.CARTAS.forEach((carta) => {
    const openable = cartaIsOpenable(carta);
    const meta = TIPO_META[carta.tipo] || TIPO_META.sorpresa;
    const sealEmoji = SELLO_META[carta.sello] || '💛';
    const leida = buzonState.leidas.includes(carta.id);

    const card = document.createElement('div');
    card.className = 'buzon-envelope' + (openable ? '' : ' is-locked');
    card.dataset.id = carta.id;

    let subText;
    if (!openable && carta.desbloqueaCon) {
      subText = carta.pista || 'se desbloquea jugando';
    } else if (!openable) {
      const dias = daysBetween(today, carta.apertura);
      subText = dias <= 1 ? 'se abre mañana' : `se abre en ${dias} días`;
    } else {
      subText = leida ? 'leída ✓' : 'toca para abrir';
    }

    card.innerHTML = `
      <div class="buzon-seal" style="background:${meta.color}22;border:1.5px solid ${meta.color}66;">${openable ? sealEmoji : '🔒'}</div>
      <p class="font-display text-sm sm:text-base text-parchment">${carta.titulo}</p>
      <p class="font-ui text-[11px] sm:text-xs text-parchment/50 mt-1">${subText}</p>
      ${openable && !leida ? '<span class="buzon-unread-dot"></span>' : ''}
    `;
    card.addEventListener('click', () => {
      if (openable) {
        openCarta(carta, card);
      } else if (carta.desbloqueaCon === 'caceria') {
        showToast('Esta carta se desbloquea encontrando los 12 corazones escondidos por el sitio 💛');
      } else if (carta.desbloqueaCon) {
        showToast('Esta carta se desbloquea en el Rincón de Juegos 💛');
      } else {
        showToast(`Esta carta se abre el ${carta.apertura.split('-').reverse().join('/')}`);
      }
    });
    buzonGrid.appendChild(card);
  });
  updateBuzonDot();
}

function openBuzonView() {
  renderBuzon();
  viewBuzon.classList.add('open');
  history.replaceState(null, '', '#buzon');
  canvasPauseReasons.add('buzon');
  updateCanvasPauseState();
}
function closeBuzonView() {
  viewBuzon.classList.remove('open');
  if (location.hash === '#buzon') history.replaceState(null, '', location.pathname + location.search);
  canvasPauseReasons.delete('buzon');
  updateCanvasPauseState();
}
buzonToggleBtn.addEventListener('click', openBuzonView);
buzonCloseBtn.addEventListener('click', closeBuzonView);
updateBuzonDot();
if (location.hash === '#buzon') openBuzonView();

/* ======================================================================
   PRÓXIMO MESIVERSARIO — tarjeta en el Jardín + celebración el día 28
====================================================================== */
const mesiversarioCard = document.getElementById('mesiversario-card');
const mesiversarioIcon = document.getElementById('mesiversario-icon');
const mesiversarioTitle = document.getElementById('mesiversario-title');
const mesiversarioBody = document.getElementById('mesiversario-body');

function nextMesiversarioDate(todayStr) {
  const [y, m, d] = todayStr.split('-').map(Number);
  let year = y, month = m;
  if (d > 28) { month += 1; if (month > 12) { month = 1; year += 1; } }
  return `${year}-${pad2(month)}-28`;
}

function renderMesiversarioCard() {
  const today = getTodayDateString();
  const day = Number(today.slice(8, 10));
  const todaysMesiversario = window.CARTAS.find((c) => c.tipo === 'mesiversario' && c.apertura === today);

  if (day === 28 && todaysMesiversario) {
    mesiversarioIcon.textContent = '🎉';
    mesiversarioTitle.textContent = '¡Nueva carta de mesiversario!';
    mesiversarioBody.textContent = `«${todaysMesiversario.titulo}» te espera en el Buzón`;
    mesiversarioCard.onclick = openBuzonView;
    return;
  }
  if (day === 28) {
    const banco = (window.FRASES && window.FRASES.length) ? window.FRASES : [{ texto: 'Hoy es 28, y aunque no hay carta nueva, aquí sigo, queriéndote igual.' }];
    const frase = banco[dayOfYear(today) % banco.length];
    mesiversarioIcon.textContent = '💛';
    mesiversarioTitle.textContent = 'Hoy es 28';
    mesiversarioBody.textContent = frase.texto;
    mesiversarioCard.onclick = null;
    return;
  }
  const next = nextMesiversarioDate(today);
  const dias = daysBetween(today, next);
  mesiversarioIcon.textContent = '🌙';
  mesiversarioTitle.textContent = 'Próximo mesiversario';
  mesiversarioBody.textContent = dias <= 1 ? 'Es mañana' : `Faltan ${dias} días`;
  mesiversarioCard.onclick = openBuzonView;
}
renderMesiversarioCard();

function celebrateMesiversarioIfNeeded() {
  const today = getTodayDateString();
  if (Number(today.slice(8, 10)) !== 28) return;
  const key = 'jardin.mesiversario.celebrado.' + today;
  if (jardinStorage.get(key)) return;
  jardinStorage.set(key, '1');
  setTimeout(() => {
    showToast('¡Feliz mesiversario, Lexi! 💛');
    spawnSparkleBurst(vw / 2, vh * 0.3, 70, true);
    spawnBokeh(vw / 2, vh * 0.35, 6);
  }, 1800);
}

/* ======================================================================
   RINCÓN DE JUEGOS — harness: abre/cierra la vista, monta y desmonta
   cada juego (js/juegos/*.js). Cacería de corazones es distinta: vive
   siempre activa en el Jardín (JuegoCaceria.init()), aquí solo se
   muestra su progreso.
====================================================================== */
const JUEGOS_JUGABLES = [window.JuegoCupones, window.JuegoMemorama, window.JuegoLluviaLirios, window.JuegoConstelacion, window.JuegoCurame].filter(Boolean);

const viewJuegos = document.getElementById('view-juegos');
const juegosToggleBtn = document.getElementById('juegos-toggle');
const juegosCloseBtn = document.getElementById('juegos-close');
const juegosDot = document.getElementById('juegos-dot');
const juegosGridEl = document.getElementById('juegos-grid');
const juegoStage = document.getElementById('juego-stage');
const juegoMount = document.getElementById('juego-mount');
const juegoExitBtn = document.getElementById('juego-exit');
const juegosHeaderTitle = document.getElementById('juegos-header-title');
const juegosIntro = document.getElementById('juegos-intro');

let activeJuego = null;

function renderJuegosGrid() {
  juegosGridEl.innerHTML = '';
  JUEGOS_JUGABLES.forEach((juego) => {
    const card = document.createElement('div');
    card.className = 'juego-card glass rounded-3xl';
    card.innerHTML = `
      <span class="juego-card-emoji">${juego.emoji}</span>
      <p class="font-display text-lg text-parchment">${juego.titulo}</p>
      <p class="font-ui text-xs" style="color:rgba(253,251,247,.6);">${juego.descripcion}</p>
      ${juego.progressLabel ? `<p class="juego-card-progress">${juego.progressLabel()}</p>` : ''}
    `;
    card.addEventListener('click', () => launchJuego(juego));
    juegosGridEl.appendChild(card);
  });

  if (window.JuegoCaceria) {
    const card = document.createElement('div');
    card.className = 'juego-card glass rounded-3xl';
    card.innerHTML = `
      <span class="juego-card-emoji">${window.JuegoCaceria.emoji}</span>
      <p class="font-display text-lg text-parchment">${window.JuegoCaceria.titulo}</p>
      <p class="font-ui text-xs" style="color:rgba(253,251,247,.6);">${window.JuegoCaceria.descripcion}</p>
      <p class="juego-card-progress">${window.JuegoCaceria.progressLabel()}</p>
    `;
    card.addEventListener('click', () => {
      showToast(`Corazones encontrados: ${window.JuegoCaceria.progressLabel()}. Están casi invisibles por todo el sitio — fíjate bien.`);
    });
    juegosGridEl.appendChild(card);
  }
}

function launchJuego(juego) {
  activeJuego = juego;
  juegoStage.dataset.portrait = ['lluvia-lirios', 'constelacion', 'curame'].includes(juego.id) ? '1' : '0';
  juegosGridEl.classList.add('hidden');
  juegosHeaderTitle.textContent = juego.titulo;
  juegosIntro.classList.add('hidden');
  juegoStage.classList.remove('hidden');
  juego.start(juegoMount);
}
function exitJuego() {
  if (activeJuego) { activeJuego.stop(); activeJuego = null; }
  juegoStage.classList.add('hidden');
  juegosHeaderTitle.textContent = 'Rincón de Juegos';
  juegosIntro.classList.remove('hidden');
  juegosGridEl.classList.remove('hidden');
  renderJuegosGrid();
}
juegoExitBtn.addEventListener('click', exitJuego);

function openJuegosView() {
  renderJuegosGrid();
  viewJuegos.classList.add('open');
  history.replaceState(null, '', '#juegos');
  canvasPauseReasons.add('juegos');
  updateCanvasPauseState();
}
function closeJuegosView() {
  exitJuego();
  viewJuegos.classList.remove('open');
  canvasPauseReasons.delete('juegos');
  updateCanvasPauseState();
  if (location.hash === '#juegos') history.replaceState(null, '', location.pathname + location.search);
}
juegosToggleBtn.addEventListener('click', openJuegosView);
juegosCloseBtn.addEventListener('click', closeJuegosView);
if (location.hash === '#juegos') openJuegosView();

function updateJuegosDot() {
  if (!window.JuegoCaceria || !juegosDot) return;
  const found = window.JuegoCaceria.progressLabel().split(' ')[0];
  juegosDot.classList.toggle('hidden', found === '12');
}

if (window.JuegoCaceria) {
  window.JuegoCaceria.init();
  updateJuegosDot();
  // Re-check periodically instead of patching internals — cheap (every 4s),
  // and only runs while the page is open, not inside the render loop.
  setInterval(updateJuegosDot, 4000);
}

