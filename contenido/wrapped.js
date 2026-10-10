/* Nuestro Wrapped — cifras de nuestra conversación (28 de mayo al 27 de septiembre de
   2026), solo conteos; ningún mensaje del chat vive en el sitio. Las
   cifras son aproximadas (conteo por coincidencia de texto). Cada slide:
     tipo "numero": un número grande que sube (valor, unidad)
     tipo "duo":    dos barras comparadas (a / b con nombre y valor)
     tipo "barras": barras por etiqueta (items)
     tipo "cierre": cierre
   Textos en voz de Julio, borrador — revisar en REVISAR.md. */
window.WRAPPED = [
  { tipo: "numero", eyebrow: "Del 28 de mayo al 27 de septiembre", valor: 123, unidad: "días hablando", texto: "Cuatro meses de nosotros, contados en mensajes." },
  { tipo: "numero", eyebrow: "En total", valor: 65689, unidad: "mensajes", texto: "Escribimos más de sesenta y cinco mil mensajes." },
  { tipo: "duo", eyebrow: "Quién escribió más", titulo: "Mensajes", a: { nombre: "Yo", valor: 42427 }, b: { nombre: "Tú", valor: 23262 }, texto: "Yo escribo casi el doble. Pero tú me ganas en audios: 478 contra 43." },
  { tipo: "duo", eyebrow: "Nuestra frase favorita", titulo: "Te amo", a: { nombre: "Yo", valor: 1600, mas: true }, b: { nombre: "Tú", valor: 800, mas: true }, texto: "Y todavía discutimos quién ama a quién más." },
  { tipo: "duo", eyebrow: "Y también", titulo: "Amor", a: { nombre: "Yo", valor: 1779 }, b: { nombre: "Tú", valor: 1299 }, texto: "\"Amor\", a secas, también se nos da bien." },
  { tipo: "numero", eyebrow: "Nuestra hora", valor: 50, mas: true, unidad: "veces te mandé 11:11", texto: "Y tú siempre contestas: \"ya lo pedí\"." },
  { tipo: "duo", eyebrow: "Lo confieso", titulo: "Te extraño", a: { nombre: "Yo", valor: 234 }, b: { nombre: "Tú", valor: 46 }, texto: "Lo dije 234 veces, y lo que siento no cabe en un contador." },
  { tipo: "barras", eyebrow: "Mensajes por mes", items: [
    { etiqueta: "Mayo", valor: 6436, nota: "solo 4 días" },
    { etiqueta: "Junio", valor: 13082 },
    { etiqueta: "Julio", valor: 14342 },
    { etiqueta: "Agosto", valor: 13821 },
    { etiqueta: "Septiembre", valor: 18008 },
  ], texto: "Septiembre fue el mes en que más hablamos." },
  { tipo: "numero", eyebrow: "29 de mayo, el segundo día de conocernos", valor: 2025, unidad: "mensajes en un solo día", texto: "Nuestro día más largo." },
  { tipo: "duo", eyebrow: "Los stickers hablan por nosotros", titulo: "Stickers", a: { nombre: "Yo", valor: 4401 }, b: { nombre: "Tú", valor: 2433 }, texto: "Mejor que mil palabras, dicen." },
  { tipo: "cierre", titulo: "Y esto apenas empieza.", texto: "Hoy, mañana y siempre.", nota: "Cifras aproximadas." },
];
