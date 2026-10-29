/* ======================================================================
   MICRO-INTERACCIONES (bloque 6) — el sitio responde al tocarlo
   • Cada toque a un botón o tarjeta suelta unos pétalos y un sonido suave.
   • Un toque al aire (fuera de botones, vistas y juegos) suelta pocos pétalos.
   • Los pétalos se dibujan en la capa superior (spawnPetalTouch, motor-canvas.js)
     y el sonido pasa por el bus único de js/sonidos.js.
   Todo respeta prefers-reduced-motion (sin pétalos) y el interruptor de sonidos.
====================================================================== */
(function () {
  'use strict';
  var CLICABLE = 'button, [role="button"], a[href], .camino, .tl-mes-btn, .juego-card, .buzon-envelope, .cupon-card, .song-select-card, .polaroid, .banda-play';
  /* estos ya hacen su propio sonido (abrir vista, cambiar cielo…): solo llevan pétalos */
  var CON_SONIDO_PROPIO = '#buzon-toggle, #juegos-toggle, #sunset-toggle, #camino-buzon, #camino-juegos, #clock-infinity-link, #camino-efectos, .tl-mes-btn, [data-cielo], .app-view-close, #modal-close';
  var ultimoAire = 0;

  function colores() {
    if (document.body.classList.contains('sunset-mode')) return ['#FB7185', '#F59E0B', '#FFD700'];
    if (document.body.classList.contains('night-mode')) return ['#DCE3FF', '#A9B6FF', '#FBE7A1'];
    return ['#FFD700', '#FACC15', '#E9D5FF', '#FB7185'];
  }

  document.addEventListener('pointerdown', function (e) {
    if (e.button > 0 || document.body.classList.contains('locked')) return;
    if (!window.spawnPetalTouch) return;
    var t = e.target;
    if (!t.closest) return;
    var cl = t.closest(CLICABLE);
    if (cl) {
      if (t.closest('#juego-stage, canvas')) return; // dentro de un juego mandan sus propios efectos
      window.spawnPetalTouch(e.clientX, e.clientY, 7, colores());
      if (window.Sonidos && !cl.matches(CON_SONIDO_PROPIO) && !cl.closest(CON_SONIDO_PROPIO)) window.Sonidos.play('toque');
      return;
    }
    /* al aire: solo en el Jardín (no en vistas, juegos ni popups) y sin saturar */
    if (t.closest('.app-view, .modal-backdrop, .lightbox, canvas, #screen-gate, #screen-songs, input, textarea')) return;
    var ahora = performance.now();
    if (ahora - ultimoAire < 350) return;
    ultimoAire = ahora;
    window.spawnPetalTouch(e.clientX, e.clientY, 4, colores());
    if (window.Sonidos) window.Sonidos.play('petalos');
  }, { passive: true });
})();
