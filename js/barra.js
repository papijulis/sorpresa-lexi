/* ======================================================================
   BARRA SUPERIOR (rediseño de movimiento) — pastilla de vidrio fija
   • No existe mientras el inicio está visible: entra con la fusión del inicio
     (Flujo.fusion() > ~0.35) cayendo desde arriba con fade y desenfoque que se
     aclara (700 ms, ease-out-soft), sus elementos escalonados 70 ms; al volver
     arriba hace el camino inverso (histéresis para que no parpadee).
   • Marca (lirio) + enlaces a Caminos, las 5 partes y "Las cartas del final";
     una pastilla de acento se desliza hasta el enlace de la sección visible.
   • ≤ 768 px: marca + botón de menú que abre una hoja de vidrio (Esc / clic fuera,
     foco atrapado). Accesible: nav con aria-label, :focus-visible, aria-current.
   La sección activa y el scroll salen de motor.js (un solo lector).
====================================================================== */
(function () {
  'use strict';
  var M = window.Motor, E = M.estado;
  var barra = document.getElementById('barra-sup');
  if (!barra) return;
  var enlaces = Array.prototype.slice.call(barra.querySelectorAll('.barra-enlace'));
  var pastilla = barra.querySelector('.barra-pastilla');
  var menuBtn = document.getElementById('barra-menu');
  var hoja = document.getElementById('barra-hoja');
  var hojaEnlaces = Array.prototype.slice.call(hoja.querySelectorAll('a'));
  var destinos = enlaces.map(function (a) { return a.getAttribute('href'); });
  var tops = [], activo = -1, visible = false, hojaAbierta = false;

  function medir() {
    var t = M.anclas(destinos);
    tops = t.map(function (v) { return v === null ? Infinity : v; });
    posicionar();
  }
  function posicionar() {
    if (activo < 0 || !enlaces[activo] || !pastilla || barra.offsetWidth === 0) { if (pastilla) pastilla.style.opacity = '0'; return; }
    var a = enlaces[activo];
    if (a.offsetWidth === 0) { pastilla.style.opacity = '0'; return; }   // en móvil los enlaces viven en la hoja
    pastilla.style.opacity = '1';
    pastilla.style.width = a.offsetWidth + 'px';
    pastilla.style.transform = 'translateX(' + a.offsetLeft + 'px)';
  }
  function marcar(i) {
    if (i === activo) return;
    activo = i;
    enlaces.forEach(function (a, k) { if (k === i) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    hojaEnlaces.forEach(function (a, k) { if (k === i) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    posicionar();
  }

  function mostrar(v) {
    if (v === visible) return;
    visible = v;
    barra.classList.toggle('visible', v);
    if (v) barra.removeAttribute('inert'); else barra.setAttribute('inert', '');
    if (!v) cerrarHoja();
  }

  function cuadro(E) {
    var fus = window.Flujo ? window.Flujo.fusion() : 1;
    if (!visible && fus > .35) mostrar(true);
    else if (visible && fus < .2) mostrar(false);
    if (!visible) return;
    var ref = E.y + E.vh * .4, i = -1;
    for (var k = 0; k < tops.length; k++) { if (tops[k] <= ref) i = k; }
    marcar(i);
  }

  /* ---- hoja de menú en móvil ---- */
  function abrirHoja() {
    hojaAbierta = true; hoja.classList.add('abierta'); menuBtn.setAttribute('aria-expanded', 'true');
    hoja.removeAttribute('inert');
    if (hojaEnlaces[0]) hojaEnlaces[0].focus({ preventScroll: true });
  }
  function cerrarHoja(devolverFoco) {
    if (!hojaAbierta) return;
    hojaAbierta = false; hoja.classList.remove('abierta'); menuBtn.setAttribute('aria-expanded', 'false');
    hoja.setAttribute('inert', '');
    if (devolverFoco) menuBtn.focus({ preventScroll: true });
  }
  menuBtn.addEventListener('click', function () { if (hojaAbierta) cerrarHoja(true); else abrirHoja(); });
  document.addEventListener('keydown', function (e) {
    if (!hojaAbierta) return;
    if (e.key === 'Escape') { cerrarHoja(true); return; }
    if (e.key !== 'Tab') return;
    var f = [menuBtn].concat(hojaEnlaces), pos = f.indexOf(document.activeElement);
    if (e.shiftKey && pos <= 0) { f[f.length - 1].focus(); e.preventDefault(); }
    else if (!e.shiftKey && pos === f.length - 1) { f[0].focus(); e.preventDefault(); }
  });
  document.addEventListener('pointerdown', function (e) { if (hojaAbierta && !hoja.contains(e.target) && !menuBtn.contains(e.target)) cerrarHoja(false); });

  /* ---- ir a una sección (la barra no tapa el título: scroll-margin-top en CSS) ---- */
  function ir(e) {
    var a = e.currentTarget, id = a.getAttribute('href');
    if (!id || id.charAt(0) !== '#') return;
    var el = document.querySelector(id);
    if (!el) return;
    e.preventDefault();
    cerrarHoja(false);
    if (window.CartasFinal) window.CartasFinal.pausarAuto();   // que la carta no se abra sola al cruzar su pista
    el.scrollIntoView({ behavior: E.reducido ? 'auto' : 'smooth', block: 'start' });
  }
  enlaces.concat(hojaEnlaces).forEach(function (a) { a.addEventListener('click', ir); });
  var marca = barra.querySelector('.barra-marca');
  marca.addEventListener('click', function (e) { e.preventDefault(); cerrarHoja(false); if (window.CartasFinal) window.CartasFinal.pausarAuto(); window.scrollTo({ top: 0, behavior: E.reducido ? 'auto' : 'smooth' }); });

  var mt = 0;
  window.addEventListener('resize', function () { clearTimeout(mt); mt = setTimeout(function () { medir(); if (E.vw > 768) cerrarHoja(false); }, 160); });
  window.addEventListener('load', function () { setTimeout(medir, 300); });
  if ('ResizeObserver' in window) new ResizeObserver(function () { clearTimeout(mt); mt = setTimeout(medir, 160); }).observe(document.getElementById('main-content') || document.body);
  setTimeout(medir, 1500);
  medir();
  hoja.setAttribute('inert', '');
  M.suscribir(cuadro);
})();
