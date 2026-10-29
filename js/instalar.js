/* ======================================================================
   INSTALAR EL JARDÍN — una opción más en "Caminos del jardín"
   Ya no hay aviso flotante: Julio pidió que viva en el menú, junto a Buzón,
   Juegos, Tocadiscos y Cielo (tarjeta #camino-instalar, abajo, ancha).
   • Chrome/Edge/Android: se guarda beforeinstallprompt y la tarjeta abre el
     diálogo nativo de instalación.
   • Safari de iPhone/iPad (no tiene ese evento) y cualquier otro navegador:
     la tarjeta abre una ventanita que explica cómo "Añadir a pantalla de inicio".
   • Si ya está instalada (modo standalone) o se aceptó, la tarjeta se esconde.
   Estado en jardin.instalar.v1 ({instalado: bool}).
====================================================================== */
(function () {
  'use strict';
  var KEY = 'jardin.instalar.v1';
  var ua = navigator.userAgent || '';
  var esIOS = /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
  var esSafariIOS = esIOS && /safari/i.test(ua) && !/crios|fxios|edgios|opios/i.test(ua);
  var evento = null;
  var tarjeta = document.getElementById('camino-instalar');
  if (!tarjeta) return;

  function instalado() { try { return !!JSON.parse(jardinStorage.get(KEY) || '{}').instalado; } catch (e) { return false; } }
  function marcar() { try { jardinStorage.set(KEY, JSON.stringify({ instalado: true })); } catch (e) { /* sin guardar */ } }
  function yaInstalada() { return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true || instalado(); }
  function pintar() { tarjeta.hidden = yaInstalada(); }

  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); evento = e; pintar(); });
  window.addEventListener('appinstalled', function () { evento = null; marcar(); pintar(); });

  tarjeta.addEventListener('click', function () {
    if (evento) {
      var e = evento; evento = null;
      e.prompt();
      e.userChoice.then(function (r) { if (r && r.outcome === 'accepted') { marcar(); pintar(); } }, function () { /* cerró el diálogo */ });
      return;
    }
    openModal({
      icon: 'i-casa',
      title: 'Llevar el Jardín contigo',
      body: esSafariIOS
        ? 'En Safari toca el botón Compartir y luego «Añadir a pantalla de inicio». Así lo abres cuando quieras, como una app.'
        : 'Abre el menú de tu navegador y elige «Instalar app» o «Añadir a pantalla de inicio». Así lo abres cuando quieras, como una app.',
    });
  });
  pintar();
})();
