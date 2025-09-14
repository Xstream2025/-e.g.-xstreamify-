// public/js/sound.js
// Tiny synth sounds — ALWAYS ON (no toggle)

let audioCtx;
function ensureCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  try { audioCtx.resume(); } catch {}
  return true;
}

export function playPlop(v = 0.2, start = 650, end = 200, ms = 160) {
  if (!ensureCtx()) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(start, audioCtx.currentTime);
  o.frequency.exponentialRampToValueAtTime(end, audioCtx.currentTime + ms / 1000);
  g.gain.setValueAtTime(0.0001, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(v, audioCtx.currentTime + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + ms / 1000);
  o.connect(g).connect(audioCtx.destination);
  o.start(); o.stop(audioCtx.currentTime + ms / 1000);
}

export function playBoing(v = 0.15, base = 220, ms = 220) {
  if (!ensureCtx()) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = "triangle";
  o.frequency.setValueAtTime(base, audioCtx.currentTime);
  o.frequency.exponentialRampToValueAtTime(base * 1.8, audioCtx.currentTime + ms / 2000);
  o.frequency.exponentialRampToValueAtTime(base * 0.9, audioCtx.currentTime + ms / 1000);
  g.gain.setValueAtTime(0.0001, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(v, audioCtx.currentTime + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + ms / 1000);
  o.connect(g).connect(audioCtx.destination);
  o.start(); o.stop(audioCtx.currentTime + ms / 800);
}
