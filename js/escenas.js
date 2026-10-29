/* ======================================================================
   ESCENAS — motor pequeño de movimiento ligado al scroll (sin librerías)
   • [data-escena="trazo"]  escribe --p (0→1) mientras el elemento sube por la
     pantalla: lo usa el divisor ornamental para "dibujarse".
   • [data-escena="pasada"] --p = cuánto ha cruzado el elemento por la pantalla
     (0 entra por abajo, 1 sale por arriba): base para las escenas del rediseño.
   • [data-en-vista] / .mov-* → agrega la clase .en-vista una sola vez.
   Solo mide los elementos que están en pantalla (IntersectionObserver) y
   actualiza con un requestAnimationFrame por desplazamiento. Con
   prefers-reduced-motion deja todo en su estado final (--p = 1).
====================================================================== */
(function () {
  'use strict';
  var reduced = function () { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; };
  var clamp = function (v) { return Math.max(0, Math.min(1, v)); };

  var visibles = new Set();
  var pendiente = false;

  function progreso(el) {
    var r = el.getBoundingClientRect(), vh = window.innerHeight;
    if (el.dataset.escena === 'trazo') return clamp((vh * 0.92 - r.top) / (vh * 0.3));
    return clamp((vh - r.top) / (vh + r.height));
  }
  function actualizar() {
    pendiente = false;
    visibles.forEach(function (el) { el.style.setProperty('--p', progreso(el).toFixed(3)); });
  }
  function programar() {
    if (!pendiente) { pendiente = true; requestAnimationFrame(actualizar); }
  }

  var ioEscenas = 'IntersectionObserver' in window ? new IntersectionObserver(function (entradas) {
    entradas.forEach(function (e) { if (e.isIntersecting) visibles.add(e.target); else visibles.delete(e.target); });
    programar();
  }, { rootMargin: '25% 0px 25% 0px' }) : null;

  var ioVista = 'IntersectionObserver' in window ? new IntersectionObserver(function (entradas) {
    entradas.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('en-vista'); ioVista.unobserve(e.target); }
    });
  }, { threshold: 0, rootMargin: '0px 0px -10% 0px' }) : null;

  function registrar(el) {
    if (reduced() || !ioEscenas) {
      if (el.hasAttribute('data-escena')) el.style.setProperty('--p', 1);
      el.classList.add('en-vista');
      return;
    }
    if (el.hasAttribute('data-escena')) ioEscenas.observe(el);
    if (el.hasAttribute('data-en-vista') || /\bmov-/.test(el.className)) ioVista.observe(el);
  }

  /* inserta el divisor ornamental bajo cada título de sección y en los
     contenedores marcados con data-orn-divisor */
  function decorar() {
    document.querySelectorAll('.titulo-seccion').forEach(function (h) {
      if (h.nextElementSibling && h.nextElementSibling.classList.contains('orn-divisor')) return;
      var d = document.createElement('div');
      d.className = 'orn-divisor';
      d.setAttribute('data-escena', 'trazo');
      d.innerHTML = window.ornDivisor();
      h.insertAdjacentElement('afterend', d);
    });
    document.querySelectorAll('[data-orn-divisor]').forEach(function (c) {
      if (!c.firstChild) c.innerHTML = window.ornDivisor();
    });
    document.querySelectorAll('[data-escena], [data-en-vista], .mov-florecer, .mov-revelar').forEach(registrar);
  }

  window.addEventListener('scroll', programar, { passive: true });
  window.addEventListener('resize', programar);
  window.Escenas = { registrar: registrar, decorar: decorar };
  decorar();
})();
