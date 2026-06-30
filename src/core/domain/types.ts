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

/** Mapeia a prioridade inteira do Godot (0=urgente … 3=baixa) para o enum daqui. */
export const PRIORITY_BY_INT: Priority[] = ['urgente', 'alta', 'normal', 'baixa'];

export type SegmentType =
  'press' | 'hold' | 'nav' | 'selection' | 'wait' | 'file' | 'mash' | 'combo' | 'scrub' | 'gauge';

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
  /** Se este passo ABRE um app (lança o programa). Permite app por passo (uma task
   *  pode abrir o Chrome e depois o VS Code). Sem isto, é um press de trabalho. */
  opens?: import('../snapshot').AppId;
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

/** `file`: abrir um arquivo no editor navegando a lista (setas) ou via Ctrl+P. */
export interface FileSegment {
  type: 'file';
  /** Restringe o arquivo-alvo a uma extensão (ex.: 'css'). Cursor navega todos. */
  ext?: string;
}

/**
 * `mash`: alternância/repetição rítmica de teclas com contador (o "esfregar o
 * prato"). `keys` é o ciclo a percorrer: 1 tecla = repetir; 2+ = alternar em
 * ordem (ex.: ⬅️➡️ para resolver um conflito de merge). NÃO é tempo morto — cada
 * batida é uma ação, com feedback que escala. Ver DIRECAO_GAMEPLAY.md §6.
 *
 * `groups` = sub-unidades resolvidas em sequência (ex.: cada conflito do merge).
 * `minCount`/`maxCount` são batidas POR grupo; o total = grupos × batidas/grupo.
 */
export interface MashSegment {
  type: 'mash';
  keys: string[];
  label: string;
  /** Batidas por grupo (sorteia entre min/max). */
  minCount: number;
  maxCount: number;
  /** Quantos grupos sequenciais (sorteia entre min/max; default 1). */
  minGroups?: number;
  maxGroups?: number;
  /** "Digitar": QUALQUER tecla de letra avança (martelar), em vez do ciclo `keys`. */
  anyKey?: boolean;
}

/** Um passo de `combo`: tecla com modificador (ex.: Ctrl+C). */
export interface ComboStep {
  mod?: 'ctrl' | 'meta';
  key: string;
  label: string;
}

/**
 * `combo`: sequência ORDENADA de atalhos (modificador + tecla), ex.: Ctrl+C →
 * Ctrl+V (copiar a correção e colar). Mimético do gesto real do dev. Cada passo
 * é uma ação; pressionar fora de ordem é ignorado (sem penalidade).
 */
export interface ComboSegment {
  type: 'combo';
  steps: ComboStep[];
}

/**
 * `scrub`: discar um valor ⬅️➡️ com preview ao vivo (cor, tamanho de fonte) e
 * confirmar com Enter. Substitui a escolha "fria" pelo gesto de afinar. Pode
 * ficar errado (valor ≠ alvo) → CR rejeita, como `selection`.
 */
export interface ScrubSegment {
  type: 'scrub';
  options: Action[];
}

/**
 * `gauge`: segurar pra encher uma barra e SOLTAR na zona-alvo (estilo "encher o
 * copo até a linha" do CSD). Soltar na faixa = sucesso; passar do alvo = exagerou
 * (over-engineer) → erro, CR rejeita. Precisão, NÃO tempo morto.
 */
export interface GaugeSegment {
  type: 'gauge';
  key: string;
  label: string;
  /** Enchimento por segundo (0..1). */
  rate: number;
}

export type Segment =
  | PressSegment
  | HoldSegment
  | NavSegment
  | SelectionSegment
  | WaitSegment
  | FileSegment
  | MashSegment
  | ComboSegment
  | ScrubSegment
  | GaugeSegment;

/** Passo: contém segmentos do mesmo tipo (GDD 3.1). No conteúdo atual, 1 por passo. */
export interface StepTemplate {
  segments: Segment[];
}

export interface TaskTemplate {
  id: string;
  title: string;
  /** Passos fixos. Se `variants` existir, ele é sorteado e tem prioridade. */
  steps: StepTemplate[];
  /** Conjuntos alternativos de passos; a instância sorteia um (ex.: UI = cor|fonte). */
  variants?: StepTemplate[][];
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
