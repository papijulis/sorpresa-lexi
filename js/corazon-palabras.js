/* ======================================================================
   CORAZÓN DE PALABRAS — "te amo" en decenas de idiomas, relleno de texto
   Reemplaza al corazón de idiomas por renglones. Va en el mismo lugar (#inf-lang,
   centrado dentro del corazón de flores del popup Infinito) y se genera AL MISMO
   TIEMPO que las flores: las palabras visibles = floor(p · total) con el progreso
   p ∈ [0,1] que infinito.js publica en window.heartProgress cada cuadro.
   • Forma: x = 16 sin³t, y = 13 cos t − 5 cos 2t − 2 cos 3t − cos 4t, rasterizada una
     vez en un canvas fuera de pantalla para saber qué puntos caen dentro.
   • Mosaico (se calcula UNA vez por tamaño, nunca por cuadro): palabras de 8 a 20 px,
     sin rotación y sin pisarse (rechazo con measureText, de grandes a chicas), "Te amo" y
     "Hasta la luna" grandes cerca del centro. Color por profundidad: del tono más oscuro
     en el borde al más claro en el centro (variables CSS del sitio).
   • Orden de aparición: recorrido angular desde arriba — lóbulo derecho, contorno hasta la
     punta, lado izquierdo — y al final el lóbulo izquierdo y el interior.
   • Dos capas: una estática con las palabras ya completas y el canvas animado solo para
     las que entran (fade-in ~420 ms) o destellan (cada ~260 ms 1–3 palabras, ~600 ms).
   • Un solo requestAnimationFrame; pausa con visibilitychange; destruir() lo limpia todo.
   Contenido: contenido/idiomas.js (IDIOMAS, IDIOMAS_GRANDES). Con prefers-reduced-motion
   dibuja todo de una vez, sin destellos.
====================================================================== */
(function () {
  'use strict';
  var FUENTE = "'Noto Sans', 'Segoe UI', system-ui, -apple-system, 'Playfair Display', sans-serif";
  var FLASH = [255, 247, 235];
  var ENTRADA_MS = 420, DESTELLO_MS = 600, CADA_MS = 260;

  function css(nombre, defecto) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(nombre).trim();
    return v || defecto;
  }
  function rgb(hex) {
    var m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
    if (!m) { var c = hex.match(/\d+/g); return c ? [+c[0], +c[1], +c[2]] : [168, 85, 247]; }
    var n = parseInt(m[1], 16); return [n >> 16, (n >> 8) & 255, n & 255];
  }
  function mezcla(a, b, k) { return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]; }
  function css3(c, a) { return 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + a + ')'; }
  function rand(a, b) { return Math.random() * (b - a) + a; }

  function crear(canvas) {
    var ctx = canvas.getContext('2d');
    var S = document.createElement('canvas'), sctx = S.getContext('2d');
    var REDUCIDO = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var W = 0, H = 0, dpr = 1, palabras = [], paleta = [];
    var mostradas = 0, entrando = [], destellos = [], corriendo = false, raf = 0, ultimoDestello = 0;

    function colorEn(prof) {   // prof 0 = borde, 1 = centro
      var n = paleta.length - 1, x = Math.min(.999, Math.max(0, prof)) * n, i = Math.floor(x);
      return mezcla(paleta[i], paleta[i + 1], x - i);
    }
    function fuente(px) { return '600 ' + px + 'px ' + FUENTE; }

    /* ---- mosaico: se calcula una vez por tamaño ---- */
    var ultimaClave = '';
    function medir(w, h, K, dpr_) {
      /* el mosaico es caro (miles de intentos): si el tamaño no cambió, se reutiliza */
      var clave = Math.round(w) + 'x' + Math.round(h) + '@' + dpr_ + ':' + document.documentElement.dataset.cielo;
      if (clave === ultimaClave && palabras.length) { reiniciar(); return; }
      ultimaClave = clave;
      W = w; H = h; dpr = dpr_;
      canvas.width = S.width = Math.round(W * dpr); canvas.height = S.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var dark = rgb(css('--ciruela-700', '#270D42'));
      var am = rgb(css('--amatista-500', '#A855F7')), or = rgb(css('--orquidea-400', '#C084FC')), la = rgb(css('--lavanda-200', '#E9D5FF'));
      paleta = [mezcla(dark, am, .55), am, or, la];

      var escala = K * 0.82, cx = W / 2, cy = H / 2 - 2.538 * escala;
      var mask = document.createElement('canvas'); mask.width = Math.max(1, Math.round(W)); mask.height = Math.max(1, Math.round(H));
      var mc = mask.getContext('2d'); mc.fillStyle = '#fff'; mc.beginPath();
      for (var i = 0; i <= 260; i++) {
        var t = (i / 260) * Math.PI * 2;
        var px = cx + 16 * Math.pow(Math.sin(t), 3) * escala;
        var py = cy - (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * escala;
        if (i) mc.lineTo(px, py); else mc.moveTo(px, py);
      }
      mc.closePath(); mc.fill();
      var datos = mc.getImageData(0, 0, mask.width, mask.height).data, MW = mask.width, MH = mask.height;
      function dentro(x, y) { x = Math.round(x); y = Math.round(y); return x >= 0 && y >= 0 && x < MW && y < MH && datos[(y * MW + x) * 4 + 3] > 140; }
      function profundidad(x, y) {   // distancia al borde (≤ 36 px) en 8 direcciones
        var m = 36;
        for (var a = 0; a < 8; a++) {
          var dx = Math.cos(a * .7854), dy = Math.sin(a * .7854);
          for (var d = 2; d < m; d += 2) { if (!dentro(x + dx * d, y + dy * d)) { m = d; break; } }
        }
        return m / 36;
      }

      var pool = (window.IDIOMAS || []).map(function (i) { return i.t; });
      var grandes = window.IDIOMAS_GRANDES || ['Te amo'];
      var puestas = [], celda = 28, rejilla = {};
      function choca(x, y, w, h) {
        var x0 = Math.floor((x - w / 2 - 3) / celda), x1 = Math.floor((x + w / 2 + 3) / celda), y0 = Math.floor((y - h / 2 - 3) / celda), y1 = Math.floor((y + h / 2 + 3) / celda);
        for (var gy = y0; gy <= y1; gy++) for (var gx = x0; gx <= x1; gx++) {
          var l = rejilla[gx + ',' + gy]; if (!l) continue;
          for (var k = 0; k < l.length; k++) { var p = l[k]; if (Math.abs(p.x - x) < (p.w + w) / 2 + 2 && Math.abs(p.y - y) < (p.h + h) / 2 + 1.5) return true; }
        }
        return false;
      }
      function registrar(p) {
        puestas.push(p);
        var x0 = Math.floor((p.x - p.w / 2) / celda), x1 = Math.floor((p.x + p.w / 2) / celda), y0 = Math.floor((p.y - p.h / 2) / celda), y1 = Math.floor((p.y + p.h / 2) / celda);
        for (var gy = y0; gy <= y1; gy++) for (var gx = x0; gx <= x1; gx++) { var key = gx + ',' + gy; (rejilla[key] = rejilla[key] || []).push(p); }
      }
      function cabe(x, y, w, h) {
        var hx = w / 2, hy = h / 2 * .8;
        return dentro(x - hx, y - hy) && dentro(x + hx, y - hy) && dentro(x - hx, y + hy) && dentro(x + hx, y + hy) && dentro(x, y - hy) && dentro(x, y + hy) && dentro(x - hx / 2, y) && dentro(x + hx / 2, y);
      }
      function intentar(texto, px, intentos, zona) {
        ctx.font = fuente(px);
        var w = ctx.measureText(texto).width, h = px * 1.05;
        for (var n = 0; n < intentos; n++) {
          var x, y;
          if (zona) { var a = Math.random() * 6.283, r = Math.sqrt(Math.random()) * zona; x = cx + Math.cos(a) * r; y = H / 2 + Math.sin(a) * r * .8; }
          else { x = rand(cx - 16.5 * escala, cx + 16.5 * escala); y = rand(cy - 13 * escala, cy + 17.5 * escala); }
          if (!cabe(x, y, w, h) || choca(x, y, w, h)) continue;
          var pr = profundidad(x, y);
          registrar({ t: texto, x: x, y: y, w: w, h: h, s: px, pr: pr });
          return true;
        }
        return false;
      }
      puestas = [];
      var centroR = 4.2 * escala;
      // 1) "Te amo" y "Hasta la luna", varias veces y grandes, cerca del centro
      var ns = [21, 20, 19, 18, 18, 17, 17, 16];
      ns.forEach(function (px, k) { intentar(grandes[(k % 2 === 0 ? 0 : grandes.length - 1)], Math.round(px * Math.min(1.15, Math.max(.7, W / 560))), 140, centroR + k * escala * .35); });
      // 2) el resto, de grande a chico
      var tamaños = [18, 16, 15, 14, 13, 12, 11, 10, 9, 8, 8];
      tamaños.forEach(function (px) {
        var pxr = Math.round(px * Math.min(1.12, Math.max(.8, W / 560)) * 2) / 2;
        var fallos = 0, topeFallos = 700 + (20 - px) * 90, cortas = pool.filter(function (t) { return t.length <= 9; });
        while (fallos < topeFallos && puestas.length < 1600) {
          var lista = (px <= 11 && Math.random() < .65) ? cortas : pool;   // las chicas, cortas: rellenan los huecos
          var texto = lista[Math.floor(Math.random() * lista.length)];
          if (intentar(texto, pxr, 14, 0)) fallos = Math.max(0, fallos - 2); else fallos += 14;
        }
      });

      // 3) orden de aparición y color por profundidad
      palabras = puestas.map(function (p) {
        var ang = Math.atan2(p.x - cx, -(p.y - H / 2));   // 0 = arriba, sentido horario
        if (ang < 0) ang += Math.PI * 2;
        var prof = Math.min(1, p.pr + rand(-.08, .08));
        var base = colorEn(prof);
        if (p.s >= 16) base = mezcla(base, FLASH, .22);
        p.col = base; p.key = ang / (Math.PI * 2) * .72 + p.pr * .28 + rand(-.015, .015);
        p.alfa = .6 + .4 * p.pr;
        return p;
      }).sort(function (a, b) { return a.key - b.key; });
      reiniciar();
    }

    function dibujar(c, p, alfa, col) {
      c.globalAlpha = alfa; c.fillStyle = css3(col || p.col, 1); c.font = fuente(p.s); c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(p.t, p.x, p.y);
    }
    function reiniciar() {
      mostradas = 0; entrando = []; destellos = [];
      sctx.clearRect(0, 0, W, H); ctx.clearRect(0, 0, W, H);
      if (REDUCIDO) { palabras.forEach(function (p) { dibujar(sctx, p, p.alfa); }); mostradas = palabras.length; pintarUnaVez(); }
    }
    function pintarUnaVez() { if (!W || !H) return; ctx.clearRect(0, 0, W, H); ctx.globalAlpha = 1; ctx.drawImage(S, 0, 0, W, H); }

    function cuadro(t) {
      raf = 0;
      if (!corriendo) return;
      var p = Math.max(0, Math.min(1, window.heartProgress || 0));
      var objetivo = Math.floor(p * palabras.length + (p >= 1 ? .5 : 0));
      if (p >= 1) objetivo = palabras.length;
      if (objetivo < mostradas) {   // las flores se reiniciaron: empezar de nuevo
        mostradas = 0; entrando = []; destellos = []; sctx.clearRect(0, 0, W, H);
      }
      if (REDUCIDO) { objetivo = palabras.length; for (; mostradas < objetivo; mostradas++) dibujar(sctx, palabras[mostradas], palabras[mostradas].alfa); }
      else for (; mostradas < objetivo; mostradas++) entrando.push({ p: palabras[mostradas], t0: t });

      ctx.clearRect(0, 0, W, H);
      ctx.globalAlpha = 1; ctx.drawImage(S, 0, 0, W, H);
      for (var i = entrando.length - 1; i >= 0; i--) {
        var e = entrando[i], k = (t - e.t0) / ENTRADA_MS;
        if (k >= 1) { dibujar(sctx, e.p, e.p.alfa); dibujar(ctx, e.p, e.p.alfa); entrando.splice(i, 1); continue; }
        dibujar(ctx, e.p, e.p.alfa * k * (2 - k));
      }
      /* destellos: solo con el corazón completo */
      if (!REDUCIDO && mostradas >= palabras.length && !entrando.length) {
        if (t - ultimoDestello > CADA_MS) { ultimoDestello = t; var n = 1 + Math.floor(Math.random() * 3); for (var d = 0; d < n; d++) destellos.push({ p: palabras[Math.floor(Math.random() * palabras.length)], t0: t }); }
      }
      for (var j = destellos.length - 1; j >= 0; j--) {
        var f = destellos[j], kk = 1 - (t - f.t0) / DESTELLO_MS;
        if (kk <= 0) { destellos.splice(j, 1); continue; }
        dibujar(ctx, f.p, .6 * kk, FLASH);
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(cuadro);
    }

    function toque(x, y) {   // las palabras cercanas (≈ 80 px) destellan
      if (REDUCIDO || !palabras.length) return;
      var ahora = performance.now();
      for (var i = 0; i < palabras.length && destellos.length < 40; i++) {
        var p = palabras[i], dx = p.x - x, dy = p.y - y;
        if (dx * dx + dy * dy < 6400 && i < mostradas) destellos.push({ p: p, t0: ahora - Math.random() * 120 });
      }
    }
    function iniciar() {
      if (REDUCIDO) { pintarUnaVez(); return; }   // reiniciar() ya dibujó todo: sin bucle con movimiento reducido
      if (corriendo) return;
      corriendo = true;
      if (!raf) raf = requestAnimationFrame(cuadro);
    }
    function detener() { corriendo = false; if (raf) { cancelAnimationFrame(raf); raf = 0; } }
    function vis() { if (document.hidden) { if (raf) { cancelAnimationFrame(raf); raf = 0; } } else if (corriendo && !raf) raf = requestAnimationFrame(cuadro); }
    document.addEventListener('visibilitychange', vis);
    function destruir() { detener(); document.removeEventListener('visibilitychange', vis); palabras = []; entrando = []; destellos = []; ctx.clearRect(0, 0, W, H); }

    return { medir: medir, iniciar: iniciar, detener: detener, toque: toque, destruir: destruir };
  }
  window.CorazonPalabras = { crear: crear };
})();
