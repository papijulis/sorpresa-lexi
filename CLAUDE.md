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
   - Selector de canciones: al elegir una, se oculta con `display:none` (quitar clase `active` y agregar `screen-out`) y se convierte en el grupo de música del dock inferior (`#mini-player`).
   - Botón "No" del inicio: se vuelve `position:fixed` solo dinámicamente en JS (`ensureNoButtonFixed`), tomando antes el `getBoundingClientRect()`; nunca debe encimarse al "Sí".
   - **Sin contacto con Julio:** no hay botones de WhatsApp ni "responderle" en ninguna parte; donde antes había uno hay una nota romántica (`NOTA_CARTA`, `NOTA_CUPON`). Decisión de Julio.
   - **Privacidad:** el repo es público. Nada del chat, ni nombres de terceros, ni salud, intimidad o peleas en textos del sitio. El banco de amor y el chat viven fuera del repo.
   - Cursor: se conserva el cursor nativo del sistema (NUNCA poner `cursor:none` — si el canvas se pausa, el cursor desaparecía). Solo hay un rastro de pétalos dorados en `#cursor-canvas` (z-index 200), únicamente con puntero fino (`pointer: fine`). Sin corazón en la punta.
   - Fotos con `pictureHTML()`: llevan `width`/`height` como atributos, así que el CSS global `picture{display:block}` + `picture > img{height:auto}` es obligatorio; sin eso las fotos se estiran/inflan (polaroids alargadas, memorama con huecos, línea del tiempo de 7,000px). Dentro de contenedores flex hay que darle `width/height:100%` también al `<picture>` (ver `.memorama-face-front picture`).
   - `.reveal` usa IntersectionObserver con `threshold:0` + `rootMargin` negativo; con `threshold` alto las secciones muy altas (línea del tiempo) nunca se revelaban y dejaban un hueco vacío.
   - Ecualizador con `AnalyserNode` real (`setupAnalysers`) y fallback CSS (clase `.playing` en las barras) si falla `createMediaElementSource`.
6. **Accesibilidad mínima:** botones con `aria-label`, contraste suficiente, foco visible, nada esencial depende solo del hover (los flujos táctiles tienen su propia rama, p. ej. `evadeNo`).
7. **Voz y textos de Julio:** el contenido personal (razones, cartas, frases) que redacte Claude Code va marcado `borrador: true` en el array y listado en `REVISAR.md` para que Julio lo edite/apruebe. Nunca inventar recuerdos o hechos de la pareja que no estén en `PROMPT-claude-code.md` o ya en el código.
8. **Íconos, no emojis:** el sitio ya no usa emojis; todo ícono sale del sprite SVG de la firma visual (`ico('i-corazon')`, ver sección "Firma visual"). Pies de foto de polaroids sin emoji ni ícono. **Estética existente a respetar:** paleta ciruela/amatista/dorado/rosa/pergamino, tres voces tipográficas: **Cormorant Garamond** (solo titulares grandes y números, ver "Tipografía"), Playfair Display (títulos medianos **y** texto íntimo en itálica — clase `.font-hand`, sin usar nunca una fuente script/cursiva) e Inter (UI). Modo día y modo atardecer (`isSunset`). Mantener el espíritu: lirios procedurales en canvas, pétalos, mariposas moradas, luciérnagas, bokeh.
9. Si algo de un plan de fase choca con estas reglas, ganan estas reglas — documentarlo en el commit.

## Arquitectura

```
/
├─ index.html                 # El Jardín (inicio) + navegación a espacios
├─ editor.html                # SOLO para Julio, noindex, no enlazado desde el sitio
├─ manifest.webmanifest       # PWA — nombre, íconos, theme_color
├─ sw.js                      # Service worker: HTML/JS/CSS network-first (los arreglos llegan de inmediato), contenido/*.js
│                              # también network-first (con SWR se veía HTML nuevo + contenido viejo), fuentes/fotos cache-first, audio NO se intercepta (Range). Sube CACHE_VERSION
│                              # (hoy v8) si cambias la estrategia o qué se precachea; nunca dejes index.html en cache-first.
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
- **Cielo (día · atardecer · noche)**: `setCielo(estado)` (`js/navegacion.js`)
  es el único que cambia `body.sunset-mode` / `body.night-mode` (excluyentes),
  `isSunset`, `isNight` (motor-canvas.js) y `<html data-cielo>`. Al abrir, sigue
  la hora de Ciudad de México (20:00–6:00 → noche, si no día; sin guardarse);
  después Lexi lo cambia con el botón del dock (cicla) o con la escena "El cielo".
- **Tema NOCHE (punto 8)**: `:root[data-cielo="noche"]` en `tokens.css` redefine
  los tokens de color (índigo profundo, amatista→azul periwinkle, dorado→champán
  lunar, pergamino frío). Va en `:root`, no en `body`, para que `--grad-*` y
  `--brillo-*` se recalculen. Los tokens que cambian están registrados con
  `@property` para interpolar en 1.4 s al cambiar de cielo; sin soporte, saltan.
  Cielo: `applyNightMode()` (extras.js) construye una vez la vía láctea, 110
  estrellas (64 en móvil, 40 en modo ligero; azules/doradas/grandes) y la
  estrella fugaz (`lanzarFugaz()` en navegacion.js, cada ~8 s, nunca con vistas
  abiertas ni con reduced-motion); la constelación se vuelve a dibujar cada vez
  que se entra a la noche. Canvas: pétalos lavanda/champán más lentos y 60 %
  de cantidad, luciérnagas también de noche, lirios al 80 %, rastro del cursor
  lavanda. `<meta theme-color>` cambia con el cielo. La luna (`#night-moon`,
  ícono `i-luna-solida`) solo es clicable con `night-mode` activo.
- **Corazones al escribir "te amo"**: tiene su propio arreglo
  (`heartRain`) y sus propias `updateHeartRain()`/`drawHeartRainItem()`,
  enganchadas al `loop()` del canvas ya existente — no reutiliza
  `particles` (los pétalos) porque necesita dibujar la forma de corazón
  real, no una elipse recoloreada.
- **Línea de tiempo**: el `PHOTO_BY_DATE` dentro de `renderTimeline()` es
  un mapeo manual fecha→foto; no todas las fechas de `MEMORIES` tienen
  una entrada, eso es intencional (no cada recuerdo necesita foto).

## Easter egg: corazón multilingüe (pendiente, agregado después)

Al escribir **"i love you"** (o "te amo", que además lanza la lluvia de
corazones) se abre el popup "Infinito" (ver más abajo), donde vive el
corazón multilingüe. Antes era un overlay propio (`#heart-languages`);
se quitó por decisión de Julio.

- `HEART_LANG_PHRASES` (extras.js): "te amo" en 20 idiomas, constante fija
  inline — son traducciones de un hecho público, no voz personal de Julio,
  así que no llevan `borrador` ni van en `REVISAR.md`.
- `buildHeartLangWords(width, height, opts?)` es "scanline": rasteriza el
  corazón relleno en un `<canvas>` offscreen, recorre fila por fila con
  `getImageData` para hallar el ancho disponible y va empacando frases
  (cicladas, `ctx.measureText`) centradas. `opts {cx, cy, scale}` lo coloca
  en otro punto/tamaño del lienzo. Los renglones finales de una sola frase
  (la punta) se reordenan de la más larga a la más corta para que sigan la
  forma del corazón. Es el paso caro: se calcula una vez por tamaño.

## Firma visual (rediseño, punto 1)

Un solo motivo maestro en todo el sitio: **el lirio de 6 pétalos con trazo continuo, unido al ∞**.

- **Tokens** (`assets/css/tokens.css`): únicos dueños de colores (`--dorado-500`, `--amatista-500`…), canales para `rgba(var(--dorado-rgb), .4)`, degradados, radios, sombras/brillos, curvas (`--ease-flor`, `--ease-rebote`), duraciones y escala de capas (`--z-*`). **No pongas hex ni rgba sueltos en CSS nuevo.** (En JS/canvas los colores siguen siendo literales.)
- **Sprite de ornamentos e íconos**: la geometría vive en `tools/generar-ornamentos.js` (fuente única). Correr `node tools/generar-ornamentos.js` regenera `assets/img/ornamentos.svg` (referencia) y `js/ornamentos.js` (se inyecta al inicio del `<body>`; funciona con `file://`). Nunca edites esos dos a mano. Helpers globales: `ico('i-sobre', 'ico-lg')`, `iconoHTML(id|texto)`, `iconizar('Texto {i-corazon-lleno}')` (los toasts y modales ya lo aplican), `ornDivisor()`, `ornPreloader()`. Convención: `i-*` = íconos de línea 24×24 (heredan `currentColor`); sin prefijo = símbolos de firma (`lirio`, `lirio-linea`, `lirio-mini`, `infinito`, `infinito-flor`, `brillo`). Los íconos de juegos/cupones se declaran con `icono:` (id del sprite), no `emoji:`.
- **Componentes** (`assets/css/ornamentos.css`): `.ico`, `.orn-divisor` (el trazo se dibuja con el scroll; se agrega solo bajo cada `.titulo-seccion` o donde pongas `data-orn-divisor`), `.tarjeta-flor` (esquinas de pétalo), `.btn-brillo` (brillo que pasa en botones dorados), flor de precarga, y el lenguaje de movimiento: `.mov-florecer`, `.mov-latido`, `.mov-revelar`, `.mov-halo` (con `prefers-reduced-motion` ya cubierto).
- **Escenas** (`js/escenas.js`): motor de scroll sin librerías. `data-escena="trazo|pasada"` escribe `--p` (0→1) solo mientras el elemento está en pantalla; `.mov-*`/`data-en-vista` agregan `.en-vista` una vez. `Escenas.registrar(el)` para elementos creados por JS.
- **Marca** (`node tools/generar-marca.js` + Inkscape, comandos impresos al final): íconos de la app, maskable, favicon y `og.jpg` con la misma flor maestra.
- El CSS ya no vive en `index.html`: `utilities`, `tokens`, `base`, `componentes`, `vistas`, `jardin`, `ornamentos`, `navegacion`, `portada`, `capitulos`, `tipografia`, `linea-tiempo`, `cd`, `infinito`, `movil` (en ese orden; `movil.css` al final para ganar la cascada) y el JS en `js/` (`ornamentos`, `nucleo`, `motor-canvas`, `ui`, `audio`, `secciones`, `buzon-juegos`, `extras`, `infinito`, `sonidos`, `micro`, `portada`, `capitulos`, `navegacion`, `escenas`); todo cargado como `<script src>` clásicos que comparten el ámbito global.

## Navegación integrada (rediseño, punto 9)

- **Dock inferior** (`<nav id="dock">`, `assets/css/navegacion.css`): Buzón · Juegos · música (`#mini-player`, con vinilo, play, EQ y siguiente) · Cielo. Reemplaza los botones de las esquinas y el mini-reproductor; **se conservaron los ids** (`buzon-toggle`, `juegos-toggle`, `sunset-toggle`, `buzon-dot`, `juegos-dot`) porque los usan Cacería y el JS existente. Aparece (`.visible`) al terminar la selección de canción. Los puntitos (`.dock-dot`) son los avisos de carta nueva / corazones pendientes. El toast sube sobre el dock; `main` lleva `padding-bottom` para que nada quede tapado.
- **Caminos del jardín** (`#caminos`, tras el inicio): cuatro escenas SVG en línea con animación CSS — Buzón (bandera arriba si hay cartas nuevas, chip con la cuenta; la pone `updateBuzonDot()`), Rincón de Juegos (invernadero), Tocadiscos (disco y brazo animados según `bgAudio`) y El cielo (astro que viaja según `data-cielo`). Mismas funciones que el dock, no duplican estado.
- **Iris**: `.app-view` se abre/cierra con `clip-path: circle()` desde `--ox/--oy`, el centro del botón que se tocó (`irisDesde()` en buzon-juegos.js; `openBuzonView(origen)` / `openJuegosView(origen)` aceptan el evento o el elemento). Con `prefers-reduced-motion` es solo un fundido.
- `js/navegacion.js` carga después de `extras.js` (usa `mexicoCityHour` y `applyNightMode`) y antes de `escenas.js`. Los textos nuevos son rótulos de interfaz ("Caminos del jardín", subtítulos de cada escena), no voz personal.

## Portada en capas (rediseño, bloque 2)

- `#portada` (fija, z 1, antes de la viñeta) y `#portada-frente` (fija, z 3, sobre el canvas de pétalos y bajo `main`): luz (`.p-sol`/`.p-disco`), colinas lejanas y medias, hierba con tallos y lirios en silueta (SVG en `index.html`, generados una sola vez; los colores salen de tokens, así la noche los recolorea) y dos lirios grandes desenfocados al frente. Estilos en `assets/css/portada.css`; lógica en `js/portada.js` (`window.Portada.actualizar(cielo)`, la llama `setCielo()`).
- **Luz según cielo y hora de Ciudad de México**: día = arco de 6:00 a 18:00 (x 12→88 %, rosa en los extremos y dorado a mediodía; si eligió "día" fuera de horario, mediodía); atardecer = sol bajo ámbar; noche = resplandor plata en la esquina de la luna, sin disco. Se recalcula cada 5 min. `--sol-rgb`/`--sol-a` están registrados con `@property` y la posición transiciona 2.6 s.
- **Parallax**: scroll → `--sy`, puntero fino → `--mx/--my` (un rAF por movimiento, `js/portada.js`); cada capa tiene `--vy`/`--px`. Todo se desvanece (`--fade`) y se oculta (`.oculta`) al bajar del inicio. `prefers-reduced-motion` pone `--par:0` (sin parallax ni vaivén). Modo ligero (`body.light-mode`) y <640px: sin desenfoque. El panel del inicio se mueve más lento que el scroll.
- El canvas principal suma unas pocas luciérnagas de día mientras se ve la portada (`updateFireflies`).

## Partes del recorrido (rediseño, bloque 3)

- El recorrido va en **cinco partes** (`<div class="capitulo" id="cap-N" data-capitulo="N" data-nombre="…">` en `index.html`): I Cómo empezó (contador, mesiversario, calendario) · II Lo que guardo de ti (nota de voz, frasco) · III Lo que hemos vivido (fotos favoritas, polaroids, línea del tiempo) · IV Nuestra música (banda sonora) · V Lo que sigue (pergamino de cartas). Se dice **"Parte"**, no "Capítulo": "Capítulo 1" ya es el nombre de la sorpresa del 21 de septiembre.
- Cada parte abre con un **portal a pantalla completa** (`.cap-portal`, `data-escena="pasada"`: el número romano gigante en contorno y el texto se mueven con `--p`), y entre partes crece un **puente** (`.cap-puente`, `data-escena="trazo"`: un tallo que se dibuja y un lirio que florece). Estilos en `assets/css/capitulos.css`.
- `js/capitulos.js`: un `IntersectionObserver` con banda de cero alto en el centro decide la parte actual → `body[data-capitulo]` (tiñe `#bg-capitulo` con `--cap-rgb`/`--cap-a`, registrados con `@property`), resalta la entrada del índice de partes (dentro de "Caminos del jardín", `.cap-indice-item`) y muestra 3.4 s el letrero `#cap-indicador`. Si agregas una sección nueva, ponla dentro de la parte que le toque, no suelta; si agregas una parte, suma su portal, su puente y un tinte `body[data-capitulo="N"]`.
- Los títulos y subtítulos de las partes son rótulos míos: están listados en `REVISAR.md`.

## Tipografía (rediseño, bloque 4)

- Tres voces, definidas en `tokens.css` (`--fuente-display`, `--fuente-titulo`, `--fuente-ui`) y aplicadas en `assets/css/tipografia.css`: **Cormorant Garamond** (display: "Para ti, Lexi", `h2.titulo-seccion`, portales de las partes, números del contador y del popup Infinito) · **Playfair Display** (títulos medianos y todo texto íntimo en itálica) · **Inter** (interfaz). Julio eligió Cormorant (2026-10-29) entre Cormorant, Fraunces y Marcellus.
- Cormorant es fina y más chica a igual tamaño: se usa **solo grande**, con peso 500–600, y la escala (`--t-hero`, `--t-portal`, `--t-seccion`, `--t-numero`) ya lo compensa. No la uses para texto corrido ni títulos chicos. Trae cifras antiguas (el 1 parece una I): en contadores se fuerza `font-variant-numeric: lining-nums tabular-nums`.
- Archivo: `assets/fonts/CormorantGaramond-latin-300-700-normal.woff2` (subset latin, ~38 KB, variable 300–700, solo normal — no hay itálica de Cormorant), con preload en `index.html` y en el precache de `sw.js`. Mismo criterio que las otras: autoalojada, sin Google Fonts.

## Línea del tiempo plegable (rediseño, bloque 5)

- `renderTimeline()` (extras.js) agrupa `MEMORIES` por mes (`.tl-mes`: encabezado-botón `aria-expanded` + `.tl-panel` con los recuerdos); el último mes arranca abierto y hay un botón "Abrir/Cerrar todos los meses" (`#tl-toggle-todo`). Con todo plegado mide ~300 px; con todo abierto ~6,800 px (antes siempre eso). El plegado anima `grid-template-rows` 0fr→1fr (sin medir alturas) y el panel cerrado queda `visibility:hidden`.
- **Enredadera** (`#timeline-vine`, SVG regenerado por `buildVine(h)` según el alto real del bloque): tallo ondulado con `pathLength=1` cuyo `stroke-dashoffset` sigue el scroll, más hojas y zarcillos (`.tl-deco`) que aparecen al pasar la marca de lectura (75 % de la pantalla). Un `ResizeObserver` vuelve a medir al plegar/desplegar. Los tops se miden en `measure()` y en scroll solo se leen números guardados (sin `getBoundingClientRect` por cuadro). Color de hojas: token `--oliva-rgb`. Estilos en `assets/css/linea-tiempo.css`.
- Si agregas un mes nuevo a `recuerdos.js` aparece solo; las fotos de la línea siguen saliendo del mapa `PHOTO_BY_DATE` (dentro de la función).

## Micro-interacciones y sonidos (rediseño, bloque 6)

- **Sonidos** (`js/sonidos.js`, `window.Sonidos`): todo sintetizado con Web Audio, **sin archivos**, y por **un solo bus**: voces → lowpass 7 kHz → compresor → `master` (`VOLUMEN` 0.8, voces ≈ -27 dBFS: muy por debajo de la música) con una reverb corta generada. Reutiliza el mismo `AudioContext` de la música (`getAudioCtx()` en audio.js). Nombres: `toque`, `mes`, `abrir`, `cerrar`, `cielo(estado)`, `corazon`, `premio`, `petalos`; cada uno con un tiempo de espera para no saturar. Calla con la pestaña oculta o mientras suena la nota de voz. Julio pidió "volumen bajo, discretos": no subas `VOLUMEN` ni las ganancias de `VOCES` sin preguntar. Interruptor `#camino-efectos` (tarjeta Tocadiscos de Caminos), preferencia en `jardin.sonidos.v1` (`{on}`; por defecto encendido). Sonido nuevo = una función en `VOCES` + su espera en `ESPERA`; nunca un `<audio>`/`new Audio()` aparte.
- **Dónde suenan**: `premio` lo dispara `spawnSparkleBurst(..., rising=true)`; `abrir/cerrar` las vistas (Buzón, Juegos, Infinito) y el modal; `cielo` `setCielo()`; `corazon` el frasco; `toque`/`petalos` los pone `js/micro.js`.
- **Pétalos al tocar** (`js/micro.js` + `spawnPetalTouch()` en motor-canvas.js, capa superior `#cursor-canvas`): un `pointerdown` sobre algo clicable suelta 7 pétalos (4 si es al aire, con 350 ms de espera, solo en el Jardín: no en vistas, juegos, popups ni canvas). Sin pétalos con `prefers-reduced-motion`; la mitad en modo ligero. El rastro del cursor ahora tiene 4 colores según el cielo y cae un poquito. Los puntitos de aviso del dock laten (`latidoSuave`).

## Selector de discos (rediseño, bloque 7)

- La Parte IV ("Nuestra música", sección "Nuestra banda sonora") es un **reproductor de CD de los de antes**: `renderBandaSonora()` (extras.js) arma dentro de `#banda-sonora-list` una pantalla LCD (disco N/total, título, artista, tiempo, barra), un carrusel de discos iridiscentes (el elegido al centro, vecinos más chicos; texto del título/artista rotulado en el borde con `textPath`), mandos anterior/reproducir/siguiente, números de disco y la dedicatoria. Estilos en `assets/css/cd.css`.
- **Se construye solo con `SONGS`** (`contenido/canciones.js`): más canciones = más discos, sin tocar código. Hoy son 3 y **no hay espacios vacíos ni discos de relleno** (decisión de Julio, 2026-10-29: las 4 canciones nuevas — Call It What You Want, Cowboy Like Me, Gold Rush, Patient Zero — se agregan cuando él suba los mp3; entonces basta con meter cada una en `SONGS` y en `assets/audio/` y correr `check-assets.js`).
- Elegir un disco (deslizar, flechas, números o tocar uno vecino) solo lo pone al centro; **Reproducir** o tocar el disco central usa `playDedicatedSong()` / `bgAudio`, igual que el mini-reproductor del dock, y el aparato se sincroniza con ambos (`play`/`pause`/`loadstart`/`timeupdate`). El disco que suena gira. Accesible: discos como botones con `aria-current`, `role="status"` sr-only con el estado, teclado ←/→, y botones de 44 px. `prefers-reduced-motion` quita el giro.

## Pergamino con dos cartas, panel del inicio y ritual 11:11

- **Mesiversarios en el Buzón:** `mes-5` (28 oct) y `mes-6` "Seis meses" (28 nov, `borrador:true`, sin foto ni canción como las demás) ya existen; el siguiente mesiversario se agrega igual (`tipo:"mesiversario"`, `apertura` el día 28) y la tarjeta "Próximo mesiversario" lo toma sola. Probar con `?fecha=2026-11-28`.

- El pergamino final recorre 3 cartas (`LETTER_SEQ`): `LETTER` (config.js),
  `CARTA_FINAL` ("Para seguir escribiendo") y `CARTA_PARA_LEXI` ("Para Lexi",
  texto literal de Julio, última), con "Leer una carta más" y "Volver a…"
  (`goToLetter()`; "Leer…" se oculta en la última, "Volver…" en la primera): la tinta se desvanece y se
  vuelve a revelar párrafo por párrafo, `aria-live="polite"`, instantáneo con
  `prefers-reduced-motion`. La vela del deseo (`#letter-wish-block`) es solo de
  la primera carta. `CARTA_FINAL` también es un sobre abierto del Buzón; "Para Lexi" **no** está en el Buzón (solo es la tercera carta del pergamino).
- **Contador infinito:** `diffFromStart()` calcula siempre ahora − 28/05/2026 en hora de Ciudad de México (Intl, no la zona del dispositivo) a partir de `Date`, nunca sumando 1 por tic; sin fecha de fin ni `clearInterval`; se actualiza al instante en `visibilitychange`/`pageshow`/`focus`. Debajo va la dedicatoria "Me dijiste que el día que este contador se detenga…". `START_DATE` es el instante fijo `2026-05-28T00:00:00-06:00`.
- **Popup "Infinito"** (`#view-infinito` en index.html + `assets/css/infinito.css` + `js/infinito.js`; ya no existe `infinito.html`): se abre desde el ∞ junto al contador (`#clock-infinity-link`) como una vista más (`.app-view`, iris desde el ∞, `window.Infinito.abrir()/cerrar()`, razón `'infinito'` en `canvasPauseReasons`) — por decisión de Julio, para que no se reinicie el Jardín al volver. Idea tomada de ritvikbhatia/LoveProject (texto tipo código que se escribe solo + corazón de flores + contador), en JS plano con la paleta del sitio: flores de pétalos bezier con composición `lighter` sobre canvas (dpr ≤ 2, 1.5 en teléfono), **el corazón de "te amo" en 20 idiomas justo en el centro del corazón de flores** (`#inf-lang`, mismo centro H/2, escala `K*0.82`, vía `buildHeartLangWords(w, h, {cx, cy, scale})`), texto en monoespaciado del sistema (única excepción tipográfica, solo para el "código"), contador con la misma regla de siempre. Nada corre con el popup cerrado; reduced-motion dibuja todo de una vez.
- La sección "Lo que nos falta vivir" se eliminó por decisión de Julio (no volver a agregarla).
- Inicio: `#hero-panel` es un cuadro semitransparente que aparece ~4.5 s después de abrir el sitio (clase `.shown`) para que "Para ti" y el texto se lean sobre los lirios; sin la fecha "21 de septiembre" arriba. En modo ligero (`body.light-mode`) no usa blur.
- Cursor: cursor nativo siempre visible (nunca `cursor:none`) y la manita (`cursor:pointer`) en todo lo clicable vía regla global `button, [role="button"], a[href]…` (venía del preflight de Tailwind y se había perdido). La capa superior `#cursor-canvas` (z 200) tiene su propio rAF (`topFrame`), independiente del loop principal, y dibuja el rastro de pétalos (por `pointermove` de mouse/lápiz, nunca touch) y los destellos de premio (`spawnSparkleBurst` los manda ahí cuando el canvas principal está pausado, así se ven al ganar un juego). Todo lo que decae lo hace por tiempo (dt), no por cuadro.
- Rendimiento del canvas: los lirios ya florecidos se dibujan desde un sprite cacheado (`buildLilySprite`) en vez de rehacer 6 gradientes por flor por cuadro; `scrollYCache` evita leer `window.scrollY` (layout forzado) en cada cuadro; ningún loop debe llamar a `getBoundingClientRect()` por cuadro, guarda el tamaño en el resize.
- Móvil (<640px): botones táctiles de 44px, texto mínimo 12px, zonas seguras (`env(safe-area-inset-*)`) en lo fijo, dock inferior en vez de botones en las esquinas, cupones 2 columnas (1 columna <360px), selección de canción compacta, `@media (hover: none)` anula hovers pegados, caps de partículas y dpr 1.5 en teléfono; en horizontal, los juegos de lienzo piden girar el teléfono (`#juego-stage[data-portrait]`).
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
