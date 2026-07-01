/**
 * Áudio ISOLADO do protótipo de pausas (Web Audio, zero assets). Não toca no
 * `src/store/sound.ts` de produção. Foco: provar o "suco" (som + resposta visual).
 * `latencyHint: 'interactive'` + ataques secos → onset no tempo (ritmo).
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
    // 0 = pede o mínimo absoluto de buffer (menor que 'interactive' em alguns SOs).
    ctx = new AC({ latencyHint: 0 });
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** Instante do relógio de áudio (pra agendar demos sample-accurate). */
export function now(): number {
  const c = ac();
  return c ? c.currentTime : 0;
}

/** Piso de latência de saída (buffer do navegador/SO), em ms — só pra medir. */
export function outLatencyMs(): number {
  const c = ac();
  if (!c) return 0;
  const base = (c as unknown as { baseLatency?: number }).baseLatency ?? 0;
  const out = (c as unknown as { outputLatency?: number }).outputLatency ?? 0;
  return Math.round((base + out) * 1000);
}

interface ToneOpts {
  type?: OscillatorType;
  gain?: number;
  delay?: number;
  slideTo?: number;
  attack?: number;
  cutoff?: number;
  when?: number;
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
    when,
  } = opts;
  const t0 = when ?? c.currentTime + delay;
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
  when?: number;
}

function noise(dur: number, opts: NoiseOpts): void {
  const c = ac();
  if (!c || !master) return;
  const { type = 'bandpass', freq, q = 1, gain, slideTo, when } = opts;
  const t0 = when ?? c.currentTime;
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

// --- 1 · Pandeiro: chocalho metálico + pele (tum grave / ta agudo) ---
/** Transiente curtíssimo (1ª frente de onda) — deixa o onset "cair" antes. */
function click(gain: number, when?: number): void {
  noise(0.005, { type: 'highpass', freq: 4200, gain, when });
}
/**
 * Brilho metálico dos pratinhos: banco de parciais INARMÔNICOS (metal não é
 * harmônico) via squares num highpass, com decay curto — o "ching/shimmer" que
 * ruído puro não dá. Razões estilo hi-hat 808 (inarmônicas).
 */
function platinelas(gain: number, dur: number, when?: number): void {
  const c = ac();
  if (!c || !master) return;
  const t0 = when ?? c.currentTime;
  const base = 3300;
  const ratios = [1, 1.34, 1.79, 2.31, 2.92, 3.47];
  const hp = c.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 5200;
  const g = c.createGain();
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  for (const r of ratios) {
    const o = c.createOscillator();
    o.type = 'square';
    o.frequency.value = base * r;
    o.connect(hp);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }
  hp.connect(g);
  g.connect(master);
}

/** Platinelas: shimmer metálico + sizzle + cauda de chocalho (acompanha a pele). */
export function jingle(gain = 0.06, when?: number): void {
  platinelas(gain, 0.13, when); // o "ching" metálico (o pratinho)
  noise(0.09, { type: 'highpass', freq: 7000, gain: gain * 0.5, when }); // sizzle das plaquinhas
  noise(0.16, { type: 'bandpass', freq: 8500, q: 0.6, gain: gain * 0.28, when }); // cauda que chocalha
}
/** Tum do meio (polegar/base no centro) — grave. Ataque seco pra cair no tempo. */
export function pandeiroTum(when?: number): void {
  click(0.04, when);
  tone(115, 0.13, { type: 'sine', gain: 0.24, slideTo: 78, attack: 0.0005, when });
  jingle(0.04, when);
}
/** Toque em cima (dedos na borda de cima) — aberto, mais agudo/cristalino. */
export function pandeiroTop(when?: number): void {
  click(0.06, when);
  noise(0.04, { type: 'bandpass', freq: 640, q: 0.9, gain: 0.14, when });
  tone(360, 0.05, { type: 'triangle', gain: 0.08, attack: 0.0005, when });
  jingle(0.09, when);
}
/** Toque embaixo (dedos na borda de baixo) — mais fechado/redondo que o de cima. */
export function pandeiroBottom(when?: number): void {
  click(0.05, when);
  noise(0.05, { type: 'bandpass', freq: 410, q: 0.9, gain: 0.13, when });
  tone(240, 0.06, { type: 'triangle', gain: 0.08, attack: 0.0005, when });
  jingle(0.06, when);
}

// --- 2 · Girar o pescoço: estalo por direção + alívio na volta completa ---
export function neckCrack(): void {
  noise(0.04, { type: 'highpass', freq: 2200, gain: 0.1 });
  tone(150, 0.1, { type: 'sine', gain: 0.09, slideTo: 85 });
  tone(300, 0.22, { type: 'sine', gain: 0.035, slideTo: 240, attack: 0.05 });
}
/** Alívio maior (volta completa do pescoço): sopro macio descendente + "ahh". */
export function sigh(): void {
  noise(0.5, { type: 'bandpass', freq: 900, q: 2, gain: 0.07, slideTo: 300 });
  tone(340, 0.45, { type: 'sine', gain: 0.06, slideTo: 220, attack: 0.06 });
}

// --- 3 · Esmagar: pop suculento + esguicho curto (pitch sobe no combo) ---
export function squash(pitch: number): void {
  tone(pitch, 0.08, { type: 'sine', gain: 0.17, slideTo: pitch * 0.4, attack: 0.001 });
  noise(0.05, { type: 'lowpass', freq: 520, gain: 0.06, slideTo: 150 });
}
