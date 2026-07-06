import { Game } from './game';
import type { Snapshot, SoundEvent } from './snapshot';

/**
 * Game loop em requestAnimationFrame, desacoplado do ciclo de render do React
 * (DESIGN_CONSULTORIA.md Seção 10.3). A cada frame: avança a lógica e publica
 * um snapshot para quem estiver inscrito (a store).
 */
export type SnapshotListener = (snapshot: Snapshot) => void;
export type SoundListener = (event: SoundEvent) => void;

export class GameLoop {
  private game: Game;
  private rafId: number | null = null;
  private lastTs = 0;
  private listener: SnapshotListener;
  private onSound: SoundListener | null;

  constructor(
    listener: SnapshotListener,
    onSound: SoundListener | null = null,
    game: Game = new Game(),
  ) {
    this.game = game;
    this.listener = listener;
    this.onSound = onSound;
  }

  /** Publica o snapshot atual e escoa os eventos sonoros pendentes. */
  private sync(): void {
    this.listener(this.game.snapshot());
    if (this.onSound) for (const s of this.game.drainSounds()) this.onSound(s);
  }

  start(): void {
    if (this.rafId !== null) return;
    this.lastTs = performance.now();
    this.sync();
    this.rafId = requestAnimationFrame(this.frame);
  }

  /** Publica o snapshot SEM iniciar o RAF — o mundo espera (ex.: daily antes
   *  de o relógio andar). `start()` depois disso não pula tempo (lastTs = now). */
  publish(): void {
    this.sync();
  }

  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  // Intenções de input vindas da UI são repassadas ao motor.
  selectSlot(index: number): void {
    this.game.selectSlot(index);
    this.sync();
  }

  keyDown(key: string): void {
    this.game.keyDown(key);
    this.sync();
  }

  keyUp(key: string): void {
    this.game.keyUp(key);
    this.sync();
  }

  confirm(): void {
    this.game.confirm();
    this.sync();
  }

  focusProgram(id: import('./snapshot').ProgramId): void {
    this.game.focusProgram(id);
    this.sync();
  }

  cycleFocus(dir: 1 | -1 = 1): void {
    this.game.cycleFocus(dir);
    this.sync();
  }

  quickOpen(): void {
    this.game.quickOpen();
    this.sync();
  }

  deliver(): void {
    this.game.deliver();
    this.sync();
  }

  /** Fadiga: a UI avisa quando entra/sai da pausa. */
  setResting(v: boolean): void {
    this.game.setResting(v);
  }

  /** Fadiga: ritual completado na pausa → restaura. */
  restoreFatigue(): void {
    this.game.restore();
    this.sync();
  }

  /** Debug (?debug=1): injeta minutos de fadiga. */
  debugFatigue(min: number): void {
    this.game.debugFatigue(min);
    this.sync();
  }

  /** Debug (?debug=1): força um lapso perceptual (piscada/desfoque). */
  debugLapse(kind: 'blink' | 'defocus'): void {
    this.game.debugLapse(kind);
    this.sync();
  }

  private frame = (ts: number): void => {
    // dt = tempo real decorrido, SEM clamp: o RAF é estrangulado a ~1fps em
    // segundo plano; clampear faria o relógio/deadlines/CR rastejarem. Assim o
    // jogo segue no tempo real mesmo com a aba em background (o `tick` limita só
    // a parte de gameplay — hold/gauge — contra saltos ao voltar segurando tecla).
    const dtMs = ts - this.lastTs;
    this.lastTs = ts;
    this.game.tick(dtMs);
    this.sync();
    this.rafId = requestAnimationFrame(this.frame);
  };
}
