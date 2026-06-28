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
  count: number;
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

export type SegmentInstance =
  PressInstance | HoldInstance | NavInstance | SelectionInstance | WaitInstance;

export interface StepInstance {
  segments: SegmentInstance[];
}

export interface TaskInstance {
  template: TaskTemplate;
  steps: StepInstance[];
}

export interface TicketInstance {
  template: TicketTemplate;
  tasks: TaskInstance[];
  taskIndex: number;
  stepIndex: number;
  errors: number;
  ready: boolean;
}

function instantiateSegment(segment: Segment): SegmentInstance {
  switch (segment.type) {
    case 'press': {
      const count = randInt(1, Math.max(1, segment.maxItems));
      const chosen = segment.maxItems > 1 ? shuffleTake(segment.actions, count) : segment.actions;
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
    case 'nav':
      return {
        type: 'nav',
        direction: segment.direction,
        target: randInt(segment.minCount, segment.maxCount),
        count: 0,
      };
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
  }
}

function instantiateStep(step: StepTemplate): StepInstance {
  return { segments: step.segments.map(instantiateSegment) };
}

export function instantiateTicket(template: TicketTemplate): TicketInstance {
  return {
    template,
    tasks: template.tasks.map((t) => ({ template: t, steps: t.steps.map(instantiateStep) })),
    taskIndex: 0,
    stepIndex: 0,
    errors: 0,
    ready: false,
  };
}

export function segmentCompleted(seg: SegmentInstance): boolean {
  switch (seg.type) {
    case 'press':
      return seg.pressed.every(Boolean);
    case 'hold':
      return seg.held >= seg.target;
    case 'nav':
      return seg.count >= seg.target;
    case 'selection':
      return seg.chosenIndex !== null;
    case 'wait':
      return seg.elapsed >= seg.total;
  }
}

export function stepCompleted(step: StepInstance): boolean {
  return step.segments.every(segmentCompleted);
}

export function priorityFromInt(p: number): Priority {
  return (['urgente', 'alta', 'normal', 'baixa'] as Priority[])[p] ?? 'normal';
}
