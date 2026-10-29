/* Página "Infinito": un corazón hecho de flores que se dibujan solas (idea
   tomada de ritvikbhatia/LoveProject, reescrita en JS plano con la paleta
   del sitio), texto tipo código que se escribe solo, y el contador que
   nunca se detiene. Respeta prefers-reduced-motion, pausa con la pestaña
   oculta y limita el devicePixelRatio. */
(function () {
  'use strict';

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canvas = document.getElementById('garden');
  var box = document.getElementById('heart-box');
  var ctx = canvas.getContext('2d');
  var messageEl = document.getElementById('inf-message');
  var toastEl = document.getElementById('inf-toast');

  function rand(a, b) { return Math.random() * (b - a) + a; }
  function randInt(a, b) { return Math.floor(rand(a, b + 1)); }

  /* ------------------------------------------------------------------
     Jardín: cada flor son pétalos (curvas bezier) que crecen sin borrar
     el lienzo, así los trazos se acumulan y brillan (composición "lighter").
  ------------------------------------------------------------------ */
  var PALETTE = [
    [168, 85, 247],  // amatista
    [192, 132, 252], // orquídea
    [251, 113, 133], // rosa
    [255, 215, 0],   // dorado
    [233, 213, 255], // lavanda clara
  ];
  var PALETTE_WEIGHTS = [34, 26, 18, 14, 8];

  function pickColor() {
    var total = PALETTE_WEIGHTS.reduce(function (a, b) { return a + b; }, 0);
    var r = Math.random() * total, i = 0;
    while (i < PALETTE_WEIGHTS.length - 1 && r > PALETTE_WEIGHTS[i]) { r -= PALETTE_WEIGHTS[i]; i++; }
    var c = PALETTE[i];
    function j(v) { return Math.max(0, Math.min(255, Math.round(v + rand(-18, 18)))); }
    return 'rgba(' + j(c[0]) + ',' + j(c[1]) + ',' + j(c[2]) + ',0.22)';
  }

  var W = 0, H = 0, K = 1, dpr = 1;
  var blooms = [];
  var placed = [];

  function rot(x, y, deg) {
    var t = deg * Math.PI / 180, c = Math.cos(t), s = Math.sin(t);
    return [c * x - s * y, s * x + c * y];
  }

  function makeBloom(x, y, radius) {
    var count = randInt(8, 15), step = 360 / count, start = randInt(0, 90), petals = [];
    for (var i = 0; i < count; i++) {
      petals.push({
        sa: rand(0.1, 3), sb: rand(0.1, 3), start: start + i * step, angle: step,
        grow: rand(0.1, 1) * K, r: 1, done: false,
      });
    }
    return { x: x, y: y, R: radius, color: pickColor(), petals: petals };
  }

  function drawPetal(p) {
    var v1 = rot(0, p.r, p.start);
    var v2 = rot(v1[0], v1[1], p.angle);
    ctx.beginPath();
    ctx.moveTo(v1[0], v1[1]);
    ctx.bezierCurveTo(v1[0] * p.sa, v1[1] * p.sa, v2[0] * p.sb, v2[1] * p.sb, v2[0], v2[1]);
    ctx.stroke();
  }

  /* devuelve true cuando todas las flores terminaron de crecer */
  function stepBlooms() {
    for (var i = blooms.length - 1; i >= 0; i--) {
      var b = blooms[i], allDone = true;
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.strokeStyle = b.color;
      for (var k = 0; k < b.petals.length; k++) {
        var p = b.petals[k];
        if (p.r <= b.R) { p.r += p.grow; drawPetal(p); allDone = false; } else { p.done = true; }
      }
      ctx.restore();
      if (allDone) blooms.splice(i, 1);
    }
    return blooms.length === 0;
  }

  /* curva paramétrica clásica del corazón (la misma de Constelación y del
     corazón de idiomas del Jardín) */
  function heartPoint(t) {
    var x = 16 * Math.pow(Math.sin(t), 3);
    var y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    return { x: W / 2 + x * K * 1.0, y: H / 2 - 2.5 * K + y * K };
  }

  /* ------------------------------------------------------------------
     Animación
  ------------------------------------------------------------------ */
  var raf = null, lastT = 0, acc = 0, angle = Math.PI, heartDone = false, idleTimeout = null;
  var running = false, visibleEnough = true;

  function sizeCanvas() {
    var rect = box.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 640 ? 1.5 : 2);
    W = Math.max(1, rect.width); H = Math.max(1, rect.height);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineWidth = 1.1;
    K = W * 0.84 / 32; // el corazón mide 32 unidades de ancho
  }

  function placeStep() {
    var bloomR = 10 * (K / 15.5);
    var pt = heartPoint(angle);
    var ok = true;
    for (var i = 0; i < placed.length; i++) {
      var dx = placed[i].x - pt.x, dy = placed[i].y - pt.y;
      if (Math.sqrt(dx * dx + dy * dy) < bloomR * 1.3) { ok = false; break; }
    }
    if (ok) {
      placed.push(pt);
      blooms.push(makeBloom(pt.x, pt.y, randInt(8, 10) * (K / 15.5)));
    }
    angle += 0.04;
    if (angle >= Math.PI * 3) { heartDone = true; }
  }

  function showMessage() { messageEl.classList.add('shown'); }

  function frame(t) {
    raf = null;
    if (!running) return;
    var dt = lastT ? Math.min(t - lastT, 100) : 16;
    lastT = t;

    if (!heartDone) {
      acc += dt;
      while (acc >= 32 && !heartDone) { placeStep(); acc -= 32; }
    }
    var finished = stepBlooms();

    if (heartDone && finished) {
      showMessage();
      // en reposo no corre ningún rAF: cada tanto vuelve a florecer un punto del contorno
      if (!idleTimeout) idleTimeout = setTimeout(reBloom, 1400);
      return;
    }
    raf = requestAnimationFrame(frame);
  }

  function reBloom() {
    idleTimeout = null;
    if (!placed.length) return;
    if (!running || document.hidden) { idleTimeout = setTimeout(reBloom, 1400); return; }
    var p = placed[randInt(0, placed.length - 1)];
    blooms.push(makeBloom(p.x, p.y, randInt(8, 10) * (K / 15.5)));
    start();
  }

  function start() {
    if (raf || !running) return;
    lastT = 0;
    raf = requestAnimationFrame(frame);
  }

  function restart() {
    sizeCanvas();
    ctx.clearRect(0, 0, W, H);
    clearTimeout(idleTimeout); idleTimeout = null;
    blooms = []; placed = []; angle = Math.PI; heartDone = false; acc = 0;
    messageEl.classList.remove('shown');
    if (REDUCED) {
      // sin animación: se dibuja el corazón completo de una vez
      while (!heartDone) placeStep();
      var guard = 0;
      while (!stepBlooms() && guard++ < 4000) { /* crece hasta terminar */ }
      showMessage();
      return;
    }
    running = true;
    start();
  }

  var resizeTimer = null, lastW = 0;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      var w = window.innerWidth;
      if (w !== lastW) { lastW = w; restart(); }
    }, 250);
  });

  document.addEventListener('visibilitychange', function () {
    if (REDUCED) return;
    if (document.hidden) {
      running = false;
      if (raf) { cancelAnimationFrame(raf); raf = null; }
    } else {
      running = visibleEnough;
      start();
    }
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visibleEnough = entries[0].isIntersecting;
      if (REDUCED || document.hidden) return;
      if (visibleEnough) { running = true; start(); }
      else { running = false; if (raf) { cancelAnimationFrame(raf); raf = null; } }
    }, { threshold: 0 }).observe(box);
  }

  /* ------------------------------------------------------------------
     Abrazo: una ráfaga de flores nuevas sobre el corazón
  ------------------------------------------------------------------ */
  var toastTimer = null;
  function toast(text) {
    toastEl.textContent = text;
    toastEl.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('on'); }, 3600);
  }
  document.getElementById('hug-btn').addEventListener('click', function () {
    var n = 14;
    for (var i = 0; i < n; i++) {
      var p = heartPoint(rand(0, Math.PI * 2));
      var b = makeBloom(p.x + rand(-W * 0.08, W * 0.08), p.y + rand(-H * 0.08, H * 0.08), randInt(9, 13) * (K / 15.5));
      blooms.push(b);
    }
    if (REDUCED) { var g = 0; while (!stepBlooms() && g++ < 4000) { /* termina */ } }
    else if (!raf) { running = true; start(); }
    toast('Aquí estoy, abrazándote muy fuerte.');
  });

  /* ------------------------------------------------------------------
     Contador: SIEMPRE ahora − 28/05/2026 00:00 (Ciudad de México), desde
     Date; nunca suma de 1 en 1, nunca se detiene.
  ------------------------------------------------------------------ */
  var START = (window.START_DATE instanceof Date) ? window.START_DATE : new Date('2026-05-28T00:00:00-06:00');
  var elDays = document.getElementById('c-days'), elH = document.getElementById('c-hours'),
      elM = document.getElementById('c-minutes'), elS = document.getElementById('c-seconds');
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function tick() {
    var ms = Math.max(0, Date.now() - START.getTime());
    var days = Math.floor(ms / 86400000); ms -= days * 86400000;
    var h = Math.floor(ms / 3600000); ms -= h * 3600000;
    var m = Math.floor(ms / 60000); ms -= m * 60000;
    var s = Math.floor(ms / 1000);
    elDays.textContent = days.toLocaleString('es-MX');
    elH.textContent = pad(h); elM.textContent = pad(m); elS.textContent = pad(s);
  }
  tick();
  setInterval(function () { if (!document.hidden) tick(); }, 1000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) tick(); });
  window.addEventListener('pageshow', tick);
  window.addEventListener('focus', tick);

  /* ------------------------------------------------------------------
     Texto tipo código que se escribe solo (tocar el panel lo completa)
  ------------------------------------------------------------------ */
  var CODE = [
    ['c-comment', '/**\n * EL CÓDIGO DEL AMOR\n */\n\n'],
    ['c-comment', '// 28 de mayo de 2026\n'],
    ['c-key', 'mensaje'], ['', '('], ['c-str', '"Holaaa, Lexi? Soy Julio"'], ['', ');\n'],
    ['c-key', 'respuesta'], ['', ' = '], ['c-str', '"La misma"'], ['', ';\n\n'],
    ['c-comment', '// y desde entonces...\n'],
    ['c-key', 'mientras'], ['', ' (existan.atardeceres) {\n  dedicarte(atardecer);\n}\n\n'],
    ['c-comment', '// este contador no tiene condición de parada\n'],
    ['c-key', 'mientras'], ['', ' ('], ['c-key', 'verdadero'], ['', ') {\n  te.elijo('], ['c-str', '"hoy"'], ['', ');\n  te.elijo('],
    ['c-str', '"mañana"'], ['', ');\n  te.elijo('], ['c-str', '"siempre"'], ['', ');\n}\n\n'],
    ['c-comment', '// Hasta la luna.'],
  ];
  var out = document.getElementById('code-out');
  var panel = document.getElementById('code-panel');
  var srText = CODE.map(function (s) { return s[1]; }).join('');
  document.getElementById('code-sr').textContent = srText;

  var segIdx = 0, charIdx = 0, curSpan = null, typingTimer = null;
  function finishTyping() {
    clearTimeout(typingTimer);
    out.textContent = '';
    CODE.forEach(function (s) {
      var span = document.createElement('span');
      if (s[0]) span.className = s[0];
      span.textContent = s[1];
      out.appendChild(span);
    });
    panel.classList.add('done');
    segIdx = CODE.length;
  }
  function typeNext() {
    if (segIdx >= CODE.length) { panel.classList.add('done'); return; }
    var seg = CODE[segIdx];
    if (charIdx === 0) {
      curSpan = document.createElement('span');
      if (seg[0]) curSpan.className = seg[0];
      out.appendChild(curSpan);
    }
    curSpan.textContent += seg[1].charAt(charIdx);
    charIdx++;
    if (charIdx >= seg[1].length) { segIdx++; charIdx = 0; }
    typingTimer = setTimeout(typeNext, seg[1].charAt(charIdx - 1) === '\n' ? 140 : 38);
  }
  panel.addEventListener('click', finishTyping);

  /* ------------------------------------------------------------------
     Volver: cierra esta pestaña si la abrió el Jardín (así la música
     sigue sonando allá); si se abrió suelta, va al inicio.
  ------------------------------------------------------------------ */
  document.getElementById('volver').addEventListener('click', function (e) {
    if (window.opener && !window.opener.closed) {
      e.preventDefault();
      window.close();
      setTimeout(function () { window.location.href = './index.html'; }, 300);
    }
  });

  /* ------------------------------------------------------------------ */
  lastW = window.innerWidth;
  restart();
  if (REDUCED) finishTyping(); else setTimeout(typeNext, 700);
})();
