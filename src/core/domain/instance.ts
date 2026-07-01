/**
 * Estado de RUNTIME da hierarquia. Cada ticket na fila vira uma `TicketInstance`
 * com seu próprio cursor (tarefa/passo atual) e instâncias de segmento que guardam
 * progresso. A aleatoriedade dos templates é resolvida aqui, ao instanciar.
 *
 * RNG ainda é Math.random; o seed do dia (casca daily) entra numa fase posterior.
 */
import type {
  Action,
  ComboStep,
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
  /** App que este passo abre (se for um passo de "abrir programa"). */
  opens?: AppId;
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

export interface MashInstance {
  type: 'mash';
  keys: string[];
  label: string;
  /** Batidas exigidas no total (= grupos × batidas/grupo). */
  target: number;
  /** Grupos sequenciais (ex.: conflitos do merge). */
  groups: number;
  /** Batidas feitas. */
  count: number;
  /** Índice (em `keys`) da próxima tecla esperada no ciclo. */
  expect: number;
}

export interface ComboInstance {
  type: 'combo';
  steps: ComboStep[];
  /** Passos já pressionados, em ordem. */
  done: boolean[];
}

export interface ScrubInstance {
  type: 'scrub';
  options: Action[];
  correctIndex: number;
  /** Valor atualmente discado. */
  cursor: number;
  committed: boolean;
  wrong: boolean;
}

export interface GaugeInstance {
  type: 'gauge';
  key: string;
  label: string;
  rate: number;
  /** Centro da zona-alvo (0..1) e meia-largura da faixa. */
  target: number;
  tol: number;
  /** Enchimento atual (0..1). */
  current: number;
  holding: boolean;
  committed: boolean;
  /** Passou da zona (exagerou) — erro. */
  wrong: boolean;
}

export interface FileInstance {
  type: 'file';
  files: string[];
  targetIndex: number;
  /** Pastas abertas (caminhos). O cursor anda sobre as LINHAS visíveis. */
  expanded: string[];
  cursor: number;
  chosenIndex: number | null;
  committed: boolean;
  wrong: boolean;
  /** Modo busca (Ctrl+P) e o texto digitado. */
  searching: boolean;
  query: string;
}

/** Último segmento de um caminho (nome do arquivo/pasta). */
export function fileBasename(path: string): string {
  return path.split('/').pop() ?? path;
}

/** Caminhos de TODAS as pastas presentes na lista de arquivos. */
export function allFolderPaths(files: string[]): string[] {
  const set = new Set<string>();
  for (const f of files) {
    const parts = f.split('/');
    for (let d = 0; d < parts.length - 1; d++) set.add(parts.slice(0, d + 1).join('/'));
  }
  return [...set];
}

export interface FileRow {
  kind: 'folder' | 'file';
  path: string;
  name: string;
  depth: number;
  /** Índice em `files` (linhas de arquivo); -1 para pastas. */
  fileIndex: number;
}

/** Linhas visíveis da árvore: pastas primeiro, descendo só nas expandidas. */
export function fileRows(files: string[], expanded: Set<string>): FileRow[] {
  type Node = { folders: Map<string, Node>; files: number[] };
  const root: Node = { folders: new Map(), files: [] };
  files.forEach((f, i) => {
    const parts = f.split('/');
    let node = root;
    for (let d = 0; d < parts.length - 1; d++) {
      const key = parts.slice(0, d + 1).join('/');
      let child = node.folders.get(key);
      if (!child) {
        child = { folders: new Map(), files: [] };
        node.folders.set(key, child);
      }
      node = child;
    }
    node.files.push(i);
  });

  const out: FileRow[] = [];
  const walk = (node: Node, depth: number) => {
    for (const [path, child] of node.folders) {
      out.push({ kind: 'folder', path, name: fileBasename(path), depth, fileIndex: -1 });
      if (expanded.has(path)) walk(child, depth + 1);
    }
    for (const i of node.files) {
      out.push({ kind: 'file', path: files[i], name: fileBasename(files[i]), depth, fileIndex: i });
    }
  };
  walk(root, 0);
  return out;
}

export type SegmentInstance =
  | PressInstance
  | HoldInstance
  | NavInstance
  | SelectionInstance
  | WaitInstance
  | FileInstance
  | MashInstance
  | ComboInstance
  | ScrubInstance
  | GaugeInstance;

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
  /** Prazo da demanda (segundos reais) — por prioridade. */
  deadline: number;
  /** Tempo restante (segundos). Expira em 0 se não entregue → custa na nota. */
  remaining: number;
}

/** Prazo (s reais) por prioridade — generoso, afinar com playtest (§9/§11). */
const DEADLINE_BY_PRIORITY: Record<Priority, number> = {
  urgente: 45,
  alta: 65,
  normal: 95,
  baixa: 125,
};

let nextTicketId = 1;

function instantiateSegment(segment: Segment): SegmentInstance {
  switch (segment.type) {
    case 'press': {
      const count = randInt(1, Math.max(1, segment.maxItems));
      const chosen = shuffleTake(segment.actions, count);
      const distractors = segment.actions.filter((a) => !chosen.includes(a));
      return {
        type: 'press',
        actions: chosen,
        distractors,
        pressed: chosen.map(() => false),
        opens: segment.opens,
      };
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
    case 'mash': {
      const groups = randInt(segment.minGroups ?? 1, segment.maxGroups ?? 1);
      const perGroup = randInt(segment.minCount, segment.maxCount);
      return {
        type: 'mash',
        keys: segment.keys,
        label: segment.label,
        groups,
        target: groups * perGroup,
        count: 0,
        expect: 0,
      };
    }
    case 'combo':
      return { type: 'combo', steps: segment.steps, done: segment.steps.map(() => false) };
    case 'scrub': {
      const correctIndex = randInt(0, segment.options.length - 1);
      // Começa longe do alvo pra exigir o gesto de discar (não já em cima).
      const cursor = correctIndex === 0 ? segment.options.length - 1 : 0;
      return {
        type: 'scrub',
        options: segment.options,
        correctIndex,
        cursor,
        committed: false,
        wrong: false,
      };
    }
    case 'gauge':
      return {
        type: 'gauge',
        key: segment.key,
        label: segment.label,
        rate: segment.rate,
        // Zona-alvo espalhada pela barra (não só no fim); deixa folga no topo pra
        // o overshoot ainda ser falha. Faixa estreita (precisão).
        target: 0.35 + Math.random() * 0.45,
        tol: 0.06,
        current: 0,
        holding: false,
        committed: false,
        wrong: false,
      };
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
        expanded: [], // começa tudo colapsado; o jogador abre as pastas
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
    tasks: template.tasks.map((t) => {
      // Se a task tem variantes (ex.: UI = cor|fonte), sorteia uma.
      const chosen = t.variants ? t.variants[randInt(0, t.variants.length - 1)] : t.steps;
      return { template: t, steps: chosen.map(instantiateStep) };
    }),
    taskIndex: 0,
    stepIndex: 0,
    errors: 0,
    ready: false,
    reviewRejected: false,
    reviewComment: null,
    wrongApp: null,
    focused: 'details',
    deadline: DEADLINE_BY_PRIORITY[template.priority],
    remaining: DEADLINE_BY_PRIORITY[template.priority],
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
    case 'mash':
      return seg.count >= seg.target;
    case 'combo':
      return seg.done.every(Boolean);
    case 'scrub':
      return seg.committed;
    case 'gauge':
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
    case 'scrub':
    case 'gauge':
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
    case 'mash':
      seg.count = 0;
      seg.expect = 0;
      break;
    case 'combo':
      seg.done = seg.done.map(() => false);
      break;
    case 'scrub':
      seg.cursor = seg.correctIndex === 0 ? seg.options.length - 1 : 0;
      seg.committed = false;
      seg.wrong = false;
      break;
    case 'gauge':
      seg.current = 0;
      seg.holding = false;
      seg.committed = false;
      seg.wrong = false;
      break;
  }
}

export function priorityFromInt(p: number): Priority {
  return (['urgente', 'alta', 'normal', 'baixa'] as Priority[])[p] ?? 'normal';
}
