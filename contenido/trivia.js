/* ¿Qué tanto nos conocemos? — pool de preguntas con hechos verificados del
   banco de amor (BANCO-DE-AMOR.md) y del calendario. Cada partida toma 10
   al azar y mezcla el orden de las opciones. "correcta" es el índice
   (0-based) de la opción correcta en "opciones". Editable: agrega o quita
   preguntas libremente, el juego se ajusta solo al length. */
window.TRIVIA = [
  { pregunta: '¿Cómo empezó el primer mensaje de Julio?', opciones: ['"Holaaa, Lexi? Soy Julio"', '"Hola, ¿cómo estás?"', '"Buenas noches, bonita"', '"¿Qué haces?"'], correcta: 0 },
  { pregunta: '¿Qué dijo Julio que haría en lugar de prometer?', opciones: ['"Te lo voy a demostrar"', '"Te voy a escribir un poema"', '"Te voy a regalar el mundo"', '"Te voy a cantar"'], correcta: 0 },
  { pregunta: '¿Qué regalo dijo Lexi que le bastaba?', opciones: ['Un diente de león del parque rojo', 'Un anillo de oro', 'Un perfume', 'Un viaje a Europa'], correcta: 0 },
  { pregunta: '¿Cuáles son los colores favoritos de Lexi y de Julio?', opciones: ['Morado y azul', 'Rojo y negro', 'Verde y amarillo', 'Rosa y naranja'], correcta: 0 },
  { pregunta: '¿Con qué canción quiere bailar Lexi si algún día se casan?', opciones: ['Call It What You Want', 'Love Story', 'Wildest Dreams', 'Shake It Off'], correcta: 0 },
  { pregunta: '¿Qué le dedicó Julio a Lexi por primera vez el 1 de junio?', opciones: ['Un atardecer', 'Una canción', 'Un poema', 'Un MVP'], correcta: 0 },
  { pregunta: '¿Qué le regaló Julio a Lexi el 6 de junio?', opciones: ['Un elefante de peluche (Panchito), flores y una cartita', 'Un perfume', 'Un vinilo', 'Un anillo'], correcta: 0 },
  { pregunta: '¿Cuándo se vieron por primera vez en persona?', opciones: ['Martes 9 de junio', 'Jueves 28 de mayo', 'Sábado 13 de junio', 'Viernes 12 de junio'], correcta: 0 },
  { pregunta: '¿Qué hacen cuando el reloj marca 11:11?', opciones: ['Piden un deseo', 'Se llaman', 'Se dicen "buenas noches"', 'Se mandan una foto'], correcta: 0 },
  { pregunta: '¿Qué regla se volvió ley en el carro?', opciones: ['Un beso en cada semáforo en rojo', 'Nunca poner música', 'Siempre ir por el camino largo', 'Apagar el celular'], correcta: 0 },
  { pregunta: '¿Qué cena tuvieron el 4 de julio?', opciones: ['Italiana', 'Mexicana', 'Japonesa', 'Francesa'], correcta: 0 },
  { pregunta: '¿De qué color eran las flores que Julio mandó a su trabajo en julio?', opciones: ['Moradas', 'Amarillas', 'Rojas', 'Blancas'], correcta: 0 },
  { pregunta: '¿Cuál es el buldak favorito de Julio?', opciones: ['Cremoso carbonara con queso', 'El más picante de todos', 'El de camarón', 'El de salsa verde'], correcta: 0 },
  { pregunta: '¿A qué concierto fueron el 11 de septiembre?', opciones: ['Tributo a Taylor Swift', 'Arctic Monkeys', 'Travis Scott', 'Olivia Rodrigo'], correcta: 0 },
  { pregunta: '¿Qué peli vieron en Screen X?', opciones: ['Spider-Man', 'Titanic', 'Aro 2', 'La La Land'], correcta: 0 },
  { pregunta: '¿Qué juego platinó Julio el 17 de septiembre?', opciones: ['Cyberpunk 2077', 'Baldur\'s Gate 3', 'Minecraft', 'Monster Hunter Wilds'], correcta: 0 },
  { pregunta: '¿Qué estilo de uñas eligió Lexi "por ti"?', opciones: ['Edgerunners, granate y dorado, con una J', 'Rosa pastel con flores', 'Azul con estrellas', 'Negras con una L'], correcta: 0 },
  { pregunta: '¿Cómo es el cuarto soñado de Julio?', opciones: ['Con ventana al oeste para ver atardeceres', 'Con vista al mar', 'Con una chimenea', 'Con techo de cristal'], correcta: 0 },
  { pregunta: '¿Cómo se llama el panda de su mundo de Minecraft?', opciones: ['Po', 'Winnie', 'Panchito', 'Kung Fu'], correcta: 0 },
  { pregunta: '¿Cuál es el rol de Lexi en Marvel Rivals?', opciones: ['Healer (soporte)', 'Tanque', 'Duelista', 'Francotiradora'], correcta: 0 },
  { pregunta: '¿Quién superó a Kanye West en los artistas más escuchados de Julio?', opciones: ['Taylor Swift', 'Travis Scott', 'Joji', 'Arctic Monkeys'], correcta: 0 },
  { pregunta: '¿Cuál es la comida de niño favorita de Julio?', opciones: ['Los hot dogs (dogos)', 'Pizza', 'Hamburguesas', 'Sushi'], correcta: 0 },
  { pregunta: '¿Dónde fue la cena del cumpleaños de Lexi?', opciones: ['En un mirador con vista a la ciudad', 'En una azotea', 'En la playa', 'En su casa'], correcta: 0 },
  { pregunta: '¿En qué fecha empezó su historia?', opciones: ['28 de mayo', '9 de junio', '21 de septiembre', '6 de junio'], correcta: 0 },
  { pregunta: '¿Qué día crearon su mundo en Minecraft?', opciones: ['1 de junio', '28 de mayo', '21 de septiembre', '3 de julio'], correcta: 0 },
  { pregunta: '¿Cuál de estas SÍ es una de las flores favoritas de Lexi?', opciones: ['Lirios', 'Tulipanes', 'Margaritas', 'Claveles'], correcta: 0 },
  { pregunta: '¿Qué canción salió el 12 de junio y desde entonces es "suya"?', opciones: ['Honeybee', 'Lover', 'So High School', 'Ninguna'], correcta: 0 },
  { pregunta: '¿Qué hicieron el 13 de junio, su segunda salida?', opciones: ['Fueron a Andares, Gale y al cine', 'Vieron Cyberpunk Edgerunners', 'Fueron a Colomos', 'Cenaron en un mirador'], correcta: 0 },
  { pregunta: 'El 19 de septiembre Lexi le dio a Julio el mejor regalo que ha recibido. ¿Qué incluía?', opciones: ['El vinilo de Astroworld, el osito de Kanye y el funko de Spidey', 'Un libro y un reloj', 'Boletos para un concierto', 'Un perfume'], correcta: 0 },
  { pregunta: '¿Cuándo es el cumpleaños de Julio?', opciones: ['1 de julio', '4 de julio', '5 de agosto', '28 de mayo'], correcta: 0 },
  { pregunta: '¿Cuándo es el cumpleaños de Lexi?', opciones: ['5 de agosto', '1 de julio', '15 de agosto', '29 de agosto'], correcta: 0 },
];
