import type { Priority } from './domain/types';

/**
 * Visão imutável do estado do jogo, publicada pelo loop a cada frame e lida pela UI.
 * É a única coisa que a camada React enxerga do `core`.
 */

export type GameStatus = 'playing' | 'won' | 'lost';

/** Um token de input do ticket ativo, para a UI renderizar a sequência. */
export interface InputToken {
  key: string;
  label: string;
  done: boolean;
  current: boolean;
}

export interface SlotSnapshot {
  index: number;
  name: string;
  priority: Priority;
  ready: boolean;
  active: boolean;
}

export interface ActiveTicketSnapshot {
  name: string;
  description: string;
  priority: Priority;
  taskTitle: string;
  taskIndex: number;
  taskCount: number;
  inputs: InputToken[];
  ready: boolean;
}

export interface Snapshot {
  status: GameStatus;
  clock: string;
  satisfaction: number;
  delivered: number;
  /** Sempre 5 posições; `null` = slot vazio. */
  slots: (SlotSnapshot | null)[];
  active: ActiveTicketSnapshot | null;
}
