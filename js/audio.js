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
function updateAudioBars() {
  if (!useRealEq) return;
  if (bgAnalyser && !bgAudio.paused) {
    bgAnalyser.getByteFrequencyData(bgDataArr);
    applyBars(miniEqBars, bgDataArr);
  }
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

/* ======================================================================
   SUNSET TOGGLE
====================================================================== */
document.getElementById('sunset-toggle').addEventListener('click', () => {
  isSunset = !isSunset;
  document.body.classList.toggle('sunset-mode', isSunset);
  particles = [];
  if (!isSunset) { fireflies = []; birds = []; }
  if (isSunset) showToast(SUNSET_TOAST_TEXT);
});

