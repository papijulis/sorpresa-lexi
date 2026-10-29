/* ======================================================================
   NAVEGACIÓN INTEGRADA (punto 9 del rediseño)
   • Cielo de tres estados (día · atardecer · noche): reemplaza al botón
     de atardecer y al cielo nocturno automático. Al abrir, sigue la hora
     de Ciudad de México; después Lexi lo cambia con el dock o con la
     escena "El cielo" de Caminos del jardín.
   • Caminos del jardín: las escenas llevan a Buzón y Juegos, controlan la
     música y el cielo.
   • Nota flotante "Sonando: …" sobre el dock al cambiar de canción.
   Carga después de extras.js (usa mexicoCityHour y applyNightMode).
====================================================================== */
const CIELOS = ['dia', 'atardecer', 'noche'];
const CIELO_ETIQUETA = { dia: 'Día', atardecer: 'Atardecer', noche: 'Noche' };
let cieloActual = 'dia';
const THEME_COLOR = { dia: '#18062B', atardecer: '#5C182B', noche: '#0B1130' };

function cieloAutomatico() {
  const h = mexicoCityHour();
  return (h >= 20 || h < 6) ? 'noche' : 'dia';
}

function actualizarCieloUI() {
  const etq = CIELO_ETIQUETA[cieloActual];
  const boton = document.getElementById('sunset-toggle');
  boton.setAttribute('aria-label', `Cielo: ${etq.toLowerCase()}. Toca para cambiar`);
  document.getElementById('cielo-etiqueta').textContent = etq;
  document.getElementById('escena-cielo').setAttribute('data-cielo', cieloActual);
  document.querySelectorAll('#camino-cielo-botones [data-cielo]').forEach((b) => {
    b.setAttribute('aria-pressed', b.dataset.cielo === cieloActual ? 'true' : 'false');
  });
}

function setCielo(estado, silencioso) {
  if (!CIELOS.includes(estado)) return;
  const eraAtardecer = isSunset, eraNoche = isNight;
  cieloActual = estado;
  isSunset = estado === 'atardecer';
  isNight = estado === 'noche';
  document.body.classList.toggle('sunset-mode', isSunset);
  document.body.classList.toggle('night-mode', isNight);
  /* en <html>: así los tokens de color (tokens.css) cambian de paleta con el cielo */
  document.documentElement.dataset.cielo = estado;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', THEME_COLOR[estado]);
  if (isNight) applyNightMode();
  if (eraAtardecer !== isSunset || eraNoche !== isNight) particles = [];
  if (!isSunset && !isNight) fireflies = [];
  if (!isSunset) birds = [];
  actualizarCieloUI();
  if (window.Portada) window.Portada.actualizar(estado);
  if (!silencioso && estado === 'atardecer') showToast(SUNSET_TOAST_TEXT);
}

document.getElementById('sunset-toggle').addEventListener('click', () => {
  setCielo(CIELOS[(CIELOS.indexOf(cieloActual) + 1) % CIELOS.length]);
});
document.getElementById('camino-cielo-botones').addEventListener('click', (e) => {
  const b = e.target.closest('[data-cielo]');
  if (b) setCielo(b.dataset.cielo);
});
setCielo(cieloAutomatico(), true);

/* ---- estrella fugaz: de vez en cuando cruza el cielo de noche ---- */
const SIN_MOVIMIENTO = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function lanzarFugaz() {
  const el = document.querySelector('.night-fugaz');
  if (!el || !isNight || document.hidden || canvasPauseReasons.size || SIN_MOVIMIENTO) return;
  el.style.top = rand(4, 34).toFixed(1) + '%';
  el.style.left = rand(40, 92).toFixed(1) + '%';
  el.classList.remove('go');
  void el.offsetWidth;
  el.classList.add('go');
}
setInterval(() => { if (Math.random() < 0.65) lanzarFugaz(); }, 8000);

/* ---- Caminos: Buzón y Juegos ---- */
document.getElementById('camino-buzon').addEventListener('click', openBuzonView);
document.getElementById('camino-juegos').addEventListener('click', openJuegosView);

/* ---- Caminos: tocadiscos (misma música que el dock) ---- */
const caminoPlay = document.getElementById('camino-musica-play');
const caminoSub = document.getElementById('camino-musica-sub');
const escenaTocadiscos = document.getElementById('escena-tocadiscos');
const dockNotaEl = document.getElementById('dock-nota');
let dockNotaTimer = 0;

function sincronizarMusica() {
  const suena = !bgAudio.paused;
  caminoPlay.setAttribute('aria-pressed', suena ? 'true' : 'false');
  caminoPlay.innerHTML = ico(suena ? 'i-pausa' : 'i-play');
  escenaTocadiscos.classList.toggle('sonando', suena);
  caminoSub.textContent = currentSongIndex >= 0 ? SONGS[currentSongIndex].title : 'Nuestro soundtrack';
}
function notaDeDock(texto) {
  dockNotaEl.textContent = texto;
  dockNotaEl.classList.add('on');
  clearTimeout(dockNotaTimer);
  dockNotaTimer = setTimeout(() => dockNotaEl.classList.remove('on'), 3200);
}
caminoPlay.addEventListener('click', () => miniToggle.click());
document.getElementById('camino-musica-next').addEventListener('click', () => miniNext.click());
['play', 'pause', 'loadstart'].forEach((ev) => bgAudio.addEventListener(ev, sincronizarMusica));
bgAudio.addEventListener('loadstart', () => {
  if (currentSongIndex >= 0) notaDeDock('Sonando: ' + SONGS[currentSongIndex].title);
});
sincronizarMusica();
