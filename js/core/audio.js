/* Sound effects (synthesised with WebAudio — no files) and German text-to-speech. */
(function () {
  'use strict';
  const B = window.Brezel;
  let ctx = null;

  function ac() {
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, start, dur, { type = 'sine', gain = 0.15, slideTo = null } = {}) {
    const c = ac();
    if (!c) return;
    const t0 = c.currentTime + start;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(c.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.03);
  }

  const sounds = {
    tap: () => tone(620, 0, 0.05, { gain: 0.05 }),
    drop: () => tone(420, 0, 0.07, { type: 'triangle', gain: 0.07 }),
    correct: () => {
      tone(784, 0, 0.12, { type: 'triangle', gain: 0.16 });
      tone(1175, 0.09, 0.26, { type: 'triangle', gain: 0.16 });
    },
    wrong: () => {
      tone(233, 0, 0.16, { type: 'sawtooth', gain: 0.05, slideTo: 190 });
      tone(185, 0.13, 0.26, { type: 'square', gain: 0.035, slideTo: 150 });
    },
    combo: () => [659, 784, 988, 1319].forEach((f, i) => tone(f, i * 0.06, 0.14, { type: 'triangle', gain: 0.1 })),
    complete: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.11, 0.32, { type: 'triangle', gain: 0.13 })),
  };

  function play(name) {
    if (!B.store.setting('sound')) return;
    try {
      sounds[name] && sounds[name]();
    } catch (e) {
      /* audio is decoration — never let it break the app */
    }
  }

  // --- Text to speech -------------------------------------------------------
  const canSpeak = typeof window.speechSynthesis !== 'undefined' && typeof window.SpeechSynthesisUtterance !== 'undefined';
  let voice = null;

  function pickVoice() {
    if (!canSpeak) return null;
    const voices = window.speechSynthesis.getVoices().filter((v) => /^de(-|_|$)/i.test(v.lang));
    if (!voices.length) return null;
    const score = (v) =>
      (/de-DE/i.test(v.lang) ? 4 : 0) +
      (/premium|enhanced|natural|neural/i.test(v.name) ? 3 : 0) +
      (/google|anna|petra|helena|katja|markus/i.test(v.name) ? 2 : 0) +
      (v.localService ? 1 : 0);
    return voices.sort((a, b) => score(b) - score(a))[0];
  }

  if (canSpeak) {
    voice = pickVoice();
    window.speechSynthesis.addEventListener &&
      window.speechSynthesis.addEventListener('voiceschanged', () => (voice = pickVoice()));
  }

  function speak(text) {
    if (!canSpeak || !text) return;
    const clean = String(text).replace(/_/g, ' ').replace(/\//g, ', ').replace(/\s*…\s*/g, ' ');
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = 'de-DE';
    if (voice) u.voice = voice;
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  }

  B.audio = { play, speak, canSpeak };
})();
