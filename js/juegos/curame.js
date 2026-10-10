/* Cúrame — mini-juego de Rivals: la barra de vida de Julio baja sola y
   Lexi la cura tocando los corazones que aparecen ("usa a Elsa").
   Sin game over duro: si la barra llega a cero, Julio pide un "¡cúrame!"
   y se recupera un poco, el tiempo sigue. Al aguantar DURACION_MS se
   guarda { completada: true } en jardin.curame.v1 y se desbloquea la
   carta con desbloqueaCon: "curame" (ver cartaIsOpenable() en
   index.html). jardinStorage/openModal/etc. se usan solo dentro de
   funciones. */
window.JuegoCurame = (function () {
  const STORAGE_KEY = 'jardin.curame.v1';
  const DURACION_MS = 40000;
  const HEAL = 9;
  const HEART_LIFE_MS = 1700;

  let mountEl = null;
  let raf = null;
  let running = false;
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

  function start(mount) {
    mountEl = mount;
    const already = loadState().completada;
    mount.innerHTML = `
      <div class="curame-wrap">
        <div class="curame-hud">
          <span class="curame-label">Julio</span>
          <div class="curame-bar" role="progressbar" aria-label="Vida de Julio" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100"><div class="curame-bar-fill" id="curame-fill"></div></div>
        </div>
        <div class="curame-time"><div class="curame-time-fill" id="curame-time"></div></div>
        <div class="curame-arena" id="curame-arena"></div>
        <p class="font-ui text-[11px] mt-3" style="color:rgba(253,251,247,.5);text-align:center;">Toca los corazones para curarme. Aguanta hasta que se llene la barra de abajo. Usa a Elsa.</p>
        ${already ? '<p class="font-ui text-[11px] mt-1" style="color:rgba(255,215,0,.7);text-align:center;">Ya me curaste una vez y la carta está en el Buzón. Puedes volver a jugar cuando quieras.</p>' : ''}
        <div style="text-align:center;"><button type="button" id="curame-replay" class="cupon-redeem-btn" style="margin-top:.9rem;display:none;">Jugar de nuevo</button></div>
      </div>
    `;
    const fillEl = mount.querySelector('#curame-fill');
    const barEl = mount.querySelector('.curame-bar');
    const timeEl = mount.querySelector('#curame-time');
    const arenaEl = mount.querySelector('#curame-arena');
    const replayBtn = mount.querySelector('#curame-replay');

    let health, elapsed, lastT, nextSpawn, hearts, ended, grito;

    function reset() {
      health = 100; elapsed = 0; lastT = 0; nextSpawn = 400; hearts = []; ended = false; grito = 0;
      arenaEl.innerHTML = '';
      replayBtn.style.display = 'none';
      paint();
    }
    function paint() {
      fillEl.style.transform = `scaleX(${Math.max(0, health) / 100})`;
      fillEl.classList.toggle('low', health < 30);
      barEl.setAttribute('aria-valuenow', String(Math.round(Math.max(0, health))));
      timeEl.style.transform = `scaleX(${Math.min(1, elapsed / DURACION_MS)})`;
    }

    function spawnHeart() {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'curame-heart';
      btn.setAttribute('aria-label', 'Curar a Julio');
      btn.textContent = '💛';
      const rect = arenaEl.getBoundingClientRect();
      const x = 8 + Math.random() * Math.max(10, rect.width - 64);
      const y = 8 + Math.random() * Math.max(10, rect.height - 64);
      btn.style.left = x + 'px';
      btn.style.top = y + 'px';
      const heart = { el: btn, born: elapsed };
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (ended || !btn.parentNode) return;
        health = Math.min(100, health + HEAL);
        btn.classList.add('popped');
        hearts = hearts.filter((h) => h !== heart);
        setTimeout(() => btn.remove(), 220);
        if (typeof spawnSparkleBurst === 'function') {
          const r = btn.getBoundingClientRect();
          spawnSparkleBurst(r.left + r.width / 2, r.top + r.height / 2, 6, true);
        }
      });
      arenaEl.appendChild(btn);
      hearts.push(heart);
    }

    function finish() {
      ended = true;
      hearts.forEach((h) => h.el.remove());
      hearts = [];
      saveState({ completada: true });
      if (typeof updateBuzonDot === 'function') updateBuzonDot();
      replayBtn.style.display = 'inline-flex';
      if (typeof spawnSparkleBurst === 'function') {
        const r = arenaEl.getBoundingClientRect();
        spawnSparkleBurst(r.left + r.width / 2, r.top + r.height / 2, 60, true);
      }
      setTimeout(() => {
        if (typeof openModal === 'function') openModal({ icon: '💛', title: '¡Me curaste!', body: 'Otra vez. Eres mi healer favorita. Se abrió una carta nueva en el Buzón.' });
      }, 350);
    }

    function loop(t) {
      if (!running) return;
      const dt = lastT ? Math.min(t - lastT, 100) : 16;
      lastT = t;
      if (!ended) {
        elapsed += dt;
        const drain = 4 + (elapsed / DURACION_MS) * 4; // % por segundo
        health -= drain * (dt / 1000);
        if (health <= 0) { health = 35; grito++; arenaEl.classList.add('shout'); setTimeout(() => arenaEl.classList.remove('shout'), 400); }
        nextSpawn -= dt;
        if (nextSpawn <= 0) { spawnHeart(); nextSpawn = 650 + Math.random() * 450; }
        for (let i = hearts.length - 1; i >= 0; i--) {
          if (elapsed - hearts[i].born > HEART_LIFE_MS) { hearts[i].el.remove(); hearts.splice(i, 1); }
        }
        paint();
        if (elapsed >= DURACION_MS) finish();
      }
      raf = requestAnimationFrame(loop);
    }

    const onReplay = () => { reset(); };
    replayBtn.addEventListener('click', onReplay);
    listeners.push(() => replayBtn.removeEventListener('click', onReplay));

    const onVis = () => { lastT = 0; };
    document.addEventListener('visibilitychange', onVis);
    listeners.push(() => document.removeEventListener('visibilitychange', onVis));

    reset();
    running = true;
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
    id: 'curame',
    titulo: 'Cúrame',
    emoji: '💛',
    descripcion: 'Cura a Julio antes de que se acabe la barra.',
    progressLabel() { return loadState().completada ? 'curado' : 'sin completar'; },
    start,
    stop,
  };
})();
