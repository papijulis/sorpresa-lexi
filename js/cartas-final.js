/* ======================================================================
   LAS CARTAS DEL FINAL (2026-11-05: vuelta al pergamino, con un solo sobre)
   Las cartas largas —la carta del Capítulo 1 (LETTER), "Para seguir
   escribiendo" (CARTA_FINAL), "Para Lexi" (CARTA_PARA_LEXI) y, si existe, la
   cuarta (CARTA_CUARTA; mientras no tiene texto se muestra como papel en
   blanco)— viven detrás de UN solo sobre:
     • Al bajar, el sobre (un cuadrito lila) crece con el scroll hasta ocupar la
       pantalla y en ese momento se vuelve un pop-up fijo (#carta-lector) con la
       carta en papel de pergamino, como la versión anterior: texto con scroll
       propio, tinta que aparece párrafo por párrafo y las flechas redondas con
       "Carta N de M" (M = cuántas cartas hay) para cambiar entre ellas (←/→ y
       deslizar también).
     • Al cerrar (✕, Esc o tocar fuera) el pop-up se encoge de nuevo hasta el
       sobre, que queda quieto al centro; la página se queda justo al final de la
       pista, así que para volver a abrirlo basta tocarlo o subir con el scroll
       (el sobre vuelve a crecer al regresar hacia el centro de la pista).
   El crecimiento es simétrico respecto al centro de la pista: entrar desde arriba
   o desde abajo lo abre igual. Mientras el pop-up está abierto la página no se
   mueve (html.carta-abierta) y el canvas principal se pausa.
   #letter-container (ancla de un corazón de la Cacería) es el propio sobre.
   Con prefers-reduced-motion: sin pista; el sobre es un botón que abre el pop-up.
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
  ];
  /* la cuarta carta (contenido/cartas.js): mientras Julio la escribe es un papel en blanco */
  var C4 = window.CARTA_CUARTA;
  if (C4) datos.push(C4.texto ? { titulo: C4.titulo || 'La cuarta carta', texto: C4.texto } : { titulo: C4.titulo || 'La cuarta carta', pendiente: C4.pendiente || 'Todavía la estoy escribiendo.' });
  datos = datos.filter(function (c) { return c.texto || c.pendiente; });
  var N = datos.length;
  if (!N) return;
  var NUM = ['', 'Una carta guardada', 'Dos cartas guardadas', 'Tres cartas guardadas', 'Cuatro cartas guardadas', 'Cinco cartas guardadas', 'Seis cartas guardadas'];
  var cabSub = seccion.querySelector('.cartas-final-cab p');
  if (cabSub && NUM[N]) cabSub.textContent = NUM[N] + ' en un solo sobre.';
  var estatica = E.reducido;
  if (estatica) seccion.classList.add('estatica');

  var LADO = 128;            // lado del sobre en px
  var R_SOBRE = 26, R_CARTA = 22;
  var flor = '<svg class="carta-flourish" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><path d="M32 4 C36 16 48 20 58 18 C48 26 44 38 48 50 C38 44 26 44 18 52 C22 40 16 28 6 22 C18 22 28 14 32 4Z"/></svg>';

  /* ---- la pista con el sobre ---- */
  host.innerHTML =
    '<div class="carta-pista">' +
      '<div class="carta-escena">' +
        '<div class="carta-marco" aria-hidden="true">' +
          '<div class="carta-papel">' + flor + flor.replace('carta-flourish', 'carta-flourish der') +
            '<p class="carta-etiqueta">Carta 1 de ' + N + '</p><p class="carta-titulo font-hand">' + datos[0].titulo + '</p>' +
          '</div>' +
          '<div class="carta-cara"></div>' +
        '</div>' +
        '<div class="carta-sobre" id="letter-container">' +
          '<button type="button" class="carta-sobre-btn" aria-label="Abrir las cartas del final (' + N + ' cartas)">' + ico('i-sobre-carta') + '</button>' +
        '</div>' +
        '<p class="carta-pista-nota font-hand">' + N + ' cartas para ti · toca el sobre o desliza para abrirlo</p>' +
      '</div>' +
    '</div>';
  var pista = host.querySelector('.carta-pista');
  var marco = host.querySelector('.carta-marco');
  var papel = host.querySelector('.carta-papel');
  var cara = host.querySelector('.carta-cara');
  var sobre = host.querySelector('.carta-sobre');
  var sobreBtn = host.querySelector('.carta-sobre-btn');
  var nota = host.querySelector('.carta-pista-nota');

  /* ---- el pop-up: la carta en pergamino ---- */
  var lector = document.createElement('div');
  lector.id = 'carta-lector';
  lector.className = 'carta-lector';
  lector.setAttribute('role', 'dialog');
  lector.setAttribute('aria-modal', 'true');
  lector.setAttribute('aria-labelledby', 'carta-lector-titulo');
  lector.inert = true;
  lector.innerHTML =
    '<div class="carta-lector-caja">' +
      '<div class="carta-lector-papel">' + flor + flor.replace('carta-flourish', 'carta-flourish der') +
        '<button type="button" class="carta-lector-cerrar" aria-label="Cerrar la carta">' + ico('i-cerrar') + '</button>' +
        '<header class="carta-cab"><p class="carta-etiqueta" id="carta-lector-n"></p><h3 class="carta-titulo font-hand" id="carta-lector-titulo"></h3><p class="carta-sub"></p></header>' +
        '<div class="carta-texto" tabindex="0" role="region" aria-label="Texto de la carta" aria-live="polite"></div>' +
        '<div class="letter-nav" role="group" aria-label="Cambiar de carta">' +
          '<button type="button" id="letter-back" class="letter-nav-btn letter-nav-prev" aria-label="Carta anterior">' + ico('i-siguiente') + '</button>' +
          '<span id="letter-nav-n" class="letter-nav-n"></span>' +
          '<button type="button" id="letter-switch" class="letter-nav-btn" aria-label="Siguiente carta">' + ico('i-siguiente') + '</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  document.body.appendChild(lector);
  var caja = lector.querySelector('.carta-lector-caja');
  var lcTexto = lector.querySelector('.carta-texto');
  var lcCerrar = lector.querySelector('.carta-lector-cerrar');
  var btnAnt = lector.querySelector('#letter-back');
  var btnSig = lector.querySelector('#letter-switch');
  var lcN = lector.querySelector('#letter-nav-n');

  var actual = 0, abierto = false, animando = false, origen = null, timers = [], bloqueoHasta = 0;

  function limpiarTinta() { timers.forEach(clearTimeout); timers = []; }
  function pintarCarta(i, conTinta) {
    var c = datos[i];
    actual = i;
    lector.querySelector('#carta-lector-n').textContent = 'Carta ' + (i + 1) + ' de ' + N;
    lector.querySelector('.carta-titulo').textContent = c.titulo;
    var sub = lector.querySelector('.carta-sub'); sub.textContent = c.sub || ''; sub.hidden = !c.sub;
    limpiarTinta();
    lcTexto.innerHTML = '';
    if (c.pendiente) {
      var pe = document.createElement('p');
      pe.className = 'carta-pendiente font-hand' + (conTinta ? ' ink-hidden' : '');
      pe.textContent = c.pendiente;
      lcTexto.appendChild(pe);
      if (conTinta) timers.push(setTimeout(function () { pe.classList.add('ink-in'); }, 260));
      terminarPintado(i, c);
      return;
    }
    var ps = c.texto.split('\n\n');
    var els = ps.map(function (t, k) {
      var p = document.createElement('p');
      p.className = (k === ps.length - 1 ? 'carta-firma font-hand' : 'carta-parrafo') + (conTinta ? ' ink-hidden' : '');
      p.textContent = t;
      lcTexto.appendChild(p);
      return p;
    });
    var sello = document.createElement('div'); sello.className = 'wax-seal'; sello.setAttribute('aria-hidden', 'true'); sello.textContent = 'J';
    lcTexto.appendChild(sello);
    lcTexto.scrollTop = 0;
    if (conTinta) els.forEach(function (p, k) { timers.push(setTimeout(function () { p.classList.add('ink-in'); }, 120 + Math.min(k, 7) * 300)); });
    terminarPintado(i, c);
  }
  function terminarPintado(i, c) {
    lcTexto.classList.toggle('es-pendiente', !!c.pendiente);
    lcTexto.scrollTop = 0;
    lcN.textContent = 'Carta ' + (i + 1) + ' de ' + N;
    var foco = document.activeElement;
    btnAnt.disabled = i === 0;
    btnSig.disabled = i === N - 1;
    /* si se desactivó el botón que tenía el foco, el foco no debe salirse del diálogo */
    if ((foco === btnSig && btnSig.disabled) || (foco === btnAnt && btnAnt.disabled)) {
      var otro = foco === btnSig ? btnAnt : btnSig;
      (otro.disabled ? lcCerrar : otro).focus({ preventScroll: true });
    }
    var t = papel.querySelector('.carta-titulo'); if (t) t.textContent = c.titulo;
    var e = papel.querySelector('.carta-etiqueta'); if (e) e.textContent = 'Carta ' + (i + 1) + ' de ' + N;
  }
  function irCarta(d) {
    var j = actual + d;
    if (!abierto || j < 0 || j >= N) return;
    lcTexto.classList.add('cambiando');
    setTimeout(function () { lcTexto.classList.remove('cambiando'); pintarCarta(j, !E.reducido); }, E.reducido ? 0 : 260);
    if (window.Sonidos) window.Sonidos.play('mes');
  }
  btnAnt.addEventListener('click', function () { irCarta(-1); });
  btnSig.addEventListener('click', function () { irCarta(1); });

  /* rectángulo del sobre dentro de la caja del pop-up, como clip-path inset */
  function insetDesde(r, cr, radio) {
    return 'inset(' + (r.top - cr.top).toFixed(1) + 'px ' + (cr.right - r.right).toFixed(1) + 'px ' + (cr.bottom - r.bottom).toFixed(1) + 'px ' + (r.left - cr.left).toFixed(1) + 'px round ' + radio + 'px)';
  }
  function rectSobreCentrado() {
    /* centro real de la escena (100svh): en iPhone innerHeight puede ser el viewport grande */
    var cx = window.innerWidth / 2, cy = window.innerHeight / 2;
    var esc = host.querySelector('.carta-escena');
    if (esc) {
      var er = esc.getBoundingClientRect();
      if (er.width > 0 && er.height > 0) { cx = er.left + er.width / 2; cy = er.top + er.height / 2; }
    }
    return { left: cx - LADO / 2, right: cx + LADO / 2, top: cy - LADO / 2, bottom: cy + LADO / 2 };
  }

  /* desde: 'scroll' (el marco ya ocupa la pantalla) o el rect del sobre (al tocarlo) */
  function abrir(desdeRect) {
    if (abierto || animando) return;
    abierto = true;
    origen = desdeRect ? document.activeElement : sobreBtn;   // abierta con el scroll: al cerrar el foco queda en el sobre
    pintarCarta(actual, !E.reducido);
    lector.inert = false;
    document.documentElement.classList.add('carta-abierta');
    canvasPauseReasons.add('carta-lector'); updateCanvasPauseState();
    if (window.Sonidos) window.Sonidos.play('abrir');
    if (E.reducido || !desdeRect) {
      caja.style.clipPath = '';
      lector.classList.add('abierto', 'sin-anim');
      requestAnimationFrame(function () { lector.classList.remove('sin-anim'); });
    } else {
      var cr = caja.getBoundingClientRect();
      lector.classList.add('sin-anim', 'desde-sobre');
      caja.style.clipPath = insetDesde(desdeRect, cr, R_SOBRE);
      void caja.offsetWidth;
      lector.classList.remove('sin-anim');
      lector.classList.add('abierto');
      animando = true;
      caja.style.clipPath = 'inset(0px 0px 0px 0px round ' + R_CARTA + 'px)';
      setTimeout(function () { animando = false; lector.classList.remove('desde-sobre'); }, 760);
    }
    lcCerrar.focus({ preventScroll: true });
  }

  function cerrar() {
    if (!abierto || animando) return;
    abierto = false;
    limpiarTinta();
    if (window.Sonidos) window.Sonidos.play('cerrar');
    document.documentElement.classList.remove('carta-abierta');
    canvasPauseReasons.delete('carta-lector'); updateCanvasPauseState();
    if (!estatica) {
      /* la página se acomoda al final de la pista: ahí el sobre está chico y al centro,
         justo donde termina de encogerse el pop-up */
      bloqueoHasta = performance.now() + 900;
      window.scrollTo({ top: Math.round(medidas.top + medidas.rec), behavior: 'instant' });
    }
    if (E.reducido) {
      lector.classList.remove('abierto');
      finCerrar();
      return;
    }
    var cr = caja.getBoundingClientRect();
    animando = true;
    lector.classList.add('hacia-sobre');
    caja.style.clipPath = insetDesde(rectSobreCentrado(), cr, R_SOBRE);
    setTimeout(function () {
      lector.classList.add('sin-anim');
      lector.classList.remove('abierto', 'hacia-sobre');
      caja.style.clipPath = '';
      void caja.offsetWidth;
      lector.classList.remove('sin-anim');
      animando = false;
      finCerrar();
    }, 720);
  }
  function finCerrar() {
    lector.inert = true;
    var a = origen && document.contains(origen) && origen !== document.body ? origen : sobreBtn;
    a.focus({ preventScroll: true });
    origen = null;
  }

  lcCerrar.addEventListener('click', cerrar);
  lector.addEventListener('pointerdown', function (e) { if (e.target === lector) cerrar(); });
  document.addEventListener('keydown', function (e) {
    /* con el aviso (modal) encima, Esc/Tab son del modal, no del lector */
    var modal = document.getElementById('app-modal');
    if (!abierto || (modal && modal.classList.contains('open'))) return;
    if (e.key === 'Escape') { cerrar(); e.preventDefault(); }
    else if (e.key === 'ArrowRight' && document.activeElement !== lcTexto) { irCarta(1); e.preventDefault(); }
    else if (e.key === 'ArrowLeft' && document.activeElement !== lcTexto) { irCarta(-1); e.preventDefault(); }
    else if (e.key === 'Tab') {
      var f = Array.prototype.filter.call(caja.querySelectorAll('button, [tabindex="0"]'), function (x) { return !x.disabled; });
      var pos = f.indexOf(document.activeElement);
      if (pos === -1) { if (f.length) f[e.shiftKey ? f.length - 1 : 0].focus(); e.preventDefault(); return; }
      if (e.shiftKey && pos <= 0) { f[f.length - 1].focus(); e.preventDefault(); }
      else if (!e.shiftKey && pos === f.length - 1) { f[0].focus(); e.preventDefault(); }
    }
  });
  /* deslizar entre cartas (solo táctil; con el mouse se selecciona texto) */
  var tx = null, ty = 0;
  caja.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  caja.addEventListener('touchend', function (e) {
    if (tx === null) return;
    var dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
    tx = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) irCarta(dx < 0 ? 1 : -1);
  });

  sobreBtn.addEventListener('click', function () {
    if (estatica) { abrir(null); return; }
    abrir(sobre.getBoundingClientRect());
  });

  /* mientras dura un salto programático (enlaces de la barra superior) la carta
     no se abre sola al pasar por el centro de la pista; se libera tras ~12 cuadros quietos */
  var autoPausa = false, framesQuieto = 0;
  window.CartasFinal = { pausarAuto: function () { autoPausa = true; framesQuieto = 0; } };

  if (estatica) return;

  /* ---- la pista: el sobre crece con el scroll (simétrico respecto al centro) ---- */
  var medidas = { top: 0, h: 0, rec: 1, mw: 0, mh: 0 };
  function medir() {
    var r = pista.getBoundingClientRect();
    medidas.top = r.top + (window.scrollY || 0);
    medidas.h = pista.offsetHeight;
    medidas.rec = Math.max(1, medidas.h - window.innerHeight);
    medidas.mw = marco.offsetWidth; medidas.mh = marco.offsetHeight;
    ultimoX = -1;
    ultimoP = null;
  }
  var mt = 0;
  window.addEventListener('resize', function () { clearTimeout(mt); mt = setTimeout(medir, 160); });
  window.addEventListener('load', function () { setTimeout(medir, 300); });
  if ('ResizeObserver' in window) new ResizeObserver(function () { clearTimeout(mt); mt = setTimeout(medir, 160); }).observe(document.getElementById('main-content') || document.body);
  setTimeout(medir, 1500);

  var emph = M.ease(.7, 0, .2, 1), lerp = M.lerp, clamp = M.clamp, suave = M.suave;
  var ultimoX = -1;
  var ultimoP = null;

  function aplicar(x) {
    var mw = medidas.mw, mh = medidas.mh;
    var a = emph(x);
    var w = lerp(LADO, mw, a), h = lerp(LADO, mh, a), r = lerp(R_SOBRE, R_CARTA, a);
    var t = (mh - h) / 2, l = (mw - w) / 2;
    marco.style.clipPath = 'inset(' + t.toFixed(1) + 'px ' + l.toFixed(1) + 'px ' + t.toFixed(1) + 'px ' + l.toFixed(1) + 'px round ' + r.toFixed(1) + 'px)';
    cara.style.opacity = (1 - suave((x - .15) / .55)).toFixed(3);
    papel.style.opacity = suave((x - .1) / .5).toFixed(3);
    papel.classList.toggle('con-titulo', x > .72);
    var icono = 1 - suave(x / .22);
    sobre.style.opacity = icono.toFixed(3);
    sobre.style.transform = 'scale(' + (1 + a * .6).toFixed(3) + ')';
    sobre.classList.toggle('apagado', icono < .5);
    nota.style.opacity = (1 - suave(x / .18)).toFixed(3);
    marco.classList.toggle('con-brillo', x > .02 && x < .9);
  }

  function cuadro(E) {
    if (abierto || animando) return;
    if (autoPausa) { if (E.dy === 0) { if (++framesQuieto > 12) autoPausa = false; } else framesQuieto = 0; }
    var p = clamp((E.y - medidas.top) / medidas.rec, 0, 1);
    var d = Math.min(p, 1 - p) * 2;                 // 0 en los extremos de la pista, 1 en el centro
    var x = clamp((d - .12) / .82, 0, 1);
    /* un deslizamiento rápido puede saltarse la ventana del centro: también cuenta cruzarlo */
    var cruzo = ultimoP !== null && ultimoP !== p && (ultimoP - .5) * (p - .5) <= 0;
    ultimoP = p;
    if (x === ultimoX) return;
    var subiendo = x > ultimoX;
    ultimoX = x;
    aplicar(x);
    var otraCapa = typeof canvasPauseReasons !== 'undefined' && canvasPauseReasons.size > 0;   // Buzón, Juegos, Infinito, visor…
    if (autoPausa || otraCapa || performance.now() <= bloqueoHasta) return;
    if ((x >= .985 && subiendo) || (cruzo && x > .85)) abrir(null);
  }
  medir();
  aplicar(0);
  M.suscribir(cuadro);
})();
