/* El Buzón — cartas que se "sellan" hasta su fecha de apertura (o que
   están disponibles desde ya, para abrir "cuando" haga falta).
   Fecha de apertura: comparada contra la fecha de hoy en America/Mexico_City
   (ver getTodayDateString() en index.html). Mientras no llegue esa fecha,
   el sobre se ve sellado con cuenta regresiva.
   desbloqueaCon: "caceria" | "curame" — la carta no se abre por fecha sino
   al completar ese juego (ver cartaIsOpenable() en index.html); "pista" es
   lo que se lee en el sobre mientras está cerrado.
   Los textos marcados borrador:true se listan en REVISAR.md. */

/* Segunda carta del pergamino final ("Leer una carta más") y también sobre
   del Buzón. Texto de CARTA-FINAL.md; el cierre mezcla las tres variantes
   opcionales (gracias por quedarte / lugar seguro, hogar, persona / hasta
   la luna). Sin emojis a propósito. */
window.CARTA_FINAL = {
  titulo: "Para seguir escribiendo",
  botonIda: "Leer una carta más",
  botonVuelta: "Volver a la primera carta",
  texto: `Lexi:

Cuando abriste esta página el 21 de septiembre, me dijiste que iba a ser tu lugar seguro cuando yo no estuviera. Por eso no quise que se quedara en la sorpresa de un solo día. Aquí van a vivir las cartas que todavía no te escribo, las razones que todavía me faltan y todo lo que se nos vaya ocurriendo.

Todo empezó con un "Holaaa, Lexi? Soy Julio" y tu "La misma". Ese día me dijiste que no querías flores, ni oro, ni perfume; que querías tiempo. Yo te dije que te daría el mío y que, en lugar de prometerte cosas, te las iba a demostrar. Esta página es una de esas demostraciones, y no es la última.

Desde entonces hemos compartido atardeceres, canciones, partidas, buldaks y más 11:11 de los que puedo contar. Panchito te ha cuidado cuando yo no podía, y yo he aprendido que contigo la rutina se vuelve algo único.

Si algún día dudas de lo que siento, vuelve aquí. Está escrito, con letras que no se borran, que te elijo hoy, mañana y siempre. Y no voy a discutir quién ama a quién más, porque ya sabes que gano yo.

Gracias por quedarte, por dejarme amarte y por hacerme tan feliz. Mi lugar seguro, mi hogar, mi persona.

Esto apenas empieza.

Hoy, mañana y siempre.
Contigo, hasta la luna.

Julio`,
  borrador: true, // solo el cierre mezclado es nuevo; el resto es el texto de CARTA-FINAL.md
};

window.CARTAS = [
  {
    id: "para-seguir-escribiendo",
    titulo: "Para seguir escribiendo",
    tipo: "sorpresa",
    apertura: "2026-09-21",
    sello: "lirio",
    texto: window.CARTA_FINAL.texto,
    borrador: true,
  },
  {
    id: "mes-5",
    titulo: "Cinco meses",
    tipo: "mesiversario",
    apertura: "2026-10-28",
    sello: "lirio",
    texto: "\"Quiero tiempo.\" Eso me pediste el primer día, y yo te dije: \"Y yo te daré el mío.\" Hoy cumplimos cinco meses y todavía sigo dándotelo, con gusto.\n\nSi quieres repasar el camino, la línea de tiempo del Jardín nos espera: desde aquel \"Holaaa, Lexi? Soy Julio\" hasta hoy.\n\nFeliz mesiversario, Lexi. Hoy, mañana y siempre.",
    borrador: true,
  },
  {
    id: "abre-triste",
    titulo: "Ábrela cuando estés triste",
    tipo: "abre-cuando",
    apertura: "2026-09-21",
    sello: "corazon",
    texto: "Si estás leyendo esto es porque algo te tiene triste, y antes que nada quiero que sepas que está bien sentirte así. No tienes que fingir que estás bien conmigo, nunca.\n\nRespira, tómate tu tiempo, y cuando quieras te abrazo fuerte — aquí sigo, esperándote, pase lo que pase.",
    borrador: true,
  },
  {
    id: "abre-no-dormir",
    titulo: "Ábrela cuando no puedas dormir",
    tipo: "abre-cuando",
    apertura: "2026-09-21",
    sello: "estrella",
    texto: "Si no puedes dormir, cierra los ojos y acuérdate de lo que me dijiste el primer día que te dediqué un atardecer: \"Algún día lo vamos a ver juntos, y el anochecer, y el amanecer.\"\n\nYo quiero ver miles de atardeceres contigo, y que cuando vivamos juntos nuestro cuarto tenga una ventana que dé al oeste. Mientras tanto, cuenta las razones del frasco, o cuéntame a mí lo que te quita el sueño.\n\nDuérmete bonita. Aquí estoy, aunque sea así.",
    borrador: true,
  },
  {
    id: "abre-extranes",
    titulo: "Ábrela cuando me extrañes",
    tipo: "abre-cuando",
    apertura: "2026-09-21",
    sello: "lirio",
    texto: "Si me extrañas, acuérdate de aquel día que fui por ti con la mente hecha un huracán de pensamientos. En cuanto saliste y te abracé, sentí paz. De repente pasó la tormenta y salió el sol.\n\nSiempre que voy a un lugar solo pienso cómo sería si estuvieras conmigo, pero recuerdo que tú siempre estás conmigo.\n\nYo también te extraño. Ya casi nos vemos.",
    borrador: true,
  },
  {
    id: "abre-insegura",
    titulo: "Ábrela cuando dudes",
    tipo: "abre-cuando",
    apertura: "2026-09-21",
    sello: "corazon",
    texto: "Si algo te hace dudar, de ti o de nosotros, léeme despacio: te elijo así, completa, con tus días buenos y tus días malos. Porque amar es elegir, y yo te elijo a ti cada día.\n\nNo necesito ningún título para saber que eres tú.",
    borrador: true,
  },
  {
    id: "abre-enojada",
    titulo: "Ábrela cuando estés enojada conmigo",
    tipo: "abre-cuando",
    apertura: "2026-09-21",
    sello: "estrella",
    texto: "Si estás enojada conmigo, probablemente me lo merezca, y lo siento de corazón. Tómate el tiempo que necesites, no voy a ir a ningún lado.\n\nSolo quiero que sepas que, enojo aparte, sigues siendo lo que más quiero en este mundo.",
    borrador: true,
  },
  {
    id: "abre-dia-increible",
    titulo: "Ábrela cuando tengas un día increíble",
    tipo: "abre-cuando",
    apertura: "2026-09-21",
    sello: "lirio",
    texto: "Si hoy tuviste un día increíble, quiero celebrarlo contigo como sabemos hacerlo: a las 11:11, pide un deseo.\n\nYa sé que siempre dices \"ya lo pedí\". Y yo te digo lo mismo que te dije un día: mi deseo ya se cumplió.\n\nSigue brillando así, mi reina.",
    borrador: true,
  },
  {
    id: "navidad-cabana",
    titulo: "La cabaña de Navidad",
    tipo: "sorpresa",
    apertura: "2026-12-25",
    sello: "estrella",
    texto: "Feliz Navidad, Lexi.\n\nUna vez hablamos de pasar la Navidad tú y yo solos en una cabaña, hasta año nuevo, y la respuesta fue un \"Acepto\". Sigue pendiente, y sigue en pie.\n\nMientras llega, este es mi regalo: hoy, mañana y siempre.",
    borrador: true,
  },
  {
    id: "capsula-primer-ano",
    titulo: "Nuestro primer año",
    tipo: "capsula",
    apertura: "2027-05-28",
    sello: "estrella",
    texto: "Cuando escribí esto yo tenía 20 años y tú 26. Apenas íbamos por los cinco meses y ya sabía que no quería ser solo un capítulo en tu vida: quería ser la historia completa.\n\nSi estás leyendo esto, cumplimos un año. Cuéntame cómo fue. Hoy, mañana y siempre.",
    borrador: true,
  },
  {
    id: "capsula-un-ano-lirios",
    titulo: "Un año del primer ramo de lirios",
    tipo: "capsula",
    apertura: "2027-09-21",
    sello: "lirio",
    texto: "Hace un año, en un 21 de septiembre, te preparé una sorpresa con flores amarillas y toda una página solo para ti. Si esto sigue vivo y tú lo sigues leyendo, significa que ese primer capítulo se convirtió en muchos más.\n\nGracias por quedarte, Lexi. Por este año, y por todos los que siguen.",
    borrador: true,
  },
  {
    // Se abre al completar el juego "Cúrame" (js/juegos/curame.js), no por fecha.
    id: "sorpresa-curame",
    titulo: "Mi healer favorita",
    tipo: "sorpresa",
    apertura: "2099-01-01",
    desbloqueaCon: "curame",
    pista: "cúrame, cúrame, cúrame",
    sello: "estrella",
    texto: "Si estás leyendo esto es porque me curaste. Otra vez. En Rivals y en todo lo demás, siempre eres mi healer.\n\nTe dedico mi MVP: cada victoria es tuya, aunque yo juegue fatal. Y ya sabes: usa a Elsa.\n\nGracias por curarme, Lexi. Hoy, mañana y siempre.",
    borrador: true,
  },
  {
    // Fecha de apertura lejana a propósito: esta carta no se abre por
    // fecha, sino al completar la Cacería de corazones (Fase 3). Ver
    // desbloqueaCon y cartaIsOpenable() en index.html.
    id: "sorpresa-caceria",
    titulo: "Los doce corazones",
    tipo: "sorpresa",
    apertura: "2099-01-01",
    desbloqueaCon: "caceria",
    pista: "encuentra los 12 corazones",
    sello: "corazon",
    texto: "Si estás leyendo esto es porque encontraste los doce corazones que escondí por todo este pequeño mundo — en la luna, en Panchito, entre las flores, donde se me fueran ocurriendo.\n\nMe gusta pensar que así soy yo contigo: dejando pedacitos de cariño escondidos en todas partes, para que los sigas encontrando incluso cuando no los estás buscando.\n\nGracias por buscar hasta el último. Te amo, Lexi.",
    borrador: true,
  },
];
