# Por revisar

Textos marcados `borrador: true` en `contenido/*.js` para que Julio los lea,
edite o apruebe antes de que Lexi los vea. Cuando uno quede aprobado tal
cual, cambia su `borrador` a `false` y bórralo de esta lista.

Fuente del contenido nuevo: el banco de amor extraído del chat (citas
textuales). El chat y el banco **no** están en este repositorio, que es
público.

## Calendario (`contenido/recuerdos.js`)

Entradas reescritas en versión positiva y sin nombres de terceros:

- **30 de mayo:** "El día que me dijiste «tqm» por primera vez."
- **25 de junio:** "El día que nos acostamos juntos en el parque, sin prisa y sin nada más importante que nosotros."
- **26 de junio y 29 de agosto:** se quitaron los nombres de terceras personas.
- **9 de septiembre:** se quitó la palabra "íntimos".
- **11 de septiembre:** "El concierto de Taylor, el día que lloré de felicidad viéndote."
- **13 de septiembre:** versión positiva, sin referencias a la pelea.
- **17 de septiembre:** "El día que me presentaste en tu stream y me llevaste un pastel a la universidad."

Entradas nuevas: 29 de mayo, 18 de junio (Chapultepec), 1 de julio
(tu cumpleaños), 10 de julio (pulseras), 21 de septiembre (la sorpresa) y
24 de septiembre (uñas Edgerunners).

## Frasco (`contenido/razones.js`)

- 39 razones nuevas del banco de amor (todas `borrador:true`).
- Se suavizó la razón número 2 de las originales: se quitó "traumas".
- Frases de los 4 hitos y la Razón 101 (secreta), tomadas del banco.

## El Buzón (`contenido/cartas.js`)

- **"Para seguir escribiendo"** (`CARTA_FINAL`): texto de `CARTA-FINAL.md`.
  El único cambio es el cierre, que mezcla las tres variantes: "Gracias por
  quedarte, por dejarme amarte y por hacerme tan feliz. Mi lugar seguro, mi
  hogar, mi persona." y "Contigo, hasta la luna." Está en el pergamino
  final (botón "Leer una carta más") y como sobre del Buzón.
- Reescritas con citas del banco: "me extrañes", "no puedas dormir",
  "dudes" (antes "insegura") y "día increíble".
- **"Seis meses" (`mes-6`, se abre el 28 de noviembre de 2026): carta nueva, borrador mío.** Abre como "Para Lexi" (Mi niña hermosa, mi Lexi) y usa solo hechos que ya están en el sitio (calendario, mes-5, cabaña de Navidad); sin foto ni botón de canción, como las demás cartas. Ya tiene tus ajustes del 29 de octubre (la frase íntima se dejó tierna y sin detalles por la regla de privacidad del repo público). Léela y edítala en `contenido/cartas.js` antes de publicar.
- Nuevas: "Cinco meses" (mes-5, reescrita), "La cabaña de Navidad"
  (25 de dic), cápsula del primer año (reescrita) y "Mi healer favorita"
  (se abre ganando Cúrame).
- No se incluyó "el sueño de la playa" de la carta "no puedas dormir":
  el banco lo menciona pero no trae el texto. Si quieres, agrégalo tú.
- "Ábrela cuando estés enojada conmigo" se dejó (genérica); el banco pide
  evitar peleas, así que valora si la quieres.

## Juegos

- **Cupones (`cupones.js`):** 15 cupones del banco, descripciones cortas y sin referencias. Ya no contactan a nadie: el botón es "Acepto" y muestra una nota (`NOTA_CUPON`).
- **Cúrame (`js/juegos/curame.js`):** 40 segundos, sin game over duro; "como si fueras Luna en Rivals".

## Otros textos (`contenido/config.js`, `canciones.js`)

- `NOTA_CARTA`, `NOTA_CUPON` y `RITUAL_1111_TEXT`.
- Dedicatorias de las canciones: Honeybee (Olivia Rodrigo) y So High
  School (con la frase de Lexi).

## Popup "Infinito" (`js/infinito.js`, borrador)

El texto tipo código que se escribe solo (usa tu primer mensaje y "La misma",
los atardeceres dedicados y "hoy / mañana / siempre"), la frase del botón
"Un abrazo" ("Aquí estoy, abrazándote muy fuerte.") y los mensajes de debajo
del corazón. Ajústalos en el arreglo `CODE` y en la función del abrazo.

## Rótulos del rediseño (míos, para que los cambies si quieres)

- **Partes del recorrido** (título · subtítulo): I "Cómo empezó" · "28 de mayo de 2026"; II "Lo que guardo de ti" · "una voz y cien razones"; III "Lo que hemos vivido" · "flores, fotos y días que se quedan"; IV "Nuestra música" · "las canciones que ya son nuestras"; V "Lo que sigue" · "una carta que no termina". Están en `index.html` (`.cap-portal`) y en el `data-nombre` de cada `.capitulo`.
- **Aviso de instalar** (`js/instalar.js`): "Lleva el Jardín contigo: instálalo en tu pantalla de inicio y ábrelo cuando quieras.", la versión de iPhone ("…en Safari toca Compartir y luego «Añadir a pantalla de inicio».") y el botón "Llevar el Jardín en mi pantalla de inicio".
- **Caminos del jardín:** títulos y subtítulos de las 4 escenas ("Cartas que se abren con el tiempo", "Cupones, memorama y más sorpresas", "Nuestro soundtrack", "Día, atardecer o noche") y "Por aquí se llega a cada rincón."

## Decisiones tomadas (sin texto que revisar)

- Sin botón ni texto para contactar a Julio (WhatsApp eliminado), por tu
  indicación.
- Tipografía: se mantiene Playfair Display itálica para la firma, no
  Dancing Script, por tu decisión anterior de no usar fuentes cursivas.
- Emojis: no se agregaron nuevos; los juegos y cupones nuevos reutilizan
  los que el sitio ya tenía. Se quitaron los de los pies de foto.
- Contador: "días desde que empezamos a hablar".

## Pendiente para después

Cacería de corazones con los lugares del chat, playlist ampliada
(Call It What You Want, Cowboy Like Me, Gold Rush, Patient Zero), galería
de "ojitos", carta de los 6 meses (28 de noviembre) y "Adivina los 5
versos".

## Mejoras futuras sugeridas (no implementadas)

**Móvil:** agrupar la línea del tiempo por mes (hoy mide ~6,800px en el teléfono); gestos de deslizar entre cartas del Buzón; vibración suave (`navigator.vibrate`) al acertar en juegos; modo "instalar en inicio" con aviso amable (PWA); menú inferior fijo en vez de botones flotantes; juegos jugables también en horizontal.

**Escritorio:** atajos de teclado (B Buzón, J Juegos); galería con navegación de flechas en el lightbox; fondo que reacciona al ritmo de la canción; carta del mes con cuenta regresiva en vivo; cacería con los lugares del chat; playlist ampliada; carta de los 6 meses.

**Ambos:** Lighthouse real (rendimiento ≥90) en un teléfono de gama baja; imágenes AVIF; modo oscuro/claro automático según la hora del dispositivo.
