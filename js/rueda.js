/* ======================================================================
   "PARA CUANDO COMETO UN ERROR" — la rueda de las 100 formas de pedir perdón
   Un círculo en el Buzón (#rueda-abrir) se expande (clip-path: circle, 800 ms,
   ease-emph) hasta cubrir la pantalla y aparece la rueda, dibujada en un <canvas>
   2D con las constantes del original:
     TICK 16 ms · INTERVAL 9 cuadros entre frases · R0 182 · R_MAX 342
   Cada frase es un rayo con el texto rotado radialmente, en sentido horario desde las
   12; el color recorre de frío (índigo) a cálido (oro): del dolor a la reconciliación.
   El rayo nuevo entra deslizándose ~12 px y brilla en casi blanco mientras es el actual;
   toda la rueda gira muy despacio. El centro dice "100 RAZONES / PARA PEDIR PERDÓN", la
   frase actual en serif cursiva con fundido y el contador N° 031. Un arco dorado de progreso
   crece desde las 12. Al llegar a 100: "Perdóname. Siempre." y N° 100; tocar un rayo
   muestra su frase. Un toque antes de terminar pausa/continúa.
   Cada rayo se cachea en un canvas fuera de pantalla. Un solo rAF por rueda; al cerrar se
   destruye todo (rAF, listeners, cachés). Contenido: contenido/rueda.js.
   Reduced-motion: la rueda aparece completa y quieta.
====================================================================== */
(function () {
  'use strict';
  var FRASES = window.RUEDA_FRASES || [], TITULO = window.RUEDA_TITULO || ['100 RAZONES', 'PARA PEDIR PERDÓN'], CIERRE = window.RUEDA_CIERRE || 'Perdóname. Siempre.';
  var abrirBtn = document.getElementById('rueda-abrir');
  var overlay = document.getElementById('rueda');
  if (!abrirBtn || !overlay || !FRASES.length) return;
  var canvas = document.getElementById('rueda-canvas');
  var cerrarBtn = document.getElementById('rueda-cerrar');
  var repetirBtn = document.getElementById('rueda-repetir');
  var lista = document.getElementById('rueda-lista');
  var estado = document.getElementById('rueda-estado');
  var REDUCIDO = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var TICK = 16, INTERVAL = 9, R0 = 182, R_MAX = 342, REF = 700, C = REF / 2, N = FRASES.length;
  var SERIF = "'Playfair Display', Georgia, serif", SANS = "'Inter', Helvetica, Arial, sans-serif";
  var BGC = [.06, .05, .13], CREAM = [1, .95, .88], GOLD = [.86, .69, .40], FLASH = [1, .97, .92];
  var STOPS = [[.42, .52, .98], [.68, .48, .96], [.96, .46, .68], [1, .62, .45], [1, .82, .46]];

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function mix(a, b, k) { return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]; }
  function hx(c, a) { return 'rgba(' + Math.round(c[0] * 255) + ',' + Math.round(c[1] * 255) + ',' + Math.round(c[2] * 255) + ',' + (a === undefined ? 1 : a) + ')'; }
  function palette(k) { k = clamp(k, 0, 1) * (STOPS.length - 1); var i = Math.min(STOPS.length - 2, Math.floor(k)); return mix(STOPS[i], STOPS[i + 1], k - i); }
  function easeOut(x) { return 1 - Math.pow(1 - clamp(x, 0, 1), 3); }
  function pad3(n) { return (n < 10 ? '00' : n < 100 ? '0' : '') + n; }
  function envolver(texto, max) {
    var pal = texto.split(' '), lineas = [], actual = '';
    pal.forEach(function (p) { if (actual && (actual + ' ' + p).length > max) { lineas.push(actual); actual = p; } else actual = actual ? actual + ' ' + p : p; });
    if (actual) lineas.push(actual);
    return lineas;
  }

  /* ---- una rueda (instancia desechable) ---- */
  function crearRueda() {
    var ctx = canvas.getContext('2d');
    var s = 1, dpr = 1, ps = 1;
    var rayos = [], n = 0, rot = 0, acc = 0, fr = 0, ultimo = 0, raf = 0, pausada = false, vivo = true;
    var estrellas = [], tCambio = 0, fraseVista = '', seleccion = -1, tSeleccion = 0, tFin = 0;
    for (var e = 0; e < 90; e++) estrellas.push({ x: Math.random() * REF, y: Math.random() * REF, r: .5 + Math.random() * 1.1, f: Math.random() * 6.28, v: .4 + Math.random() * .9 });

    function medir() {
      var lado = Math.floor(Math.min(window.innerWidth - 8, window.innerHeight - 96, 760));
      lado = Math.max(260, lado);
      dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.5 : 2);
      s = lado / REF; ps = s * dpr;
      canvas.style.width = canvas.style.height = lado + 'px';
      canvas.width = canvas.height = Math.round(lado * dpr);
      rayos.forEach(function (r) { r.cache = null; r.flashC = null; });   // se rehacen al nuevo tamaño
    }
    var medidor = document.createElement('canvas').getContext('2d');   // uno solo para medir todos los rayos
    function textoCache(i, color) {
      var tam = 11, tmp = medidor;
      tmp.font = '600 ' + tam + 'px ' + SANS;
      var w = tmp.measureText(FRASES[i]).width, max = R_MAX - R0 - 4, f = w > max ? max / w : 1;
      var cw = Math.ceil((w * f + 6) * ps), ch = Math.ceil(16 * ps);
      var oc = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(cw, ch) : Object.assign(document.createElement('canvas'), { width: cw, height: ch });
      var o = oc.getContext('2d');
      o.font = '600 ' + (tam * f * ps) + 'px ' + SANS; o.textBaseline = 'middle'; o.fillStyle = hx(color); o.fillText(FRASES[i], 2 * ps, ch / 2);
      return { img: oc, w: cw / ps, h: ch / ps };
    }
    function nuevoRayo(i, t) {
      return { i: i, color: palette(i / N), t0: t, tOff: 0, cache: null, flashC: null, cur: true };
    }

    function pintarEstrellas(t) {
      ctx.fillStyle = hx(CREAM);
      estrellas.forEach(function (st) {
        var a = REDUCIDO ? .5 : .25 + .6 * (.5 + .5 * Math.sin(t / 1000 * st.v + st.f));
        ctx.globalAlpha = a; ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, 6.283); ctx.fill();
      });
      ctx.globalAlpha = 1;
    }
    function textoEspaciado(txt, x, y, sp) {
      var w = 0, i; for (i = 0; i < txt.length; i++) w += ctx.measureText(txt[i]).width + sp; w -= sp;
      var cx = x - w / 2; ctx.textAlign = 'left';
      for (i = 0; i < txt.length; i++) { ctx.fillText(txt[i], cx, y); cx += ctx.measureText(txt[i]).width + sp; }
      ctx.textAlign = 'center';
    }

    function dibujar(t) {
      ctx.setTransform(ps, 0, 0, ps, 0, 0);
      ctx.clearRect(0, 0, REF, REF);
      /* círculo fino y anillos casi invisibles */
      ctx.lineWidth = 1; ctx.strokeStyle = hx([.06, .05, .13], 1);
      ctx.beginPath(); ctx.arc(C, C, R_MAX, 0, 6.283); ctx.stroke();
      ctx.strokeStyle = hx([.06, .05, .13], .7);
      ctx.beginPath(); ctx.arc(C, C, R_MAX - 52, 0, 6.283); ctx.stroke();
      ctx.beginPath(); ctx.arc(C, C, R0 - 3, 0, 6.283); ctx.stroke();
      pintarEstrellas(t);

      var fin = n >= N, actual = n - 1;
      for (var k = 0; k < rayos.length; k++) {
        var r = rayos[k];
        var edad = REDUCIDO ? 1 : clamp((t - r.t0) / 420, 0, 1), ent = easeOut(edad);
        var ang = -Math.PI / 2 + 2 * Math.PI * r.i / N + rot;
        if (!r.cache) r.cache = textoCache(r.i, r.color);
        var esActual = !fin && r.i === actual;
        var f = REDUCIDO ? 0 : (esActual ? 1 : clamp(1 - (t - (r.tOff || r.t0)) / 380, 0, 1) * (r.flashC ? 1 : 0));
        var alfa = (esActual || edad < 1 ? ent : 1) * (esActual ? 1 : .75);
        ctx.save(); ctx.translate(C, C); ctx.rotate(ang); ctx.translate(R0 + 12 * (1 - ent), 0);
        ctx.globalAlpha = alfa; ctx.drawImage(r.cache.img, 0, -r.cache.h / 2, r.cache.w, r.cache.h);
        if (f > .01) {
          if (!r.flashC) r.flashC = textoCache(r.i, FLASH);
          ctx.globalAlpha = f * ent; ctx.drawImage(r.flashC.img, 0, -r.flashC.h / 2, r.flashC.w, r.flashC.h);
        } else if (r.flashC && !esActual) r.flashC = null;
        ctx.restore();
      }
      ctx.globalAlpha = 1;

      /* arco de progreso desde las 12 en punto */
      if (n > 0) {
        ctx.lineWidth = 2; ctx.strokeStyle = hx(GOLD, .9); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(C, C, R_MAX + 6, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * (fin ? 1 : n / N)); ctx.stroke();
      }

      /* centro */
      var resp = fin && !REDUCIDO ? 1 + .012 * Math.sin(t / 900) : 1;
      ctx.save(); ctx.translate(C, C); ctx.scale(resp, resp); ctx.translate(-C, -C);
      ctx.fillStyle = hx(BGC, .97); ctx.beginPath(); ctx.arc(C, C, R0 - 18, 0, 6.283); ctx.fill();
      ctx.lineWidth = 1; ctx.strokeStyle = hx(GOLD, .28); ctx.stroke();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = hx(GOLD); ctx.font = '600 9px ' + SANS;
      textoEspaciado(TITULO[0], C, C - 100, 3.4); textoEspaciado(TITULO[1], C, C - 86, 3.4);
      /* frase actual (o la del rayo tocado, o el cierre) con fundido */
      var texto, num, mostrandoSel = seleccion >= 0 && fin;
      if (fin && !mostrandoSel) { texto = CIERRE; num = N; }
      else if (mostrandoSel) { texto = FRASES[seleccion]; num = seleccion + 1; }
      else { texto = n ? FRASES[n - 1] : ''; num = n; }
      if (texto !== fraseVista) { fraseVista = texto; tCambio = t; }
      var af = REDUCIDO ? 1 : clamp((t - tCambio) / 250, 0, 1);
      var tam = Math.max(26, 15 / s);
      var lineas = envolver(texto, 16), alto = tam * 1.18, y0 = C - ((lineas.length - 1) * alto) / 2 + 2;
      ctx.globalAlpha = af; ctx.fillStyle = hx(CREAM); ctx.font = 'italic ' + tam + 'px ' + SERIF;
      lineas.forEach(function (l, i) { ctx.fillText(l, C, y0 + i * alto); });
      ctx.globalAlpha = 1;
      ctx.strokeStyle = hx(GOLD, .55); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(C - 14, C + 62); ctx.lineTo(C + 14, C + 62); ctx.stroke();
      ctx.fillStyle = hx(GOLD, .75); ctx.font = '600 9px ' + SANS; ctx.fillText('N° ' + pad3(num), C, C + 80);
      ctx.restore();
    }

    function cuadro(t) {
      raf = 0;
      if (!vivo) return;
      var dt = ultimo ? Math.min(64, t - ultimo) : TICK; ultimo = t;
      if (!pausada && !REDUCIDO) {
        acc += dt;
        while (acc >= TICK) {
          acc -= TICK; fr++; rot -= .0006;
          if (n < N && fr % INTERVAL === 0) {
            var prev = rayos[rayos.length - 1]; if (prev) prev.tOff = t;
            rayos.push(nuevoRayo(n, t)); n++;
            if (n >= N) tFin = t;
          }
        }
      }
      if (seleccion >= 0 && t - tSeleccion > 3500) seleccion = -1;
      dibujar(t);
      if (REDUCIDO) { return; }
      raf = requestAnimationFrame(cuadro);
    }

    function tocar(e) {
      var r = canvas.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * REF, y = (e.clientY - r.top) / r.height * REF;
      if (n >= N) {
        var dx = x - C, dy = y - C, rad = Math.sqrt(dx * dx + dy * dy);
        if (rad >= R0 - 6 && rad <= R_MAX + 6) {
          var a = Math.atan2(dy, dx) - rot + Math.PI / 2; a = ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
          seleccion = Math.round(a / (2 * Math.PI) * N) % N; tSeleccion = performance.now();
          if (REDUCIDO) dibujar(tSeleccion);
        }
      } else {
        pausada = !pausada;
        if (estado) estado.textContent = pausada ? 'Rueda en pausa' : 'Rueda en marcha';
      }
    }
    function visibilidad() { if (document.hidden) { if (raf) { cancelAnimationFrame(raf); raf = 0; } } else if (vivo && !raf && !REDUCIDO) { ultimo = 0; raf = requestAnimationFrame(cuadro); } }
    var onResize = function () { medir(); if (REDUCIDO) dibujar(performance.now()); };

    canvas.addEventListener('pointerdown', tocar);
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', visibilidad);
    medir();
    if (REDUCIDO) {
      for (var i = 0; i < N; i++) { var r0 = nuevoRayo(i, 0); r0.cur = false; rayos.push(r0); } n = N; dibujar(performance.now());
      if (estado) estado.textContent = CIERRE;
    } else raf = requestAnimationFrame(cuadro);

    return {
      destruir: function () {
        vivo = false; if (raf) cancelAnimationFrame(raf); raf = 0;
        canvas.removeEventListener('pointerdown', tocar); window.removeEventListener('resize', onResize); document.removeEventListener('visibilitychange', visibilidad);
        rayos.length = 0; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
      },
    };
  }

  /* ---- abrir / cerrar el overlay ---- */
  var rueda = null, abierta = false, tCierre = 0, desde = abrirBtn;
  /* se abre desde el círculo del Buzón o desde otro (el del final de la línea del tiempo) */
  function origen() {
    var r = desde.getBoundingClientRect();
    overlay.style.setProperty('--ox', Math.round(r.left + r.width / 2) + 'px');
    overlay.style.setProperty('--oy', Math.round(r.top + r.height / 2) + 'px');
  }
  function abrir(boton) {
    if (abierta) return;
    desde = boton && boton.getBoundingClientRect ? boton : abrirBtn;
    clearTimeout(tCierre);
    abierta = true; origen();
    overlay.hidden = false; void overlay.offsetWidth;
    overlay.classList.add('abierta');
    canvasPauseReasons.add('rueda'); updateCanvasPauseState();
    if (window.Sonidos) window.Sonidos.play('abrir');
    if (!rueda) rueda = crearRueda();
    cerrarBtn.focus({ preventScroll: true });
  }
  function cerrar() {
    if (!abierta) return;
    abierta = false; origen();
    overlay.classList.remove('abierta');
    if (window.Sonidos) window.Sonidos.play('cerrar');
    tCierre = setTimeout(function () {
      if (rueda) { rueda.destruir(); rueda = null; }
      overlay.hidden = true;
      canvasPauseReasons.delete('rueda'); updateCanvasPauseState();
    }, REDUCIDO ? 220 : 820);
    desde.focus({ preventScroll: true });
  }
  function repetir() { if (rueda) rueda.destruir(); rueda = crearRueda(); if (estado) estado.textContent = 'Rueda reiniciada'; }

  lista.innerHTML = FRASES.map(function (f) { return '<li>' + f.replace(/</g, '&lt;') + '</li>'; }).join('');
  abrirBtn.addEventListener('click', function () { abrir(abrirBtn); });
  cerrarBtn.addEventListener('click', cerrar);
  repetirBtn.addEventListener('click', repetir);
  document.addEventListener('keydown', function (e) {
    if (!abierta) return;
    if (e.key === 'Escape') { cerrar(); e.preventDefault(); e.stopPropagation(); }
    else if (e.key === 'Tab') {
      var f = [cerrarBtn, repetirBtn, canvas], pos = f.indexOf(document.activeElement);
      if (e.shiftKey && pos <= 0) { f[f.length - 1].focus(); e.preventDefault(); }
      else if (!e.shiftKey && pos === f.length - 1) { f[0].focus(); e.preventDefault(); }
      else if (pos === -1) { f[0].focus(); e.preventDefault(); }
    }
  }, true);
  window.Rueda = { abrir: abrir, cerrar: cerrar };
})();
