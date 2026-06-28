/**
 * TEMPLATES da hierarquia Ticket → Task → Step → Segment (definição estática).
 *
 * O estado de runtime (cursor de progresso, contadores, índice correto sorteado)
 * vive em `instance.ts`. Os templates carregam os PARÂMETROS; a aleatoriedade
 * (subset de press, contagem de nav, opção correta, durações) é resolvida ao
 * instanciar (ver `game.ts` / `instance.ts`).
 *
 * ──────────────────────────────────────────────────────────────────────────
 * AUDITORIA Hold/Wait (DESIGN_CONSULTORIA.md Seção 4) — PENDENTE DE DECISÃO
 * `hold` e `wait` são "tempo morto" (esperar/segurar), o oposto de habilidade.
 * Foram portados aqui para paridade com o PoC, mas a recomendação é REVISAR ou
 * CORTAR antes de investir em conteúdo. Não construir muito em cima deles.
 * ──────────────────────────────────────────────────────────────────────────
 */

export type Priority = 'urgente' | 'alta' | 'normal' | 'baixa';

/** Multiplicador de drain por prioridade (GDD 3.3). */
export const PRIORITY_DRAIN: Record<Priority, number> = {
  urgente: 2.0,
  alta: 1.5,
  normal: 1.0,
  baixa: 0.7,
};

/** Mapeia a prioridade inteira do Godot (0=urgente … 3=baixa) para o enum daqui. */
export const PRIORITY_BY_INT: Priority[] = ['urgente', 'alta', 'normal', 'baixa'];

export type SegmentType = 'press' | 'hold' | 'nav' | 'selection' | 'wait';

/** Uma ação/tecla com rótulo legível (ex.: { key: 'w', label: 'Abrir navegador' }). */
export interface Action {
  key: string;
  label: string;
}

/** `press`: pressionar uma ou mais teclas. `maxItems` sorteia um subconjunto das ações. */
export interface PressSegment {
  type: 'press';
  actions: Action[];
  /** Quantas ações exigir (sorteia 1..maxItems dentre `actions`). 1 = sempre todas as listadas. */
  maxItems: number;
}

/** `hold`: segurar a tecla por `minDuration` segundos. AUDITORIA: tempo morto. */
export interface HoldSegment {
  type: 'hold';
  action: Action;
  minDuration: number;
  /** Apenas referência; a conclusão usa `minDuration` (paridade com o PoC). */
  maxDuration: number;
}

export type NavDirection = 'up' | 'down' | 'left' | 'right';

/** `nav`: pressionar a seta `direction` N vezes (sorteado entre min/max). */
export interface NavSegment {
  type: 'nav';
  direction: NavDirection;
  minCount: number;
  maxCount: number;
}

/** `selection`: escolher a opção correta (sorteada) dentre `options`. */
export interface SelectionSegment {
  type: 'selection';
  options: Action[];
}

/** `wait`: timer passivo (sorteado entre min/max). AUDITORIA: tempo morto. */
export interface WaitSegment {
  type: 'wait';
  minDuration: number;
  maxDuration: number;
}

export type Segment = PressSegment | HoldSegment | NavSegment | SelectionSegment | WaitSegment;

/** Passo: contém segmentos do mesmo tipo (GDD 3.1). No conteúdo atual, 1 por passo. */
export interface StepTemplate {
  segments: Segment[];
}

export interface TaskTemplate {
  id: string;
  title: string;
  steps: StepTemplate[];
  description: string;
}

export interface TicketTemplate {
  id: string;
  name: string;
  description: string;
  priority: Priority;
  tasks: TaskTemplate[];
}

export const SYMBOL_BY_DIRECTION: Record<NavDirection, string> = {
  up: '▲',
  down: '▼',
  left: '◀',
  right: '▶',
};

export const ARROW_KEY_BY_DIRECTION: Record<NavDirection, string> = {
  up: 'arrowup',
  down: 'arrowdown',
  left: 'arrowleft',
  right: 'arrowright',
};
