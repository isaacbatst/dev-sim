import type { SoundEvent } from '@/core/snapshot';

/**
 * Síntese de áudio via Web Audio API — zero assets, zero licença. Cada
 * `SoundEvent` do motor vira um som curto e diegético (estilo "suco por tecla"
 * do Cook, Serve, Delicious). O AudioContext só nasce no primeiro gesto do
 * usuário (um keydown), respeitando a política de autoplay dos navegadores.
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
/** Fadiga (D): lowpass no master — o mundo soa cada vez mais abafado. */
let muffle: BiquadFilterNode | null = null;
let muted = false;

// Combo de digitação: teclas rápidas em sequência sobem de tom (feedback de ritmo).
let combo = 0;
let lastKeyAt = -1;

// Mash (resolver conflito ⬅️➡️): cada batida sobe de tom — "catraca" que escala.
let mashCombo = 0;
let lastMashAt = -1;

// Cochicho do `hold` (segurar — falar na reunião, rodar testes): murmúrio.
let holdTimer: ReturnType<typeof setTimeout> | null = null;
let holding = false;

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.42;
    muffle = ctx.createBiquadFilter();
    muffle.type = 'lowpass';
    muffle.frequency.value = 18000; // aberto (sem fadiga)
    muffle.Q.value = 0.5;
    master.connect(muffle);
    muffle.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** Tom curto com envelope percussivo. `slideTo` faz um glissando opcional. */
function tone(
  freq: number,
  dur: number,
  opts: {
    type?: OscillatorType;
    gain?: number;
    delay?: number;
    slideTo?: number;
    attack?: number;
    cutoff?: number;
  } = {},
): void {
  const c = audio();
  if (!c || !master) return;
  // Padrão triangle + lowpass: timbre arredondado e "macio", longe do bip 8-bit.
  const {
    type = 'triangle',
    gain = 0.16,
    delay = 0,
    slideTo,
    attack = 0.008,
    cutoff = 2200,
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
  // Ataque/decay suaves (sem o liga-desliga abrupto que soa chiptune).
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(lp);
  lp.connect(g);
  g.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.03);
}

function arpeggio(
  freqs: number[],
  step: number,
  dur: number,
  type: OscillatorType,
  gain: number,
  cutoff = 3000,
): void {
  freqs.forEach((f, i) => tone(f, dur, { type, gain, delay: i * step, cutoff }));
}

function keyBlip(): void {
  const c = audio();
  if (!c) return;
  const now = c.currentTime;
  if (lastKeyAt < 0 || now - lastKeyAt > 0.45) combo = 0;
  else combo = Math.min(combo + 1, 14);
  lastKeyAt = now;
  // Corpo macio (triangle filtrado) que sobe com o combo + um "toc" curto de
  // ruído pro toque mecânico — soa como tecla de verdade, não bip de console.
  const freq = 360 * Math.pow(2, combo / 30);
  tone(freq, 0.05, { type: 'triangle', gain: 0.1, cutoff: 1700 });
  noiseBurst(0.012, 1500, 0.04);
}

/** Batida do mash: catraca curta cujo tom sobe com o ritmo (reseta se esfriar). */
function mashTick(): void {
  const c = audio();
  if (!c) return;
  const now = c.currentTime;
  if (lastMashAt < 0 || now - lastMashAt > 0.5) mashCombo = 0;
  else mashCombo = Math.min(mashCombo + 1, 24);
  lastMashAt = now;
  // Sobe ~1.5 oitava ao longo do mash; corpo curto + "click" de catraca.
  const freq = 240 * Math.pow(2, mashCombo / 18);
  tone(freq, 0.045, { type: 'triangle', gain: 0.11, cutoff: 2000 });
  noiseBurst(0.01, 2600, 0.05);
}

/** Estouro curto de ruído filtrado — um "chic" percussivo (chocalho/hi-hat). */
function noiseBurst(dur: number, freq: number, gain: number): void {
  const c = audio();
  if (!c || !master) return;
  const t0 = c.currentTime;
  const frames = Math.max(1, Math.floor(c.sampleRate * dur));
  const buffer = c.createBuffer(1, frames, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buffer;
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = freq;
  bp.Q.value = 1.2;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(bp);
  bp.connect(g);
  g.connect(master);
  src.start(t0);
  src.stop(t0 + dur);
}

/**
 * Sílaba cochichada: ruído filtrado por um bandpass ressonante (formante de
 * vogal) com leve glide e envelope macio. Soa como fala sussurrada, não batida.
 */
function whisperSyllable(): void {
  const c = audio();
  if (!c || !master) return;
  const t0 = c.currentTime;
  const dur = 0.08 + Math.random() * 0.1;
  const frames = Math.max(1, Math.floor(c.sampleRate * dur));
  const buffer = c.createBuffer(1, frames, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buffer;
  // Tira o grave (sopro) e ressoa numa formante de vogal que desliza (wah).
  const hp = c.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 500;
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 5;
  const f0 = 850 + Math.random() * 800;
  bp.frequency.setValueAtTime(f0, t0);
  bp.frequency.linearRampToValueAtTime(f0 * (0.75 + Math.random() * 0.6), t0 + dur);
  const g = c.createGain();
  const peak = 0.05 + Math.random() * 0.03;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(peak, t0 + dur * 0.4);
  g.gain.linearRampToValueAtTime(0, t0 + dur);
  src.connect(hp);
  hp.connect(bp);
  bp.connect(g);
  g.connect(master);
  src.start(t0);
  src.stop(t0 + dur + 0.02);
}

function stopHold(): void {
  holding = false;
  if (holdTimer !== null) {
    clearTimeout(holdTimer);
    holdTimer = null;
  }
}

function startHold(): void {
  stopHold();
  holding = true;
  // Murmúrio: sílabas sussurradas em ritmo irregular, às vezes em dupla.
  const murmur = () => {
    if (!holding) return;
    whisperSyllable();
    if (Math.random() < 0.4)
      setTimeout(() => holding && whisperSyllable(), 70 + Math.random() * 60);
    holdTimer = setTimeout(murmur, 130 + Math.random() * 170);
  };
  murmur();
}

/** Sintetiza o feedback de um evento do motor. */
export function playSound(event: SoundEvent): void {
  if (muted) return;
  switch (event) {
    case 'key':
      keyBlip();
      break;
    case 'nav':
      tone(330, 0.035, { type: 'triangle', gain: 0.1 });
      break;
    case 'type':
      tone(360, 0.03, { type: 'triangle', gain: 0.06, cutoff: 1600 });
      break;
    case 'tab':
    case 'open':
      // Abrir um programa é igual a selecionar uma task: um clique neutro,
      // sem revelar acerto/erro no instante da ação. Corpo + "toc" de ruído
      // pra ter presença (estava baixo demais).
      tone(300, 0.055, { type: 'sine', gain: 0.2 });
      noiseBurst(0.014, 1600, 0.07);
      break;
    case 'select':
      // Escolha confirmada: um toque seco e neutro, não um "ding" de vitória.
      tone(520, 0.05, { type: 'triangle', gain: 0.1 });
      break;
    case 'error':
      // "Donk" grave e abafado — claramente negativo, mas sem zumbido 8-bit.
      tone(196, 0.22, { type: 'triangle', gain: 0.14, slideTo: 130, cutoff: 900 });
      tone(98, 0.24, { type: 'sine', gain: 0.1 });
      break;
    case 'step':
    case 'ready':
      // Concluir um passo — inclusive a ação final (merge etc.) — é progresso
      // padrão, não sucesso: "tec-toc" mecânico discreto. O sucesso é a entrega.
      tone(430, 0.05, { type: 'triangle', gain: 0.1, slideTo: 360 });
      tone(300, 0.06, { type: 'sine', gain: 0.08, delay: 0.045 });
      break;
    case 'deliver':
      // Fechar a demanda: "carimbo" macio que ASSENTA (resolve pra baixo) — uma
      // confirmação quente e contida, não o sino agudo de notificação que era.
      noiseBurst(0.022, 760, 0.05);
      tone(392, 0.13, { type: 'triangle', gain: 0.13, slideTo: 294, cutoff: 1500 });
      tone(196, 0.17, { type: 'sine', gain: 0.085, delay: 0.02 });
      break;
    case 'win':
      arpeggio([523, 659, 784, 1046, 1318], 0.13, 0.5, 'triangle', 0.17);
      break;
    case 'mash':
      mashTick();
      break;
    case 'holdStart':
      startHold();
      break;
    case 'holdEnd':
      stopHold();
      break;
    case 'stuck':
      // Fadiga: tecla emperrou — "thunk" surdo e mole (input engolido, não erro).
      tone(110, 0.09, { type: 'sine', gain: 0.14, slideTo: 85, cutoff: 500 });
      noiseBurst(0.018, 420, 0.05);
      break;
    case 'yawn':
      // Fadiga: bocejo — sopro descendente longo e macio (o telegraph).
      tone(320, 0.9, { type: 'sine', gain: 0.05, slideTo: 150, attack: 0.25, cutoff: 900 });
      noiseBurst(0.5, 700, 0.02);
      break;
  }
}

export function setMuted(value: boolean): void {
  muted = value;
  if (muted) stopHold();
}

/**
 * Fadiga (peso perceptual contínuo): `x` = horas além do limiar de cansado.
 * O corte do lowpass desce de 18kHz (fresco) até ~3.5kHz (x=3) — os sons do
 * trabalho ficam progressivamente surdos, como ouvido cansado.
 */
/** Corte do lowpass (Hz) por fadiga — puro, pro debug exibir o valor real. */
export function muffleCutoffHz(x: number): number {
  return Math.max(3200, 18000 * Math.exp(-0.55 * Math.min(3, Math.max(0, x))));
}

export function setMuffle(x: number): void {
  if (!muffle || !ctx) return;
  muffle.frequency.setTargetAtTime(muffleCutoffHz(x), ctx.currentTime, 0.4);
}

export function isMuted(): boolean {
  return muted;
}
