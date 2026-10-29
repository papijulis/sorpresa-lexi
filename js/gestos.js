/* ======================================================================
   GESTOS Y ATAJOS (bloque 9)
   • Atajos de teclado en escritorio: B abre/cierra el Buzón, J los Juegos.
   • Vibración suave (Haptica) al acertar en los juegos; Acierto(tipo) junta
     vibración + sonido para que los juegos hagan UNA llamada.
   (Deslizar entre cartas del Buzón está en buzon-juegos.js y las flechas del
   visor de fotos en ui.js, junto al código que ya manejaba esas ventanas.)
   Todo respeta el interruptor de sonidos/efectos: apagado = sin vibración.
====================================================================== */
(function () {
  'use strict';

  /* ---- vibración: solo donde existe (Android); iOS no la soporta y se ignora ---- */
  var puede = typeof navigator.vibrate === 'function';
  var ultimo = 0;
  function activa() { return puede && !document.hidden && (!window.Sonidos || window.Sonidos.activo()); }
  window.Haptica = {
    vibrar: function (patron) {
      if (!activa()) return;
      var t = performance.now();
      if (t - ultimo < 40) return;
      ultimo = t;
      try { navigator.vibrate(patron); } catch (e) { /* sin vibración */ }
    },
  };
  /* tipos: tic (acierto chico, sin sonido) · pareja (acierto con notita) · exito (premio) · golpe (espina) */
  window.Acierto = function (tipo) {
    var H = window.Haptica, S = window.Sonidos;
    if (tipo === 'tic') H.vibrar(10);
    else if (tipo === 'pareja') { H.vibrar(16); if (S) S.play('corazon'); }
    else if (tipo === 'exito') { H.vibrar([20, 40, 30]); if (S) S.play('premio'); }
    else if (tipo === 'golpe') H.vibrar(28);
  };

  /* ---- atajos de teclado ---- */
  var buzonBtn = document.getElementById('buzon-toggle');
  var juegosBtn = document.getElementById('juegos-toggle');
  buzonBtn.setAttribute('aria-keyshortcuts', 'B');
  juegosBtn.setAttribute('aria-keyshortcuts', 'J');
  if (window.matchMedia('(pointer: fine)').matches) {
    buzonBtn.title = 'El Buzón (B)';
    juegosBtn.title = 'Rincón de Juegos (J)';
  }

  function vistaAbierta(id) { return document.getElementById(id).classList.contains('open'); }
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    var k = e.key.toLowerCase();
    if (k !== 'b' && k !== 'j') return;
    var t = e.target;
    if (t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName))) return;
    if (document.body.classList.contains('locked')) return;                       // pantalla de entrada
    if (document.getElementById('app-modal').classList.contains('open')) return;  // hay una carta abierta
    if (document.getElementById('lightbox').classList.contains('open')) return;
    if (typeof activeJuego !== 'undefined' && activeJuego) return;                // jugando: no estorbar
    var buzon = vistaAbierta('view-buzon'), juegos = vistaAbierta('view-juegos'), inf = vistaAbierta('view-infinito');
    if (inf) return;
    if (k === 'b') {
      if (buzon) closeBuzonView();
      else if (!juegos) openBuzonView(buzonBtn);
    } else {
      if (juegos) closeJuegosView();
      else if (!buzon) openJuegosView(juegosBtn);
    }
  });
})();
