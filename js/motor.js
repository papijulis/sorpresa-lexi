/* ======================================================================
   MOTOR — un solo lector de scroll y un solo bucle requestAnimationFrame
   compartidos por lo nuevo (flujo de luz, barra superior, tarjetas vivas,
   cartas del final). Nadie más debe registrar su propio listener de scroll
   ni su propio rAF para movimiento nuevo: se suscribe aquí.
   • Motor.estado: { y, dy, dir, vw, vh, t, dt, reducido }  (y = scroll cacheado)
   • Motor.suscribir(fn)   fn(estado) corre una vez por cuadro
   • Motor.anclas(selectores) → mide la posición vertical absoluta (sin caché, fuerza layout: llamar solo al medir, nunca por cuadro)
   • Motor.ease(x1,y1,x2,y2) → función de easing (cubic-bezier)
   • Motor.lerp / Motor.clamp / Motor.suave
   Se detiene con la pestaña oculta y vuelve sola.
====================================================================== */
(function () {
  'use strict';
  var estado = {
    y: window.scrollY || 0, dy: 0, dir: 1, vw: window.innerWidth, vh: window.innerHeight,
    t: 0, dt: 16, reducido: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  };
  var subs = [], raf = 0, ultimo = 0;

  window.addEventListener('scroll', function () {
    var y = window.scrollY || 0;
    estado.dy = y - estado.y;
    if (estado.dy) estado.dir = estado.dy > 0 ? 1 : -1;
    estado.y = y;
  }, { passive: true });
  window.addEventListener('resize', function () { estado.vw = window.innerWidth; estado.vh = window.innerHeight; });

  function tick(t) {
    raf = 0;
    if (document.hidden) return;
    estado.dt = Math.min(64, ultimo ? t - ultimo : 16);
    ultimo = t; estado.t = t;
    for (var i = 0; i < subs.length; i++) { try { subs[i](estado); } catch (e) { /* un módulo no tumba a los demás */ } }
    estado.dy = 0;
    raf = requestAnimationFrame(tick);
  }
  function arrancar() { if (!raf && !document.hidden) { ultimo = 0; raf = requestAnimationFrame(tick); } }
  document.addEventListener('visibilitychange', function () { if (document.hidden) { if (raf) cancelAnimationFrame(raf); raf = 0; } else arrancar(); });

  function lerp(a, b, k) { return a + (b - a) * k; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function suave(x) { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); }
  /* cubic-bezier como función de easing (Newton + bisección) */
  function ease(x1, y1, x2, y2) {
    function cx(t) { return 3 * x1 * t * (1 - t) * (1 - t) + 3 * x2 * t * t * (1 - t) + t * t * t; }
    function cy(t) { return 3 * y1 * t * (1 - t) * (1 - t) + 3 * y2 * t * t * (1 - t) + t * t * t; }
    return function (x) {
      if (x <= 0) return 0; if (x >= 1) return 1;
      var lo = 0, hi = 1, t = x;
      for (var i = 0; i < 18; i++) { var v = cx(t); if (Math.abs(v - x) < 1e-4) break; if (v < x) lo = t; else hi = t; t = (lo + hi) / 2; }
      return cy(t);
    };
  }
  /* posiciones verticales absolutas: sin caché, fuerza layout (getBoundingClientRect). Llamar solo desde medir() (resize/ResizeObserver), nunca por cuadro */
  function anclas(sels) {
    var y = window.scrollY || 0;
    return sels.map(function (s) {
      var el = typeof s === 'string' ? document.querySelector(s) : s;
      return el ? el.getBoundingClientRect().top + y : null;
    });
  }

  window.Motor = { estado: estado, suscribir: function (fn) { subs.push(fn); arrancar(); }, anclas: anclas, ease: ease, lerp: lerp, clamp: clamp, suave: suave };
  arrancar();
})();
