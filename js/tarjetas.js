/* ======================================================================
   TARJETAS VIVAS (rediseño de movimiento)
   Las tarjetas grandes reaccionan al puntero: inclinación 3D suave (±5°,
   perspective 900px) con inercia, un foco de luz lila que sigue el cursor por la
   superficie y elementos internos que se mueven más que el fondo (4–10 px).
   En táctil, la misma reacción más sutil (touchmove). Los botones principales
   se acercan un poquito al cursor (efecto magnético, ≤ 6 px, con la propiedad
   `translate` para no pelear con sus propios transform).
   Un solo listener de puntero y el bucle compartido de motor.js. Con
   prefers-reduced-motion no hace nada.
   Para sumar una tarjeta: agrégale data-tilt (o ponla en TARJETAS).
====================================================================== */
(function () {
  'use strict';
  var M = window.Motor, E = M.estado;
  if (E.reducido) return;

  /* selector de la tarjeta → hijos con profundidad (px de parallax interno) */
  var TARJETAS = {
    '.camino:not(.camino-ancho)': { '.camino-escena': 10, 'h3': 5 },
    '.cal-card': { '#cal-title': 6 },
    '#mesiversario-card': { '#mesiversario-icon': 9, '#mesiversario-title': 4 },
    '.cd-aparato': { '.cd-escenario': 10, '.cd-lcd': 4 },
    '.voice-card': { '#voice-play': 8 },
  };
  var MAGNETICOS = '#jar-btn, #random-memory-btn, #tl-toggle-todo, #cd-play, #hug-btn, .camino-chip';

  var vivos = [];   // { el, hijos:[{el,d}], rx, ry, tx, ty, gx, gy, go, mag }
  var porEl = new WeakMap();
  function registrar(el, hijos, mag) {
    if (porEl.has(el)) return;
    var st = { el: el, hijos: hijos || [], rx: 0, ry: 0, tx: 0, ty: 0, gx: 50, gy: 50, go: 0, to: 0, mag: !!mag, x: 0, y: 0, ax: 0, ay: 0, dentro: false };
    if (!mag) {
      el.classList.add('tilt');
      var b = document.createElement('span'); b.className = 'tilt-brillo'; b.setAttribute('aria-hidden', 'true'); el.appendChild(b);
      st.brillo = b;
    }
    porEl.set(el, st); vivos.push(st);
  }
  Object.keys(TARJETAS).forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (el) {
      var hs = [];
      Object.keys(TARJETAS[sel]).forEach(function (hsel) { var h = el.querySelector(hsel); if (h) hs.push({ el: h, d: TARJETAS[sel][hsel] }); });
      registrar(el, hs, false);
    });
  });
  document.querySelectorAll('[data-tilt]').forEach(function (el) { registrar(el, [], false); });
  document.querySelectorAll(MAGNETICOS).forEach(function (el) { registrar(el, [], true); });

  var actual = null;   // estado bajo el puntero
  function apuntar(st, cx, cy, factor) {
    var r = st.el.getBoundingClientRect();
    if (!r.width) return;
    var px = M.clamp((cx - r.left) / r.width, 0, 1) - .5, py = M.clamp((cy - r.top) / r.height, 0, 1) - .5;
    if (st.mag) { st.tx = M.clamp(px * 14, -6, 6); st.ty = M.clamp(py * 14, -6, 6); return; }
    st.ty = px * 10 * factor; st.tx = -py * 10 * factor;       // ±5° con factor 1
    st.gx = (px + .5) * 100; st.gy = (py + .5) * 100; st.to = 1; st.dentro = true;
    st.ax = px; st.ay = py;
  }
  function soltar(st) { if (!st) return; st.tx = 0; st.ty = 0; st.to = 0; st.dentro = false; st.ax = 0; st.ay = 0; }
  function buscar(t) {
    if (!t || !t.closest) return null;
    var el = t.closest('.tilt, ' + MAGNETICOS);
    return el ? porEl.get(el) || null : null;
  }
  function mover(cx, cy, target, factor) {
    var st = buscar(target);
    if (st !== actual) { soltar(actual); actual = st; }
    if (st) apuntar(st, cx, cy, factor);
  }
  document.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse' || e.pointerType === 'pen') mover(e.clientX, e.clientY, e.target, 1); }, { passive: true });
  document.addEventListener('touchmove', function (e) { var t = e.touches[0]; if (t) mover(t.clientX, t.clientY, document.elementFromPoint(t.clientX, t.clientY), .5); }, { passive: true });
  document.addEventListener('touchstart', function (e) { var t = e.touches[0]; if (t) mover(t.clientX, t.clientY, e.target, .5); }, { passive: true });
  ['touchend', 'touchcancel'].forEach(function (n) { document.addEventListener(n, function () { soltar(actual); actual = null; }, { passive: true }); });
  document.documentElement.addEventListener('pointerleave', function () { soltar(actual); actual = null; });
  window.addEventListener('blur', function () { soltar(actual); actual = null; });

  function cuadro(E) {
    var k = 1 - Math.pow(1 - .14, E.dt / 16.7);
    for (var i = 0; i < vivos.length; i++) {
      var st = vivos[i], quieto;
      if (st.mag) {
        st.rx += (st.tx - st.rx) * k; st.ry += (st.ty - st.ry) * k;
        quieto = Math.abs(st.rx) < .02 && Math.abs(st.ry) < .02 && !st.tx && !st.ty;
        if (!quieto || st.on) { st.el.style.translate = quieto ? '' : st.rx.toFixed(2) + 'px ' + st.ry.toFixed(2) + 'px'; st.on = !quieto; }
        continue;
      }
      st.rx += (st.tx - st.rx) * k; st.ry += (st.ty - st.ry) * k; st.go += (st.to - st.go) * k;
      quieto = Math.abs(st.rx) < .02 && Math.abs(st.ry) < .02 && st.go < .01 && !st.dentro;
      if (quieto) {
        if (st.on) {
          st.on = false; st.el.classList.remove('tilt-vivo'); st.el.style.transform = ''; st.brillo.style.opacity = '0';
          st.hijos.forEach(function (h) { h.el.style.translate = ''; });
        }
        continue;
      }
      if (!st.on) { st.on = true; st.el.classList.add('tilt-vivo'); }
      st.el.style.transform = 'perspective(900px) rotateX(' + st.rx.toFixed(2) + 'deg) rotateY(' + st.ry.toFixed(2) + 'deg)';
      st.brillo.style.opacity = st.go.toFixed(2);
      st.brillo.style.background = 'radial-gradient(circle at ' + st.gx.toFixed(1) + '% ' + st.gy.toFixed(1) + '%, rgba(var(--orquidea-rgb), .30), rgba(var(--orquidea-rgb), .06) 38%, transparent 62%)';
      for (var h = 0; h < st.hijos.length; h++) {
        var hh = st.hijos[h];
        hh.el.style.translate = (st.ry / 5 * hh.d).toFixed(2) + 'px ' + (-st.rx / 5 * hh.d).toFixed(2) + 'px';
      }
    }
  }
  M.suscribir(cuadro);
})();
