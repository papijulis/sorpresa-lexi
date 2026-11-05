/* ======================================================================
   "UNA FLOR ESPECIAL" — lirio estrella 3D que florece (pop-up de la galería de flores)
   Three.js r160 (assets/vendor/, cargado con import() solo la primera vez que se abre).
   Todo es procedural, sin .glb: tallos (TubeGeometry con setDrawRange), hojas lanceoladas
   (PlaneGeometry deformado), tépalos (PlaneGeometry puntiagudo, arqueado y rizado, 6 por
   flor: 3 externos + 3 internos), botones (LatheGeometry), estambres con anteras y pistilo.
   Cinco etapas en DURACION segundos (cada una es una función del tiempo con smoothstep):
     01 tallos y hojas lanceoladas · 02 plano 3D de los tépalos · 03 pigmentación y papilas
     04 estambres y estigma · 05 ejemplar completo.  Después queda en órbita lenta.
   Colores: los del sitio (morado de --amatista-500 en los pétalos, dorado --dorado-500 /
   ámbar en las motas y anteras, verde oliva #84944F del lirio 2D en tallos y hojas).
   Un solo rAF, pausa con visibilitychange, dispose() completo al cerrar. Sin WebGL: lirio 2D.
   Con prefers-reduced-motion: lirio completo, sin crecimiento ni giro automático.
====================================================================== */
(function () {
  'use strict';
  var DURACION = 11;   // segundos de crecimiento (configurable)
  var COLOR = { petalo: 0xA855F7, petaloClaro: 0xE9D5FF, petaloOscuro: 0x6B21A8, mota: 0xFFD700, ambar: 0xF59E0B, verde: 0x84944F, verdeOscuro: 0x4F5E2B, fondo: 0x07030F };
  var ETAPAS = [
    'ETAPA 01 // TALLOS Y HOJAS LANCEOLADAS', 'ETAPA 02 // PLANO 3D DE LOS TÉPALOS', 'ETAPA 03 // PIGMENTACIÓN Y PAPILAS',
    'ETAPA 04 // ESTAMBRES Y ESTIGMA', 'ETAPA 05 // EJEMPLAR COMPLETO',
  ];

  var btn = document.getElementById('flor-especial-btn');
  var dlg = document.getElementById('flor-especial');
  if (!btn || !dlg) return;
  var host = document.getElementById('flor-lienzo');
  var cerrarBtn = document.getElementById('flor-esp-cerrar');
  var hudT = document.getElementById('flor-hud-t'), hudB = document.getElementById('flor-hud-b');
  var texto = document.getElementById('flor-esp-texto');
  var REDUCIDO = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var THREE = null, Orbit = null, inst = null, abierto = false, cargando = false, tCierre = 0;

  function sm(a, b, x) { x = Math.max(0, Math.min(1, (x - a) / (b - a))); return x * x * (3 - 2 * x); }

  /* ---------------------------------------------------------------- escena */
  function crearEscena(T, OrbitControls) {
    var W = host.clientWidth || 600, H = host.clientHeight || 520;
    var renderer;
    try { renderer = new T.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' }); } catch (e) { return null; }
    var movil = window.innerWidth < 700;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, movil ? 1.5 : 2));
    renderer.setSize(W, H, false);   // el tamaño CSS lo manda .flor-canvas (100 % del lienzo)
    renderer.setClearColor(COLOR.fondo, 1);
    renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    renderer.domElement.className = 'flor-canvas';
    renderer.domElement.setAttribute('aria-hidden', 'true');
    host.insertBefore(renderer.domElement, host.firstChild);

    var scene = new T.Scene();
    var camera = new T.PerspectiveCamera(35, W / H, .1, 60);
    camera.position.set(0, -1.1, 9.6);
    var target = new T.Vector3(0, .15, 0);
    camera.lookAt(target);
    var controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(target);
    controls.enableZoom = false; controls.enablePan = false; controls.enableDamping = !REDUCIDO; controls.dampingFactor = .06;
    controls.autoRotate = !REDUCIDO; controls.autoRotateSpeed = 1.43;   // ≈ 0.15 rad/s
    controls.minPolarAngle = Math.PI * .28; controls.maxPolarAngle = Math.PI * .62;
    controls.update();

    var luzFrente = new T.DirectionalLight(0xFFE6C4, 2.4); luzFrente.position.set(2.5, 3, 6); scene.add(luzFrente);
    var luzRelleno = new T.DirectionalLight(0x9DB4FF, 1.1); luzRelleno.position.set(-4, 1.5, -5); scene.add(luzRelleno);
    scene.add(new T.AmbientLight(0x2a2140, 1.1));

    var recursos = [];   // geometrías, materiales y texturas para dispose()
    function g(x) { recursos.push(x); return x; }

    /* ---- texturas procedurales de los tépalos ---- */
    function texturaPetalo() {
      var w = 256, h = 512, c = document.createElement('canvas'); c.width = w; c.height = h; var x = c.getContext('2d');
      var col = function (n) { return '#' + ('000000' + n.toString(16)).slice(-6); };
      var gr = x.createLinearGradient(0, h, 0, 0);
      gr.addColorStop(0, col(COLOR.petaloOscuro)); gr.addColorStop(.35, col(COLOR.petalo)); gr.addColorStop(1, col(COLOR.petaloClaro));
      x.fillStyle = gr; x.fillRect(0, 0, w, h);
      x.strokeStyle = 'rgba(40,10,70,.35)'; x.lineWidth = 1.6;           // venas radiales
      for (var i = -3; i <= 3; i++) { x.beginPath(); x.moveTo(w / 2 + i * 3, h); x.quadraticCurveTo(w / 2 + i * 26, h * .45, w / 2 + i * 14, h * .04); x.stroke(); }
      var t = new T.CanvasTexture(c); t.anisotropy = 4; t.colorSpace = T.SRGBColorSpace; return t;
    }
    function texturaMotas() {
      var w = 256, h = 512, c = document.createElement('canvas'); c.width = w; c.height = h; var x = c.getContext('2d');
      var bump = document.createElement('canvas'); bump.width = w; bump.height = h; var b = bump.getContext('2d');
      b.fillStyle = '#808080'; b.fillRect(0, 0, w, h);
      for (var i = 0; i < 3200; i++) {                                      // papilas: densas en el centro/base, casi nulas en las puntas
        var v = Math.pow(Math.random(), 1.7) * .78;                         // 0 = base
        var ancho = Math.sin(Math.PI * Math.pow(Math.max(.02, v + .04), .75)) * .46;
        var px = w / 2 + (Math.random() - .5) * 2 * ancho * w * .92 * (0.35 + Math.random() * .65), py = h - v * h;
        var r = .5 + Math.random() * 1.5;
        x.fillStyle = Math.random() < .78 ? 'rgba(255,215,0,' + (.5 + Math.random() * .45) + ')' : 'rgba(245,158,11,' + (.5 + Math.random() * .4) + ')';
        x.beginPath(); x.arc(px, py, r, 0, 6.283); x.fill();
        b.fillStyle = 'rgba(255,255,255,.8)'; b.beginPath(); b.arc(px, py, r, 0, 6.283); b.fill();
      }
      var t = new T.CanvasTexture(c); t.anisotropy = 4; t.colorSpace = T.SRGBColorSpace;
      var tb = new T.CanvasTexture(bump);
      return { map: t, bump: tb };
    }
    var texP = g(texturaPetalo()), motas = texturaMotas(); g(motas.map); g(motas.bump);

    /* ---- geometrías ---- */
    var L_PET = 1.22, A_PET = .52;
    function geoPetalo(largo, ancho, rizo) {
      var geo = g(new T.PlaneGeometry(1, 1, 6, 14)), p = geo.attributes.position;
      for (var i = 0; i < p.count; i++) {
        var u = p.getX(i), v = p.getY(i) + .5;
        var w = Math.pow(Math.sin(Math.PI * Math.pow(v, .78)), .8) * ancho;                 // contorno puntiagudo
        p.setXYZ(i, u * 2 * w, v * largo, .7 * largo * v * v * v * .55 + rizo * Math.sin(v * 13 + u * 6) * Math.abs(u * 2) * v + .12 * (1 - Math.abs(u * 2)) * Math.sin(Math.PI * v) * .0);
      }
      geo.computeVertexNormals(); return geo;
    }
    function geoHoja(largo, ancho, curva) {
      var geo = g(new T.PlaneGeometry(1, 1, 4, 16)), p = geo.attributes.position;
      for (var i = 0; i < p.count; i++) {
        var u = p.getX(i), v = p.getY(i) + .5;
        var w = Math.pow(Math.sin(Math.PI * Math.pow(v, .72)), .9) * ancho;                 // lanceolada: más ancha hacia la base
        p.setXYZ(i, u * 2 * w, v * largo, curva * v * v * largo * .55 - .04 * ancho * (1 - Math.abs(u * 2)));
      }
      geo.computeVertexNormals(); return geo;
    }
    function geoBoton(largo, radio) {
      var pts = [];
      for (var i = 0; i <= 14; i++) { var v = i / 14; pts.push(new T.Vector2(Math.max(.0001, radio * Math.pow(Math.sin(Math.PI * Math.pow(v, .72)), 1)), v * largo)); }
      return g(new T.LatheGeometry(pts, 14));
    }
    var geoP = geoPetalo(L_PET, A_PET, .035), geoPi = geoPetalo(L_PET * .94, A_PET * 1.14, .03);

    /* ---- materiales ---- */
    var matVerdeSol = g(new T.MeshStandardMaterial({ color: COLOR.verde, roughness: .65, side: T.DoubleSide, transparent: true, opacity: 0 }));
    var matHojaSol = g(new T.MeshStandardMaterial({ color: COLOR.verdeOscuro, roughness: .6, side: T.DoubleSide, transparent: true, opacity: 0 }));
    var matBlancoWire = g(new T.MeshBasicMaterial({ color: 0xFFFFFF, wireframe: true, transparent: true, opacity: .75 }));
    var matLilaWire = g(new T.MeshBasicMaterial({ color: COLOR.petaloClaro, wireframe: true, transparent: true, opacity: 0, side: T.DoubleSide }));
    var matBotonSol = g(new T.MeshStandardMaterial({ color: 0x6E7F45, roughness: .55, transparent: true, opacity: 0 }));
    var matPetaloSol = g(new T.MeshPhysicalMaterial({
      map: texP, bumpMap: motas.bump, bumpScale: 1.5, roughness: .55, side: T.DoubleSide, transparent: true, opacity: 0,
      sheen: 1, sheenRoughness: .5, sheenColor: new T.Color(COLOR.petaloClaro), clearcoat: .15,
    }));
    var uRev = { value: 0 };
    var matMotas = g(new T.MeshBasicMaterial({ map: motas.map, transparent: true, depthWrite: false, side: T.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    matMotas.onBeforeCompile = function (sh) {
      sh.uniforms.uReveal = uRev;
      sh.fragmentShader = sh.fragmentShader.replace('void main() {', 'uniform float uReveal;\nvoid main() {')
        .replace('#include <map_fragment>', '#include <map_fragment>\n diffuseColor.a *= 1.0 - smoothstep(uReveal - 0.2, uReveal, vMapUv.y);');
    };
    var matPuntos = g(new T.PointsMaterial({ color: 0xF3E8FF, size: .035, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false }));
    var matAntera = g(new T.MeshStandardMaterial({ color: COLOR.ambar, emissive: 0x5A3300, roughness: .5, transparent: true, opacity: 0 }));
    var matFilamento = g(new T.MeshStandardMaterial({ color: 0xF5E9B8, roughness: .6, transparent: true, opacity: 0 }));
    var matEstigma = g(new T.MeshStandardMaterial({ color: 0xFFF1A8, roughness: .5, transparent: true, opacity: 0 }));
    var matPunta = g(new T.PointsMaterial({ color: 0xE6F58A, size: .09, transparent: true, opacity: .95, blending: T.AdditiveBlending, depthWrite: false }));

    var raiz = new T.Group(); scene.add(raiz);
    var tallos = [], hojas = [], flores = [], botones = [], pedicelos = [], puntas = [];

    /* ---- tallos (tubo con crecimiento por drawRange) ---- */
    function tubo(puntos, radio, radial) {
      var curva = new T.CatmullRomCurve3(puntos.map(function (p) { return new T.Vector3(p[0], p[1], p[2]); }));
      var seg = 70, geo = g(new T.TubeGeometry(curva, seg, radio, radial || 7, false));
      var wire = new T.Mesh(geo, matBlancoWire), sol = new T.Mesh(geo, matVerdeSol);
      raiz.add(wire, sol);
      var punta = new T.Points(g(new T.BufferGeometry().setFromPoints([new T.Vector3()])), matPunta); raiz.add(punta);
      var o = { curva: curva, geo: geo, seg: seg, radial: radial || 7, total: geo.index.count, wire: wire, sol: sol, punta: punta };
      tallos.push(o); return o;
    }
    function crecer(o, k) {
      var n = Math.floor(k * o.seg) * o.radial * 6;
      o.geo.setDrawRange(0, n);
      o.punta.position.copy(o.curva.getPoint(Math.min(1, k)));
      o.punta.visible = k > .01 && k < .995;
    }
    var tA = tubo([[-.1, -2.7, 0], [-.28, -1.4, .1], [-.18, .1, 0], [.06, 1.3, -.1], [.02, 2.15, 0]], .045, 7);
    var tB = tubo([[.55, -2.7, .12], [.75, -1.5, 0], [.98, -.6, -.1], [1.2, -.12, .12]], .04, 7);
    var pA1 = tubo([[-.24, -.55, .08], [-.6, -.35, .25], [-.95, -.05, .32]], .028, 6);    // → flor 1
    var pA2 = tubo([[-.02, .95, -.06], [.5, 1.1, .12], [1.12, 1.4, .24]], .028, 6);       // → flor 3
    var pB1 = tubo([[.82, -.9, -.05], [.62, -.55, .28], [.5, -.18, .4]], .022, 6);        // → botón 2
    pedicelos = [pA1, pA2, pB1];

    /* ---- hojas lanceoladas, alternas ---- */
    function hoja(tallo, u, lado, largo, ancho, giro) {
      var p = tallo.curva.getPoint(u), geo = geoHoja(largo, ancho, .5);
      var gr = new T.Group(); gr.position.copy(p); gr.rotation.set(0, giro, lado * .95);
      var m1 = new T.Mesh(geo, matBlancoWire), m2 = new T.Mesh(geo, matHojaSol);
      gr.add(m1, m2); gr.scale.set(1, 0.001, 1); raiz.add(gr);
      hojas.push({ g: gr, wire: m1, sol: m2, u: u }); return gr;
    }
    [[tA, .08, -1, 1.5, .17, .3], [tA, .2, 1, 1.35, .15, -.4], [tA, .32, -1, 1.2, .14, .9], [tA, .46, 1, 1.0, .13, -.2], [tA, .6, -1, .85, .11, .5],
     [tB, .1, 1, 1.4, .16, -.5], [tB, .24, -1, 1.2, .15, .6], [tB, .38, 1, 1.05, .13, -.9], [tB, .54, -1, .85, .11, .2], [tA, .72, 1, .7, .1, -.6]]
      .forEach(function (h) { hoja.apply(null, h); });

    /* ---- botones (lathe) ---- */
    function colocar(grp, pos, dir) { grp.position.copy(pos); grp.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir.clone().normalize()); }
    function boton(pos, dir, escala) {
      var grp = new T.Group(); colocar(grp, pos, dir); grp.scale.setScalar(escala);
      var geo = geoBoton(1.05, .2);
      var w = new T.Mesh(geo, matBlancoWire), s = new T.Mesh(geo, matBotonSol);
      grp.add(w, s); raiz.add(grp); botones.push({ g: grp, wire: w, sol: s, esc: escala, flor: null }); return botones[botones.length - 1];
    }
    /* ---- flor abierta: 6 tépalos + 6 estambres + pistilo ---- */
    function flor(pos, dir, escala, fase) {
      var grp = new T.Group(); colocar(grp, pos, dir); raiz.add(grp);
      var balanceo = new T.Group(); grp.add(balanceo);
      var f = { g: grp, b: balanceo, esc: escala, petalos: [], estambres: [], fase: fase };
      for (var k = 0; k < 6; k++) {
        var pivote = new T.Group(); pivote.rotation.y = k * Math.PI / 3 + (k % 2 ? .08 : 0);
        var interno = k % 2 === 1, geo = interno ? geoPi : geoP;
        var inclina = new T.Group(); pivote.add(inclina);
        var cuerpo = new T.Group(); inclina.add(cuerpo);
        var wire = new T.Mesh(geo, matLilaWire), sol = new T.Mesh(geo, matPetaloSol), mo = new T.Mesh(geo, matMotas);
        var pts = new T.Points(geo, matPuntos);
        cuerpo.add(wire, sol, mo, pts);
        balanceo.add(pivote);
        f.petalos.push({ incl: inclina, cuerpo: cuerpo, wire: wire, interno: interno });
      }
      for (var s = 0; s < 6; s++) {
        var a = s * Math.PI / 3 + .3, pivS = new T.Group(); pivS.rotation.y = a;
        var inc = new T.Group(); pivS.add(inc);
        var fil = new T.Mesh(g(new T.CylinderGeometry(.009, .012, 1, 6, 1).translate(0, .5, 0)), matFilamento);
        var ant = new T.Mesh(g(new T.CapsuleGeometry(.032, .15, 4, 8)), matAntera); ant.position.y = 1; ant.rotation.z = Math.PI / 2;
        inc.add(fil, ant); balanceo.add(pivS);
        f.estambres.push({ inc: inc, fil: fil, ant: ant, a: a });
      }
      var pis = new T.Group(); balanceo.add(pis);
      var filP = new T.Mesh(g(new T.CylinderGeometry(.014, .02, 1, 6, 1).translate(0, .5, 0)), matFilamento);
      pis.add(filP);
      for (var l = 0; l < 3; l++) { var lob = new T.Mesh(g(new T.SphereGeometry(.05, 10, 8)), matEstigma); lob.scale.set(1, .6, 1.4); lob.position.set(Math.cos(l * 2.094) * .05, 1.02, Math.sin(l * 2.094) * .05); lob.rotation.y = -l * 2.094; pis.add(lob); }
      f.pistilo = { g: pis, fil: filP };
      flores.push(f); return f;
    }
    var D = function (x, y, z) { return new T.Vector3(x, y, z); };
    var F1 = flor(D(-.95, -.05, .32), D(-.75, .55, .45), 1, 0), F2 = flor(D(1.2, -.12, .12), D(.55, .75, .5), .95, 1.7), F3 = flor(D(1.12, 1.4, .24), D(.65, .62, .45), .9, 3.1);
    [F1, F2, F3].forEach(function (f) {   // cada flor nace de un botón
      var b = boton(f.g.position, D(0, 1, 0).applyQuaternion(f.g.quaternion), f.esc * 1.0); b.flor = f; b.g.quaternion.copy(f.g.quaternion);
    });
    var B1 = boton(D(.02, 2.12, 0), D(.12, 1, .05), 1.15), B2 = boton(D(.5, -.18, .4), D(.5, .9, .45), .78);

    /* ---- polvo flotante ---- */
    var N_POLVO = movil ? 90 : 150, polvoPos = new Float32Array(N_POLVO * 3), polvoSem = [];
    for (var i = 0; i < N_POLVO; i++) { polvoPos[i * 3] = (Math.random() - .5) * 7; polvoPos[i * 3 + 1] = (Math.random() - .5) * 6.5; polvoPos[i * 3 + 2] = (Math.random() - .5) * 5; polvoSem.push([Math.random() * 6.28, Math.random() * .4 + .1]); }
    var polvoGeo = g(new T.BufferGeometry()); polvoGeo.setAttribute('position', new T.BufferAttribute(polvoPos, 3));
    var spr = document.createElement('canvas'); spr.width = spr.height = 32; var sx = spr.getContext('2d'), gg = sx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gg.addColorStop(0, 'rgba(255,255,255,1)'); gg.addColorStop(.4, 'rgba(255,240,200,.5)'); gg.addColorStop(1, 'rgba(255,240,200,0)'); sx.fillStyle = gg; sx.fillRect(0, 0, 32, 32);
    var sprT = g(new T.CanvasTexture(spr));
    var polvoMat = g(new T.PointsMaterial({ map: sprT, size: .14, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, color: 0xFFF2CC }));
    var polvo = new T.Points(polvoGeo, polvoMat); scene.add(polvo);

    /* ---------------------------------------------------------------- línea de tiempo */
    function pintar(f, tt) {
      var s1 = sm(0, .2, f), solT = sm(.04, .22, f);
      crecer(tA, s1); crecer(tB, sm(.02, .2, f));
      tallos.forEach(function (o) { o.sol.visible = o.wire.visible = true; });
      var pedG = sm(.2, .32, f); crecer(pA1, pedG); crecer(pA2, pedG); crecer(pB1, pedG);
      matVerdeSol.opacity = solT; matHojaSol.opacity = sm(.1, .26, f);
      matBlancoWire.opacity = .8 * (1 - sm(.18, .34, f));
      hojas.forEach(function (h, i) {
        var k = sm(.06 + i * .006, .22 + i * .004, f); h.g.scale.set(1, Math.max(.001, k), 1);
        h.wire.visible = true;
      });
      /* botones → tépalos */
      var bG = sm(.2, .3, f), desplegar = sm(.26, .42, f), abrirTodo = sm(.8, 1, f), soltarBoton = sm(.34, .44, f);
      matBotonSol.opacity = sm(.22, .34, f);
      botones.forEach(function (b) {
        var k = b.flor ? bG * (1 - soltarBoton) : bG;
        b.g.scale.setScalar(Math.max(.001, b.esc * k));
        b.wire.visible = b.sol.visible = k > .003;
      });
      matLilaWire.opacity = sm(.26, .36, f) * (1 - sm(.6, .88, f)) * .9;
      matPuntos.opacity = sm(.3, .4, f) * (1 - sm(.62, .9, f)) * .9;
      matPetaloSol.opacity = sm(.42, .55, f); uRev.value = sm(.44, .7, f) * 1.25;
      matMotas.opacity = sm(.44, .54, f);
      var open = .16 + .34 * sm(.3, .5, f) + .82 * abrirTodo;                  // inclinación de los tépalos (rad)
      flores.forEach(function (fl) {
        var crece = sm(.28, .42, f);
        fl.g.scale.setScalar(Math.max(.001, fl.esc * (crece > 0 ? 1 : 0)));
        fl.petalos.forEach(function (p, k) {
          var kk = Math.max(.001, crece);
          p.cuerpo.scale.set(kk, kk, kk);
          p.incl.rotation.x = open + (p.interno ? -.1 : .06) * sm(.5, 1, f);
        });
        var eG = sm(.64, .82, f);
        fl.estambres.forEach(function (e, i) {
          e.inc.scale.set(1, Math.max(.001, eG * (1.0 + (i % 2) * .08)) * 1.3, 1);
          e.inc.rotation.x = .22 + .1 * Math.sin(tt * 1.1 + e.a + fl.fase) * eG;
          e.inc.rotation.z = .05 * Math.sin(tt * .9 + i + fl.fase);
          e.fil.material.opacity = eG; e.ant.material.opacity = eG;
        });
        fl.pistilo.g.scale.set(1, Math.max(.001, eG * 1.4), 1);
        matFilamento.opacity = eG; matAntera.opacity = eG; matEstigma.opacity = eG;
        fl.b.rotation.z = .035 * Math.sin(tt * .7 + fl.fase) * sm(.5, 1, f); fl.b.rotation.x = .03 * Math.cos(tt * .6 + fl.fase) * sm(.5, 1, f);
      });
      polvoMat.opacity = sm(.1, .5, f) * .8;
      camera.zoom = 1 + .1 * sm(.88, 1, f); camera.updateProjectionMatrix();
    }
    function polvoCuadro(tt) {
      var p = polvoGeo.attributes.position;
      for (var i = 0; i < N_POLVO; i++) {
        var s = polvoSem[i];
        p.setY(i, polvoPos[i * 3 + 1] + Math.sin(tt * s[1] + s[0]) * .25);
        p.setX(i, polvoPos[i * 3] + Math.cos(tt * s[1] * .7 + s[0]) * .12);
      }
      p.needsUpdate = true;
    }

    /* ---------------------------------------------------------------- bucle */
    var t0 = performance.now(), raf = 0, vivo = true, tTotal = 0, ultimo = t0, etapaActual = -1, listo = false;
    function render() { renderer.render(scene, camera); }
    function cuadro(now) {
      raf = 0;
      if (!vivo) return;
      var dt = Math.min(.1, (now - ultimo) / 1000); ultimo = now; tTotal += dt;
      var f = REDUCIDO ? 1 : Math.min(1, tTotal / DURACION);
      pintar(f, tTotal);
      polvoCuadro(tTotal);
      var et = Math.min(4, f < .22 ? 0 : f < .42 ? 1 : f < .66 ? 2 : f < .86 ? 3 : 4);
      if (et !== etapaActual) { etapaActual = et; hudT.textContent = ETAPAS[et]; }
      hudB.style.transform = 'scaleX(' + f.toFixed(3) + ')';
      if (f >= 1 && !listo) { listo = true; texto.classList.add('visible'); }
      controls.update(); render();
      raf = requestAnimationFrame(cuadro);
    }
    function arrancar() { if (!raf && vivo) { ultimo = performance.now(); raf = requestAnimationFrame(cuadro); } }
    function vis() { if (document.hidden) { if (raf) { cancelAnimationFrame(raf); raf = 0; } } else arrancar(); }
    document.addEventListener('visibilitychange', vis);
    var ro = 'ResizeObserver' in window ? new ResizeObserver(function () {
      var w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); if (REDUCIDO) render();
    }) : null;
    if (ro) ro.observe(host);

    if (REDUCIDO) {   // lirio completo, sin crecimiento: se redibuja solo si se arrastra
      pintar(1, 0); polvoCuadro(0); hudT.textContent = ETAPAS[4]; hudB.style.transform = 'scaleX(1)'; texto.classList.add('visible'); controls.update(); render();
      controls.addEventListener('change', render);
    } else arrancar();

    return {
      dispose: function () {
        vivo = false; if (raf) cancelAnimationFrame(raf); raf = 0;
        document.removeEventListener('visibilitychange', vis); if (ro) ro.disconnect();
        controls.dispose();
        scene.traverse(function (o) { if (o.geometry) o.geometry.dispose(); });
        recursos.forEach(function (r) { if (r && r.dispose) r.dispose(); });
        renderer.dispose(); if (renderer.forceContextLoss) renderer.forceContextLoss();
        if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
      },
    };
  }

  /* ---------------------------------------------------------------- pop-up */
  function fallback2D() {
    var d = document.createElement('div'); d.className = 'flor-fallback'; d.innerHTML = ico('lirio', 'ico-2xl'); host.insertBefore(d, host.firstChild);
    hudT.textContent = ETAPAS[4]; hudB.style.transform = 'scaleX(1)'; texto.classList.add('visible');
    return { dispose: function () { d.remove(); } };
  }
  async function abrir() {
    if (abierto || cargando) return;
    clearTimeout(tCierre);
    abierto = true; dlg.hidden = false; void dlg.offsetWidth; dlg.classList.add('abierto');
    texto.classList.remove('visible'); hudT.textContent = 'CARGANDO…'; hudB.style.transform = 'scaleX(0)';
    canvasPauseReasons.add('flor-especial'); updateCanvasPauseState();
    if (window.Sonidos) window.Sonidos.play('abrir');
    cerrarBtn.focus({ preventScroll: true });
    cargando = true;
    try {
      if (!THREE) {
        var base = new URL('./assets/vendor/', document.baseURI).href;
        THREE = await import(base + 'three.module.min.js');
        Orbit = (await import(base + 'OrbitControls.js')).OrbitControls;
      }
      if (!abierto) { cargando = false; return; }
      inst = crearEscena(THREE, Orbit) || fallback2D();
    } catch (e) { if (abierto) inst = fallback2D(); }
    cargando = false;
    if (!abierto && inst) { inst.dispose(); inst = null; }
  }
  function cerrar() {
    if (!abierto) return;
    abierto = false; dlg.classList.remove('abierto');
    if (window.Sonidos) window.Sonidos.play('cerrar');
    if (inst) { inst.dispose(); inst = null; }
    canvasPauseReasons.delete('flor-especial'); updateCanvasPauseState();
    tCierre = setTimeout(function () { dlg.hidden = true; }, 360);
    btn.focus({ preventScroll: true });
  }
  btn.addEventListener('click', abrir);
  cerrarBtn.addEventListener('click', cerrar);
  dlg.addEventListener('pointerdown', function (e) { if (e.target === dlg) cerrar(); });
  document.addEventListener('keydown', function (e) {
    if (!abierto) return;
    if (e.key === 'Escape') { cerrar(); e.preventDefault(); e.stopPropagation(); }
    else if (e.key === 'Tab') { e.preventDefault(); cerrarBtn.focus(); }   // foco atrapado: el único control es la ✕ (el lienzo se maneja con el puntero)
  }, true);
  window.FlorEspecial = { abrir: abrir, cerrar: cerrar };
})();
