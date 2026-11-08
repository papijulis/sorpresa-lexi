/* ======================================================================
   PRELOADER
====================================================================== */
const preloader = document.getElementById('preloader');
const screenGate = document.getElementById('screen-gate');
Promise.all([
  /* con red lenta una fuente colgada no debe esconder la entrada: a los 4 s se sigue (swap la aplica después) */
  Promise.race([document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, 4000))]),
  new Promise((res) => setTimeout(res, 1300)),
]).then(() => {
  preloader.style.opacity = '0';
  screenGate.classList.remove('pre-hidden');
  setTimeout(() => { preloader.style.display = 'none'; }, 700);
});

/* ======================================================================
   GENERIC MODAL
====================================================================== */
const modalBackdrop = document.getElementById('app-modal');
const modalIcon = document.getElementById('modal-icon');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const modalPanel = document.getElementById('modal-panel');
/* nav:'carta' activa deslizar/flechas entre cartas del Buzón; silencioso: no repite el sonido al cambiar de carta */
function openModal({ icon = 'i-corazon-lleno', title = '', body = '', bodyHTML = null, nav = null, silencioso = false }) {
  modalIcon.innerHTML = iconoHTML(icon, 'ico-xl');
  modalTitle.textContent = title;
  if (bodyHTML) modalBody.innerHTML = bodyHTML; else modalBody.textContent = body;
  if (nav) modalPanel.dataset.nav = nav; else delete modalPanel.dataset.nav;
  const yaAbierto = modalBackdrop.classList.contains('open');
  if (!yaAbierto) modalOrigen = document.activeElement;   // a donde vuelve el foco al cerrar
  modalBackdrop.inert = false;
  modalBackdrop.classList.add('open');
  if (!yaAbierto) document.getElementById('modal-close').focus({ preventScroll: true });
  if (!silencioso && window.Sonidos) window.Sonidos.play('abrir');
}
let modalOrigen = null;
function closeModal() {
  if (!modalBackdrop.classList.contains('open')) return;
  if (window.Sonidos) window.Sonidos.play('cerrar');
  modalBackdrop.classList.remove('open');
  modalBackdrop.inert = true;
  delete modalPanel.dataset.nav;
  if (modalOrigen && modalOrigen.focus && document.contains(modalOrigen)) modalOrigen.focus({ preventScroll: true });
  modalOrigen = null;
}
document.getElementById('modal-close').addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', (e) => { if (e.target === modalBackdrop) closeModal(); });
/* Esc cierra; Tab no se sale del panel mientras está abierto */
document.addEventListener('keydown', (e) => {
  if (!modalBackdrop.classList.contains('open')) return;
  if (e.key === 'Escape') { closeModal(); e.preventDefault(); return; }
  if (e.key !== 'Tab') return;
  const f = Array.from(modalPanel.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])')).filter((x) => !x.disabled && x.offsetParent !== null);
  if (!f.length) return;
  const i = f.indexOf(document.activeElement);
  if (e.shiftKey && i <= 0) { f[f.length - 1].focus(); e.preventDefault(); }
  else if (!e.shiftKey && (i === f.length - 1 || i === -1)) { f[0].focus(); e.preventDefault(); }
});

/* ======================================================================
   LIGHTBOX (Fase 5) — foto en grande, cierra con tap al fondo, Escape,
   o deslizando hacia abajo en móvil.
====================================================================== */
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxCloseBtn = document.getElementById('lightbox-close');
let lightboxTouchStartY = null, lightboxTouchStartX = null;
let lbGrupo = null, lbIndice = 0; // grupo de fotos navegables [{src, alt}] y la actual
let lbOrigen = null; // a donde vuelve el foco al cerrar
const lightboxPrev = document.getElementById('lightbox-prev');
const lightboxNext = document.getElementById('lightbox-next');
const lightboxCount = document.getElementById('lightbox-count');
lightbox.inert = true; // cerrado: su botón no se enfoca ni lo leen los lectores de pantalla

/* el visor usa la misma .webp que ya mostró la tarjeta (pictureHTML); si no carga, el .jpeg */
function ponerFotoLightbox(src) {
  const webp = src.replace(/\.jpe?g$/i, '.webp');
  if (webp === src) { lightboxImg.onerror = null; lightboxImg.src = src; return; }
  lightboxImg.onerror = function () {
    lightboxImg.onerror = null;
    if (lightboxImg.getAttribute('src') === webp) lightboxImg.src = src;
  };
  lightboxImg.src = webp;
}
function pintarLightbox() {
  const f = lbGrupo ? lbGrupo[lbIndice] : null;
  if (f) { ponerFotoLightbox(f.src); lightboxImg.alt = f.alt || ''; }
  const varias = !!lbGrupo;
  lightboxPrev.hidden = lightboxNext.hidden = lightboxCount.hidden = !varias;
  if (varias) {
    lightboxCount.textContent = (lbIndice + 1) + ' / ' + lbGrupo.length;
    const vecina = lbGrupo[(lbIndice + 1) % lbGrupo.length];
    new Image().src = vecina.src.replace(/\.jpe?g$/i, '.webp'); // la siguiente ya queda en caché
  }
}
/* grupo (opcional): arreglo de { src, caption|alt } para navegar con flechas, teclas y deslizando */
function openLightbox(src, alt, grupo, indice) {
  if (grupo && grupo.length > 1) {
    lbGrupo = grupo.map((g) => ({ src: g.src, alt: g.alt || g.caption || '' }));
    lbIndice = Math.max(0, Math.min(grupo.length - 1, indice || 0));
    pintarLightbox();
  } else {
    lbGrupo = null;
    ponerFotoLightbox(src);
    lightboxImg.alt = alt || '';
    pintarLightbox();
  }
  const yaAbierto = lightbox.classList.contains('open');
  if (!yaAbierto) lbOrigen = document.activeElement;
  lightbox.inert = false;
  lightbox.classList.add('open');
  if (!yaAbierto) lightboxCloseBtn.focus({ preventScroll: true });
  canvasPauseReasons.add('lightbox');
  updateCanvasPauseState();
}
function lightboxIr(d) {
  if (!lbGrupo) return;
  lbIndice = (lbIndice + d + lbGrupo.length) % lbGrupo.length;
  lightboxImg.classList.remove('lb-cambia'); void lightboxImg.offsetWidth; lightboxImg.classList.add('lb-cambia');
  pintarLightbox();
  if (window.Sonidos) window.Sonidos.play('mes');
}
function closeLightbox() {
  if (!lightbox.classList.contains('open')) return;
  lightbox.classList.remove('open');
  lightbox.inert = true;
  lightboxImg.style.transform = '';
  canvasPauseReasons.delete('lightbox');
  updateCanvasPauseState();
  if (lbOrigen && lbOrigen.focus && document.contains(lbOrigen)) lbOrigen.focus({ preventScroll: true });
  lbOrigen = null;
}
lightboxCloseBtn.addEventListener('click', closeLightbox);
lightboxPrev.addEventListener('click', () => lightboxIr(-1));
lightboxNext.addEventListener('click', () => lightboxIr(1));
lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', (e) => {
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'Escape') { closeLightbox(); e.preventDefault(); }
  else if (e.key === 'ArrowRight') lightboxIr(1);
  else if (e.key === 'ArrowLeft') lightboxIr(-1);
  else if (e.key === 'Tab') {   // Tab no se sale del visor mientras está abierto
    const f = Array.from(lightbox.querySelectorAll('button')).filter((x) => !x.hidden && !x.disabled && x.offsetParent !== null);
    if (!f.length) return;
    const i = f.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { f[f.length - 1].focus(); e.preventDefault(); }
    else if (!e.shiftKey && (i === f.length - 1 || i === -1)) { f[0].focus(); e.preventDefault(); }
  }
});
lightbox.addEventListener('touchstart', (e) => { lightboxTouchStartY = e.touches[0].clientY; lightboxTouchStartX = e.touches[0].clientX; }, { passive: true });
lightbox.addEventListener('touchmove', (e) => {
  if (lightboxTouchStartY === null) return;
  const dy = e.touches[0].clientY - lightboxTouchStartY;
  const dx = e.touches[0].clientX - lightboxTouchStartX;
  if (dy > 0 && Math.abs(dy) > Math.abs(dx)) lightboxImg.style.transform = `translateY(${dy}px)`;
}, { passive: true });
lightbox.addEventListener('touchend', (e) => {
  if (lightboxTouchStartY === null) return;
  const dy = e.changedTouches[0].clientY - lightboxTouchStartY;
  const dx = e.changedTouches[0].clientX - lightboxTouchStartX;
  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) { lightboxImg.style.transform = ''; lightboxIr(dx < 0 ? 1 : -1); }
  else if (dy > 80) closeLightbox();
  else lightboxImg.style.transform = '';
  lightboxTouchStartY = null; lightboxTouchStartX = null;
});

/* ======================================================================
   TOAST
====================================================================== */
let toastTimer = null;
function showToast(text) {
  const toast = document.getElementById('toast');
  toast.innerHTML = `<div class="glass glow-gold rounded-2xl px-6 py-4 font-hand text-lg sm:text-xl text-gold toast-in">${iconizar(text)}</div>`;
  toast.style.opacity = '1';
  toast.style.pointerEvents = 'auto';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.style.transition = 'opacity 0.6s ease';
    toast.style.opacity = '0';
    toast.style.pointerEvents = 'none';
  }, 6000);
}

/* ======================================================================
   SCROLL PROGRESS
====================================================================== */
const scrollFill = document.getElementById('scroll-progress-fill');
const scrollHeart = document.getElementById('scroll-heart');
let scrollMaxCache = 0;
function measureScrollMax() {
  scrollMaxCache = document.documentElement.scrollHeight - document.documentElement.clientHeight;
}
function updateScrollProgress() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const pct = scrollMaxCache > 0 ? clamp((scrollTop / scrollMaxCache) * 100, 0, 100) : 0;
  scrollFill.style.width = pct + '%';
  scrollHeart.style.left = pct + '%';
}
measureScrollMax();
window.addEventListener('resize', measureScrollMax);
window.addEventListener('load', measureScrollMax);
setTimeout(measureScrollMax, 1500);
/* el alto cambia al abrir meses de la línea del tiempo, con las cartas del final, etc. */
if ('ResizeObserver' in window) { let rq = 0; new ResizeObserver(() => { clearTimeout(rq); rq = setTimeout(() => { measureScrollMax(); updateScrollProgress(); }, 120); }).observe(document.body); }
let ultimoScrollProgreso = -1;
Motor.suscribir((E) => { if (E.y !== ultimoScrollProgreso) { ultimoScrollProgreso = E.y; updateScrollProgress(); } });

/* ======================================================================
   SCROLL REVEAL (IntersectionObserver)
====================================================================== */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0, rootMargin: '0px 0px -12% 0px' });
document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

/* ======================================================================
   GATEKEEPER — "¿Me amas?"
====================================================================== */
const screenSongs = document.getElementById('screen-songs');
const btnSi = document.getElementById('btn-si');
const btnNo = document.getElementById('btn-no');
const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;

function ensureNoButtonFixed() {
  if (btnNo.dataset.fixedPos === '1') return;
  const rect = btnNo.getBoundingClientRect();
  btnNo.style.position = 'fixed';
  btnNo.style.left = rect.left + 'px';
  btnNo.style.top = rect.top + 'px';
  btnNo.style.right = 'auto';
  btnNo.style.margin = '0';
  btnNo.dataset.fixedPos = '1';
  // force layout so the browser commits the snapped starting position
  // before any subsequent left/top change is animated by the transition
  void btnNo.offsetWidth;
}
function moveNoButtonRandomly() {
  ensureNoButtonFixed();
  const pad = 60;
  const w = btnNo.offsetWidth || 90;
  const h = btnNo.offsetHeight || 48;
  const x = rand(pad, vw - pad - w);
  const y = rand(pad, vh - pad - h);
  requestAnimationFrame(() => {
    btnNo.style.left = x + 'px';
    btnNo.style.top = y + 'px';
  });
}
if (!isCoarsePointer) {
  btnNo.addEventListener('mouseenter', moveNoButtonRandomly);
} else {
  const evadeNo = () => {
    btnNo.classList.add('shake-anim');
    setTimeout(() => { btnNo.style.opacity = '0'; btnNo.style.pointerEvents = 'none'; }, 550);
  };
  btnNo.addEventListener('touchstart', evadeNo, { passive: true });
  btnNo.addEventListener('click', evadeNo);
}

btnSi.addEventListener('click', () => {
  const rect = btnSi.getBoundingClientRect();
  spawnSparkleBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 90);
  screenGate.classList.add('screen-out');
  setTimeout(() => { screenGate.style.display = 'none'; }, 850);
  screenSongs.removeAttribute('inert');
  screenSongs.classList.add('active');
});

