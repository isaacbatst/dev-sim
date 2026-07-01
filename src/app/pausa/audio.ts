/**
 * Áudio ISOLADO do protótipo de pausas (Web Audio, zero assets). Não toca no
 * `src/store/sound.ts` de produção. Só mecânicas tolerantes a latência (discreto),
 * sem ritmo preciso (o pandeiro foi aposentado por causa do buffer do navegador).
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC({ latencyHint: 0 });
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

interface ToneOpts {
  type?: OscillatorType;
  gain?: number;
  delay?: number;
  slideTo?: number;
  attack?: number;
  cutoff?: number;
}

function tone(freq: number, dur: number, opts: ToneOpts = {}): void {
  const c = ac();
  if (!c || !master) return;
  const { type = 'triangle', gain = 0.16, delay = 0, slideTo, attack = 0.002, cutoff = 2600 } = opts;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = cutoff;
  lp.Q.value = 0.7;
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + dur);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(lp);
  lp.connect(g);
  g.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.03);
}

interface NoiseOpts {
  type?: BiquadFilterType;
  freq: number;
  q?: number;
  gain: number;
  slideTo?: number;
}

function noise(dur: number, opts: NoiseOpts): void {
  const c = ac();
  if (!c || !master) return;
  const { type = 'bandpass', freq, q = 1, gain, slideTo } = opts;
  const t0 = c.currentTime;
  const frames = Math.max(1, Math.floor(c.sampleRate * dur));
  const buffer = c.createBuffer(1, frames, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filt = c.createBiquadFilter();
  filt.type = type;
  filt.frequency.setValueAtTime(freq, t0);
  filt.Q.value = q;
  if (slideTo) filt.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filt);
  filt.connect(g);
  g.connect(master);
  src.start(t0);
  src.stop(t0 + dur);
}

// --- Pescoço: estalo por direção + alívio na volta completa ---
export function neckCrack(): void {
  noise(0.04, { type: 'highpass', freq: 2200, gain: 0.1 });
  tone(150, 0.1, { type: 'sine', gain: 0.09, slideTo: 85 });
  tone(300, 0.22, { type: 'sine', gain: 0.035, slideTo: 240, attack: 0.05 });
}
/** Alívio maior (volta completa): sopro macio descendente + "ahh". */
export function sigh(): void {
  noise(0.5, { type: 'bandpass', freq: 900, q: 2, gain: 0.07, slideTo: 300 });
  tone(340, 0.45, { type: 'sine', gain: 0.06, slideTo: 220, attack: 0.06 });
}

// --- Esmagar: pop suculento + esguicho curto (pitch sobe no combo) ---
export function squash(pitch: number): void {
  tone(pitch, 0.08, { type: 'sine', gain: 0.17, slideTo: pitch * 0.4, attack: 0.001 });
  noise(0.05, { type: 'lowpass', freq: 520, gain: 0.06, slideTo: 150 });
}

// --- Regar: "plip" aguado (tom curto caindo + esguicho macio na terra) ---
export function waterDrop(v = 0): void {
  const pitch = 680 + v * 160;
  tone(pitch, 0.09, { type: 'sine', gain: 0.11, slideTo: 280, attack: 0.001 });
  noise(0.07, { type: 'lowpass', freq: 1100, gain: 0.05, slideTo: 380 });
}
