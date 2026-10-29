/* Memorama de nosotros — parejas con las fotos de fotos.js. Usa
   window.FAVORITE_PHOTOS / window.POLAROIDS y openModal (globales del
   inline script), referenciados solo dentro de funciones. */
window.JuegoMemorama = (function () {
  let mountEl = null;
  let cleanupFns = [];

  function shuffle(arr) {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  function buildDeck() {
    const pool = [].concat(window.FAVORITE_PHOTOS || [], window.POLAROIDS || []);
    const photos = shuffle(pool).slice(0, 6);
    const deck = [];
    photos.forEach((p, i) => {
      deck.push({ pairId: i, src: p.src, caption: p.caption });
      deck.push({ pairId: i, src: p.src, caption: p.caption });
    });
    return shuffle(deck);
  }

  function start(mount) {
    mountEl = mount;
    const deck = buildDeck();
    mount.innerHTML = `
      <div class="memorama-grid"></div>
      <p class="memorama-status" id="memorama-status">Encuentra las parejas</p>
    `;
    const grid = mount.querySelector('.memorama-grid');
    const statusEl = mount.querySelector('#memorama-status');

    let flipped = [];
    let matchedCount = 0;
    let lock = false;

    function finish() {
      const banco = (window.FRASES && window.FRASES.length) ? window.FRASES : null;
      const frase = banco
        ? banco[Math.floor(Math.random() * banco.length)].texto
        : 'Encontraste todas nuestras fotos. Así te encuentro yo siempre a ti: sin importar dónde busque, siempre apareces.';
      openModal({ icon: 'i-cartas', title: '¡Las encontraste todas!', body: frase });
    }

    deck.forEach((item, idx) => {
      const card = document.createElement('div');
      card.className = 'memorama-card';
      card.innerHTML = `
        <div class="memorama-card-inner">
          <div class="memorama-face memorama-face-back">${ico('lirio', 'ico-xl')}</div>
          <div class="memorama-face memorama-face-front">${pictureHTML(item.src, '')}</div>
        </div>
      `;
      const onClick = () => {
        if (lock || card.classList.contains('flipped') || card.classList.contains('matched')) return;
        card.classList.add('flipped');
        flipped.push({ idx, item, card });
        if (flipped.length === 2) {
          lock = true;
          const [a, b] = flipped;
          if (a.item.pairId === b.item.pairId) {
            setTimeout(() => {
              a.card.classList.add('matched');
              b.card.classList.add('matched');
              matchedCount++;
              statusEl.textContent = a.item.caption || '¡Pareja encontrada!';
              flipped = [];
              lock = false;
              if (matchedCount === deck.length / 2) setTimeout(finish, 700);
            }, 420);
          } else {
            setTimeout(() => {
              a.card.classList.remove('flipped');
              b.card.classList.remove('flipped');
              flipped = [];
              lock = false;
            }, 700);
          }
        }
      };
      card.addEventListener('click', onClick);
      cleanupFns.push(() => card.removeEventListener('click', onClick));
      grid.appendChild(card);
    });
  }

  function stop() {
    cleanupFns.splice(0).forEach((fn) => fn());
    if (mountEl) mountEl.innerHTML = '';
    mountEl = null;
  }

  return {
    id: 'memorama',
    titulo: 'Memorama de nosotros',
    icono: 'i-cartas',
    descripcion: 'Encuentra las parejas de nuestras fotos.',
    start,
    stop,
  };
})();
