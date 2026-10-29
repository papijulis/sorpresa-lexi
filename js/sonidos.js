/* ======================================================================
   SONIDOS SUAVES (bloque 6) — un solo bus de efectos
   Todo se sintetiza con Web Audio (sin archivos): notas cortas tipo
   campanita, un soplo de pétalos y arpegios de premio. Reutiliza el mismo
   AudioContext de la música (getAudioCtx en audio.js) y pasa SIEMPRE por un
   único bus: voces → [lowpass suave] → compresor → master (volumen bajo), con un
   poquito de reverberación. Se puede apagar (se guarda en jardin.sonidos.v1);
   calla solo con la pestaña oculta o mientras suena la nota de voz.
   API: Sonidos.play(nombre, arg) · Sonidos.activar(bool) · Sonidos.activo()
   Nombres: toque · mes · abrir · cerrar · cielo(arg: dia|atardecer|noche) ·
            corazon · premio · petalos
====================================================================== */
(function () {
  'use strict';
  var KEY = 'jardin.sonidos.v1';
  var VOLUMEN = 0.8;  // volumen general del bus: las voces ya van bajitas (≈ -27 dBFS al llegar aquí), quedan ~ -25 dBFS, muy por debajo de la música
  var on = true;
  try { var raw = jardinStorage.get(KEY); if (raw) on = JSON.parse(raw).on !== false; } catch (e) { /* sin preferencia guardada */ }

  var bus = null, ruido = null, ultimo = {};

  function crearBus() {
    if (bus) return bus;
    var ac = getAudioCtx();
    var master = ac.createGain(); master.gain.value = VOLUMEN;
    var comp = ac.createDynamicsCompressor();
    comp.threshold.value = -26; comp.ratio.value = 8; comp.attack.value = 0.003; comp.release.value = 0.2;
    var suave = ac.createBiquadFilter(); suave.type = 'lowpass'; suave.frequency.value = 7000;
    var entrada = ac.createGain();
    var seco = ac.createGain(); seco.gain.value = 0.85;
    var humedo = ac.createGain(); humedo.gain.value = 0.28;
    var rev = ac.createConvolver();
    // reverberación corta generada: ruido con caída exponencial
    var len = Math.floor(ac.sampleRate * 0.9), ir = ac.createBuffer(2, len, ac.sampleRate);
    for (var c = 0; c < 2; c++) {
      var d = ir.getChannelData(c);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    rev.buffer = ir;
    entrada.connect(seco); seco.connect(suave);
    entrada.connect(rev); rev.connect(humedo); humedo.connect(suave);
    suave.connect(comp); comp.connect(master); master.connect(ac.destination);
    bus = { ac: ac, entrada: entrada };
    return bus;
  }

  /* una nota: oscilador con ataque rápido y caída suave */
  function nota(b, freq, t0, dur, o) {
    o = o || {};
    var ac = b.ac, t = ac.currentTime + t0;
    var osc = ac.createOscillator(), g = ac.createGain();
    osc.type = o.tipo || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (o.hasta) osc.frequency.exponentialRampToValueAtTime(o.hasta, t + dur);
    var pico = o.gain || 0.04;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(pico, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(b.entrada);
    osc.start(t); osc.stop(t + dur + 0.05);
  }
  /* soplo de pétalos: ruido filtrado con barrido */
  function soplo(b, t0, dur, gain) {
    var ac = b.ac, t = ac.currentTime + t0;
    if (!ruido) {
      ruido = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      var d = ruido.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    var src = ac.createBufferSource(); src.buffer = ruido;
    var f = ac.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 0.9;
    f.frequency.setValueAtTime(2200, t); f.frequency.exponentialRampToValueAtTime(900, t + dur);
    var g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + dur * 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(b.entrada);
    src.start(t); src.stop(t + dur + 0.05);
  }

  var VOCES = {
    toque: function (b) { nota(b, 1568, 0, 0.2, { gain: 0.03 }); },
    mes: function (b) { nota(b, 520, 0, 0.1, { tipo: 'triangle', hasta: 700, gain: 0.04 }); },
    abrir: function (b) { nota(b, 659, 0, 0.32, { gain: 0.045 }); nota(b, 988, 0.09, 0.42, { gain: 0.04 }); },
    cerrar: function (b) { nota(b, 988, 0, 0.26, { gain: 0.04 }); nota(b, 659, 0.09, 0.36, { gain: 0.04 }); },
    cielo: function (b, estado) {
      if (estado === 'noche') { nota(b, 523, 0, 0.9, { gain: 0.045 }); nota(b, 392, 0.16, 1.1, { gain: 0.04 }); }
      else if (estado === 'atardecer') { nota(b, 784, 0, 0.7, { tipo: 'triangle', gain: 0.04 }); nota(b, 622, 0.14, 0.9, { tipo: 'triangle', gain: 0.035 }); }
      else { nota(b, 1047, 0, 0.5, { gain: 0.04 }); nota(b, 1319, 0.1, 0.6, { gain: 0.035 }); }
    },
    corazon: function (b) { nota(b, 523, 0, 0.4, { tipo: 'triangle', gain: 0.055 }); nota(b, 784, 0.07, 0.5, { tipo: 'triangle', gain: 0.045 }); },
    premio: function (b) { [1047, 1319, 1568, 2093].forEach(function (f, i) { nota(b, f, i * 0.075, 0.5, { gain: 0.032 }); }); },
    petalos: function (b) { soplo(b, 0, 0.34, 0.02); },
  };
  var ESPERA = { toque: 70, mes: 90, abrir: 200, cerrar: 200, cielo: 300, corazon: 120, premio: 500, petalos: 350 };

  function silencio() {
    if (document.hidden) return true;
    var v = document.getElementById('voice-audio');
    return !!(v && !v.paused); // no pisar la nota de voz
  }

  var Sonidos = {
    activo: function () { return on; },
    activar: function (v) {
      on = !!v;
      try { jardinStorage.set(KEY, JSON.stringify({ on: on })); } catch (e) { /* sin guardar */ }
      document.dispatchEvent(new CustomEvent('jardin:sonidos', { detail: on }));
      if (on) this.play('toque');
    },
    play: function (nombre, arg) {
      if (!on || silencio() || !VOCES[nombre]) return;
      var ahora = performance.now();
      if (ultimo[nombre] && ahora - ultimo[nombre] < (ESPERA[nombre] || 100)) return;
      ultimo[nombre] = ahora;
      try {
        var b = crearBus();
        if (b.ac.state === 'suspended') b.ac.resume();
        VOCES[nombre](b, arg);
      } catch (e) { /* sin audio disponible: no pasa nada */ }
    },
  };
  window.Sonidos = Sonidos;
})();
