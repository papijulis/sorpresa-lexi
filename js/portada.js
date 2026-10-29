/* ======================================================================
   PORTADA EN CAPAS — luz según el cielo y la hora + parallax
   • Posición y color del sol (o la luna) según el cielo elegido y la hora de
     Ciudad de México: de día recorre un arco de 6:00 a 18:00 (rosa al amanecer,
     dorado al mediodía); en atardecer queda bajo, ámbar; de noche, plata en la
     esquina de la luna. setCielo() (navegacion.js) llama Portada.actualizar().
   • Parallax: el scroll escribe --sy y el puntero fino --mx/--my (−1…1) con un
     solo requestAnimationFrame por movimiento. Con prefers-reduced-motion no hay
     parallax (--par: 0). Todo se desvanece al bajar del inicio (--fade).
====================================================================== */
(function () {
  'use strict';
  var raiz = document.getElementById('portada');
  var frente = document.getElementById('portada-frente');
  var hero = document.querySelector('.hero-section');
  if (!raiz || !frente) return;
  var REDUCIDO = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var PUNTERO_FINO = window.matchMedia('(pointer: fine)').matches;

  function horaMexico() {
    var p = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Mexico_City', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
    var h = 0, m = 0;
    p.forEach(function (x) { if (x.type === 'hour') h = Number(x.value) % 24; if (x.type === 'minute') m = Number(x.value); });
    return h + m / 60;
  }

  /* x, y en % de la pantalla; rgb de la luz; a = fuerza del resplandor */
  function luz(cielo) {
    if (cielo === 'noche') return { x: 88, y: 15, rgb: '169, 182, 255', a: 0.5 };
    if (cielo === 'atardecer') return { x: 50, y: 62, rgb: '245, 130, 60', a: 0.8 };
    var h = horaMexico();
    if (h < 6 || h >= 18) h = 12; // eligió "día" fuera de horario: mediodía
    var t = (h - 6) / 12, w = Math.sin(Math.PI * t);
    return {
      x: 12 + 76 * t,
      y: 68 - 54 * w,
      rgb: Math.round(251 + 4 * w) + ', ' + Math.round(113 + 102 * w) + ', ' + Math.round(133 - 133 * w),
      a: 0.32 + 0.4 * w,
    };
  }

  var ultimoCielo = 'dia';
  function actualizar(cielo) {
    ultimoCielo = cielo || ultimoCielo;
    var l = luz(ultimoCielo);
    raiz.style.setProperty('--sol-x', l.x.toFixed(1) + '%');
    raiz.style.setProperty('--sol-y', l.y.toFixed(1) + '%');
    raiz.style.setProperty('--sol-rgb', l.rgb);
    raiz.style.setProperty('--sol-a', l.a.toFixed(2));
  }
  setInterval(function () { actualizar(); }, 5 * 60 * 1000);

  /* ---- parallax ---- */
  var sy = 0, mx = 0, my = 0, pendiente = false, visible = true;
  function pintar() {
    pendiente = false;
    var vh = window.innerHeight || 800;
    var f = Math.max(0, Math.min(1, 1 - sy / (vh * 0.95)));
    var oculto = f <= 0.01;
    if (oculto !== !visible) {
      visible = !oculto;
      raiz.classList.toggle('oculta', oculto);
      frente.classList.toggle('oculta', oculto);
    }
    if (oculto) return;
    [raiz, frente].forEach(function (el) {
      el.style.setProperty('--sy', sy.toFixed(1));
      el.style.setProperty('--fade', f.toFixed(3));
      el.style.setProperty('--mx', mx.toFixed(3));
      el.style.setProperty('--my', my.toFixed(3));
    });
    if (hero) hero.style.setProperty('--sy', Math.min(sy, vh).toFixed(1));
  }
  function pedir() { if (!pendiente) { pendiente = true; requestAnimationFrame(pintar); } }

  if (REDUCIDO) { raiz.style.setProperty('--par', '0'); frente.style.setProperty('--par', '0'); if (hero) hero.style.setProperty('--par', '0'); }
  window.addEventListener('scroll', function () { sy = window.scrollY || 0; pedir(); }, { passive: true });
  window.addEventListener('resize', pedir);
  if (PUNTERO_FINO && !REDUCIDO) {
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      mx = (e.clientX / window.innerWidth - 0.5) * 2;
      my = (e.clientY / window.innerHeight - 0.5) * 2;
      if (sy < window.innerHeight) pedir();
    }, { passive: true });
  }
  sy = window.scrollY || 0;
  actualizar('dia');
  pintar();

  window.Portada = { actualizar: actualizar };
})();
