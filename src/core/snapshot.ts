import type { NavDirection, Priority } from './domain/types';

export type { Priority } from './domain/types';

/**
 * Visão imutável do estado do jogo, publicada pelo loop a cada frame e lida pela UI.
 * É a única coisa que a camada React enxerga do `core`.
 */

export type GameStatus = 'playing' | 'won' | 'lost';

/** Qual "app" do desktop a tarefa atual representa (UI diegética). */
export type AppId = 'editor' | 'browser' | 'slack' | 'mail' | 'meet';

/** Token de `press`: uma tecla da sequência. */
export interface PressToken {
  key: string;
  label: string;
  done: boolean;
  current: boolean;
}

/** Visão de um segmento do passo atual, por tipo. */
export type SegmentView =
  | { type: 'press'; tokens: PressToken[] }
  | {
      type: 'hold';
      key: string;
      label: string;
      targetSec: number;
      progress: number;
      holding: boolean;
    }
  | { type: 'nav'; symbol: string; direction: NavDirection; count: number; target: number }
  | {
      type: 'selection';
      prompt: string;
      options: { key: string; label: string }[];
      chosenKey: string | null;
      wrong: boolean;
    }
  | { type: 'wait'; remaining: number; progress: number };

export interface SlotSnapshot {
  index: number;
  name: string;
  priority: Priority;
  ready: boolean;
  active: boolean;
  /** Segundos restantes se o passo atual for um `wait` em andamento; senão null. */
  waitRemaining: number | null;
}

export interface ActiveTicketSnapshot {
  name: string;
  description: string;
  priority: Priority;
  taskTitle: string;
  taskIndex: number;
  taskCount: number;
  segments: SegmentView[];
  ready: boolean;
  /** App do desktop a abrir para a tarefa atual e o título da janela. */
  app: AppId;
  windowTitle: string;
}

export interface Snapshot {
  status: GameStatus;
  clock: string;
  satisfaction: number;
  delivered: number;
  /** Erros acumulados no ticket ativo (para feedback de erro na UI). */
  activeErrors: number;
  slots: (SlotSnapshot | null)[];
  active: ActiveTicketSnapshot | null;
}
