/* ======================================================================
   PRELOADER
====================================================================== */
const preloader = document.getElementById('preloader');
const screenGate = document.getElementById('screen-gate');
Promise.all([
  document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve(),
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
  modalBackdrop.classList.add('open');
  if (!silencioso && window.Sonidos) window.Sonidos.play('abrir');
}
function closeModal() {
  if (window.Sonidos && modalBackdrop.classList.contains('open')) window.Sonidos.play('cerrar');
  modalBackdrop.classList.remove('open');
  delete modalPanel.dataset.nav;
}
document.getElementById('modal-close').addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', (e) => { if (e.target === modalBackdrop) closeModal(); });

/* ======================================================================
   LIGHTBOX (Fase 5) — foto en grande, cierra con tap al fondo, Escape,
   o deslizando hacia abajo en móvil.
====================================================================== */
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxCloseBtn = document.getElementById('lightbox-close');
let lightboxTouchStartY = null, lightboxTouchStartX = null;
let lbGrupo = null, lbIndice = 0; // grupo de fotos navegables [{src, alt}] y la actual
const lightboxPrev = document.getElementById('lightbox-prev');
const lightboxNext = document.getElementById('lightbox-next');
const lightboxCount = document.getElementById('lightbox-count');

function pintarLightbox() {
  const f = lbGrupo ? lbGrupo[lbIndice] : null;
  if (f) { lightboxImg.src = f.src; lightboxImg.alt = f.alt || ''; }
  const varias = !!lbGrupo;
  lightboxPrev.hidden = lightboxNext.hidden = lightboxCount.hidden = !varias;
  if (varias) {
    lightboxCount.textContent = (lbIndice + 1) + ' / ' + lbGrupo.length;
    const vecina = lbGrupo[(lbIndice + 1) % lbGrupo.length];
    new Image().src = vecina.src; // la siguiente ya queda en caché
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
    lightboxImg.src = src;
    lightboxImg.alt = alt || '';
    pintarLightbox();
  }
  lightbox.classList.add('open');
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
  lightbox.classList.remove('open');
  lightboxImg.style.transform = '';
  canvasPauseReasons.delete('lightbox');
  updateCanvasPauseState();
}
lightboxCloseBtn.addEventListener('click', closeLightbox);
lightboxPrev.addEventListener('click', () => lightboxIr(-1));
lightboxNext.addEventListener('click', () => lightboxIr(1));
lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', (e) => {
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  else if (e.key === 'ArrowRight') lightboxIr(1);
  else if (e.key === 'ArrowLeft') lightboxIr(-1);
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
window.addEventListener('scroll', updateScrollProgress, { passive: true });

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
  screenSongs.classList.add('active');
});

