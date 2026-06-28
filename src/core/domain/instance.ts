/**
 * Estado de RUNTIME da hierarquia. Cada ticket na fila vira uma `TicketInstance`
 * com seu próprio cursor (tarefa/passo atual) e instâncias de segmento que guardam
 * progresso. A aleatoriedade dos templates é resolvida aqui, ao instanciar.
 *
 * RNG ainda é Math.random; o seed do dia (casca daily) entra numa fase posterior.
 */
import type {
  Action,
  NavDirection,
  Priority,
  Segment,
  StepTemplate,
  TaskTemplate,
  TicketTemplate,
} from './types';
import type { AppId, ProgramId } from '../snapshot';
import { PROJECT_FILES } from '@/data/files';

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleTake<T>(arr: T[], count: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < count && copy.length > 0; i++) {
    out.push(copy.splice(randInt(0, copy.length - 1), 1)[0]);
  }
  return out;
}

export interface PressInstance {
  type: 'press';
  /** Ações exigidas nesta instância (subset sorteado). */
  actions: Action[];
  /** Distratores: teclas válidas no template mas não exigidas (erro se pressionadas). */
  distractors: Action[];
  pressed: boolean[];
}

export interface HoldInstance {
  type: 'hold';
  action: Action;
  target: number;
  held: number;
  holding: boolean;
}

export interface NavInstance {
  type: 'nav';
  direction: NavDirection;
  target: number;
  /** Posição atual do cursor (pode passar do alvo). */
  cursor: number;
  /** Limite de movimento (alvo + folga para passar direto). */
  max: number;
  /** Confirmado pelo jogador (commit). Conclui o segmento mesmo na posição errada. */
  committed: boolean;
  wrong: boolean;
}

export interface SelectionInstance {
  type: 'selection';
  options: Action[];
  correctIndex: number;
  chosenIndex: number | null;
  wrong: boolean;
}

export interface WaitInstance {
  type: 'wait';
  total: number;
  elapsed: number;
}

export interface FileInstance {
  type: 'file';
  files: string[];
  targetIndex: number;
  cursor: number;
  chosenIndex: number | null;
  committed: boolean;
  wrong: boolean;
  /** Modo busca (Ctrl+P) e o texto digitado. */
  searching: boolean;
  query: string;
}

export type SegmentInstance =
  PressInstance | HoldInstance | NavInstance | SelectionInstance | WaitInstance | FileInstance;

export interface StepInstance {
  segments: SegmentInstance[];
}

export interface TaskInstance {
  template: TaskTemplate;
  steps: StepInstance[];
}

export interface TicketInstance {
  id: number;
  template: TicketTemplate;
  tasks: TaskInstance[];
  taskIndex: number;
  stepIndex: number;
  errors: number;
  ready: boolean;
  /** CR rejeitado: entregue com escolha errada; precisa refazer o passo e o push. */
  reviewRejected: boolean;
  /** Comentário do reviewer explicando o que rejeitou (null se não houve). */
  reviewComment: string | null;
  /** App aberto por engano no passo de abrir; bloqueia até fechar com X. */
  wrongApp: AppId | null;
  /** Programa em foco (aba ativa): a "Comanda" (details) ou um app aberto. */
  focused: ProgramId;
}

let nextTicketId = 1;

function instantiateSegment(segment: Segment): SegmentInstance {
  switch (segment.type) {
    case 'press': {
      const count = randInt(1, Math.max(1, segment.maxItems));
      const chosen = shuffleTake(segment.actions, count);
      const distractors = segment.actions.filter((a) => !chosen.includes(a));
      return { type: 'press', actions: chosen, distractors, pressed: chosen.map(() => false) };
    }
    case 'hold':
      return {
        type: 'hold',
        action: segment.action,
        target: segment.minDuration,
        held: 0,
        holding: false,
      };
    case 'nav': {
      const target = randInt(segment.minCount, segment.maxCount);
      return {
        type: 'nav',
        direction: segment.direction,
        target,
        cursor: 0,
        max: target + 3, // folga para passar direto e voltar
        committed: false,
        wrong: false,
      };
    }
    case 'selection':
      return {
        type: 'selection',
        options: segment.options,
        correctIndex: randInt(0, segment.options.length - 1),
        chosenIndex: null,
        wrong: false,
      };
    case 'wait': {
      const total =
        segment.minDuration + Math.random() * (segment.maxDuration - segment.minDuration);
      return { type: 'wait', total, elapsed: 0 };
    }
    case 'file': {
      const allowed = segment.ext
        ? PROJECT_FILES.map((f, i) => (f.endsWith(`.${segment.ext}`) ? i : -1)).filter(
            (i) => i >= 0,
          )
        : PROJECT_FILES.map((_, i) => i);
      const targetIndex = allowed[randInt(0, allowed.length - 1)];
      return {
        type: 'file',
        files: PROJECT_FILES,
        targetIndex,
        cursor: 0,
        chosenIndex: null,
        committed: false,
        wrong: false,
        searching: false,
        query: '',
      };
    }
  }
}

function instantiateStep(step: StepTemplate): StepInstance {
  return { segments: step.segments.map(instantiateSegment) };
}

export function instantiateTicket(template: TicketTemplate): TicketInstance {
  return {
    id: nextTicketId++,
    template,
    tasks: template.tasks.map((t) => ({ template: t, steps: t.steps.map(instantiateStep) })),
    taskIndex: 0,
    stepIndex: 0,
    errors: 0,
    ready: false,
    reviewRejected: false,
    reviewComment: null,
    wrongApp: null,
    focused: 'details',
  };
}

export function segmentCompleted(seg: SegmentInstance): boolean {
  switch (seg.type) {
    case 'press':
      return seg.pressed.every(Boolean);
    case 'hold':
      return seg.held >= seg.target;
    case 'nav':
      return seg.committed;
    case 'selection':
      return seg.chosenIndex !== null;
    case 'wait':
      return seg.elapsed >= seg.total;
    case 'file':
      return seg.committed;
  }
}

export function stepCompleted(step: StepInstance): boolean {
  return step.segments.every(segmentCompleted);
}

/** Segmento concluído com a escolha ERRADA (cor/linha/arquivo). Base do CR rejeitado. */
export function segmentWrong(seg: SegmentInstance): boolean {
  switch (seg.type) {
    case 'selection':
      return seg.chosenIndex !== null && seg.wrong;
    case 'nav':
    case 'file':
      return seg.committed && seg.wrong;
    default:
      return false;
  }
}

/** Zera o progresso de um segmento (mantém alvo/resposta correta) para refazê-lo. */
export function resetSegment(seg: SegmentInstance): void {
  switch (seg.type) {
    case 'press':
      seg.pressed = seg.pressed.map(() => false);
      break;
    case 'hold':
      seg.held = 0;
      seg.holding = false;
      break;
    case 'nav':
      seg.cursor = 0;
      seg.committed = false;
      seg.wrong = false;
      break;
    case 'selection':
      seg.chosenIndex = null;
      seg.wrong = false;
      break;
    case 'wait':
      seg.elapsed = 0;
      break;
    case 'file':
      seg.cursor = 0;
      seg.chosenIndex = null;
      seg.committed = false;
      seg.wrong = false;
      seg.searching = false;
      seg.query = '';
      break;
  }
}

export function priorityFromInt(p: number): Priority {
  return (['urgente', 'alta', 'normal', 'baixa'] as Priority[])[p] ?? 'normal';
}
