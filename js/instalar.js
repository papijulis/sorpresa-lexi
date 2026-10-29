/* ======================================================================
   INSTALAR EL JARDÍN (bloque 10) — aviso amable, nunca insistente
   • Chrome/Edge/Android: se guarda el evento beforeinstallprompt y el aviso
     abre el diálogo nativo de instalación.
   • Safari de iPhone/iPad (no tiene ese evento): el aviso explica cómo
     "Añadir a pantalla de inicio".
   • Sale una sola vez tras ~60 s de recorrido activo, nunca encima de una
     vista/carta abierta, y si se descarta no vuelve en 14 días. Además hay
     una línea permanente en "Caminos del jardín" mientras no esté instalada.
   Preferencia en jardin.instalar.v1 ({descartado: ms, instalado: bool}).
====================================================================== */
(function () {
  'use strict';
  var KEY = 'jardin.instalar.v1';
  var DIAS_ESPERA = 14;
  var ua = navigator.userAgent || '';
  var esIOS = /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
  var esSafariIOS = esIOS && /safari/i.test(ua) && !/crios|fxios|edgios|opios/i.test(ua);
  var evento = null;

  function leer() { try { return JSON.parse(jardinStorage.get(KEY) || '{}') || {}; } catch (e) { return {}; } }
  function guardar(o) { try { jardinStorage.set(KEY, JSON.stringify(Object.assign(leer(), o))); } catch (e) { /* sin guardar */ } }
  function yaInstalada() { return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true || !!leer().instalado; }
  function sePuede() { return !yaInstalada() && (!!evento || esSafariIOS); }

  /* ---- aviso flotante ---- */
  var aviso = document.createElement('div');
  aviso.id = 'instalar-aviso';
  aviso.className = 'instalar-aviso';
  aviso.setAttribute('role', 'dialog');
  aviso.setAttribute('aria-label', 'Instalar el Jardín');
  aviso.innerHTML =
    '<p class="instalar-texto font-hand" id="instalar-texto"></p>' +
    '<div class="instalar-acciones"><button type="button" id="instalar-si" class="instalar-si"></button>' +
    '<button type="button" id="instalar-no" class="instalar-no">Ahora no</button></div>';
  document.body.appendChild(aviso);
  var textoEl = aviso.querySelector('#instalar-texto'), siBtn = aviso.querySelector('#instalar-si'), noBtn = aviso.querySelector('#instalar-no');

  function mostrar() {
    if (esSafariIOS && !evento) {
      textoEl.textContent = 'Lleva el Jardín contigo: en Safari toca Compartir y luego «Añadir a pantalla de inicio».';
      siBtn.textContent = 'Entendido';
    } else {
      textoEl.textContent = 'Lleva el Jardín contigo: instálalo en tu pantalla de inicio y ábrelo cuando quieras.';
      siBtn.textContent = 'Instalar';
    }
    aviso.classList.add('on');
  }
  function ocultar() { aviso.classList.remove('on'); }
  function descartar() { guardar({ descartado: Date.now() }); ocultar(); }

  function instalar() {
    if (evento) {
      var e = evento; evento = null;
      e.prompt();
      e.userChoice.then(function (r) { if (r && r.outcome === 'accepted') guardar({ instalado: true }); else guardar({ descartado: Date.now() }); pintarLinea(); }, function () {});
      ocultar();
    } else {
      descartar(); // iOS: ya leyó cómo hacerlo
    }
  }
  siBtn.addEventListener('click', instalar);
  noBtn.addEventListener('click', descartar);

  /* ---- línea permanente en Caminos del jardín ---- */
  var linea = document.getElementById('instalar-linea');
  var lineaBtn = document.getElementById('instalar-linea-btn');
  function pintarLinea() { if (linea) linea.hidden = !sePuede(); }
  if (lineaBtn) lineaBtn.addEventListener('click', function () { if (evento) instalar(); else mostrar(); });

  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); evento = e; pintarLinea(); });
  window.addEventListener('appinstalled', function () { evento = null; guardar({ instalado: true }); ocultar(); pintarLinea(); });
  pintarLinea();

  /* ---- cuándo salir solo: ~60 s de recorrido activo, con la pantalla libre ---- */
  var activos = 0;
  setInterval(function () {
    if (document.hidden || document.body.classList.contains('locked')) return;
    activos += 5;
    if (activos < 60 || aviso.classList.contains('on')) return;
    var g = leer();
    if (!sePuede() || (g.descartado && Date.now() - g.descartado < DIAS_ESPERA * 86400000)) return;
    if (document.querySelector('.app-view.open, .modal-backdrop.open, .lightbox.open')) return;
    mostrar();
  }, 5000);
})();
