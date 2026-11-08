/* Cacería de corazones — 12 corazones casi invisibles repartidos por el
   sitio (no es un juego que se "lanza" como los demás: vive siempre
   presente en el Jardín). init() se llama una sola vez desde
   buzon-juegos.js en DOMContentLoaded, cuando ya existen todos los elementos ancla
   (galerías de fotos, buzón, juegos, etc). Al encontrar los 12 se abre
   la carta secreta con desbloqueaCon:"caceria" en cartas.js. */
window.JuegoCaceria = (function () {
  const STORAGE_KEY = 'jardin.caceria.v1';
  const TOTAL = 12;
  const SPOTS = [
    { id: 'luna', selector: '#sunset-toggle', top: '6px', left: '6px' },
    { id: 'frasco', selector: '#jar', top: '4px', right: '2px' },
    { id: 'panchito', selector: '#polaroid-grid .polaroid:first-child', top: '-10px', left: '-10px' },
    { id: 'favoritas', selector: '#favorite-photos-grid .polaroid:first-child', top: '-10px', right: '-10px' },
    { id: 'carta', selector: '#letter-container', bottom: '18px', right: '18px' },
    { id: 'pie-pagina', selector: 'footer', top: '-6px', left: 'calc(50% - 15px)' },
    { id: 'deseo', selector: '#wish-candle', top: '-14px', right: '-10px' },
    { id: 'hora-1111', selector: '#badge-1111', top: '-8px', left: '-8px' },
    { id: 'nota-voz', selector: '#voice-play', bottom: '-8px', right: '-8px' },
    { id: 'buzon', selector: '#buzon-toggle', bottom: '-4px', left: '-4px' },
    { id: 'juegos', selector: '#juegos-toggle', bottom: '-4px', right: '-4px' },
    { id: 'mesiversario', selector: '#mesiversario-card', top: '-8px', right: '10%' },
  ];

  function loadState() {
    try {
      const raw = jardinStorage.get(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return {
        encontrados: Array.isArray(parsed.encontrados) ? parsed.encontrados : [],
        completada: !!parsed.completada,
      };
    } catch (e) {
      return { encontrados: [], completada: false };
    }
  }
  function saveState() { jardinStorage.set(STORAGE_KEY, JSON.stringify(state)); }

  // Se lee en init() (DOMContentLoaded): este archivo carga ANTES que
  // nucleo.js, donde vive jardinStorage, así que leer aquí daría vacío.
  let state = null;

  // Un corazón ya encontrado sale del orden de tabulación y del árbol de
  // accesibilidad (es un control anidado dentro del botón que lo contiene).
  function retirarDelFoco(el) {
    el.tabIndex = -1;
    if (document.activeElement === el) {
      const anchor = el.parentElement;
      if (anchor && anchor.tabIndex >= 0 && typeof anchor.focus === 'function') {
        try { anchor.focus({ preventScroll: true }); } catch (e) { anchor.focus(); }
      } else {
        el.blur();
      }
    }
    el.setAttribute('aria-hidden', 'true');
  }

  function openSorpresaCarta() {
    const carta = (window.CARTAS || []).find((c) => c.desbloqueaCon === 'caceria');
    if (!carta || typeof openModal !== 'function') return;
    openModal({
      icon: 'i-corazon-lleno',
      title: carta.titulo,
      bodyHTML: `<div class="letter-detail-text font-hand text-lg sm:text-xl leading-relaxed">${carta.texto}</div>`,
    });
  }

  function markFound(spotId, el) {
    if (!state) state = loadState();
    if (state.encontrados.includes(spotId)) return;
    state.encontrados.push(spotId);
    saveState();
    el.classList.add('found');
    retirarDelFoco(el);

    if (typeof spawnSparkleBurst === 'function') {
      const rect = el.getBoundingClientRect();
      spawnSparkleBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 18, true);
    }
    if (typeof showToast === 'function') {
      showToast(`Encontraste un corazón {i-corazon-lleno} (${state.encontrados.length}/${TOTAL})`);
    }
    if (state.encontrados.length >= TOTAL && !state.completada) {
      state.completada = true;
      saveState();
      setTimeout(openSorpresaCarta, 900);
    }
  }

  function init() {
    state = loadState();
    SPOTS.forEach((spot) => {
      const anchor = document.querySelector(spot.selector);
      if (!anchor) return;
      if (getComputedStyle(anchor).position === 'static') anchor.style.position = 'relative';

      const el = document.createElement('span');
      el.setAttribute('role', 'button');
      el.tabIndex = 0;
      el.className = 'heart-hotspot';
      el.setAttribute('aria-label', 'Un corazón escondido');
      el.innerHTML = ico('i-corazon-lleno');
      el.style.color = 'var(--dorado-500)';
      if (spot.top) el.style.top = spot.top;
      if (spot.bottom) el.style.bottom = spot.bottom;
      if (spot.left) el.style.left = spot.left;
      if (spot.right) el.style.right = spot.right;

      if (state.encontrados.includes(spot.id)) {
        el.classList.add('found');
        el.tabIndex = -1;
        el.setAttribute('aria-hidden', 'true');
      }

      // Ya encontrado: deja pasar el clic al botón que lo contiene (Buzón,
      // Cielo, nota de voz…) en vez de tragárselo para siempre.
      const onActivate = (e) => {
        if (state.encontrados.includes(spot.id)) return;
        e.stopPropagation();
        markFound(spot.id, el);
      };
      el.addEventListener('click', onActivate);
      el.addEventListener('keydown', (e) => {
        if (state.encontrados.includes(spot.id)) return;
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onActivate(e); }
      });

      anchor.appendChild(el);
    });
  }

  return {
    id: 'caceria',
    titulo: 'Cacería de corazones',
    icono: 'i-caceria',
    descripcion: 'Doce corazones casi invisibles, escondidos por todo el sitio.',
    init,
    progressLabel() {
      const s = loadState();
      return `${s.encontrados.length} de ${TOTAL} encontrados`;
    },
  };
})();
