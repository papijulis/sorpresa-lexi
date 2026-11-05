/* ======================================================================
   LAS CARTAS DEL FINAL (rediseño de movimiento)
   Las tres cartas largas del recorrido —la carta del Capítulo 1, "Para seguir
   escribiendo" y "Para Lexi"— ya no viven en el Buzón ni en un pergamino: cada una
   tiene una pista de scroll alta con un escenario fijo (sticky) y un progreso p∈[0,1]:
     0 – 0.20  un rectángulo lila pequeño (con anticipación) se expande hasta casi toda
               la pantalla (un solo elemento: clip-path inset + radio, ease-emph)
     0.20–0.80 se queda fija para leer con calma: texto seleccionable, con scroll
               interno que encadena con la página al llegar al final
     0.80–1    se encoge hasta volverse un sobre (ícono i-sobre-carta) que queda en la
               fila de sobres, con un brillo suave
   Todo es scrub (reversible, sin saltos). Tocar un sobre reabre la carta como panel
   grande (✕, Esc, clic fuera). La vela del deseo quedó como remate (#wish-candle).
   Con prefers-reduced-motion: tarjetas apiladas, sin scrub.
   Un solo bucle: motor.js.
====================================================================== */
(function () {
  'use strict';
  var M = window.Motor, E = M.estado;
  var host = document.getElementById('cartas-pistas');
  var seccion = document.getElementById('cartas-final');
  if (!host || !seccion) return;

  var datos = [
    { titulo: 'Carta del Capítulo 1', sub: '21 de septiembre de 2026', texto: window.LETTER },
    { titulo: (window.CARTA_FINAL && window.CARTA_FINAL.titulo) || 'Para seguir escribiendo', texto: window.CARTA_FINAL && window.CARTA_FINAL.texto },
    { titulo: (window.CARTA_PARA_LEXI && window.CARTA_PARA_LEXI.titulo) || 'Para Lexi', texto: window.CARTA_PARA_LEXI && window.CARTA_PARA_LEXI.texto },
  ].filter(function (c) { return c.texto; });
  var N = datos.length;
  if (!N) return;
  var estatica = E.reducido;
  if (estatica) seccion.classList.add('estatica');

  function parrafos(contenedor, texto, conTinta) {
    var ps = texto.split('\n\n'), lista = [];
    ps.forEach(function (t, i) {
      var p = document.createElement('p');
      p.className = (i === ps.length - 1 ? 'carta-firma font-hand' : 'carta-parrafo') + (conTinta ? ' ink-hidden' : '');
      p.textContent = t;
      contenedor.appendChild(p); lista.push(p);
    });
    return lista;
  }
  function sobre(extra) { return ico('i-sobre-carta', extra || ''); }

  /* ---- pistas ---- */
  var pistas = datos.map(function (c, k) {
    var pista = document.createElement('div');
    pista.className = 'carta-pista';
    var slots = '';
    for (var s = 0; s < N; s++) slots += '<button type="button" class="carta-slot" data-s="' + s + '" tabindex="-1" aria-label="Abrir carta: ' + datos[s].titulo.replace(/"/g, '') + '" title="' + datos[s].titulo.replace(/"/g, '') + '">' + sobre() + '</button>';
    pista.innerHTML =
      '<div class="carta-escena">' +
        '<div class="carta-marco"><div class="carta-glow">' +
          '<article class="carta-panel"' + (k === 0 ? ' id="letter-container"' : '') + ' aria-label="' + c.titulo.replace(/"/g, '') + '">' +
            '<div class="carta-color" aria-hidden="true"></div>' +
            '<div class="carta-cuerpo">' +
              '<header class="carta-cab"><p class="carta-etiqueta">Carta ' + (k + 1) + ' de ' + N + '</p>' +
              '<h3 class="carta-titulo font-hand">' + c.titulo + '</h3>' + (c.sub ? '<p class="carta-sub">' + c.sub + '</p>' : '') + '</header>' +
              '<div class="carta-texto" tabindex="0" role="region" aria-label="Texto de la carta"></div>' +
            '</div>' +
            '<div class="carta-icono" aria-hidden="true">' + sobre() + '</div>' +
          '</article>' +
        '</div></div>' +
        '<div class="carta-slots" role="group" aria-label="Cartas guardadas">' + slots + '</div>' +
      '</div>';
    host.appendChild(pista);
    var texto = pista.querySelector('.carta-texto');
    var ps = parrafos(texto, c.texto, true);
    return {
      el: pista, k: k, marco: pista.querySelector('.carta-marco'), glow: pista.querySelector('.carta-glow'), panel: pista.querySelector('.carta-panel'),
      color: pista.querySelector('.carta-color'), cuerpo: pista.querySelector('.carta-cuerpo'), icono: pista.querySelector('.carta-icono'),
      slots: Array.prototype.slice.call(pista.querySelectorAll('.carta-slot')), ps: ps, texto: texto,
      top: 0, h: 0, mw: 0, mh: 0, sx: 0, sy: 0, ultimoP: -1, tinta: false,
    };
  });

  /* ---- lector: un sobre guardado reabre la carta como panel grande ---- */
  var lector = document.createElement('div');
  lector.id = 'carta-lector';
  lector.className = 'carta-lector';
  lector.setAttribute('role', 'dialog');
  lector.setAttribute('aria-modal', 'true');
  lector.setAttribute('aria-label', 'Carta');
  lector.innerHTML = '<div class="carta-lector-caja vidrio"><button type="button" class="app-view-close carta-lector-cerrar" aria-label="Cerrar carta">' + ico('i-cerrar') + '</button><header class="carta-cab"><p class="carta-etiqueta"></p><h3 class="carta-titulo font-hand"></h3><p class="carta-sub"></p></header><div class="carta-texto carta-lector-texto" tabindex="0"></div></div>';
  document.body.appendChild(lector);
  var lectorAbierto = false, lectorOrigen = null;
  var lcCaja = lector.querySelector('.carta-lector-caja'), lcTexto = lector.querySelector('.carta-lector-texto'), lcCerrar = lector.querySelector('.carta-lector-cerrar');
  function abrirLector(i, origen) {
    var c = datos[i];
    lector.querySelector('.carta-etiqueta').textContent = 'Carta ' + (i + 1) + ' de ' + N;
    lector.querySelector('.carta-titulo').textContent = c.titulo;
    var sub = lector.querySelector('.carta-sub'); sub.textContent = c.sub || ''; sub.hidden = !c.sub;
    lcTexto.innerHTML = ''; parrafos(lcTexto, c.texto, false); lcTexto.scrollTop = 0;
    lector.classList.add('abierto'); lectorAbierto = true; lectorOrigen = origen || null;
    canvasPauseReasons.add('carta-lector'); updateCanvasPauseState();
    if (window.Sonidos) window.Sonidos.play('abrir');
    lcCerrar.focus({ preventScroll: true });
  }
  function cerrarLector() {
    if (!lectorAbierto) return;
    lectorAbierto = false; lector.classList.remove('abierto');
    canvasPauseReasons.delete('carta-lector'); updateCanvasPauseState();
    if (window.Sonidos) window.Sonidos.play('cerrar');
    if (lectorOrigen) lectorOrigen.focus({ preventScroll: true });
  }
  lcCerrar.addEventListener('click', cerrarLector);
  lector.addEventListener('pointerdown', function (e) { if (e.target === lector) cerrarLector(); });
  document.addEventListener('keydown', function (e) {
    if (!lectorAbierto) return;
    if (e.key === 'Escape') { cerrarLector(); e.preventDefault(); }
    else if (e.key === 'Tab') {   // foco atrapado entre ✕ y el texto
      var f = [lcCerrar, lcTexto], pos = f.indexOf(document.activeElement);
      if (e.shiftKey && pos <= 0) { f[1].focus(); e.preventDefault(); }
      else if (!e.shiftKey && pos === 1) { f[0].focus(); e.preventDefault(); }
    }
  });
  pistas.forEach(function (t) {
    t.slots.forEach(function (b) { b.addEventListener('click', function () { abrirLector(Number(b.dataset.s), b); }); });
  });

  if (estatica) {
    pistas.forEach(function (t) { t.ps.forEach(function (p) { p.classList.add('ink-in'); }); t.slots.forEach(function (b) { b.hidden = true; }); });
    return;
  }

  /* ---- medidas (fuera del cuadro) ---- */
  function medir() {
    var y = window.scrollY || 0;
    pistas.forEach(function (t) {
      var r = t.el.getBoundingClientRect();
      t.top = r.top + y; t.h = t.el.offsetHeight;
      var mr = t.marco.getBoundingClientRect();
      t.mw = mr.width; t.mh = mr.height;
      var sl = t.slots[t.k];
      if (sl) { var sr = sl.getBoundingClientRect(); t.sx = sr.left + sr.width / 2 - mr.left; t.sy = sr.top + sr.height / 2 - mr.top; }
      t.ultimoP = -1;
    });
  }
  var mt = 0;
  window.addEventListener('resize', function () { clearTimeout(mt); mt = setTimeout(medir, 160); });
  window.addEventListener('load', function () { setTimeout(medir, 300); });
  if ('ResizeObserver' in window) new ResizeObserver(function () { clearTimeout(mt); mt = setTimeout(medir, 160); }).observe(document.getElementById('main-content') || document.body);
  setTimeout(medir, 1500);
  medir();

  var emph = M.ease(.7, 0, .2, 1);
  var lerp = M.lerp, clamp = M.clamp;
  var R_GRANDE = 26, R_CHICO = 20, R_SOBRE = 18;

  function inset(cx, cy, w, h, r, mw, mh) {
    var t = cy - h / 2, l = cx - w / 2, ri = mw - (cx + w / 2), b = mh - (cy + h / 2);
    return 'inset(' + t.toFixed(1) + 'px ' + ri.toFixed(1) + 'px ' + b.toFixed(1) + 'px ' + l.toFixed(1) + 'px round ' + r.toFixed(1) + 'px)';
  }

  function aplicar(t, p) {
    var mw = t.mw, mh = t.mh, cx, cy, w, h, r, color, textoOp, icono = 0, glow = 0;
    if (p < .2) {                       // expandir
      var x = p / .2, a = emph(x);
      var ant = 1 - .07 * Math.sin(Math.PI * clamp(x / .28, 0, 1));   // anticipación: se contrae un poco antes de crecer
      w = lerp(96 * ant, mw, a); h = lerp(64 * ant, mh, a); cx = mw / 2; cy = mh / 2; r = lerp(R_CHICO, R_GRANDE, a);
      color = 1 - M.suave((x - .25) / .6); textoOp = M.suave((x - .72) / .28); glow = 1 - a;
    } else if (p < .8) {                // leer
      w = mw; h = mh; cx = mw / 2; cy = mh / 2; r = R_GRANDE; color = 0; textoOp = 1;
    } else {                            // encoger hasta el sobre
      var xs = (p - .8) / .2, b = emph(xs);
      w = lerp(mw, 58, b); h = lerp(mh, 58, b); cx = lerp(mw / 2, t.sx, b); cy = lerp(mh / 2, t.sy, b); r = lerp(R_GRANDE, R_SOBRE, b);
      color = M.suave(xs / .45); textoOp = 1 - M.suave(xs / .4); icono = M.suave((xs - .6) / .4); glow = b;
    }
    t.marco.style.clipPath = inset(cx, cy, w, h, r, mw, mh);
    t.glow.classList.toggle('con-brillo', glow > .02);
    t.color.style.opacity = color.toFixed(3);
    t.cuerpo.style.opacity = textoOp.toFixed(3);
    t.icono.style.opacity = icono.toFixed(3);
    t.panel.style.pointerEvents = p > .86 || p < .06 ? 'none' : '';
    /* tinta: los párrafos aparecen en cascada al leer, y se esconden al volver */
    var leyendo = p > .14 && p < .9;
    if (leyendo !== t.tinta) {
      t.tinta = leyendo;
      t.ps.forEach(function (el, i) { el.style.transitionDelay = leyendo ? (i * .32) + 's' : '0s'; el.classList.toggle('ink-in', leyendo); });
    }
    /* sobres guardados: los anteriores y, al terminar, esta misma */
    t.slots.forEach(function (b, s) {
      var guardado = s < t.k || (s === t.k && p >= .975);
      if (s > t.k) guardado = false;
      var estaba = b.classList.contains('guardado');
      if (guardado !== estaba) { b.classList.toggle('guardado', guardado); b.tabIndex = guardado ? 0 : -1; }
    });
  }

  function cuadro(E) {
    var vh = E.vh;
    for (var i = 0; i < pistas.length; i++) {
      var t = pistas[i];
      var recorrido = Math.max(1, t.h - vh);
      var p = clamp((E.y - t.top) / recorrido, 0, 1);
      if (p === t.ultimoP) continue;
      if ((E.y + vh < t.top - vh * .5 || E.y > t.top + t.h + vh * .5) && (t.ultimoP === 0 || t.ultimoP === 1) && p === (E.y > t.top ? 1 : 0)) { t.ultimoP = p; continue; }
      t.ultimoP = p;
      aplicar(t, p);
    }
  }
  pistas.forEach(function (t) { aplicar(t, 0); t.ultimoP = 0; });
  M.suscribir(cuadro);
})();
