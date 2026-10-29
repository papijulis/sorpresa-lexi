/* Constelación — unir 12 estrellas en orden para formar un corazón;
   al completarla se revela la fecha "28 · 05 · 2026" y queda guardada
   para aparecer como decoración permanente en el cielo nocturno del
   Jardín (ver renderNightConstellation() en index.html, que llama a
   getHeartPoints() de aquí para no duplicar la curva del corazón). */
window.JuegoConstelacion = (function () {
  const STORAGE_KEY = 'jardin.constelacion.v1';
  const POINT_COUNT = 12;
  const TAP_RADIUS = 26;

  let mountEl = null;
  let canvas, ctx;
  let points = [];
  let bgStars = [];
  let connected = 0;
  let finished = false;
  let raf = null;
  let cw = 0, ch = 0;
  let listeners = [];

  function loadState() {
    try {
      const raw = jardinStorage.get(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return { completada: !!parsed.completada };
    } catch (e) {
      return { completada: false };
    }
  }
  function saveState(state) { jardinStorage.set(STORAGE_KEY, JSON.stringify(state)); }

  // Curva paramétrica clásica del corazón. y se invierte porque en
  // canvas/SVG la "y" crece hacia abajo.
  function heartPoint(t, scale) {
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    return { x: x * scale, y: -y * scale };
  }

  // Expuesto para que index.html dibuje la misma forma, ya completada,
  // como decoración estática en el cielo nocturno — sin reimplementar
  // la curva ahí.
  function getHeartPoints(scale) {
    const pts = [];
    for (let i = 0; i < POINT_COUNT; i++) {
      pts.push(heartPoint((i / POINT_COUNT) * Math.PI * 2, scale));
    }
    return pts;
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    cw = rect.width; ch = rect.height;
    const cx = rect.width / 2;
    const cy = rect.height / 2 - rect.height * 0.04;
    const scale = Math.min(rect.width, rect.height) / 36;
    points = getHeartPoints(scale).map((p) => ({ x: cx + p.x, y: cy + p.y }));

    if (!bgStars.length) {
      for (let i = 0; i < 24; i++) {
        bgStars.push({
          x: Math.random() * rect.width, y: Math.random() * rect.height,
          r: Math.random() * 1.3 + 0.4, phase: Math.random() * Math.PI * 2,
        });
      }
    }
  }

  function draw(t) {
    ctx.clearRect(0, 0, cw, ch);

    bgStars.forEach((s) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0.1, 0.3 + Math.sin(t / 900 + s.phase) * 0.25);
      ctx.fillStyle = '#FDFBF7';
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });

    if (connected > 0) {
      ctx.save();
      ctx.strokeStyle = finished ? '#FFD700' : 'rgba(255,215,0,.85)';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = finished ? 10 : 4;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i <= connected; i++) ctx.lineTo(points[i % POINT_COUNT].x, points[i % POINT_COUNT].y);
      ctx.stroke();
      ctx.restore();
    }

    points.forEach((p, i) => {
      const isDone = i < connected;
      const isNext = i === connected && !finished;
      ctx.save();
      ctx.fillStyle = isDone ? '#FFD700' : (isNext ? '#FFE9A8' : 'rgba(255,255,255,.5)');
      if (isNext) { ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 12; }
      const r = isNext ? 6 + Math.sin(t / 300) * 1.4 : 4;
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });

    raf = requestAnimationFrame(draw);
  }

  function completeConstellation() {
    finished = true;
    saveState({ completada: true });
    if (typeof spawnSparkleBurst === 'function') {
      const rect = canvas.getBoundingClientRect();
      spawnSparkleBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 60, true);
    }
    setTimeout(() => {
      const dateEl = mountEl && mountEl.querySelector('.constelacion-fecha');
      if (dateEl) dateEl.classList.add('in');
    }, 500);
  }

  function handleTap(clientX, clientY) {
    if (finished || !points.length) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left, y = clientY - rect.top;
    const target = points[connected];
    if (Math.hypot(x - target.x, y - target.y) < TAP_RADIUS) {
      connected++;
      if (window.Acierto && connected < POINT_COUNT) window.Acierto('tic');
      if (connected >= POINT_COUNT) completeConstellation();
    }
  }

  function start(mount) {
    mountEl = mount;
    const already = loadState().completada;
    mount.innerHTML = `
      <div class="constelacion-wrap">
        <canvas class="constelacion-canvas" id="constelacion-canvas"></canvas>
        <p class="constelacion-fecha" id="constelacion-fecha">28 · 05 · 2026</p>
        <p class="font-ui text-[11px] mt-3" style="color:rgba(253,251,247,.5);">Une las estrellas en orden para formar un corazón.</p>
        ${already ? '<p class="font-ui text-[11px] mt-1" style="color:rgba(255,215,0,.7);">Ya la completaste una vez — vive en el cielo nocturno del Jardín. Puedes volver a armarla aquí cuando quieras.</p>' : ''}
      </div>
    `;
    canvas = mount.querySelector('#constelacion-canvas');
    ctx = canvas.getContext('2d');
    bgStars = [];
    points = [];
    connected = 0;
    finished = false;
    resize();

    const onResize = () => resize();
    window.addEventListener('resize', onResize);
    listeners.push(() => window.removeEventListener('resize', onResize));

    const onPointerDown = (e) => handleTap(e.clientX, e.clientY);
    canvas.addEventListener('pointerdown', onPointerDown);
    listeners.push(() => canvas.removeEventListener('pointerdown', onPointerDown));

    raf = requestAnimationFrame(draw);
  }

  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    listeners.splice(0).forEach((fn) => fn());
    if (mountEl) mountEl.innerHTML = '';
    mountEl = null;
  }

  return {
    id: 'constelacion',
    titulo: 'Constelación',
    icono: 'i-constelacion',
    descripcion: 'Une las estrellas y forma un corazón.',
    start,
    stop,
    isCompleted() { return loadState().completada; },
    getHeartPoints,
  };
})();
