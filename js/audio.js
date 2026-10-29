/* ======================================================================
   WEB AUDIO — real analyser-driven equalizers (with graceful fallback)
====================================================================== */
const bgAudio = new Audio();
bgAudio.loop = true;
bgAudio.crossOrigin = 'anonymous';
const voiceAudio = document.getElementById('voice-audio');

let audioCtx = null;
let bgAnalyser = null, bgDataArr = null;
let voiceAnalyser = null, voiceDataArr = null;
let useRealEq = false;
let analysersSetupDone = false;

function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}
function setupAnalysers() {
  if (analysersSetupDone) return;
  analysersSetupDone = true;
  try {
    const ac = getAudioCtx();
    const bgSource = ac.createMediaElementSource(bgAudio);
    bgAnalyser = ac.createAnalyser(); bgAnalyser.fftSize = 64;
    bgSource.connect(bgAnalyser); bgAnalyser.connect(ac.destination);
    bgDataArr = new Uint8Array(bgAnalyser.frequencyBinCount);

    const voiceSource = ac.createMediaElementSource(voiceAudio);
    voiceAnalyser = ac.createAnalyser(); voiceAnalyser.fftSize = 64;
    voiceSource.connect(voiceAnalyser); voiceAnalyser.connect(ac.destination);
    voiceDataArr = new Uint8Array(voiceAnalyser.frequencyBinCount);

    useRealEq = true;
  } catch (e) {
    useRealEq = false;
  }
}
function applyBars(barsEls, dataArr) {
  const step = Math.max(1, Math.floor(dataArr.length / barsEls.length));
  for (let i = 0; i < barsEls.length; i++) {
    const v = dataArr[i * step] / 255;
    barsEls[i].style.transform = `scaleY(${Math.max(0.12, v)})`;
  }
}
/* ---- ritmo (bloque 11): el fondo respira con los graves de la canción ----
   ritmoNivel = energía grave suavizada (0–1) · ritmoPulso = destello que salta en cada
   golpe y decae solo. Los usan #bg-ritmo (abajo), los lirios (motor-canvas.js) y unos
   bokeh que suben en los golpes fuertes. Sin movimiento (modo ligero/reducido) no hace nada. */
let ritmoProm = 0, ritmoUltimoGolpe = 0, ritmoPintado = -1; // ritmoNivel y ritmoPulso viven en motor-canvas.js (carga antes)
const bgRitmoEl = document.getElementById('bg-ritmo');
function actualizarRitmo(t) {
  const suena = bgAnalyser && !bgAudio.paused && !LIGHT_MODE;
  if (suena) {
    const e = (bgDataArr[0] + bgDataArr[1]) / 510;
    ritmoProm += (e - ritmoProm) * 0.04;
    ritmoNivel += (e - ritmoNivel) * 0.2;
    if (e > ritmoProm * 1.25 && e > 0.32 && t - ritmoUltimoGolpe > 260) {
      ritmoPulso = 1; ritmoUltimoGolpe = t;
      if (e > 0.6 && bokehs.length < 14) spawnBokeh(rand(vw * 0.15, vw * 0.85), rand(vh * 0.45, vh * 0.95), 1);
    }
  } else {
    ritmoNivel *= 0.92; ritmoPulso *= 0.92;
  }
  ritmoPulso *= 0.9;
  const v = suena || ritmoNivel > 0.01 ? Math.min(1, 0.18 + ritmoNivel * 0.62 + ritmoPulso * 0.4) : 0;
  if (Math.abs(v - ritmoPintado) > 0.012) {
    ritmoPintado = v;
    bgRitmoEl.style.opacity = v.toFixed(3);
    bgRitmoEl.style.transform = 'scale(' + (1 + ritmoPulso * 0.06).toFixed(3) + ')';
  }
}
function updateAudioBars(t) {
  if (useRealEq && bgAnalyser && !bgAudio.paused) bgAnalyser.getByteFrequencyData(bgDataArr);
  actualizarRitmo(t || 0);
  if (!useRealEq) return;
  if (bgAnalyser && !bgAudio.paused) applyBars(miniEqBars, bgDataArr);
  if (voiceAnalyser && !voiceAudio.paused) {
    voiceAnalyser.getByteFrequencyData(voiceDataArr);
    applyBars(voiceWaveBars, voiceDataArr);
  }
}

/* ======================================================================
   SOUNDTRACK — selection screen + persistent mini-player
====================================================================== */
let currentSongIndex = -1;
const mainContent = document.getElementById('main-content');
const miniPlayer = document.getElementById('mini-player');
const miniTitle = document.getElementById('mini-player-title');
const miniToggle = document.getElementById('mini-player-toggle');
const miniNext = document.getElementById('mini-player-next');
const miniVinyl = document.getElementById('mini-vinyl');
const miniEqWrap = document.getElementById('mini-eq');
const songSelectCards = document.getElementById('song-select-cards');

function buildBars(container, count) {
  container.innerHTML = '';
  const bars = [];
  for (let i = 0; i < count; i++) {
    const bar = document.createElement('div');
    bar.className = 'eq-bar w-[3px] h-full';
    bar.style.height = (30 + rand(0, 70)) + '%';
    bar.style.animationDelay = (i * 0.08) + 's';
    container.appendChild(bar);
    bars.push(bar);
  }
  return bars;
}
const miniEqBars = buildBars(miniEqWrap, 4);

SONGS.forEach((song, idx) => {
  const card = document.createElement('div');
  card.className = 'song-select-card glass rounded-2xl p-5 flex flex-col items-center text-center hover:-translate-y-1 transition-transform cursor-pointer';
  card.innerHTML = `
    <div class="vinyl-mini w-full aspect-square rounded-xl mb-4 flex items-center justify-center text-4xl bg-gradient-to-br from-amethyst-orchid/60 to-gold-amber/40 border border-white/10" style="color:var(--dorado-500);">${ico('i-vinilo', 'ico-2xl')}</div>
    <p class="font-display text-base text-parchment mb-1">${song.title}</p>
    <p class="font-ui text-xs text-parchment/50 mb-4">${song.artist}</p>
    <div class="flex items-end gap-[3px] h-6 eq-wrap"></div>
  `;
  buildBars(card.querySelector('.eq-wrap'), 5);
  card.addEventListener('click', () => {
    card.classList.add('selected');
    chooseSong(idx);
  });
  songSelectCards.appendChild(card);
});

function updateMiniPlayerIcon() {
  miniToggle.innerHTML = ico(bgAudio.paused ? 'i-play' : 'i-pausa', 'ico-sm');
  miniVinyl.classList.toggle('spinning', !bgAudio.paused);
  if (!useRealEq) miniEqBars.forEach((b) => b.classList.toggle('playing', !bgAudio.paused));
}
function playCurrentSong() {
  setupAnalysers();
  bgAudio.play().catch(() => {});
  updateMiniPlayerIcon();
}
function chooseSong(idx) {
  currentSongIndex = idx;
  const song = SONGS[idx];
  bgAudio.src = song.src;
  bgAudio.currentTime = 0;
  playCurrentSong();

  miniTitle.textContent = song.title;
  miniPlayer.classList.remove('hidden-player');

  document.body.classList.remove('locked');
  screenSongs.classList.remove('active');
  screenSongs.classList.add('screen-out');
  setTimeout(() => {
    screenSongs.style.display = 'none';
    mainContent.classList.remove('hidden-content');
    document.getElementById('dock').classList.add('visible');
    updateScrollProgress();
    revealHeroTitle();
    setTimeout(() => document.getElementById('hero-panel').classList.add('shown'), 4500);
    celebrateMesiversarioIfNeeded();
  }, 500);
}
miniToggle.addEventListener('click', () => {
  if (currentSongIndex === -1) return;
  if (bgAudio.paused) playCurrentSong(); else { bgAudio.pause(); updateMiniPlayerIcon(); }
});
miniNext.addEventListener('click', () => {
  if (currentSongIndex === -1) return;
  currentSongIndex = (currentSongIndex + 1) % SONGS.length;
  const song = SONGS[currentSongIndex];
  bgAudio.src = song.src;
  bgAudio.currentTime = 0;
  playCurrentSong();
  miniTitle.textContent = song.title;
});
function pauseBgAudioForVoiceNote() {
  if (!bgAudio.paused) { bgAudio.pause(); updateMiniPlayerIcon(); }
}
