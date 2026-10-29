/* Cupones para raspar — capa de canvas que se "rasca" con el dedo o el
   mouse hasta revelar el cupón. Usa helpers globales de index.html:
   jardinStorage, showToast y window.CUPONES / window.NOTA_CUPON. Todo lo
   que toca esos globales vive dentro
   de funciones, nunca en el nivel superior del archivo, para no importar
   si este script carga antes que el inline principal. */
window.JuegoCupones = (function () {
  const STORAGE_KEY = 'jardin.cupones.v1';
  let state = null;
  let mountEl = null;
  let cleanupFns = [];

  function loadState() {
    try {
      const raw = jardinStorage.get(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return {
        revelados: Array.isArray(parsed.revelados) ? parsed.revelados : [],
        canjeados: Array.isArray(parsed.canjeados) ? parsed.canjeados : [],
      };
    } catch (e) {
      return { revelados: [], canjeados: [] };
    }
  }
  function saveState() { jardinStorage.set(STORAGE_KEY, JSON.stringify(state)); }

  function setupScratch(canvas, onCleared) {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    let cleared = false;

    function paint() {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      const grad = ctx.createLinearGradient(0, 0, rect.width, rect.height);
      grad.addColorStop(0, '#B45309');
      grad.addColorStop(1, '#7E22CE');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, rect.width, rect.height);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = "600 12px 'Inter', sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('raspa aquí', rect.width / 2, rect.height / 2);
    }
    paint();

    const resizeObserver = new ResizeObserver(() => { if (!cleared) paint(); });
    resizeObserver.observe(canvas);

    function scratchAt(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(clientX - rect.left, clientY - rect.top, 22, 0, Math.PI * 2);
      ctx.fill();
    }

    function clearedFraction() {
      const cols = 8, rows = 8;
      let count = 0;
      const w = Math.max(1, canvas.width), h = Math.max(1, canvas.height);
      const data = ctx.getImageData(0, 0, w, h).data;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const px = Math.min(w - 1, Math.floor(((c + 0.5) / cols) * w));
          const py = Math.min(h - 1, Math.floor(((r + 0.5) / rows) * h));
          const alphaIdx = (py * w + px) * 4 + 3;
          if (data[alphaIdx] < 80) count++;
        }
      }
      return count / (cols * rows);
    }

    let dragging = false;
    let frameQueued = false;
    function handleMove(clientX, clientY) {
      scratchAt(clientX, clientY);
      if (frameQueued) return;
      frameQueued = true;
      requestAnimationFrame(() => {
        frameQueued = false;
        if (!cleared && clearedFraction() > 0.55) {
          cleared = true;
          if (window.Acierto) window.Acierto('exito');
          canvas.classList.add('cleared');
          resizeObserver.disconnect();
          onCleared();
        }
      });
    }
    function onPointerDown(e) { dragging = true; handleMove(e.clientX, e.clientY); }
    function onPointerMove(e) { if (dragging) handleMove(e.clientX, e.clientY); }
    function onPointerUp() { dragging = false; }

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    return function cleanup() {
      resizeObserver.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }

  function addRedeemUI(reveal, cupon) {
    if (state.canjeados.includes(cupon.id)) {
      const tag = document.createElement('p');
      tag.className = 'cupon-redeemed-tag';
      tag.textContent = 'Aceptado';
      reveal.appendChild(tag);
      return;
    }
    const btn = document.createElement('button');
    btn.className = 'cupon-redeem-btn btn-brillo';
    btn.textContent = 'Acepto';
    btn.setAttribute('aria-label', `Aceptar el cupón ${cupon.titulo}`);
    btn.addEventListener('click', () => {
      if (!state.canjeados.includes(cupon.id)) { state.canjeados.push(cupon.id); saveState(); }
      btn.textContent = 'Aceptado';
      btn.disabled = true;
      if (typeof showToast === 'function' && window.NOTA_CUPON) showToast(window.NOTA_CUPON);
    });
    reveal.appendChild(btn);
  }

  function renderCard(cupon) {
    const card = document.createElement('div');
    card.className = 'cupon-card glass';

    const reveal = document.createElement('div');
    reveal.className = 'cupon-reveal';
    reveal.innerHTML = `
      <span class="cupon-emoji">${iconoHTML(cupon.icono || cupon.emoji, 'ico-xl')}</span>
      <p class="font-display text-sm" style="color:#FDFBF7;">${cupon.titulo}</p>
      <p class="font-ui text-[11px]" style="color:rgba(253,251,247,.6);">${cupon.descripcion}</p>
    `;
    card.appendChild(reveal);

    if (state.revelados.includes(cupon.id)) {
      addRedeemUI(reveal, cupon);
    } else {
      const canvas = document.createElement('canvas');
      canvas.className = 'cupon-scratch-canvas';
      card.appendChild(canvas);
      const cleanup = setupScratch(canvas, () => {
        if (!state.revelados.includes(cupon.id)) { state.revelados.push(cupon.id); saveState(); }
        addRedeemUI(reveal, cupon);
        setTimeout(() => canvas.remove(), 550);
      });
      cleanupFns.push(cleanup);
    }
    return card;
  }

  function start(mount) {
    state = loadState();
    mountEl = mount;
    mount.innerHTML = '<div class="cupon-grid"></div>';
    const grid = mount.querySelector('.cupon-grid');
    (window.CUPONES || []).forEach((c) => grid.appendChild(renderCard(c)));
  }

  function stop() {
    cleanupFns.splice(0).forEach((fn) => fn());
    if (mountEl) mountEl.innerHTML = '';
    mountEl = null;
  }

  return {
    id: 'cupones',
    titulo: 'Cupones para raspar',
    icono: 'i-cupon',
    descripcion: 'Raspa cada tarjeta y descubre tu premio.',
    progressLabel() {
      const s = loadState();
      const total = (window.CUPONES || []).length;
      return `${s.revelados.length} de ${total} raspados`;
    },
    start,
    stop,
  };
})();
