/* ¿Qué tanto nos conocemos? — trivia de opción múltiple sobre la
   historia real de la pareja (contenido/trivia.js). Termina en un
   "diploma", nunca en un puntaje frío sin más. */
window.JuegoTrivia = (function () {
  let mountEl = null;

  function diplomaMessage(score, total) {
    if (score === total) return '¡Perfecto! Sabes nuestra historia de memoria, tal como yo me la sé de ti.';
    if (score >= total * 0.7) return 'Te la sabes casi toda — como era de esperarse.';
    return 'No importa el puntaje: lo que importa es que la seguimos escribiendo juntos.';
  }

  function start(mount) {
    mountEl = mount;
    const PER_GAME = 10;
    function shuffle(arr) {
      const out = arr.slice();
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    }
    function buildQuestions() {
      return shuffle(window.TRIVIA || []).slice(0, PER_GAME).map((q) => {
        const tagged = q.opciones.map((texto, i) => ({ texto, ok: i === q.correcta }));
        const mixed = shuffle(tagged);
        return { pregunta: q.pregunta, opciones: mixed.map((o) => o.texto), correcta: mixed.findIndex((o) => o.ok) };
      });
    }
    let questions = buildQuestions();
    let current = 0;
    let score = 0;

    function renderQuestion() {
      const q = questions[current];
      mount.innerHTML = `
        <p class="trivia-progress">Pregunta ${current + 1} de ${questions.length}</p>
        <p class="trivia-question">${q.pregunta}</p>
        <div class="trivia-options"></div>
      `;
      const optsEl = mount.querySelector('.trivia-options');
      q.opciones.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'trivia-option';
        btn.textContent = opt;
        btn.addEventListener('click', () => selectAnswer(idx, btn));
        optsEl.appendChild(btn);
      });
    }

    function selectAnswer(idx, btn) {
      const q = questions[current];
      const buttons = mount.querySelectorAll('.trivia-option');
      buttons.forEach((b) => { b.disabled = true; });
      if (idx === q.correcta) {
        score++;
        btn.classList.add('correct');
      } else {
        btn.classList.add('wrong');
        buttons[q.correcta].classList.add('correct');
      }
      setTimeout(() => {
        current++;
        if (current < questions.length) renderQuestion();
        else renderDiploma();
      }, 900);
    }

    function renderDiploma() {
      mount.innerHTML = `
        <div class="trivia-diploma">
          <p class="trivia-diploma-eyebrow">Diploma de</p>
          <p class="trivia-diploma-title">Mejor Novia del Mundo</p>
          <p class="trivia-diploma-score">${score} / ${questions.length}</p>
          <p class="trivia-diploma-msg">${diplomaMessage(score, questions.length)}</p>
          <p class="trivia-diploma-signature">— Con todo mi amor, Julio</p>
          <button type="button" id="trivia-replay" class="cupon-redeem-btn" style="margin-top:1.5rem;">Jugar de nuevo</button>
        </div>
      `;
      mount.querySelector('#trivia-replay').addEventListener('click', () => {
        questions = buildQuestions();
        current = 0;
        score = 0;
        renderQuestion();
      });
    }

    renderQuestion();
  }

  function stop() {
    if (mountEl) mountEl.innerHTML = '';
    mountEl = null;
  }

  return {
    id: 'trivia',
    titulo: '¿Qué tanto nos conocemos?',
    emoji: '🎓',
    descripcion: '10 preguntas al azar sobre nuestra historia.',
    start,
    stop,
  };
})();
