/* "Te amo" en decenas de idiomas y alfabetos — el corazón de palabras del popup Infinito
   (js/corazon-palabras.js). Cada forma va en su alfabeto nativo; si dudas de una ortografía,
   quítala. IDIOMAS_GRANDES son las frases que salen varias veces y grandes, cerca del centro.
   Fuente: traducciones de un hecho público (no voz personal de Julio): no llevan borrador. */
window.IDIOMAS_GRANDES = ['Te amo', 'Hasta la luna'];
window.IDIOMAS = [
  /* español y lenguas de España / América */
  { l: 'Español', t: 'Te amo' }, { l: 'Español', t: 'Te quiero' }, { l: 'Español', t: 'Te adoro' },
  { l: 'Catalán', t: "T'estimo" }, { l: 'Gallego', t: 'Quérote' }, { l: 'Euskera', t: 'Maite zaitut' },
  { l: 'Quechua', t: 'Munayki' }, { l: 'Guaraní', t: 'Rohayhu' }, { l: 'Náhuatl', t: 'Nimitztlazohtla' },
  /* lenguas romances */
  { l: 'Inglés', t: 'I love you' }, { l: 'Francés', t: "Je t'aime" }, { l: 'Italiano', t: 'Ti amo' },
  { l: 'Portugués', t: 'Eu te amo' }, { l: 'Rumano', t: 'Te iubesc' }, { l: 'Occitano', t: "T'aimi" },
  { l: 'Corso', t: 'Ti tengu caru' }, { l: 'Latín', t: 'Te amo semper' },
  /* germánicas */
  { l: 'Alemán', t: 'Ich liebe dich' }, { l: 'Neerlandés', t: 'Ik hou van je' }, { l: 'Sueco', t: 'Jag älskar dig' },
  { l: 'Noruego', t: 'Jeg elsker deg' }, { l: 'Danés', t: 'Jeg elsker dig' }, { l: 'Islandés', t: 'Ég elska þig' },
  { l: 'Afrikáans', t: 'Ek is lief vir jou' }, { l: 'Luxemburgués', t: 'Ech hunn dech gär' }, { l: 'Frisón', t: 'Ik hâld fan dy' },
  { l: 'Yidis', t: 'איך ליב דיך' },
  /* célticas */
  { l: 'Irlandés', t: 'Is breá liom thú' }, { l: 'Galés', t: "Rwy'n dy garu di" }, { l: 'Gaélico escocés', t: 'Tha gaol agam ort' }, { l: 'Bretón', t: 'Da garout a ran' },
  /* eslavas y bálticas */
  { l: 'Ruso', t: 'Я тебя люблю' }, { l: 'Ucraniano', t: 'Я тебе кохаю' }, { l: 'Polaco', t: 'Kocham cię' },
  { l: 'Checo', t: 'Miluji tě' }, { l: 'Eslovaco', t: 'Ľúbim ťa' }, { l: 'Croata', t: 'Volim te' },
  { l: 'Serbio', t: 'Волим те' }, { l: 'Esloveno', t: 'Ljubim te' }, { l: 'Búlgaro', t: 'Обичам те' },
  { l: 'Macedonio', t: 'Те сакам' }, { l: 'Letón', t: 'Mīlu tevi' }, { l: 'Lituano', t: 'Aš tave myliu' },
  /* otras de Europa */
  { l: 'Griego', t: "Σ'αγαπώ" }, { l: 'Húngaro', t: 'Szeretlek' }, { l: 'Finés', t: 'Minä rakastan sinua' },
  { l: 'Estonio', t: 'Ma armastan sind' }, { l: 'Albanés', t: 'Të dua' }, { l: 'Maltés', t: 'Inħobbok' },
  { l: 'Esperanto', t: 'Mi amas vin' },
  /* Asia oriental */
  { l: 'Japonés', t: '愛してる' }, { l: 'Coreano', t: '사랑해' }, { l: 'Coreano', t: '사랑해요' },
  { l: 'Chino simplificado', t: '我爱你' }, { l: 'Chino tradicional', t: '我愛你' }, { l: 'Mongol', t: 'Би чамд хайртай' },
  /* Sudeste asiático */
  { l: 'Vietnamita', t: 'Anh yêu em' }, { l: 'Tailandés', t: 'ฉันรักเธอ' }, { l: 'Indonesio', t: 'Aku cinta kamu' },
  { l: 'Malayo', t: 'Saya cinta padamu' }, { l: 'Filipino', t: 'Mahal kita' },
  /* Asia del sur */
  { l: 'Hindi', t: 'मुझे तुमसे प्यार है' }, { l: 'Bengalí', t: 'আমি তোমাকে ভালোবাসি' }, { l: 'Tamil', t: 'நான் உன்னை காதலிக்கிறேன்' },
  { l: 'Telugu', t: 'నేను నిన్ను ప్రేమిస్తున్నాను' }, { l: 'Gujarati', t: 'હું તને પ્રેમ કરું છું' }, { l: 'Maratí', t: 'माझं तुझ्यावर प्रेम आहे' },
  { l: 'Panyabí', t: 'ਮੈਂ ਤੈਨੂੰ ਪਿਆਰ ਕਰਦਾ ਹਾਂ' }, { l: 'Urdu', t: 'مجھے تم سے محبت ہے' }, { l: 'Nepalí', t: 'म तिमीलाई माया गर्छु' },
  /* Asia occidental y central */
  { l: 'Árabe', t: 'أحبك' }, { l: 'Persa', t: 'دوستت دارم' }, { l: 'Hebreo', t: 'אני אוהב אותך' },
  { l: 'Turco', t: 'Seni seviyorum' }, { l: 'Azerí', t: 'Səni sevirəm' }, { l: 'Kazajo', t: 'Мен сені сүйемін' },
  { l: 'Uzbeko', t: 'Seni sevaman' }, { l: 'Georgiano', t: 'მიყვარხარ' }, { l: 'Armenio', t: 'Սիրում եմ քեզ' },
  /* África y Oceanía */
  { l: 'Suajili', t: 'Nakupenda' }, { l: 'Zulú', t: 'Ngiyakuthanda' },
  { l: 'Hawaiano', t: 'Aloha wau iā ʻoe' }, { l: 'Maorí', t: 'Aroha ana au ki a koe' }, { l: 'Samoano', t: 'Ou te alofa ia te oe' },
];
