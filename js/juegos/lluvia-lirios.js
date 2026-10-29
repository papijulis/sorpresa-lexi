/* Lluvia de lirios — atrapa los lirios que caen, esquiva las espinas.
   Sin game over duro: tocar una espina solo da una sacudida, nunca
   reinicia el progreso. Pausa su propio requestAnimationFrame en stop(),
   llamado por el harness de Juegos al salir o cambiar de juego. */
window.JuegoLluviaLirios = (function () {
  const TARGET = 15;
  let raf = null;
  let mountEl = null;
  let canvas, ctx, replayBtnEl, countEl;
  let items = [];
  let paddleX = 0.5;
  let caught = 0;
  let lastSpawn = 0;
  let lastFrame = 0;
  let running = false;
  let vw = 0, vh = 0;
  let shakeUntil = 0;
  let finished = false;
  let listeners = [];

  /* Sprites del juego: el lirio de la firma (mismo dibujo del fondo, paintLilyShape)
     y una flor marchita con espinas. Se pintan una sola vez al empezar. */
  let lilySprite = null, thornSprite = null;
  function buildSprites() {
    const d = Math.min(window.devicePixelRatio || 1, 2), S = 48;
    const mk = (draw) => {
      const c = document.createElement('canvas');
      c.width = c.height = Math.round(S * d);
      const g = c.getContext('2d');
      g.scale(d, d); g.translate(S / 2, S / 2);
      draw(g);
      return c;
    };
    lilySprite = mk((g) => { if (typeof paintLilyShape === 'function') paintLilyShape(g, 19, 0, false); });
    thornSprite = mk((g) => {
      g.beginPath();
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 8 : 21;
        g[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r);
      }
      g.closePath();
      const grad = g.createRadialGradient(0, 0, 2, 0, 0, 21);
      grad.addColorStop(0, '#7F1D2E'); grad.addColorStop(1, '#3B0A1A');
      g.fillStyle = grad; g.fill();
      g.lineWidth = 1.2; g.strokeStyle = 'rgba(251,113,133,.7)'; g.stroke();
    });
  }

  function resize() {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    vw = rect.width; vh = rect.height;
    canvas.width = Math.max(1, Math.round(vw * dpr));
    canvas.height = Math.max(1, Math.round(vh * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawnItem() {
    const isThorn = Math.random() < 0.28;
    items.push({
      x: Math.random() * vw,
      y: -20,
      speed: 1.1 + Math.random() * 1.1,
      size: 16 + Math.random() * 8,
      thorn: isThorn,
      sway: Math.random() * Math.PI * 2,
    });
  }

  function updatePaddlePosition(clientX) {
    const rect = canvas.getBoundingClientRect();
    paddleX = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  }

  function updateHud() {
    if (countEl) countEl.textContent = `${Math.min(caught, TARGET)} / ${TARGET}`;
  }

  function finish() {
    finished = true;
    if (replayBtnEl) replayBtnEl.style.display = 'inline-flex';
    const banco = (window.FRASES && window.FRASES.length) ? window.FRASES : null;
    const frase = banco
      ? banco[Math.floor(Math.random() * banco.length)].texto
      : '¡Atrapaste todos los lirios! Así de fácil se me hace quererte, sin esfuerzo, uno tras otro.';
    setTimeout(() => {
      if (typeof openModal === 'function') openModal({ icon: 'lirio', title: '¡Atrapaste todos los lirios!', body: frase });
    }, 300);
  }

  function loop(t) {
    if (!running) return;
    const dt = lastFrame ? t - lastFrame : 16;
    lastFrame = t;

    if (!finished && t - lastSpawn > 650) { spawnItem(); lastSpawn = t; }

    ctx.clearRect(0, 0, vw, vh);

    const paddleY = vh - 36;
    const paddleW = 64;
    const paddleCx = paddleX * vw;

    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      it.y += it.speed * (dt / 16);
      it.x += Math.sin(t / 600 + it.sway) * 0.4;

      const sprite = it.thorn ? thornSprite : lilySprite;
      if (sprite) ctx.drawImage(sprite, it.x - it.size, it.y - it.size, it.size * 2, it.size * 2);

      const hitY = it.y > paddleY - 14 && it.y < paddleY + 14;
      const hitX = Math.abs(it.x - paddleCx) < paddleW / 2;
      if (hitY && hitX) {
        items.splice(i, 1);
        if (it.thorn) {
          shakeUntil = t + 220;
          if (window.Acierto) window.Acierto('golpe');
        } else if (!finished) {
          if (window.Acierto) window.Acierto('tic');
          caught++;
          updateHud();
          if (caught >= TARGET) finish();
        }
        continue;
      }
      if (it.y > vh + 30) items.splice(i, 1);
    }

    ctx.save();
    const shakeX = t < shakeUntil ? (Math.random() - 0.5) * 10 : 0;
    ctx.translate(shakeX, 0);
    ctx.fillStyle = t < shakeUntil ? 'rgba(251,113,133,.85)' : 'rgba(255,215,0,.85)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(paddleCx - paddleW / 2, paddleY - 8, paddleW, 16, 8);
    else ctx.rect(paddleCx - paddleW / 2, paddleY - 8, paddleW, 16);
    ctx.fill();
    ctx.restore();

    raf = requestAnimationFrame(loop);
  }

  function reset() {
    items = [];
    caught = 0;
    finished = false;
    lastSpawn = 0;
    if (replayBtnEl) replayBtnEl.style.display = 'none';
    updateHud();
  }

  function start(mount) {
    mountEl = mount;
    if (!lilySprite) buildSprites();
    mount.innerHTML = `
      <div class="lirios-wrap">
        <div class="lirios-hud"><span style="color:var(--dorado-500);">${ico('lirio-mini', 'ico-sm')}</span> <span><span id="lirios-count">0 / ${TARGET}</span></span></div>
        <canvas class="lirios-canvas" id="lirios-canvas"></canvas>
        <p class="font-ui text-[11px] mt-3" style="color:rgba(253,251,247,.5);">Mueve el dedo o el mouse para atrapar los lirios. Las espinas no te detienen.</p>
        <button id="lirios-replay" class="cupon-redeem-btn" style="margin-top:.75rem;display:none;">Jugar de nuevo</button>
      </div>
    `;
    canvas = mount.querySelector('#lirios-canvas');
    ctx = canvas.getContext('2d');
    countEl = mount.querySelector('#lirios-count');
    replayBtnEl = mount.querySelector('#lirios-replay');
    resize();

    const onResize = () => resize();
    window.addEventListener('resize', onResize);
    listeners.push(() => window.removeEventListener('resize', onResize));

    const onPointerMove = (e) => updatePaddlePosition(e.clientX);
    const onPointerDown = (e) => updatePaddlePosition(e.clientX);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerdown', onPointerDown);
    listeners.push(() => canvas.removeEventListener('pointermove', onPointerMove));
    listeners.push(() => canvas.removeEventListener('pointerdown', onPointerDown));

    const onReplay = () => reset();
    replayBtnEl.addEventListener('click', onReplay);
    listeners.push(() => replayBtnEl.removeEventListener('click', onReplay));

    reset();
    running = true;
    lastFrame = 0;
    raf = requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    listeners.splice(0).forEach((fn) => fn());
    if (mountEl) mountEl.innerHTML = '';
    mountEl = null;
  }

  return {
    id: 'lluvia-lirios',
    titulo: 'Lluvia de lirios',
    icono: 'i-gota',
    descripcion: 'Atrapa los lirios, esquiva las espinas.',
    start,
    stop,
  };
})();
