/* Nuestro Wrapped — slides con las cifras del chat (contenido/wrapped.js).
   Toca la tarjeta o usa "Siguiente"/"Anterior" (también flechas del
   teclado). Los números suben con una animación corta; con
   prefers-reduced-motion aparecen directo. Sin globales del script
   principal al nivel superior del archivo. */
window.JuegoWrapped = (function () {
  let mountEl = null;
  let cleanupFns = [];
  let rafId = null;

  function fmt(n) { return n.toLocaleString('es-MX'); }
  function reduced() { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }

  function countUp(el, target, suffix) {
    if (rafId) cancelAnimationFrame(rafId);
    const prefix = suffix && suffix.mas ? 'más de ' : '';
    if (reduced()) { el.textContent = prefix + fmt(target); return; }
    const start = performance.now();
    const dur = 900;
    function frame(now) {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + fmt(Math.round(target * eased));
      if (p < 1) rafId = requestAnimationFrame(frame); else rafId = null;
    }
    rafId = requestAnimationFrame(frame);
  }

  function start(mount) {
    mountEl = mount;
    const slides = window.WRAPPED || [];
    let idx = 0;

    mount.innerHTML = `
      <div class="wrapped-wrap">
        <div class="wrapped-progress" aria-hidden="true"></div>
        <div class="wrapped-card" id="wrapped-card" role="group" aria-live="polite"></div>
        <div class="wrapped-nav">
          <button type="button" class="wrapped-nav-btn" id="wrapped-prev" aria-label="Slide anterior">Anterior</button>
          <button type="button" class="wrapped-nav-btn" id="wrapped-next" aria-label="Slide siguiente">Siguiente</button>
        </div>
      </div>
    `;
    const progressEl = mount.querySelector('.wrapped-progress');
    const cardEl = mount.querySelector('#wrapped-card');
    const prevBtn = mount.querySelector('#wrapped-prev');
    const nextBtn = mount.querySelector('#wrapped-next');
    progressEl.innerHTML = slides.map(() => '<span></span>').join('');

    function barRow(nombre, valor, max, mas, color) {
      const pct = Math.max(4, Math.round((valor / max) * 100));
      return `
        <div class="wrapped-bar-row">
          <span class="wrapped-bar-name">${nombre}</span>
          <div class="wrapped-bar-track"><div class="wrapped-bar-fill" data-w="${pct}" style="background:${color};"></div></div>
          <span class="wrapped-bar-val" data-count="${valor}" data-mas="${mas ? 1 : 0}">0</span>
        </div>`;
    }

    function render() {
      const s = slides[idx];
      progressEl.querySelectorAll('span').forEach((el, i) => el.classList.toggle('done', i <= idx));
      let html = `<p class="wrapped-eyebrow">${s.eyebrow || ''}</p>`;
      if (s.tipo === 'numero') {
        html += `<p class="wrapped-big" id="wrapped-big" data-count="${s.valor}">0</p><p class="wrapped-unit">${s.unidad}</p>`;
      } else if (s.tipo === 'duo') {
        const max = Math.max(s.a.valor, s.b.valor);
        html += `<p class="wrapped-unit wrapped-title">${s.titulo}</p>`
          + barRow(s.a.nombre, s.a.valor, max, s.a.mas, '#FFD700')
          + barRow(s.b.nombre, s.b.valor, max, s.b.mas, '#C084FC');
      } else if (s.tipo === 'barras') {
        const max = Math.max(...s.items.map((it) => it.valor));
        html += s.items.map((it) => barRow(it.etiqueta + (it.nota ? ` (${it.nota})` : ''), it.valor, max, false, '#FB7185')).join('');
      } else {
        html += `<p class="wrapped-big wrapped-closing">${s.titulo}</p>`;
      }
      html += `<p class="wrapped-text">${s.texto || ''}</p>`;
      if (s.nota) html += `<p class="wrapped-note">${s.nota}</p>`;
      cardEl.innerHTML = html;

      const big = cardEl.querySelector('#wrapped-big');
      if (big) countUp(big, s.valor, { mas: s.mas });
      cardEl.querySelectorAll('.wrapped-bar-fill').forEach((el) => {
        if (reduced()) { el.style.width = el.dataset.w + '%'; }
        else requestAnimationFrame(() => requestAnimationFrame(() => { el.style.width = el.dataset.w + '%'; }));
      });
      cardEl.querySelectorAll('.wrapped-bar-val').forEach((el) => {
        const v = Number(el.dataset.count);
        el.textContent = (el.dataset.mas === '1' ? 'más de ' : '') + fmt(v);
      });
      prevBtn.disabled = idx === 0;
      nextBtn.textContent = idx === slides.length - 1 ? 'Ver de nuevo' : 'Siguiente';
      nextBtn.setAttribute('aria-label', idx === slides.length - 1 ? 'Ver de nuevo desde el inicio' : 'Slide siguiente');
    }
    function next() { idx = idx === slides.length - 1 ? 0 : idx + 1; render(); }
    function prev() { if (idx > 0) { idx--; render(); } }

    nextBtn.addEventListener('click', next);
    prevBtn.addEventListener('click', prev);
    cardEl.addEventListener('click', next);
    const onKey = (e) => {
      if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    cleanupFns.push(() => window.removeEventListener('keydown', onKey));
    render();
  }

  function stop() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    cleanupFns.splice(0).forEach((fn) => fn());
    if (mountEl) mountEl.innerHTML = '';
    mountEl = null;
  }

  return {
    id: 'wrapped',
    titulo: 'Nuestro Wrapped',
    emoji: '🌙',
    descripcion: 'Nuestras cifras del chat, en slides.',
    start,
    stop,
  };
})();
