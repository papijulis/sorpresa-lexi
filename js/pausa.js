/* ======================================================================
   EN PAUSA (2026-11-06) — el Jardín como un pequeño museo de recuerdos.
   Todo depende de window.JARDIN_EN_PAUSA (contenido/config.js) y los textos de
   window.PAUSA. Este archivo carga justo después de nucleo.js, antes que el
   resto: cambia rótulos del HTML (Parte V, portada, Buzón, vela) y deja la marca
   body.en-pausa / window.EN_PAUSA para que los demás scripts lo consulten:
     • buzon-juegos.js — cartas pendientes selladas "en pausa", ya abiertas fuera
       del Buzón, sin avisos de carta nueva, placa fija en vez de mesiversario.
     • extras.js — cierre al final de la línea del tiempo (+ la rueda).
     • juegos/cupones.js — se raspan y se ven, ya no se canjean.
     • motor-canvas.js / flujo.js — movimiento más sereno.
   El contador NO se toca: sigue contando para siempre.
====================================================================== */
window.EN_PAUSA = !!window.JARDIN_EN_PAUSA;
(function () {
  'use strict';
  if (!window.EN_PAUSA) return;
  var P = window.PAUSA || {};
  document.documentElement.classList.add('en-pausa');
  document.body.classList.add('en-pausa');

  function texto(sel, t) { if (!t) return; document.querySelectorAll(sel).forEach(function (el) { el.textContent = t; }); }

  /* Parte V: "Lo que sigue" → "Lo que quedó escrito" (portal, índice de Caminos, barra y su menú) */
  if (P.parteTitulo) {
    texto('#cap-5-t', P.parteTitulo);
    texto('#cap-5 .cap-sub', P.parteSub);
    var cap5 = document.getElementById('cap-5');
    if (cap5) cap5.dataset.nombre = 'V · ' + P.parteTitulo;
    texto('.cap-indice-item[data-cap="5"] span:last-child', P.parteTitulo);
    texto('.barra-enlace[href="#cap-5"] .barra-txt', P.parteTitulo);
    document.querySelectorAll('a[href="#cap-5"]:not(.barra-enlace):not(.cap-indice-item)').forEach(function (a) {
      a.innerHTML = '<b>V</b> ' + P.parteTitulo.replace(/</g, '&lt;');
    });
  }

  /* portada: una línea discreta debajo del texto */
  var panel = document.getElementById('hero-panel');
  if (panel && P.lema) {
    var lema = document.createElement('p');
    lema.className = 'hero-lema font-hand';
    lema.textContent = P.lema;
    var ref = panel.querySelector('.font-ui');
    if (ref && ref.nextSibling) panel.insertBefore(lema, ref.nextSibling); else panel.appendChild(lema);
  }

  /* subtítulo del Buzón */
  var bz = document.querySelector('#view-buzon > p.font-ui');
  if (bz && P.buzon) bz.textContent = P.buzon;
  /* la rueda va arriba del Buzón, más grande (más protagonismo) */
  var ruedaWrap = document.querySelector('#view-buzon .rueda-wrap');
  var grid = document.getElementById('buzon-grid');
  if (ruedaWrap && grid) { grid.parentNode.insertBefore(ruedaWrap, grid); ruedaWrap.classList.add('rueda-protagonista'); }

  /* la vela del deseo: apagada, solo de recuerdo (ya no es un botón) */
  var vela = document.getElementById('wish-candle');
  if (vela) {
    var quieta = document.createElement('div');
    quieta.className = 'vela-apagada';
    quieta.id = 'wish-candle';   // ancla de un corazón de la Cacería: se conserva el id
    quieta.innerHTML = ico('i-vela') + '<span class="vela-humo" aria-hidden="true"></span><span class="sr-only">Una vela apagada</span>';
    vela.replaceWith(quieta);
    var deseo = quieta.closest('.cartas-deseo');
    var frase = deseo && deseo.querySelector('p.font-hand');
    if (frase && P.vela) frase.textContent = P.vela;
    var fin = document.getElementById('wish-final');
    if (fin) fin.remove();
  }
})();
