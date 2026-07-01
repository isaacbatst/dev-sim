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
  /** O loop deve estar rodando? (distingue "parado" de "pausado por aba oculta") */
  private running = false;
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
    if (this.running) return;
    this.running = true;
    this.lastTs = performance.now();
    this.sync();
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.onVisibility);
    }
    // Se abrir já oculto, não roda o RAF; o visibilitychange retoma ao voltar.
    if (typeof document === 'undefined' || !document.hidden) {
      this.rafId = requestAnimationFrame(this.frame);
    }
  }

  stop(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.onVisibility);
    }
  }

  /**
   * Pausa o jogo quando a aba fica oculta (alt-tab / segundo plano): congela o
   * relógio, os deadlines e o CR — nada de tempo passa fora de foco. Ao voltar,
   * reinicia o `lastTs` pra não haver salto de dt (paridade com o clamp do frame).
   */
  private onVisibility = (): void => {
    if (!this.running) return;
    if (document.hidden) {
      if (this.rafId !== null) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
    } else if (this.rafId === null) {
      this.lastTs = performance.now();
      this.rafId = requestAnimationFrame(this.frame);
    }
  };

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

  private frame = (ts: number): void => {
    // Clampeia dt para evitar saltos enormes ao voltar de uma aba inativa.
    const dtMs = Math.min(100, ts - this.lastTs);
    this.lastTs = ts;
    this.game.tick(dtMs);
    this.sync();
    this.rafId = requestAnimationFrame(this.frame);
  };
}
