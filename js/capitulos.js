/* ======================================================================
   PARTES DEL RECORRIDO — parte actual, índice y tinte del fondo
   Observa cada `.capitulo` con una banda de cero alto en el centro de la
   pantalla: la parte que la cruza es la actual. Escribe body[data-capitulo]
   (capitulos.css tiñe el fondo con eso), resalta su entrada en el índice de
   "Caminos del jardín"; el letrero de la parte actual lo muestra la barra
   superior (js/barra.js).
====================================================================== */
(function () {
  'use strict';
  var caps = Array.prototype.slice.call(document.querySelectorAll('.capitulo'));
  var items = Array.prototype.slice.call(document.querySelectorAll('.cap-indice-item'));
  if (!caps.length || !('IntersectionObserver' in window)) return;
  var actual = 0;

  function poner(n) {
    if (n === actual) return;
    actual = n;
    if (n) document.body.setAttribute('data-capitulo', String(n)); else document.body.removeAttribute('data-capitulo');
    items.forEach(function (it) { it.setAttribute('aria-current', it.dataset.cap === String(n) ? 'true' : 'false'); });
  }

  var dentro = {};
  var io = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (e) { dentro[e.target.dataset.capitulo] = e.isIntersecting; });
    var n = 0;
    Object.keys(dentro).forEach(function (k) { if (dentro[k]) n = Number(k); });
    if (n) poner(n);
    else if (caps[0].getBoundingClientRect().top > window.innerHeight * 0.5) poner(0); // volvió arriba de la parte I
  }, { rootMargin: '-50% 0px -50% 0px', threshold: 0 });
  caps.forEach(function (c) { io.observe(c); });
})();
