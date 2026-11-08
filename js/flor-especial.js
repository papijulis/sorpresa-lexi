/* ======================================================================
   "UNA FLOR ESPECIAL" — racimo de lirio 3D que florece (pop-up de la galería de flores)
   Three.js r160 (assets/vendor/, import() la primera vez; se precarga en segundo plano
   cuando el botón se acerca a la pantalla). Todo procedural, sin .glb:
     • Tallo y pedicelos: tubos AHUSADOS propios (más gruesos abajo) que crecen con drawRange.
     • 13 hojas lanceoladas en espiral (ángulo áureo), dobladas por la vena y arqueadas.
     • Tépalos de 14×44 segmentos con DOS formas (morph target): cerrados, enrollados
       sobre la superficie del botón — el botón ES la flor cerrada, así ningún retoño
       atraviesa nada — y abiertos: garra estrecha, punta acuminada, canal central,
       bordes ondulados y punta recurvada hacia atrás, como un lirio real.
     • Textura de tépalo pintada en canvas: garganta verde-crema, morado del sitio con
       bordes pálidos, vena y venitas, motas oscuras en relieve (bump) y papilas doradas.
       El pigmento sube desde la base (shader) en la etapa 03.
     • 6 estambres curvos con antera versátil y polen, estilo largo y estigma trilobulado.
     • 3 flores abiertas en pedicelos que miran hacia afuera + 2 botones jóvenes arriba,
       separados para que nunca se crucen.
   Cinco etapas en DURACION s (smoothstep): 01 tallos y hojas · 02 botones · 03 apertura y
   pigmento · 04 estambres y estigma · 05 ejemplar completo; después órbita lenta. El
   encuadre se calcula con el tamaño real del lienzo (cabe completa en un teléfono).
   Colores: los del sitio (--amatista-500 #A855F7 en tépalos, dorado/ámbar en papilas y
   polen, verde oliva #84944F / #4F5E2B en tallos y hojas). Sólidos opacos (sin capas
   transparentes encimadas que en el teléfono se veían como malla); los trazos de las
   etapas 01–02 se apagan del todo antes de terminar.
   Un solo rAF, pausa con visibilitychange, dispose() completo al cerrar. Sin WebGL: lirio 2D.
   Con prefers-reduced-motion: lirio completo, sin crecimiento ni giro automático.
====================================================================== */
(function () {
  'use strict';
  var DURACION = 12;   // segundos de crecimiento (configurable)
  var COLOR = { petalo: 0xA855F7, petaloClaro: 0xE9D5FF, petaloOscuro: 0x6B21A8, mota: 0xFFD700, ambar: 0xF59E0B, verde: 0x84944F, verdeOscuro: 0x4F5E2B, fondo: 0x07030F };
  var ETAPAS = [
    'ETAPA 01 // TALLOS Y HOJAS LANCEOLADAS', 'ETAPA 02 // BOTONES: TÉPALOS CERRADOS', 'ETAPA 03 // APERTURA, PIGMENTO Y PAPILAS',
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
  var THREE = null, Orbit = null, inst = null, abierto = false, genAbrir = 0, tCierre = 0;

  function sm(a, b, x) { x = Math.max(0, Math.min(1, (x - a) / (b - a))); return x * x * (3 - 2 * x); }

  /* ---------------------------------------------------------------- escena */
  function crearEscena(T, OrbitControls) {
    if (!T || typeof OrbitControls !== 'function') return null;   // sin controles no se crea el renderer: abrir() cae al lirio 2D
    var W = host.clientWidth || 600, H = host.clientHeight || 520;
    var renderer;
    try { renderer = new T.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' }); } catch (e) { return null; }
    var movil = window.innerWidth < 700;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, movil ? 1.75 : 2));
    renderer.setSize(W, H, false);   // el tamaño CSS lo manda .flor-canvas (100 % del lienzo)
    renderer.setClearColor(COLOR.fondo, 1);
    renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.12;
    renderer.domElement.className = 'flor-canvas';
    renderer.domElement.setAttribute('aria-hidden', 'true');
    host.insertBefore(renderer.domElement, host.firstChild);

    var scene = new T.Scene();
    scene.fog = new T.FogExp2(COLOR.fondo, .035);
    var camera = new T.PerspectiveCamera(34, W / H, .1, 80);
    var CENTRO = new T.Vector3(0, .45, .2), RADIO = 2.4;   // esfera que envuelve la planta completa
    /* encuadre: que toda la planta quepa también en un teléfono vertical */
    function encuadrar(w, h) {
      var asp = w / h, v = T.MathUtils.degToRad(camera.fov);
      var hf = 2 * Math.atan(Math.tan(v / 2) * asp);
      var d = RADIO / Math.sin(Math.min(v, hf) / 2) * .9;
      camera.aspect = asp;
      var dir = camera.position.clone().sub(controls ? controls.target : CENTRO);
      if (dir.lengthSq() < 1e-6) dir.set(0, -.12, 1);
      dir.setLength(d);
      camera.position.copy(CENTRO).add(dir);
      camera.updateProjectionMatrix();
    }
    var controls = null;
    camera.position.set(0, -.6, 9);
    encuadrar(W, H);
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(CENTRO);
    controls.enableZoom = false; controls.enablePan = false; controls.enableDamping = !REDUCIDO; controls.dampingFactor = .06;
    controls.autoRotate = !REDUCIDO; controls.autoRotateSpeed = 1.43;   // ≈ 0.15 rad/s
    controls.minPolarAngle = Math.PI * .3; controls.maxPolarAngle = Math.PI * .62;
    controls.update();

    /* luz: principal cálida, contraluz frío que dibuja el borde translúcido de los tépalos, cielo/suelo suave */
    var luzFrente = new T.DirectionalLight(0xFFE9CF, 2.3); luzFrente.position.set(3, 4, 6); scene.add(luzFrente);
    var contraluz = new T.DirectionalLight(0xB9A6FF, 1.6); contraluz.position.set(-3, 2.5, -6); scene.add(contraluz);
    var bajo = new T.PointLight(0xFFD27A, 1.2, 9, 1.6); bajo.position.set(.2, 1.2, 2.2); scene.add(bajo);
    scene.add(new T.HemisphereLight(0x5A4A8A, 0x1A1408, 1.35));

    var recursos = [];   // geometrías, materiales y texturas para dispose()
    function g(x) { recursos.push(x); return x; }
    var V = function (x, y, z) { return new T.Vector3(x, y, z); };

    /* ================= texturas procedurales ================= */
    /* tépalo: garganta verde-crema, centro claro, morado saturado y bordes pálidos; vena
       central hundida, venitas, motas oscuras en relieve y papilas doradas hacia la base */
    function texturasTepalo() {
      var w = 512, h = 1024;
      var c = document.createElement('canvas'); c.width = w; c.height = h; var x = c.getContext('2d');
      var bc = document.createElement('canvas'); bc.width = w; bc.height = h; var b = bc.getContext('2d');
      var Y = function (v) { return (1 - v) * h; };   // v = 0 en la base (abajo del lienzo)
      var gr = x.createLinearGradient(0, h, 0, 0);
      gr.addColorStop(0, '#CFE0A2'); gr.addColorStop(.07, '#EEF3D2'); gr.addColorStop(.16, '#F3E8FF');
      gr.addColorStop(.3, '#C99BFB'); gr.addColorStop(.48, '#A855F7'); gr.addColorStop(.78, '#9B4DEB'); gr.addColorStop(1, '#D9B8FF');
      x.fillStyle = gr; x.fillRect(0, 0, w, h);
      var lat = x.createLinearGradient(0, 0, w, 0);                       // bordes pálidos (como el lirio "Stargazer")
      lat.addColorStop(0, 'rgba(246,236,255,.92)'); lat.addColorStop(.14, 'rgba(246,236,255,.28)'); lat.addColorStop(.3, 'rgba(246,236,255,0)');
      lat.addColorStop(.7, 'rgba(246,236,255,0)'); lat.addColorStop(.86, 'rgba(246,236,255,.28)'); lat.addColorStop(1, 'rgba(246,236,255,.92)');
      x.fillStyle = lat; x.fillRect(0, 0, w, h);
      var cen = x.createRadialGradient(w / 2, h * .74, 4, w / 2, h * .74, w * .42);   // centro más claro y luminoso
      cen.addColorStop(0, 'rgba(255,245,252,.55)'); cen.addColorStop(1, 'rgba(255,245,252,0)');
      x.fillStyle = cen; x.fillRect(0, 0, w, h);
      b.fillStyle = '#808080'; b.fillRect(0, 0, w, h);
      /* vena central (surco) */
      x.strokeStyle = 'rgba(214,236,160,.85)'; x.lineWidth = 7; x.beginPath(); x.moveTo(w / 2, Y(0)); x.lineTo(w / 2, Y(.34)); x.stroke();
      x.strokeStyle = 'rgba(90,20,140,.45)'; x.lineWidth = 3; x.beginPath(); x.moveTo(w / 2, Y(.3)); x.quadraticCurveTo(w / 2 + 3, Y(.65), w / 2, Y(.96)); x.stroke();
      b.strokeStyle = '#3a3a3a'; b.lineWidth = 9; b.beginPath(); b.moveTo(w / 2, Y(0)); b.lineTo(w / 2, Y(.92)); b.stroke();
      /* venitas paralelas que se abren */
      for (var i = 1; i <= 9; i++) {
        [-1, 1].forEach(function (sg) {
          var k = i / 10, x0 = w / 2 + sg * k * 26, x1 = w / 2 + sg * k * w * .46;
          x.strokeStyle = 'rgba(80,18,128,' + (.2 - k * .1).toFixed(3) + ')'; x.lineWidth = 1.3;
          x.beginPath(); x.moveTo(x0, Y(.02)); x.bezierCurveTo(x1, Y(.35), x1 * .98 + w / 2 * .02, Y(.7), w / 2 + sg * k * 30, Y(.98)); x.stroke();
          b.strokeStyle = 'rgba(100,100,100,.7)'; b.lineWidth = 2; b.beginPath(); b.moveTo(x0, Y(.02)); b.bezierCurveTo(x1, Y(.35), x1, Y(.7), w / 2 + sg * k * 30, Y(.98)); b.stroke();
        });
      }
      /* motas oscuras en relieve, más densas cerca de la vena y hacia la garganta */
      for (var m = 0; m < 1500; m++) {
        var v = .07 + Math.pow(Math.random(), 1.35) * .55;
        var ancho = (1 - v * .9) * .62;
        var u = (Math.random() - .5) * 2 * ancho * Math.pow(Math.random(), .6);
        var px = w / 2 + u * w / 2, py = Y(v), r = .9 + Math.random() * 2.6 * (1 - v);
        x.fillStyle = Math.random() < .82 ? 'rgba(76,10,104,' + (.55 + Math.random() * .4).toFixed(2) + ')' : 'rgba(150,40,90,.7)';
        x.beginPath(); x.ellipse(px, py, r, r * (1.3 + Math.random()), 0, 0, 6.283); x.fill();
        b.fillStyle = 'rgba(255,255,255,.9)'; b.beginPath(); b.ellipse(px, py, r + .6, r * 1.6 + .6, 0, 0, 6.283); b.fill();
      }
      /* papilas doradas (las "motas amarillas" del lirio del sitio) junto a la garganta */
      for (var q = 0; q < 900; q++) {
        var vv = .03 + Math.pow(Math.random(), 1.6) * .3, an = (1 - vv) * .34;
        var ppx = w / 2 + (Math.random() - .5) * 2 * an * w / 2, ppy = Y(vv), rr = .6 + Math.random() * 1.6;
        x.fillStyle = Math.random() < .7 ? 'rgba(255,215,0,' + (.65 + Math.random() * .3).toFixed(2) + ')' : 'rgba(245,158,11,.8)';
        x.beginPath(); x.arc(ppx, ppy, rr, 0, 6.283); x.fill();
        b.fillStyle = '#ffffff'; b.beginPath(); b.arc(ppx, ppy, rr + .5, 0, 6.283); b.fill();
      }
      var t = new T.CanvasTexture(c); t.anisotropy = 8; t.colorSpace = T.SRGBColorSpace;
      var tb = new T.CanvasTexture(bc); tb.anisotropy = 4;
      return { map: g(t), bump: g(tb) };
    }
    var texT = texturasTepalo();

    /* ================= geometrías ================= */
    /* Tépalo con dos formas (morph): CERRADO = enrollado sobre la superficie del botón
       (así el botón ES la flor cerrada y nada lo atraviesa); ABIERTO = plano con canal
       central, bordes ondulados y la punta curvada hacia atrás, como un lirio real. */
    function geoTepalo(L, Wd, Rb, interno) {
      var cols = 14, filas = 44, pos = [], abierto = [], uv = [], idx = [];
      for (var j = 0; j <= filas; j++) {
        var v = j / filas;
        var w = Wd * Math.pow(Math.sin(Math.PI * Math.pow(v, .58)), 1.05) * (.42 + .58 * Math.min(1, v / .16)); // garra estrecha → ancho → punta acuminada
        var R = Rb * Math.pow(Math.sin(Math.PI * Math.pow(Math.min(.999, v * .96 + .02), .8)), .9) + .012;
        for (var i = 0; i <= cols; i++) {
          var u = i / cols * 2 - 1, xx = u * w;
          /* cerrado: la anchura se enrolla sobre un cilindro de radio R (el botón) */
          var phi = Math.max(-1.5, Math.min(1.5, xx / Math.max(R, .02)));
          var y = v * L * (.9 + .1 * v);
          pos.push(R * Math.sin(phi), y, R * Math.cos(phi) - (interno ? .006 : 0));
          /* abierto: canal en V suave, recurvado hacia atrás desde la mitad, ondas en el borde */
          var canal = -.05 * Wd * (1 - Math.abs(u)) * Math.sin(Math.PI * Math.min(1, v * 1.2));
          var copa = -.18 * u * u * w;
          var recurva = .36 * L * Math.pow(Math.max(0, (v - .42) / .58), 2.2);
          var onda = (interno ? .028 : .02) * Math.sin(v * 26 + u * 2.4) * Math.pow(Math.abs(u), 2.2) * Math.min(1, v * 2.2);
          var giro = (interno ? -.12 : .1) * v * v;                            // leve torsión
          var xo = xx * Math.cos(giro), zo = .03 + canal + copa + recurva + onda + xx * Math.sin(giro);
          abierto.push(xo, y - recurva * .32, zo);
          uv.push((u + 1) / 2, v);
        }
      }
      for (var jj = 0; jj < filas; jj++) for (var ii = 0; ii < cols; ii++) {
        var a = jj * (cols + 1) + ii, b2 = a + cols + 1;
        idx.push(a, b2, a + 1, a + 1, b2, b2 + 1);
      }
      var geo = new T.BufferGeometry();
      geo.setIndex(idx);
      geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
      geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
      geo.computeVertexNormals();
      var tmp = new T.BufferGeometry(); tmp.setIndex(idx); tmp.setAttribute('position', new T.Float32BufferAttribute(abierto, 3)); tmp.computeVertexNormals();
      geo.morphAttributes.position = [tmp.attributes.position];
      geo.morphAttributes.normal = [tmp.attributes.normal];
      geo.computeBoundingSphere(); geo.boundingSphere.radius = L * 1.4;   // el morph cambia la forma: que no se recorte al girar
      tmp.dispose();
      return g(geo);
    }
    var L_EXT = 1.0, geoExt = geoTepalo(L_EXT, .3, .2, false), geoInt = geoTepalo(L_EXT * .96, .38, .185, true);

    /* tubo ahusado (más grueso abajo) que crece con drawRange */
    function geoTubo(curva, seg, radial, r0, r1) {
      var fr = curva.computeFrenetFrames(seg, false), pos = [], nor = [], idx = [];
      for (var i = 0; i <= seg; i++) {
        var t = i / seg, P = curva.getPointAt(t), N = fr.normals[i], B = fr.binormals[i], r = r0 + (r1 - r0) * Math.pow(t, .8);
        for (var j = 0; j <= radial; j++) {
          var a = j / radial * Math.PI * 2, cx = Math.cos(a), sx = Math.sin(a);
          var nx = cx * N.x + sx * B.x, ny = cx * N.y + sx * B.y, nz = cx * N.z + sx * B.z;
          pos.push(P.x + r * nx, P.y + r * ny, P.z + r * nz); nor.push(nx, ny, nz);
        }
      }
      for (var s2 = 0; s2 < seg; s2++) for (var k = 0; k < radial; k++) {
        var a2 = s2 * (radial + 1) + k, b3 = a2 + radial + 1;
        idx.push(a2, b3, a2 + 1, a2 + 1, b3, b3 + 1);
      }
      var geo = new T.BufferGeometry(); geo.setIndex(idx);
      geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new T.Float32BufferAttribute(nor, 3));
      return g(geo);
    }
    /* hoja lanceolada doblada por la vena, arqueada, con color de la base a la punta */
    function geoHoja(L, Wd, arco) {
      var cols = 8, filas = 22, pos = [], col = [], idx = [];
      var c0 = new T.Color(COLOR.verdeOscuro), c1 = new T.Color(COLOR.verde), c = new T.Color();
      for (var j = 0; j <= filas; j++) {
        var v = j / filas, w = Wd * Math.pow(Math.sin(Math.PI * Math.pow(v, .66)), .95);
        for (var i = 0; i <= cols; i++) {
          var u = i / cols * 2 - 1;
          var z = arco * L * v * v - .32 * Wd * Math.abs(u) * (1 - v * .5) + .012 * Math.sin(v * 18) * Math.abs(u);
          pos.push(u * w, v * L, z);
          c.copy(c0).lerp(c1, .25 + .6 * v + .15 * (1 - Math.abs(u))); col.push(c.r, c.g, c.b);
        }
      }
      for (var jj = 0; jj < filas; jj++) for (var ii = 0; ii < cols; ii++) {
        var a = jj * (cols + 1) + ii, b = a + cols + 1;
        idx.push(a, b, a + 1, a + 1, b, b + 1);
      }
      var geo = new T.BufferGeometry(); geo.setIndex(idx);
      geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new T.Float32BufferAttribute(col, 3));
      geo.computeVertexNormals(); return g(geo);
    }

    /* ================= materiales ================= */
    var uPig = { value: 0 }, uBotonPig = { value: .42 }, uBud = { value: new T.Color(0x9DB07A) };
    function matTepalo(pig) {
      var m = new T.MeshPhysicalMaterial({
        map: texT.map, bumpMap: texT.bump, bumpScale: 2.2, roughness: .48, metalness: 0, side: T.DoubleSide,
        sheen: .8, sheenRoughness: .45, sheenColor: new T.Color(0xF3E8FF), clearcoat: .22, clearcoatRoughness: .5,
        emissive: new T.Color(0x2A0B45), emissiveIntensity: .35,
      });
      m.onBeforeCompile = function (sh) {   // pigmento que sube desde la base: verde de botón → color del tépalo
        sh.uniforms.uPig = pig; sh.uniforms.uBud = uBud;
        sh.fragmentShader = sh.fragmentShader.replace('void main() {', 'uniform float uPig;\nuniform vec3 uBud;\nvoid main() {')
          .replace('#include <map_fragment>',
            '#ifdef USE_MAP\n vec4 sampledDiffuseColor = texture2D( map, vMapUv );\n' +
            ' float pg = smoothstep( vMapUv.y - .18, vMapUv.y + .02, uPig * 1.25 - .1 );\n' +
            ' diffuseColor.rgb *= mix( uBud * (.75 + .25 * sampledDiffuseColor.g), sampledDiffuseColor.rgb, pg );\n#endif');
      };
      return g(m);
    }
    var matFlor = matTepalo(uPig), matBoton = matTepalo(uBotonPig);
    var matTallo = g(new T.MeshStandardMaterial({ color: 0x84944F, roughness: .5, metalness: 0, emissive: 0x1A2208, emissiveIntensity: .6 }));
    var matHoja = g(new T.MeshStandardMaterial({ vertexColors: true, roughness: .5, side: T.DoubleSide, emissive: 0x141B06, emissiveIntensity: .7 }));
    var matWire = g(new T.MeshBasicMaterial({ color: 0xFFFFFF, wireframe: true, transparent: true, opacity: 0, depthWrite: false }));
    var matWireLila = g(new T.MeshBasicMaterial({ color: COLOR.petaloClaro, wireframe: true, transparent: true, opacity: 0, depthWrite: false }));
    var matFil = g(new T.MeshStandardMaterial({ color: 0xE9F0C8, roughness: .5 }));
    var matAntera = g(new T.MeshStandardMaterial({ color: 0xB4580C, roughness: .85, emissive: 0x3A1500, emissiveIntensity: .4 }));
    var matPolen = g(new T.MeshStandardMaterial({ color: COLOR.ambar, roughness: 1, emissive: 0x6A3A00, emissiveIntensity: .5 }));
    var matEstilo = g(new T.MeshStandardMaterial({ color: 0xDDE9B5, roughness: .45 }));
    var matEstigma = g(new T.MeshPhysicalMaterial({ color: 0x8FA45A, roughness: .3, clearcoat: .8 }));
    var matPunta = g(new T.PointsMaterial({ color: 0xE6F58A, size: .09, transparent: true, opacity: .95, blending: T.AdditiveBlending, depthWrite: false }));

    var raiz = new T.Group(); raiz.position.y = -.15; scene.add(raiz);
    var tallos = [], hojas = [], flores = [];

    function tubo(puntos, r0, r1, radial) {
      var curva = new T.CatmullRomCurve3(puntos.map(function (p) { return V(p[0], p[1], p[2]); }));
      var seg = 64, rad = radial || 10, geo = geoTubo(curva, seg, rad, r0, r1);
      var sol = new T.Mesh(geo, matTallo), wire = new T.Mesh(geo, matWire);
      raiz.add(sol, wire);
      var punta = new T.Points(g(new T.BufferGeometry().setFromPoints([V(0, 0, 0)])), matPunta); raiz.add(punta);
      var o = { curva: curva, geo: geo, seg: seg, rad: rad, sol: sol, wire: wire, punta: punta };
      tallos.push(o); return o;
    }
    function crecer(o, k) {
      o.geo.setDrawRange(0, Math.floor(k * o.seg) * o.rad * 6);
      o.punta.position.copy(o.curva.getPointAt(Math.min(1, k)));
      o.punta.visible = k > .01 && k < .995;
      o.sol.visible = o.wire.visible = k > .002;
    }

    /* ---- un racimo como el de los lirios reales: tallo con hojas alternas en espiral,
       tres flores en pedicelos que miran hacia afuera y dos botones arriba (los más jóvenes) ---- */
    var tallo = tubo([[0, -2.7, 0], [-.12, -1.75, .05], [-.04, -.7, -.02], [.06, .4, .02], [.02, 1.5, -.02], [-.05, 2.35, .02]], .062, .028, 10);
    var hojasDef = [];
    for (var h = 0; h < 13; h++) {
      var u = .04 + h * .052, lado = h * 2.399;                     // ángulo áureo: espiral natural
      hojasDef.push([u, lado, 1.2 - h * .05, .2 - h * .006, .32 + (h % 3) * .08]);
    }
    hojasDef.forEach(function (d) {
      var p = tallo.curva.getPointAt(d[0]), geo = geoHoja(d[2], d[3], .42);
      var grp = new T.Group(); grp.position.copy(p);
      var inc = new T.Group(); inc.rotation.y = d[1]; grp.add(inc);
      var hoja = new T.Group(); hoja.rotation.x = d[4] + .55; inc.add(hoja);   // inclinada hacia afuera
      var sol = new T.Mesh(geo, matHoja), wire = new T.Mesh(geo, matWire); hoja.add(sol, wire);
      grp.scale.setScalar(.001); raiz.add(grp);
      hojas.push({ g: grp, u: d[0] });
    });

    /* flor: 3 tépalos externos + 3 internos, 6 estambres curvos, estilo largo y estigma trilobulado */
    var EJE_Y = V(0, 1, 0);
    function flor(base, dir, esc, fase, esBoton) {
      var grp = new T.Group(); grp.position.copy(base);
      grp.quaternion.setFromUnitVectors(EJE_Y, dir.clone().normalize());
      raiz.add(grp);
      var bal = new T.Group(); grp.add(bal);
      var f = { g: grp, b: bal, esc: esc, fase: fase, tepalos: [], estambres: [], boton: !!esBoton, abrir: 0 };
      /* receptáculo verde que une pedicelo y tépalos */
      var rec = new T.Mesh(g(new T.SphereGeometry(.075, 14, 10)), matTallo); rec.scale.set(1, 1.5, 1); rec.position.y = .02; bal.add(rec);
      for (var k = 0; k < 6; k++) {
        var interno = k % 2 === 1;
        var piv = new T.Group(); piv.rotation.y = k * Math.PI / 3 + (interno ? .04 : 0); bal.add(piv);
        var inc = new T.Group(); piv.add(inc);
        var geo = interno ? geoInt : geoExt;
        var sol = new T.Mesh(geo, esBoton ? matBoton : matFlor), wire = new T.Mesh(geo, matWireLila);
        wire.visible = !esBoton; inc.add(sol, wire);
        f.tepalos.push({ inc: inc, sol: sol, wire: wire, interno: interno });
      }
      if (!esBoton) {
        /* los 6 filamentos son la misma curva girada: suben, se abren y la punta cae un poco
           por el peso de la antera (arco suave, como con gravedad) */
        var ARCO = [[0, .04], [.045, .24], [.11, .43], [.18, .55], [.235, .59], [.275, .575]];
        for (var s = 0; s < 6; s++) {
          var a = s * Math.PI / 3 + Math.PI / 6, ca = Math.cos(a), sa = Math.sin(a);
          var c = new T.CatmullRomCurve3(ARCO.map(function (q) { return V(ca * q[0], q[1], sa * q[0]); }));
          var fil = new T.Mesh(geoTubo(c, 20, 6, .011, .007), matFil);
          var tip = c.getPointAt(1), tan = c.getTangentAt(1);
          var ant = new T.Mesh(g(new T.CapsuleGeometry(.026, .11, 4, 10)), matAntera);   // antera versátil, de lado
          ant.position.copy(tip).addScaledVector(tan, .02);
          ant.quaternion.setFromUnitVectors(EJE_Y, V(-sa, .15, ca).normalize());
          var pol = new T.Mesh(g(new T.SphereGeometry(.03, 8, 6)), matPolen); pol.scale.set(.85, 1.9, .5); ant.add(pol); pol.position.z = .012;
          var est = new T.Group(); est.add(fil, ant); est.scale.setScalar(.001); bal.add(est);
          f.estambres.push({ g: est, a: a });
        }
        var ce = new T.CatmullRomCurve3([V(0, .04, 0), V(.02, .3, .01), V(.045, .56, .025), V(.08, .7, .04)]);
        var estilo = new T.Mesh(geoTubo(ce, 24, 8, .02, .017), matEstilo);
        var est2 = new T.Group(); est2.add(estilo);
        var cima = ce.getPointAt(1);
        for (var l = 0; l < 3; l++) { var lob = new T.Mesh(g(new T.SphereGeometry(.038, 12, 10)), matEstigma); lob.scale.set(1, .7, 1.25); lob.position.set(cima.x + Math.cos(l * 2.094) * .033, cima.y + .015, cima.z + Math.sin(l * 2.094) * .033); est2.add(lob); }
        est2.scale.setScalar(.001); bal.add(est2);
        f.pistilo = est2;
      }
      grp.scale.setScalar(.001);
      flores.push(f); return f;
    }
    /* pedicelo desde un punto del tallo; la flor nace en la punta y mira en la dirección del pedicelo */
    function rama(uTallo, ctrl, fin, esc, fase, esBoton) {
      var p0 = tallo.curva.getPointAt(uTallo);
      var t = tubo([[p0.x, p0.y, p0.z], [p0.x + ctrl[0], p0.y + ctrl[1], p0.z + ctrl[2]], fin], .024, .019, 8);
      var dir = t.curva.getTangentAt(1).clone();
      if (!esBoton) dir.lerp(V(0, .4, 1).normalize(), .42).normalize();   // las flores se asoman al frente
      var f = flor(V(fin[0], fin[1], fin[2]), dir, esc, fase, esBoton);
      f.pedicelo = t; return f;
    }
    var F1 = rama(.62, [-.42, .12, .35], [-1.18, .42, .95], 1, 0, false);       // izquierda, mirando hacia afuera y al frente
    var F2 = rama(.72, [.45, .12, .25], [1.2, .78, .8], .95, 1.7, false);     // derecha
    var F3 = rama(.84, [.05, .3, .35], [.1, 1.85, .95], .92, 3.1, false);     // al frente, más arriba
    var B1 = rama(.92, [-.32, .2, -.25], [-.62, 2.3, -.6], .62, 4.2, true);    // botones jóvenes, arriba y atrás
    var B2 = rama(1, [.05, .25, -.02], [.06, 2.75, -.06], .56, 5.0, true);

    /* ---- polvo flotante ---- */
    var N_POLVO = movil ? 90 : 150, polvoPos = new Float32Array(N_POLVO * 3), polvoSem = [];
    for (var i = 0; i < N_POLVO; i++) { polvoPos[i * 3] = (Math.random() - .5) * 7; polvoPos[i * 3 + 1] = (Math.random() - .5) * 6.5; polvoPos[i * 3 + 2] = (Math.random() - .5) * 5; polvoSem.push([Math.random() * 6.28, Math.random() * .4 + .1]); }
    var polvoGeo = g(new T.BufferGeometry()); polvoGeo.setAttribute('position', new T.BufferAttribute(polvoPos.slice(), 3));
    var spr = document.createElement('canvas'); spr.width = spr.height = 32; var sx = spr.getContext('2d'), gg = sx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gg.addColorStop(0, 'rgba(255,255,255,1)'); gg.addColorStop(.4, 'rgba(255,240,200,.5)'); gg.addColorStop(1, 'rgba(255,240,200,0)'); sx.fillStyle = gg; sx.fillRect(0, 0, 32, 32);
    var sprT = g(new T.CanvasTexture(spr));
    var polvoMat = g(new T.PointsMaterial({ map: sprT, size: .12, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, color: 0xFFF2CC }));
    var polvo = new T.Points(polvoGeo, polvoMat); scene.add(polvo);

    /* ================= línea de tiempo ================= */
    function pintar(f, tt) {
      /* 01 tallos y hojas */
      crecer(tallo, sm(0, .2, f));
      matWire.opacity = .7 * sm(0, .05, f) * (1 - sm(.18, .32, f));
      matWire.visible = matWire.opacity > .01;
      hojas.forEach(function (hh, i) { var k = sm(.02 + hh.u * .24, .12 + hh.u * .26, f); hh.g.scale.set(Math.max(.001, k), Math.max(.001, k), Math.max(.001, k)); });
      flores.forEach(function (fl, i) { crecer(fl.pedicelo, sm(.14 + i * .012, .28 + i * .012, f)); });
      /* 02 los botones se hinchan (los tépalos aún cerrados, en trazo lila) */
      matWireLila.opacity = .8 * sm(.24, .32, f) * (1 - sm(.44, .58, f));
      matWireLila.visible = matWireLila.opacity > .01;
      flores.forEach(function (fl, i) {
        var crece = sm(.24 + i * .01, .42 + i * .01, f);
        fl.g.scale.setScalar(Math.max(.001, fl.esc * crece));
        /* 03 se abren, escalonadas */
        var o = fl.boton ? .06 * sm(.5, 1, f) : sm(.42 + i * .035, .74 + i * .035, f);
        fl.abrir = o;
        fl.tepalos.forEach(function (tp) {
          tp.sol.morphTargetInfluences[0] = o; tp.wire.morphTargetInfluences[0] = o;
          tp.inc.rotation.x = o * (tp.interno ? .98 : 1.1) + (fl.boton ? 0 : .03 * Math.sin(tt * .8 + fl.fase) * o);
        });
        /* 04 estambres y estigma */
        if (!fl.boton) {
          var e = sm(.6, .84, f) * o;
          fl.estambres.forEach(function (es, k) {
            es.g.scale.setScalar(Math.max(.001, e));
            /* vaivén común a los 6 (misma fase), para que se vean iguales */
            es.g.rotation.x = .03 * Math.sin(tt * 1.1 + fl.fase) * e; es.g.rotation.z = .03 * Math.cos(tt * .9 + fl.fase) * e;
          });
          fl.pistilo.scale.setScalar(Math.max(.001, e));
        }
        fl.b.rotation.z = .03 * Math.sin(tt * .7 + fl.fase) * sm(.5, 1, f); fl.b.rotation.x = .025 * Math.cos(tt * .6 + fl.fase) * sm(.5, 1, f);
      });
      uPig.value = sm(.42, .7, f);
      polvoMat.opacity = sm(.1, .5, f) * .75;
      camera.zoom = 1 + .06 * sm(.88, 1, f); camera.updateProjectionMatrix();
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

    /* ================= bucle ================= */
    var raf = 0, vivo = true, tTotal = 0, ultimo = performance.now(), etapaActual = -1, listo = false;
    function render() { renderer.render(scene, camera); }
    function cuadro(now) {
      raf = 0;
      if (!vivo) return;
      var dt = Math.max(0, Math.min(.1, (now - ultimo) / 1000)); ultimo = now; tTotal += dt;
      var f = REDUCIDO ? 1 : Math.min(1, tTotal / DURACION);
      pintar(f, tTotal);
      polvoCuadro(tTotal);
      var et = Math.min(4, f < .22 ? 0 : f < .42 ? 1 : f < .66 ? 2 : f < .86 ? 3 : 4);
      if (et !== etapaActual) { etapaActual = et; hudT.textContent = ETAPAS[et]; }
      hudB.style.transform = 'scaleX(' + f.toFixed(3) + ')';
      if (f >= 1 && !listo) { listo = true; texto.classList.add('visible'); }
      controls.update(dt); render();   // con deltaTime el giro automático no depende de los Hz de la pantalla
      raf = requestAnimationFrame(cuadro);
    }
    function arrancar() { if (!raf && vivo) { ultimo = performance.now(); raf = requestAnimationFrame(cuadro); } }
    function vis() { if (document.hidden) { if (raf) { cancelAnimationFrame(raf); raf = 0; } } else if (REDUCIDO) { if (vivo) render(); } else arrancar(); }
    document.addEventListener('visibilitychange', vis);
    var ro = 'ResizeObserver' in window ? new ResizeObserver(function () {
      var w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
      renderer.setSize(w, h, false); encuadrar(w, h); controls.update(); if (REDUCIDO) render();
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
    if (abierto) return;
    var gen = ++genAbrir;   // cada apertura tiene su propia espera; una carga vieja que termina tarde se descarta
    clearTimeout(tCierre);
    abierto = true; dlg.hidden = false; void dlg.offsetWidth; dlg.classList.add('abierto');
    texto.classList.remove('visible'); hudT.textContent = 'CARGANDO…'; hudB.style.transform = 'scaleX(0)';
    canvasPauseReasons.add('flor-especial'); updateCanvasPauseState();
    if (window.Sonidos) window.Sonidos.play('abrir');
    cerrarBtn.focus({ preventScroll: true });
    try {
      if (!THREE && precarga) await precarga;
      if (!THREE || !Orbit) {   // los dos módulos se asignan juntos: nunca queda THREE sin OrbitControls
        var base = new URL('./assets/vendor/', document.baseURI).href;
        var m3 = await import(base + 'three.module.min.js');
        var mo = await import(base + 'OrbitControls.js');
        THREE = m3; Orbit = mo.OrbitControls;
      }
      if (!abierto || gen !== genAbrir) return;   // se cerró o hay una apertura más nueva
      inst = crearEscena(THREE, Orbit) || fallback2D();
    } catch (e) { if (abierto && gen === genAbrir && !inst) inst = fallback2D(); }
  }
  function cerrar() {
    if (!abierto) return;
    abierto = false; dlg.classList.remove('abierto');
    if (window.Sonidos) window.Sonidos.play('cerrar');
    if (inst) { inst.dispose(); inst = null; }
    canvasPauseReasons.delete('flor-especial'); updateCanvasPauseState();
    tCierre = setTimeout(function () { dlg.hidden = true; }, 420);
    btn.focus({ preventScroll: true });
  }
  /* precarga silenciosa de Three cuando el botón se acerca: en los videos tardaba ~5 s en "CARGANDO…" */
  var precarga = null;
  function precargar() {
    if (precarga || THREE) return;
    var base = new URL('./assets/vendor/', document.baseURI).href;
    precarga = Promise.all([import(base + 'three.module.min.js'), import(base + 'OrbitControls.js')])
      .then(function (m) { THREE = m[0]; Orbit = m[1].OrbitControls; }).catch(function () { precarga = null; });
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); setTimeout(precargar, 400); } }, { rootMargin: '600px 0px' });
    io.observe(btn);
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
