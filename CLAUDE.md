# Nuestro Jardín — reglas del proyecto

Sitio romántico para Lexi, mantenido por Julio. Vive en GitHub Pages:
https://papijulis.github.io/sorpresa-lexi/ (rama `main`, carpeta raíz).
100% estático — **sin backend, sin base de datos, sin build obligatorio**.

## Contexto

- Relación desde el **28 de mayo de 2026** (`START_DATE = new Date(2026, 4, 28)`).
- El 21 de septiembre de 2026 fue la entrega original de la sorpresa — se eligió esa fecha por ser el día de las flores amarillas. Ahora es el **"Capítulo 1"** de un sitio vivo al que Lexi vuelve: no deja de ser esa carta de amor original, pero se va convirtiendo en una página de amor y cariño que sigue creciendo.
- Idioma: español de México, cálido, íntimo, primera persona de Julio ("Amo que…"). Sin tecnicismos visibles para ella.
- Zona horaria para toda lógica de fechas (aperturas de cartas, mesiversarios, etc.): **America/Mexico_City**, siempre comparando por fecha local, nunca por UTC.

## Reglas de oro (no negociables)

1. **No truncar código ni usar placeholders.** Todo lo entregado debe funcionar de inmediato.
2. **Rendimiento 60 fps**, mobile-first. Canvas con `devicePixelRatio` limitado a 2, pausar animaciones cuando la pestaña esté oculta o la sección no sea visible (`visibilitychange` / `IntersectionObserver`), respetar `prefers-reduced-motion`.
3. **Sin Tailwind CDN.** El estilo utilitario vive en `assets/css/utilities.css`, escrito a mano con SOLO las clases usadas. Cada vez que se use una clase utilitaria nueva en HTML o JS, agregarla a ese archivo.
4. **Rutas de assets sensibles a mayúsculas/minúsculas** (GitHub Pages corre en Linux). Antes de cada commit correr `node tools/check-assets.js` (también revisa que cada foto `.jpeg` de galería tenga su hermano `.webp` y que ningún mp3/imagen/fuente pese menos de 1 KB: así se detectan placeholders vacíos). Nombres reales actuales:
   - Audio (`assets/audio/`): `Honeybee.mp3`, `Lover.mp3`, `So-High-School.mp3`, `nota-voz.mp3`
   - Imágenes (`assets/img/`, todas `.jpeg` + `.webp` desde Fase 5, ~760px de lado largo): `fondo-chat`, `viendo-edgerunners`, `flores-panchito`, `lirios-jarron`, `lirios-rosas`, `frutos-rojos`, `lirios-rosas-2`, `girasoles-ella`, `girasoles`, `ramo-feito-ella`. Los originales sin tocar viven en `assets/img/originales/` (mismos nombres, nunca se sirven ni se cachean) — para volver a optimizar corre `python3 tools/optimize-images.py`.
   - `assets/img/og.jpg` (metatags para compartir) es la única imagen de `assets/img/` que **no** necesita `.webp` — solo la leen crawlers de redes sociales, nunca pasa por `pictureHTML()`.
   - Nunca borrar ni renombrar estos archivos originales.
5. **Arreglos ya validados — no reintroducir los bugs que corrigen:**
   - Selector de canciones: al elegir una, se oculta con `display:none` (quitar clase `active` y agregar `screen-out`) y se convierte en mini-reproductor en la esquina.
   - Botón "No" del inicio: se vuelve `position:fixed` solo dinámicamente en JS (`ensureNoButtonFixed`), tomando antes el `getBoundingClientRect()`; nunca debe encimarse al "Sí".
   - **Sin contacto con Julio:** no hay botones de WhatsApp ni "responderle" en ninguna parte; donde antes había uno hay una nota romántica (`NOTA_CARTA`, `NOTA_CUPON`). Decisión de Julio.
   - **Privacidad:** el repo es público. Nada del chat, ni nombres de terceros, ni salud, intimidad o peleas en textos del sitio. El banco de amor y el chat viven fuera del repo.
   - Cursor: se conserva el cursor nativo del sistema (NUNCA poner `cursor:none` — si el canvas se pausa, el cursor desaparecía). Solo hay un rastro de pétalos dorados en `#cursor-canvas` (z-index 200), únicamente con puntero fino (`pointer: fine`). Sin corazón en la punta.
   - Fotos con `pictureHTML()`: llevan `width`/`height` como atributos, así que el CSS global `picture{display:block}` + `picture > img{height:auto}` es obligatorio; sin eso las fotos se estiran/inflan (polaroids alargadas, memorama con huecos, línea del tiempo de 7,000px). Dentro de contenedores flex hay que darle `width/height:100%` también al `<picture>` (ver `.memorama-face-front picture`).
   - `.reveal` usa IntersectionObserver con `threshold:0` + `rootMargin` negativo; con `threshold` alto las secciones muy altas (línea del tiempo) nunca se revelaban y dejaban un hueco vacío.
   - Ecualizador con `AnalyserNode` real (`setupAnalysers`) y fallback CSS (clase `.playing` en las barras) si falla `createMediaElementSource`.
6. **Accesibilidad mínima:** botones con `aria-label`, contraste suficiente, foco visible, nada esencial depende solo del hover (los flujos táctiles tienen su propia rama, p. ej. `evadeNo`).
7. **Voz y textos de Julio:** el contenido personal (razones, cartas, frases) que redacte Claude Code va marcado `borrador: true` en el array y listado en `REVISAR.md` para que Julio lo edite/apruebe. Nunca inventar recuerdos o hechos de la pareja que no estén en `PROMPT-claude-code.md` o ya en el código.
8. **Emojis:** no agregar emojis nuevos; reutilizar los que el sitio ya usa. Pies de foto de polaroids sin emoji. **Estética existente a respetar:** paleta ciruela/amatista/dorado/rosa/pergamino, tipografías Playfair Display (títulos **y** texto íntimo en itálica — clase `.font-hand`, sin usar nunca una fuente script/cursiva) e Inter (UI). Modo día y modo atardecer (`isSunset`). Mantener el espíritu: lirios procedurales en canvas, pétalos, mariposas moradas, luciérnagas, bokeh.
9. Si algo de un plan de fase choca con estas reglas, ganan estas reglas — documentarlo en el commit.

## Arquitectura

```
/
├─ index.html                 # El Jardín (inicio) + navegación a espacios
├─ editor.html                # SOLO para Julio, noindex, no enlazado desde el sitio
├─ manifest.webmanifest       # PWA — nombre, íconos, theme_color
├─ sw.js                      # Service worker: HTML/JS/CSS network-first (los arreglos llegan de inmediato), contenido/*.js
│                              # también network-first (con SWR se veía HTML nuevo + contenido viejo), fuentes/fotos cache-first, audio NO se intercepta (Range). Sube CACHE_VERSION
│                              # (hoy v6) si cambias la estrategia o qué se precachea; nunca dejes index.html en cache-first.
├─ CLAUDE.md                  # este archivo
├─ REVISAR.md                 # lista de textos borrador para que Julio revise/edite
├─ contenido/                 # TODO lo que Julio edita, vía <script src> (globals, no ES modules ni fetch — debe funcionar en file:// y GitHub Pages)
│  ├─ config.js               # fechas clave, textos globales (START_DATE, MONTHS_SEQUENCE, LETTER, notas románticas NOTA_CARTA/NOTA_CUPON, etc.)
│  ├─ cartas.js               # buzón: mesiversarios, "ábrelas cuando...", cápsulas (CARTAS)
│  ├─ razones.js              # razones del frasco + hitos
│  ├─ recuerdos.js            # calendario (MEMORIES)
│  ├─ fotos.js                # galerías de polaroids (FAVORITE_PHOTOS, POLAROIDS)
│  ├─ cupones.js              # cupones raspables (CUPONES)
│  ├─ frases.js               # banco de frases (FRASES) — 20 seed en Fase 2, Fase 4 lo amplía a 120
│  ├─ canciones.js            # soundtrack (SONGS)
├─ js/juegos/                 # un archivo por juego del Rincón de Juegos (Fase 3), cada uno expone
│                              # window.Juego<Nombre> = { id, titulo, emoji, descripcion, start(mount), stop() }.
│                              # Nunca llaman a globales del script principal (openModal, jardinStorage, SONGS…)
│                              # en el nivel superior del archivo — solo dentro de start()/handlers, porque estos
│                              # scripts cargan ANTES que el <script> principal que los define.
│  ├─ cupones.js              # capa de <canvas> que se "rasca" (pointer events + destination-out)
│  ├─ memorama.js             # parejas con fotos.js
│  ├─ lluvia-lirios.js        # mini-juego de canvas con su propio requestAnimationFrame (se cancela en stop())
│  └─ caceria.js              # excepción: no es "lanzable" — JuegoCaceria.init() se llama una sola vez al
│                              # final del script principal e inyecta los 12 corazones ocultos directo en el DOM
└─ assets/
   ├─ css/utilities.css
   ├─ audio/
   ├─ img/ (.jpeg + .webp por foto, og.jpg, og-source.svg; originales/ sin tocar y sin cachear)
   ├─ fonts/ (3 .woff2 autoalojados, solo subset latin — ver "Fuentes" más abajo)
   └─ icons/ (iconos de PWA + los .svg fuente que los generan)
```

- Los archivos de `contenido/` declaran constantes globales con `window.NOMBRE = [...]`. Cargan como `<script src>` clásico **antes** del script principal de `index.html`, en orden. Nunca `fetch` de JSON ni `type="module"`: debe abrir directo con `file://` y en GitHub Pages sin build.
- `index.html` se mantiene como la vista "Jardín" + el motor (canvas, audio, modal, toast) compartido. Secciones nuevas de fases futuras pueden vivir como "vistas" dentro de la misma página (hash `#buzon`, `#juegos`…) para conservar el canvas de fondo y la música sin recargar.
- Dividir CSS/JS en archivos está permitido (ya no es "un solo archivo"), pero sin pasos de build obligatorios.

### Esquemas de contenido

```js
// cartas.js (Fase 2)
{ id:"mes-5", titulo:"Cinco meses", tipo:"mesiversario"|"abre-cuando"|"capsula"|"sorpresa",
  apertura:"2026-10-28", sello:"lirio"|"corazon"|"estrella",
  texto:"…", foto:"./assets/img/…"?, audio:"./assets/audio/…"?, cancion:"Lover"?,
  borrador:false }

// razones.js
{ texto:"Amo que…", borrador:false }

// cupones.js (Fase 3)
{ id:"abrazo10", titulo:"Abrazo de 10 minutos", descripcion:"…", emoji:"🫂", canjeable:true }

// fotos.js — dos arrays en el formato original { src, caption }:
// FAVORITE_PHOTOS (sección "Y una de mis fotos favoritas de nosotros")
// y POLAROIDS (sección "Todas las flores que te he dado"). El formato
// nuevo de álbumes se adopta cuando Fase 2+ lo necesite, sin romper estos dos:
{ album:"Flores"|"Nosotros"|…, src:"./assets/img/….jpeg", pie:"…", fecha?:"YYYY-MM-DD" }

// recuerdos.js — formato actual (MEMORIES)
{ date:"YYYY-MM-DD", display:"Jueves 28 de mayo", text:"…", special?:true }
```

## Persistencia (localStorage)

Todo progreso que deba sobrevivir a un reload (frasco de razones, y lo que
venga en fases futuras: cartas leídas, cupones canjeados…) usa
`createSafeStorage()` (definida en `index.html`, junto a `rand`/`pad2`/
`clamp`) — un wrapper con `try/catch` y fallback en memoria si
`localStorage` falla (modo privado, cuota llena, etc.), expuesto como
`jardinStorage.get(key)` / `jardinStorage.set(key, value)`.

Convención de claves: `jardin.<feature>.v<n>` (ej. `jardin.frasco.v1`,
`jardin.buzon.v1` para las cartas leídas, `jardin.cupones.v1`,
`jardin.caceria.v1`). Sube el número de versión solo si cambias la forma
de los datos guardados de un modo que no es compatible hacia atrás. La
celebración del mesiversario usa una clave por fecha
(`jardin.mesiversario.celebrado.YYYY-MM-DD`) para mostrarse una sola vez
por cada día 28.

## Rincón de Juegos (Fase 3)

Juegos: cupones para raspar (15: 3 filas de 5 en pantallas ≥1024px, 3 columnas en tablet, 2 en móvil con el último centrado), memorama, lluvia de lirios,
cacería de corazones, Constelación y Cúrame: 6 tarjetas en el Rincón, 2 columnas
de 3. La Trivia y el Wrapped se eliminaron por decisión de Julio (no volver a agregarlos).

- **Constelación** (`js/juegos/constelacion.js` → `window.JuegoConstelacion`):
  12 estrellas sobre la curva paramétrica clásica del corazón
  (`x = 16·sin³t`, `y = 13·cos t − 5·cos 2t − 2·cos 3t − cos 4t`), que hay
  que tocar **en orden** para dibujar las líneas. Al llegar a la 12 se
  cierra el trazo (conecta de vuelta al punto 0) y se revela debajo, con
  fundido, el texto "28 · 05 · 2026" — la fecha se muestra como texto, no
  como una segunda constelación de puntos, porque deletrear una fecha con
  estrellas habría necesitado demasiados puntos para seguir siendo legible
  en una pantalla de celular (decisión documentada en el commit de esta
  fase). Guarda `{ completada: true }` en `jardin.constelacion.v1`; al
  volver a abrir el juego ya completado se avisa que puede rejugarse.
  `getHeartPoints(scale)` está expuesto en el objeto del juego a propósito
  — `index.html` lo reusa en `renderNightConstellation()` (llamada desde
  `applyNightMode()`) para dibujar la misma constelación, ya armada, como
  decoración SVG permanente en el cielo nocturno del Jardín una vez que
  Lexi la complete, sin reimplementar la curva del corazón una segunda vez.

- **Cúrame** (`js/juegos/curame.js`): 40 s curando a Julio tocando corazones, sin game over duro; guarda `jardin.curame.v1` y abre la carta `desbloqueaCon: "curame"`.

Las cartas secretas de juegos no se abren por fecha: tienen
`desbloqueaCon: "<juego>"` (y `pista` para el sobre cerrado).
`cartaIsOpenable()` en `index.html` revisa `jardin.<juego>.v1.completada`
(hoy `caceria` y `curame`); cualquier juego nuevo con carta sigue el mismo
patrón.

## Jardín vivo (Fase 4)

Todo lo de esta fase vive en `index.html`, al final del script principal
(sección `FASE 4 — JARDÍN VIVO`), reutilizando el motor de canvas
existente en vez de agregar uno nuevo:

- **Temporadas**: `SEASON_PALETTE` (recolorea `spawnPetal()` — nieve en
  diciembre, hojas en otoño) y `BUTTERFLY_CAP` (sube en primavera) se
  calculan una sola vez al cargar, en `applySeason()`. Ambas variables
  están declaradas junto a `isSunset` para que `spawnPetal()` las pueda
  leer sin importar en qué orden se definan las funciones.
- **Cielo nocturno**: `body.night-mode` se agrega automáticamente si la
  hora de Ciudad de México está entre las 20:00 y las 6:00
  (`applyNightMode()`). Es independiente del toggle manual de atardecer
  (`sunset-mode`) — la cascada en CSS decide cuál gana cuando ambas
  clases están presentes. La luna (`#night-moon`) solo es clicable
  (`pointer-events`) cuando `night-mode` está activo y `sunset-mode` no.
- **Corazones al escribir "te amo"**: tiene su propio arreglo
  (`heartRain`) y sus propias `updateHeartRain()`/`drawHeartRainItem()`,
  enganchadas al `loop()` del canvas ya existente — no reutiliza
  `particles` (los pétalos) porque necesita dibujar la forma de corazón
  real, no una elipse recoloreada.
- **Línea de tiempo**: el `PHOTO_BY_DATE` dentro de `renderTimeline()` es
  un mapeo manual fecha→foto; no todas las fechas de `MEMORIES` tienen
  una entrada, eso es intencional (no cada recuerdo necesita foto).

## Easter egg: corazón multilingüe (pendiente, agregado después)

Al escribir **"i love you"** (en paralelo a "te amo" → lluvia de
corazones, arriba) se abre `#heart-languages`, un overlay de pantalla
completa con su propio `<canvas>`. Vive en `index.html`, justo después
del bloque de "te amo".

- Arma un corazón relleno de la frase "te amo" en 20 idiomas
  (`HEART_LANG_PHRASES`, constante fija inline — son traducciones de un
  hecho público, no voz personal de Julio, así que no llevan `borrador`
  ni van en `REVISAR.md`). Usa la misma curva paramétrica del corazón que
  Constelación (`heartLangPoint()`), sin compartir código entre ambas
  porque viven en archivos distintos con ciclos de vida distintos.
- El acomodo de palabras (`buildHeartLangWords()`) es "scanline": rasteriza
  el corazón relleno en un `<canvas>` offscreen, recorre fila por fila con
  `getImageData` para hallar el ancho disponible en cada renglón, y va
  empacando frases (cicladas, `ctx.measureText`) centradas en ese ancho.
  Es el paso caro — se cachea por tamaño de canvas y solo se recalcula si
  cambia (`heartLangLayoutKey`), nunca en cada cuadro.
- La animación por cuadro (`drawHeartLang()`) solo mueve opacidad/posición
  de las palabras ya calculadas: entrada escalonada (`HEART_LANG_STAGGER_MS`
  por palabra) con un brillo lento después. Con `prefers-reduced-motion`
  (`LIGHT_MODE`) dibuja una sola vez, sin animar ni seguir en loop.
- Pausa el canvas principal del Jardín mientras está abierto
  (`canvasPauseReasons.add('heart-lang')`, igual que el lightbox y
  Juegos) y pausa/reanuda su propio `requestAnimationFrame` con
  `visibilitychange`, agregado solo mientras el overlay está abierto y
  quitado al cerrarlo (mismo patrón de limpieza por arreglo de funciones
  que usan los módulos de `js/juegos/`).

## Pergamino con dos cartas, panel del inicio y ritual 11:11

- El pergamino final alterna entre `LETTER` (config.js) y `CARTA_FINAL`
  (cartas.js, "Para seguir escribiendo") con el botón "Leer una carta más" /
  "Volver a la primera carta" (`switchLetter()`): la tinta se desvanece y se
  vuelve a revelar párrafo por párrafo, `aria-live="polite"`, instantáneo con
  `prefers-reduced-motion`. La vela del deseo (`#letter-wish-block`) es solo de
  la primera carta. `CARTA_FINAL` también es un sobre abierto del Buzón.
- La sección "Lo que nos falta vivir" se eliminó por decisión de Julio (no volver a agregarla).
- Inicio: `#hero-panel` es un cuadro semitransparente que aparece ~4.5 s después de abrir el sitio (clase `.shown`) para que "Para ti" y el texto se lean sobre los lirios; sin la fecha "21 de septiembre" arriba. En modo ligero (`body.light-mode`) no usa blur.
- Cursor: cursor nativo siempre visible (nunca `cursor:none`) y la manita (`cursor:pointer`) en todo lo clicable vía regla global `button, [role="button"], a[href]…` (venía del preflight de Tailwind y se había perdido). La capa superior `#cursor-canvas` (z 200) tiene su propio rAF (`topFrame`), independiente del loop principal, y dibuja el rastro de pétalos (por `pointermove` de mouse/lápiz, nunca touch) y los destellos de premio (`spawnSparkleBurst` los manda ahí cuando el canvas principal está pausado, así se ven al ganar un juego). Todo lo que decae lo hace por tiempo (dt), no por cuadro.
- Rendimiento del canvas: los lirios ya florecidos se dibujan desde un sprite cacheado (`buildLilySprite`) en vez de rehacer 6 gradientes por flor por cuadro; `scrollYCache` evita leer `window.scrollY` (layout forzado) en cada cuadro; ningún loop debe llamar a `getBoundingClientRect()` por cuadro, guarda el tamaño en el resize.
- Móvil (<640px): botones táctiles de 44px, texto mínimo 12px, zonas seguras (`env(safe-area-inset-*)`) en lo fijo, botones flotantes que se ocultan al bajar (`.fab-away`), cupones 2 columnas (1 columna <360px), selección de canción compacta, `@media (hover: none)` anula hovers pegados, caps de partículas y dpr 1.5 en teléfono; en horizontal, los juegos de lienzo piden girar el teléfono (`#juego-stage[data-portrait]`).
- Ritual 11:11 en vivo: `check1111()` abre un aviso si está en el sitio a las
  11:11 o 23:11 (hora de México), una vez por cada 11:11 de cada día.

## Rendimiento y PWA (Fase 5)

- **Fuentes autoalojadas**: 3 `.woff2` en `assets/fonts/` (Inter 300-700,
  Playfair Display 400-900 normal e itálica), subset `latin` únicamente
  (cubre español — incluye ñ, acentos, ¿¡). Se bajaron una sola vez de
  Google Fonts con `curl` simulando un user-agent de Chrome moderno (así
  sirve `.woff2` en vez de `.ttf`) — no hay script para repetirlo porque
  no debería hacer falta a menos que cambien los pesos/estilos usados.
  Cero `<link>` a `fonts.googleapis.com` en producción.
- **Fotos optimizadas**: `tools/optimize-images.py` (Pillow) reescala a
  760px de lado largo y genera JPEG progresivo + WebP (~81% menos peso
  en WebP vs. el original). Los originales intactos quedan en
  `assets/img/originales/` — el script los usa como fuente de verdad en
  cada corrida, así que no hay pérdida de calidad en cascada si lo
  vuelves a correr. `pictureHTML(src, alt, extraImgAttrs)` (en
  `index.html`, junto a `rand`/`pad2`/`clamp`) arma el `<picture>` con el
  `.webp` como `<source>` y el `.jpeg` de respaldo, más `width`/`height`
  reales (tabla `IMG_DIMENSIONS`) para evitar salto de layout. La usan
  tanto el script principal como `js/juegos/memorama.js` (solo dentro de
  `start()`, nunca al nivel superior del archivo, mismo patrón que el
  resto de `js/juegos/`).
- **Modo ligero automático**: `LIGHT_MODE` arranca en `true` si
  `prefers-reduced-motion: reduce`, o se activa sola si los primeros 3
  segundos miden menos de 40fps (`sampleFpsAndMaybeGoLight()` dentro del
  propio `loop()`). Al activarse, baja `PARTICLE_CAP`/`FIREFLY_CAP`/
  `BUTTERFLY_CAP` y apaga todo `shadowBlur` del canvas (son las 3
  llamadas que dicen `if (!LIGHT_MODE) { ...shadowBlur... }`). Es una vía
  sola: una vez activado no se vuelve a desactivar solo.
- **Pausa del canvas principal**: `canvasPauseReasons` (un `Set`) más
  `updateCanvasPauseState()` deciden si sigue vivo el `requestAnimationFrame`
  del `loop()` principal. Motivos que agregan una razón: la pestaña oculta
  (`visibilitychange`), y las vistas de pantalla completa que lo tapan
  del todo — Buzón, Juegos, y el lightbox (`openBuzonView`/
  `closeBuzonView`, `openJuegosView`/`closeJuegosView`,
  `openLightbox`/`closeLightbox`). Cualquier vista nueva de pantalla
  completa debería sumarse/quitarse de ese mismo `Set` en vez de inventar
  su propio mecanismo de pausa.
- **Lightbox**: `openLightbox(src, alt)`/`closeLightbox()`, cierra con
  click al fondo, Escape, o deslizando hacia abajo en móvil (umbral
  80px). Reutiliza la misma foto optimizada que ya se mostró en la
  tarjeta (no hay una tercera versión "grande" por separado).
- **Arreglo visual conocido (ya resuelto)**: el lirio del hero ahora
  nace con `alpha: 0.4` y un tamaño menor (`spawnLily(..., alpha)`, el
  parámetro nuevo en la firma) para no competir con el texto "Lexi".
  Cualquier lirio nuevo que se dibuje detrás de texto debería usar el
  mismo parámetro en vez de opacidad fija en otro lado.
- **`sw.js` no se pudo probar end-to-end en este entorno**: hasta un
  Service Worker mínimo de una línea falla al registrarse en el
  navegador embebido de las sesiones de Claude Code (error genérico
  "unknown error fetching the script"), con `isSecureContext: true` y
  `'serviceWorker' in navigator: true` — todo apunta a que los Service
  Workers vienen deshabilitados a propósito en ese navegador de pruebas,
  no a un bug real. `sw.js` sí pasa `node --check`. Confirmar instalación
  offline/PWA con un navegador de verdad (Chrome/Safari) una vez
  publicado en GitHub Pages.

## Parámetro de depuración (implementado desde Fase 2)

`?fecha=YYYY-MM-DD` en la URL simula "hoy" para probar aperturas de cartas
y mesiversarios — implementado en `getTodayDateString()` (`index.html`,
junto a `mexicoCityDateString()`). Sin el parámetro, "hoy" se calcula
siempre en America/Mexico_City vía `Intl.DateTimeFormat`, sin importar la
zona horaria del dispositivo. **Ignorado en producción si no se pasa** —
nunca debe afectar el comportamiento real para Lexi salvo que ella misma
ponga el parámetro en la URL.

## Cómo trabajar

- Un commit por fase, en español, claro (`Fase 1: frasco de 100 razones con hitos`).
- Correr `node tools/check-assets.js` antes de cada commit.
- Probar en navegador real antes de dar una fase por terminada.
- Nunca borrar los assets originales ni cambiar sus nombres.
