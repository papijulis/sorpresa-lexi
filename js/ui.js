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
function openModal({ icon = 'i-corazon-lleno', title = '', body = '', bodyHTML = null }) {
  modalIcon.innerHTML = iconoHTML(icon, 'ico-xl');
  modalTitle.textContent = title;
  if (bodyHTML) modalBody.innerHTML = bodyHTML; else modalBody.textContent = body;
  modalBackdrop.classList.add('open');
}
function closeModal() { modalBackdrop.classList.remove('open'); }
document.getElementById('modal-close').addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', (e) => { if (e.target === modalBackdrop) closeModal(); });

/* ======================================================================
   LIGHTBOX (Fase 5) — foto en grande, cierra con tap al fondo, Escape,
   o deslizando hacia abajo en móvil.
====================================================================== */
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxCloseBtn = document.getElementById('lightbox-close');
let lightboxTouchStartY = null;

function openLightbox(src, alt) {
  lightboxImg.src = src;
  lightboxImg.alt = alt || '';
  lightbox.classList.add('open');
  canvasPauseReasons.add('lightbox');
  updateCanvasPauseState();
}
function closeLightbox() {
  lightbox.classList.remove('open');
  lightboxImg.style.transform = '';
  canvasPauseReasons.delete('lightbox');
  updateCanvasPauseState();
}
lightboxCloseBtn.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox();
});
lightbox.addEventListener('touchstart', (e) => { lightboxTouchStartY = e.touches[0].clientY; }, { passive: true });
lightbox.addEventListener('touchmove', (e) => {
  if (lightboxTouchStartY === null) return;
  const dy = e.touches[0].clientY - lightboxTouchStartY;
  if (dy > 0) lightboxImg.style.transform = `translateY(${dy}px)`;
}, { passive: true });
lightbox.addEventListener('touchend', (e) => {
  if (lightboxTouchStartY === null) return;
  const dy = e.changedTouches[0].clientY - lightboxTouchStartY;
  if (dy > 80) closeLightbox(); else lightboxImg.style.transform = '';
  lightboxTouchStartY = null;
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

