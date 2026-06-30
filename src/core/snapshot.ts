import type { NavDirection, Priority } from './domain/types';

export type { Priority } from './domain/types';

/**
 * Visão imutável do estado do jogo, publicada pelo loop a cada frame e lida pela UI.
 * É a única coisa que a camada React enxerga do `core`.
 */

export type GameStatus = 'playing' | 'won' | 'lost';

/**
 * Eventos de áudio emitidos pelo motor a cada ação relevante. O `core` só os
 * enfileira (strings puras, sem Web Audio); a camada de UI sintetiza o som.
 */
export type SoundEvent =
  | 'key' // tecla certa numa sequência (press)
  | 'nav' // cursor moveu (nav/file)
  | 'type' // digitação na busca rápida
  | 'select' // opção correta escolhida
  | 'error' // tecla errada / escolha errada
  | 'open' // app/programa aberto
  | 'step' // subtarefa concluída
  | 'ready' // ticket ficou pronto pra entrega
  | 'deliver' // ticket entregue
  | 'win' // 17:00 — fim do expediente
  | 'tab' // troca de foco / seleção de slot
  | 'holdStart' // começou a segurar (hold)
  | 'holdEnd' // soltou / hold concluído
  | 'mash'; // batida rítmica (mash) — tom sobe com o ritmo

/** Qual "app" do desktop a tarefa atual representa (UI diegética). */
export type AppId = 'editor' | 'browser' | 'slack' | 'mail' | 'meet';

/** Programa em foco: a "Comanda" (details) ou um app aberto. */
export type ProgramId = 'details' | AppId;

/** Token de `press`: uma tecla da sequência. */
export interface PressToken {
  key: string;
  label: string;
  done: boolean;
  current: boolean;
}

/** Visão de um segmento do passo atual, por tipo. */
export type SegmentView =
  | { type: 'press'; tokens: PressToken[]; distractors: { key: string; label: string }[] }
  | {
      type: 'hold';
      key: string;
      label: string;
      targetSec: number;
      progress: number;
      holding: boolean;
    }
  | {
      type: 'nav';
      symbol: string;
      direction: NavDirection;
      cursor: number;
      target: number;
      committed: boolean;
      wrong: boolean;
    }
  | {
      type: 'selection';
      prompt: string;
      options: { key: string; label: string }[];
      chosenKey: string | null;
      wrong: boolean;
    }
  | { type: 'wait'; remaining: number; progress: number }
  | {
      type: 'mash';
      /** Teclas do ciclo (ex.: ['arrowleft','arrowright']). */
      keys: string[];
      label: string;
      /** Próxima tecla esperada no ciclo (destaque do ritmo). */
      expectKey: string;
      count: number;
      target: number;
      /** Progresso global (0..1). */
      progress: number;
      /** Grupos sequenciais (ex.: conflitos do merge). */
      groups: number;
      /** Grupo atual sendo resolvido (0-based). */
      activeGroup: number;
      /** Progresso (0..1) DENTRO do grupo atual. */
      groupProgress: number;
      /** "Digitar" (martelar): qualquer letra avança. */
      anyKey: boolean;
    }
  | {
      type: 'combo';
      /** Passos do combo, em ordem (ex.: Ctrl+C, Ctrl+V). `combo` = chave bruta
       *  p/ casar/exibir (ex.: 'ctrl+c'). */
      tokens: { combo: string; label: string; done: boolean; current: boolean }[];
    }
  | {
      type: 'scrub';
      /** Valores a discar ⬅️➡️ (ex.: cores, tamanhos). */
      options: { key: string; label: string }[];
      /** Índice do valor atualmente discado (preview). */
      cursor: number;
      committed: boolean;
      wrong: boolean;
    }
  | {
      type: 'gauge';
      key: string;
      label: string;
      /** Enchimento atual (0..1) e a zona-alvo [target-tol, target+tol]. */
      current: number;
      target: number;
      tol: number;
      holding: boolean;
      committed: boolean;
      wrong: boolean;
    }
  | {
      type: 'file';
      /** Todos os caminhos (para o Ctrl+P buscar em pastas aninhadas). */
      files: string[];
      /** Linhas visíveis da árvore (pastas/arquivos respeitando o expandido). */
      rows: {
        kind: 'folder' | 'file';
        name: string;
        depth: number;
        open: boolean;
        fileIndex: number;
      }[];
      /** Cursor sobre as LINHAS visíveis (`rows`). */
      cursor: number;
      /** Índice (em `files`) do arquivo-alvo e do escolhido. */
      target: number;
      chosenIndex: number | null;
      committed: boolean;
      wrong: boolean;
      searching: boolean;
      query: string;
      /** Índice (em `files`) do match atual do Ctrl+P; -1 se nenhum. */
      matchIndex: number;
    };

export interface SlotSnapshot {
  index: number;
  /** Id da instância (para o identificador DEV-###). */
  id: number;
  name: string;
  priority: Priority;
  ready: boolean;
  active: boolean;
  /** Segundos restantes se o passo atual for um `wait` em andamento; senão null. */
  waitRemaining: number | null;
  /** Review (CR) voltou e falta o merge — pronto pro merge. */
  readyToMerge: boolean;
}

export interface ActiveTicketSnapshot {
  /** Id da instância — muda a cada seleção (a UI reseta a aba por ele). */
  id: number;
  /** O "programa" da tarefa atual já foi aberto? (1º passo, "Abrir X", concluído.) */
  appLaunched: boolean;
  /** Programa em foco (aba ativa). */
  focused: ProgramId;
  /** Apps abertos desta demanda (abas, além da Comanda). */
  openPrograms: AppId[];
  name: string;
  description: string;
  priority: Priority;
  taskTitle: string;
  taskIndex: number;
  taskCount: number;
  segments: SegmentView[];
  ready: boolean;
  /** CR foi rejeitado (escolha errada) e a tarefa voltou para refazer. */
  reviewRejected: boolean;
  /** Comentário do reviewer sobre o que rejeitou (null se passou). */
  reviewComment: string | null;
  /** Programa aberto por engano (no passo de abrir); feche com X para voltar. */
  wrongApp: AppId | null;
  /** App do desktop a abrir para a tarefa atual e o título da janela. */
  app: AppId;
  windowTitle: string;
  /** Comanda: por subtarefa, uma descrição em prosa com os detalhes mutáveis. */
  plan: { title: string; status: PlanStatus; prose: string }[];
  /** Arquivo aberto no editor (para a cena do VSCode). */
  editorFile: string;
  /** Linha-alvo (1-based) do typo no editor; 0 se não se aplica. */
  editorLine: number;
  /** Linha (1-based) que o jogador de fato corrigiu (cursor commitado); 0 se n/a. */
  editorFixedLine: number;
  /** Site/página aberta no navegador (para a cena do browser). */
  browserSite: string;
}

export type PlanStatus = 'done' | 'current' | 'pending';

export interface Snapshot {
  status: GameStatus;
  clock: string;
  delivered: number;
  /** Erros acumulados no ticket ativo (para feedback de erro na UI). */
  activeErrors: number;
  slots: (SlotSnapshot | null)[];
  active: ActiveTicketSnapshot | null;
}
