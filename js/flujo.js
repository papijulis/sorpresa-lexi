/* ======================================================================
   FLUJO DE LUZ (rediseño de movimiento) — listones lila que fluyen + la
   fusión con el inicio.
   • Canvas 2D fijo (#flujo-luz): ~40 listones paralelos que se tuercen en una
     gran S, polvo de luz y brillo aditivo donde la cinta se dobla. Sin WebGL ni
     librerías externas (funciona igual con file://, sin red y sin vendor).
   • La forma sigue la sección visible: cada ancla (inicio, Caminos, partes I–V,
     cartas del final) tiene su keyframe y se interpola con inercia.
   • FUSIÓN (scrub reversible, inercia lerp ≈ 0.08): entre el 30 % y el 85 % de la
     altura del inicio, las partículas del inicio se estiran en trazos y se
     alinean hasta formar los listones, que nacen del foco visual del inicio; el
     inicio baja de opacidad (1→0), sube de escala (1→1.04), gana blur (≤6 px) y
     sube más lento que el scroll. La barra superior (barra.js) lee la misma fusión
     con window.Flujo.fusion().
   • Con prefers-reduced-motion: degradado estático, sin fusión ni movimiento.
   Todo sale del único bucle de motor.js.
====================================================================== */
(function () {
  'use strict';
  var M = window.Motor, E = M.estado;
  var canvas = document.getElementById('flujo-luz');
  var estatico = document.getElementById('flujo-estatico');
  var hero = document.querySelector('.hero-section');
  var heroPanel = document.getElementById('hero-panel');
  if (!canvas || !hero) return;

  var ctx = canvas.getContext && canvas.getContext('2d');
  var REDUCIDO = E.reducido;
  if (!ctx || REDUCIDO) {
    document.body.classList.add('sin-flujo');
    canvas.style.display = 'none';
    window.Flujo = { fusion: function () { return 1; } };
    return;
  }

  /* ---- grano de película muy sutil (ruido generado una vez) ---- */
  (function () {
    var g = document.getElementById('grano');
    if (!g) return;
    var c = document.createElement('canvas'); c.width = c.height = 128;
    var x = c.getContext('2d'), d = x.createImageData(128, 128);
    for (var i = 0; i < d.data.length; i += 4) { var v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    x.putImageData(d, 0, 0);
    g.style.backgroundImage = 'url(' + c.toDataURL('image/png') + ')';
  })();

  var movil = E.vw <= 768;
  var NR = movil ? 22 : 40;      // listones
  var NP = movil ? 30 : 44;      // puntos por listón
  var NPART = movil ? 36 : 90;   // polvo de luz
  var W = 0, H = 0, dpr = 1, diag = 1;

  /* keyframes por ancla: cx, cy (fracción de pantalla), th (ángulo), A (amplitud de la S),
     k (frecuencia), ph (fase), sep (separación entre listones), en fracciones de la diagonal */
  var KF = [
    { cx: .50, cy: .46, th: -.55, A: .16, k: .62, ph: 0.0, sep: .075 },   // inicio
    { cx: .56, cy: .50, th: -.30, A: .20, k: .58, ph: 0.9, sep: .090 },   // Caminos
    { cx: .44, cy: .48, th: -.78, A: .24, k: .66, ph: 1.7, sep: .070 },   // I
    { cx: .60, cy: .52, th: -.12, A: .17, k: .54, ph: 2.6, sep: .100 },   // II
    { cx: .42, cy: .46, th: .38,  A: .22, k: .70, ph: 3.4, sep: .065 },   // III
    { cx: .58, cy: .50, th: -.62, A: .26, k: .60, ph: 4.3, sep: .085 },   // IV
    { cx: .48, cy: .52, th: .10,  A: .18, k: .64, ph: 5.1, sep: .095 },   // V
    { cx: .52, cy: .46, th: -.40, A: .21, k: .56, ph: 5.9, sep: .080 },   // cartas del final
  ];
  var ANCLAS = ['.hero-section', '#caminos', '#cap-1', '#cap-2', '#cap-3', '#cap-4', '#cap-5', '#cartas-final'];
  var tops = [0, 1, 2, 3, 4, 5, 6, 7].map(function (i) { return i * 800; });
  var heroH = 800, foco = { x: 0, y: 0 };

  var S = Object.assign({}, KF[0]), T = Object.assign({}, KF[0]);   // estado suavizado y objetivo
  var fusS = 0;                                                      // fusión suavizada 0–1
  var easeEmph = M.ease(.7, 0, .2, 1);

  /* dispersión inicial (partículas del inicio) por listón/punto, en disco unitario */
  var disp = new Float32Array(NR * NP * 2);
  for (var d = 0; d < NR * NP; d++) { var a = Math.random() * 6.283, r = Math.sqrt(Math.random()); disp[d * 2] = Math.cos(a) * r; disp[d * 2 + 1] = Math.sin(a) * r; }
  var polvo = [];
  for (var p = 0; p < NPART; p++) polvo.push({ j: Math.random(), u: Math.random(), n: (Math.random() - .5) * 30, v: (Math.random() * .6 + .2) * 0.00004, f: Math.random() * 6.28 });

  var pts = new Float32Array(NP * 2);

  function medir() {
    movil = E.vw <= 768;
    var nd = Math.min(window.devicePixelRatio || 1, movil ? 1.5 : 2);
    if (E.vw !== W || E.vh !== H || nd !== dpr) {   // el lienzo solo se rehace si cambió la pantalla
      dpr = nd; W = E.vw; H = E.vh; diag = Math.sqrt(W * W + H * H);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    var t = M.anclas(ANCLAS);
    for (var i = 0; i < t.length; i++) tops[i] = t[i] === null ? (i ? tops[i - 1] + 800 : 0) : t[i];
    heroH = Math.max(1, hero.offsetHeight);
    var r = (heroPanel || hero).getBoundingClientRect();
    foco.x = r.left + r.width / 2; foco.y = r.top + (E.y || 0) + r.height * .42;   // coordenada de página
  }
  var mt = 0;
  window.addEventListener('resize', function () { clearTimeout(mt); mt = setTimeout(medir, 160); });
  window.addEventListener('load', function () { setTimeout(medir, 300); });
  if ('ResizeObserver' in window) new ResizeObserver(function () { clearTimeout(mt); mt = setTimeout(medir, 160); }).observe(document.getElementById('main-content') || document.body);
  setTimeout(medir, 1500);
  medir();

  /* punto del listón de índice normalizado q∈[-.5,.5] en u∈[0,1] */
  var cosT = 1, sinT = 0, fase = 0;
  function punto(q, u, out, o) {
    var a = (u - .5) * diag * 1.55;
    var arg = 6.283 * S.k * (u - .5) + S.ph + fase;
    var b = S.A * diag * Math.sin(arg) + q * S.sep * diag * 2.4 * (0.28 + 0.72 * Math.abs(Math.cos(arg * .9 + q * 1.3)));
    out[o] = S.cx * W + a * cosT - b * sinT;
    out[o + 1] = S.cy * H + a * sinT + b * cosT;
  }

  var ultimoOp = -1, hOp = -1, ultimoDibujo = 0, ultimoYDibujo = -1, quieto = 0;
  var po = new Float32Array(2);
  /* desenfoque del inicio solo donde sale barato: escritorio y sin modo ligero */
  var conBlur = function () { return E.vw > 768 && !(typeof LIGHT_MODE !== 'undefined' && LIGHT_MODE); };
  function cuadro(E) {
    /* --- fusión: tramo 30 %–85 % del inicio, con inercia --- */
    var objetivo = M.clamp((E.y - heroH * .30) / (heroH * .55), 0, 1);
    fusS += (objetivo - fusS) * (1 - Math.pow(1 - .08, E.dt / 16.7));
    if (Math.abs(objetivo - fusS) < .0008) fusS = objetivo;
    var e = easeEmph(fusS);

    /* --- el inicio se funde (opacity/escala/blur) --- */
    if (Math.abs(e - hOp) > .002) {
      hOp = e;
      hero.style.opacity = (1 - e).toFixed(3);
      hero.style.transform = e > .001 ? 'scale(' + (1 + .04 * e).toFixed(4) + ')' : '';
      hero.style.filter = e > .01 && conBlur() ? 'blur(' + (6 * e).toFixed(2) + 'px)' : '';
      hero.style.pointerEvents = e > .6 ? 'none' : '';
    }

    var pausado = typeof canvasPauseReasons !== 'undefined' && canvasPauseReasons.size > 0;
    if (e <= .003 || pausado) {
      if (ultimoOp !== 0) { canvas.style.opacity = '0'; ultimoOp = 0; ctx.clearRect(0, 0, W, H); }
      return;
    }

    /* --- ritmo de dibujo: a 60 fps mientras hay scroll o la fusión se mueve; quieto, ~24 fps
       (la ondulación es lentísima); en modo ligero, siempre ~30 fps --- */
    if (E.y !== ultimoYDibujo || Math.abs(objetivo - fusS) > .001) { quieto = 0; ultimoYDibujo = E.y; } else quieto += E.dt;
    var ligero = typeof LIGHT_MODE !== 'undefined' && LIGHT_MODE;
    var intervalo = ligero ? 33 : (quieto > 1200 ? 41 : 0);
    if (intervalo && E.t - ultimoDibujo < intervalo) return;
    var dtDibujo = ultimoDibujo ? Math.min(100, E.t - ultimoDibujo) : E.dt;
    ultimoDibujo = E.t;

    /* --- keyframe según la sección visible, con inercia --- */
    var ref = E.y + E.vh * .35, i = 0;
    while (i < tops.length - 2 && ref >= tops[i + 1]) i++;
    var f = M.suave((ref - tops[i]) / Math.max(1, tops[i + 1] - tops[i]));
    var A = KF[i], B = KF[Math.min(i + 1, KF.length - 1)];
    for (var key in T) T[key] = A[key] + (B[key] - A[key]) * f;
    var k = 1 - Math.pow(1 - .06, dtDibujo / 16.7);
    for (key in S) S[key] += (T[key] - S[key]) * k;
    cosT = Math.cos(S.th); sinT = Math.sin(S.th);
    fase = E.t * .00007;

    /* --- dibujo --- */
    var op = (.95 * Math.min(1, e * 1.25));
    if (Math.abs(op - ultimoOp) > .004) { canvas.style.opacity = op.toFixed(3); ultimoOp = op; }
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    var fx = foco.x, fy = foco.y - E.y * .55;   // el foco sube con el inicio, más lento que el scroll (parallax)
    var rad = Math.min(W, H) * .17;
    var lineas = e;            // 0 = solo polvo, 1 = trazos continuos
    var e15 = Math.pow(e, 1.4);

    var nr = ligero ? Math.ceil(NR / 2) : NR;
    for (var j = 0; j < nr; j++) {
      var q = j / (nr - 1) - .5;
      var central = 1 - Math.min(1, Math.abs(q) * 1.5);
      var hue = 262 + q * 24 + (j % 3) * 3;
      var base = (.16 + .26 * central) * e15;
      var o;
      for (var n = 0; n < NP; n++) {
        o = n * 2;
        punto(q, n / (NP - 1), pts, o);
        var di = (j * NP + n) * 2;
        var sx = fx + disp[di] * rad * (.45 + central), sy = fy + disp[di + 1] * rad * (.45 + central);
        pts[o] = sx + (pts[o] - sx) * e; pts[o + 1] = sy + (pts[o + 1] - sy) * e;
      }
      if (lineas > .06) {
        /* estela ancha y tenue + trazo fino: el brillo se acumula donde los listones se aprietan */
        ctx.strokeStyle = 'hsla(' + hue.toFixed(0) + ',90%,78%,' + (base * .30).toFixed(3) + ')'; ctx.lineWidth = 4.2;
        ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (n = 1; n < NP; n++) ctx.lineTo(pts[n * 2], pts[n * 2 + 1]); ctx.stroke();
        ctx.strokeStyle = 'hsla(' + hue.toFixed(0) + ',92%,' + (80 + central * 8).toFixed(0) + '%,' + base.toFixed(3) + ')'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (n = 1; n < NP; n++) ctx.lineTo(pts[n * 2], pts[n * 2 + 1]); ctx.stroke();
      }
      if (e < .9) {   // las partículas del inicio, antes de alinearse
        ctx.fillStyle = 'hsla(' + hue.toFixed(0) + ',90%,86%,' + ((1 - e) * .62).toFixed(3) + ')';
        for (n = 0; n < NP; n += (movil ? 2 : 1)) ctx.fillRect(pts[n * 2] - .8, pts[n * 2 + 1] - .8, 1.7, 1.7);
      }
    }

    /* polvo de luz que acompaña a los listones */
    if (e > .2) {
      for (var m = 0; m < polvo.length; m++) {
        var pl = polvo[m];
        pl.u += pl.v * dtDibujo; if (pl.u > 1) pl.u -= 1;
        punto(pl.j - .5, pl.u, po, 0);
        var tw = .35 + .65 * Math.abs(Math.sin(E.t * .0009 + pl.f));
        ctx.fillStyle = 'hsla(' + (270 + pl.j * 20).toFixed(0) + ',100%,90%,' + (tw * .55 * e).toFixed(3) + ')';
        ctx.fillRect(po[0] + pl.n * .5 - .9, po[1] + pl.n - .9, 1.8, 1.8);
      }
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  M.suscribir(cuadro);
  window.Flujo = { fusion: function () { return easeEmph(fusS); } };
})();
