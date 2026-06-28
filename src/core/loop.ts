import { Game } from './game';
import type { Snapshot } from './snapshot';

/**
 * Game loop em requestAnimationFrame, desacoplado do ciclo de render do React
 * (DESIGN_CONSULTORIA.md Seção 10.3). A cada frame: avança a lógica e publica
 * um snapshot para quem estiver inscrito (a store).
 */
export type SnapshotListener = (snapshot: Snapshot) => void;

export class GameLoop {
  private game: Game;
  private rafId: number | null = null;
  private lastTs = 0;
  private listener: SnapshotListener;

  constructor(listener: SnapshotListener, game: Game = new Game()) {
    this.game = game;
    this.listener = listener;
  }

  start(): void {
    if (this.rafId !== null) return;
    this.lastTs = performance.now();
    this.listener(this.game.snapshot());
    this.rafId = requestAnimationFrame(this.frame);
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
    this.listener(this.game.snapshot());
  }

  keyDown(key: string): void {
    this.game.keyDown(key);
    this.listener(this.game.snapshot());
  }

  keyUp(key: string): void {
    this.game.keyUp(key);
    this.listener(this.game.snapshot());
  }

  deliver(): void {
    this.game.deliver();
    this.listener(this.game.snapshot());
  }

  private frame = (ts: number): void => {
    // Clampeia dt para evitar saltos enormes ao voltar de uma aba inativa.
    const dtMs = Math.min(100, ts - this.lastTs);
    this.lastTs = ts;
    this.game.tick(dtMs);
    this.listener(this.game.snapshot());
    this.rafId = requestAnimationFrame(this.frame);
  };
}
