import { isMuted } from './sound';

/**
 * Sons das PAUSAS (mesa) — portados do protótipo /pausa. Paleta QUENTE (água,
 * madeira, suspiro), separada da paleta seca de trabalho (sound.ts). Respeita o
 * mute global. Gestos tolerantes a latência (nada de ritmo julgado).
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

function ac(): AudioContext | null {
  if (typeof window === 'undefined' || isMuted()) return null;
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
  const {
    type = 'triangle',
    gain = 0.16,
    delay = 0,
    slideTo,
    attack = 0.002,
    cutoff = 2600,
  } = opts;
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
  delay?: number;
}

function noise(dur: number, opts: NoiseOpts): void {
  const c = ac();
  if (!c || !master) return;
  const { type = 'bandpass', freq, q = 1, gain, slideTo, delay = 0 } = opts;
  const t0 = c.currentTime + delay;
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

/** Pescoço: estalo por direção. */
export function neckCrack(): void {
  noise(0.04, { type: 'highpass', freq: 2200, gain: 0.1 });
  tone(150, 0.1, { type: 'sine', gain: 0.09, slideTo: 85 });
  tone(300, 0.22, { type: 'sine', gain: 0.035, slideTo: 240, attack: 0.05 });
}

/** Alívio (volta completa do pescoço / fim do gole): sopro + "ahh". */
export function sigh(): void {
  noise(0.5, { type: 'bandpass', freq: 900, q: 2, gain: 0.07, slideTo: 300 });
  tone(340, 0.45, { type: 'sine', gain: 0.06, slideTo: 220, attack: 0.06 });
}

/** Tecladinho: nota "piano" macia (fundamental + oitava de brilho). */
export function pianoNote(freq: number): void {
  tone(freq, 0.55, { type: 'triangle', gain: 0.16, cutoff: 2400, attack: 0.004 });
  tone(freq * 2, 0.3, { type: 'sine', gain: 0.04, cutoff: 3200, attack: 0.004 });
}

/** Regar: "plip" aguado (tom curto caindo + esguicho macio na terra). */
export function waterDrop(v = 0): void {
  const pitch = 680 + v * 160;
  tone(pitch, 0.09, { type: 'sine', gain: 0.11, slideTo: 280, attack: 0.001 });
  noise(0.07, { type: 'lowpass', freq: 1100, gain: 0.05, slideTo: 380 });
}

/** Gole de café: slurp curto + "ahh" quente na sequência. */
export function sip(): void {
  noise(0.22, { type: 'bandpass', freq: 1400, q: 1.6, gain: 0.08, slideTo: 500 });
  tone(300, 0.16, { type: 'sine', gain: 0.05, slideTo: 200, attack: 0.02 });
  noise(0.45, { type: 'bandpass', freq: 850, q: 2, gain: 0.06, slideTo: 300, delay: 0.28 });
  tone(330, 0.4, { type: 'sine', gain: 0.05, slideTo: 215, attack: 0.06, delay: 0.28 });
}
