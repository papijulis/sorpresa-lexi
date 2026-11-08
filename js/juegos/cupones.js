/* Cupones para raspar — capa de canvas que se "rasca" con el dedo o el
   mouse hasta revelar el cupón. Usa helpers globales de los scripts principales
   (nucleo.js, ui.js…):
   jardinStorage, showToast y window.CUPONES / window.NOTA_CUPON. Todo lo
   que toca esos globales vive dentro
   de funciones, nunca en el nivel superior del archivo, para no importar
   aunque este script cargue antes que ellos. */
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

    function revelar(porTeclado) {
      if (cleared) return;
      cleared = true;
      if (window.Acierto) window.Acierto('exito');
      canvas.classList.add('cleared');
      canvas.tabIndex = -1;
      canvas.setAttribute('aria-hidden', 'true');
      resizeObserver.disconnect();
      onCleared(porTeclado === true);
    }

    let dragging = false;
    let frameQueued = false;
    let ultimaRevision = 0;
    let pendiente = false;   // hubo raspado desde la última revisión
    /* leer el lienzo completo cuesta: se revisa a lo más cada 120 ms mientras
       se raspa, y una vez más al soltar */
    function revisar() {
      if (cleared || !pendiente) return;
      ultimaRevision = performance.now();
      pendiente = false;
      if (clearedFraction() > 0.55) revelar(false);
    }
    function handleMove(clientX, clientY) {
      scratchAt(clientX, clientY);
      pendiente = true;
      if (frameQueued) return;
      frameQueued = true;
      requestAnimationFrame(() => {
        frameQueued = false;
        if (performance.now() - ultimaRevision < 120) return;
        revisar();
      });
    }
    function onPointerDown(e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;   // solo el botón principal raspa
      dragging = true;
      handleMove(e.clientX, e.clientY);
    }
    function onPointerMove(e) {
      if (!dragging) return;
      // soltó el mouse fuera de la ventana o perdió el foco: deja de raspar
      if (e.pointerType === 'mouse' && !(e.buttons & 1)) { dragging = false; revisar(); return; }
      handleMove(e.clientX, e.clientY);
    }
    // pointerup se escucha en window por cada tarjeta: solo revisa la que se estaba raspando
    function onPointerUp() {
      if (!dragging) return;
      dragging = false;
      revisar();
    }
    // teclado / switch: Enter o Espacio revela el cupón
    function onKeyDown(e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      revelar(true);
    }

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('keydown', onKeyDown);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    return function cleanup() {
      resizeObserver.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
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
    /* en pausa los cupones se raspan y se leen, pero ya no se canjean */
    if (window.EN_PAUSA) {
      const tag = document.createElement('p');
      tag.className = 'cupon-redeemed-tag';
      tag.textContent = (window.PAUSA && window.PAUSA.cupon) || 'guardado';
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
      canvas.tabIndex = 0;
      canvas.setAttribute('role', 'button');
      canvas.setAttribute('aria-label', 'Raspar el cupón ' + cupon.titulo);
      card.appendChild(canvas);
      const cleanup = setupScratch(canvas, (porTeclado) => {
        if (!state.revelados.includes(cupon.id)) { state.revelados.push(cupon.id); saveState(); }
        addRedeemUI(reveal, cupon);
        if (porTeclado) {
          // el lienzo se quita en 550 ms: el foco pasa al botón "Acepto" (o al cupón, en pausa)
          const destino = reveal.querySelector('button:not([disabled])') || reveal;
          if (destino === reveal) reveal.tabIndex = -1;
          try { destino.focus({ preventScroll: true }); } catch (e) { destino.focus(); }
        }
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
      const cupones = window.CUPONES || [];
      // solo cuenta ids que siguen existiendo (si Julio quita o renombra un cupón)
      const ids = new Set(cupones.map((c) => c && c.id));
      const n = s.revelados.filter((id) => ids.has(id)).length;
      return `${n} de ${cupones.length} raspados`;
    },
    start,
    stop,
  };
})();
