import { ARROW_KEY_BY_DIRECTION, PRIORITY_DRAIN, SYMBOL_BY_DIRECTION } from './domain/types';
import type { TicketTemplate } from './domain/types';
import {
  instantiateTicket,
  segmentCompleted,
  stepCompleted,
  type FileInstance,
  type SegmentInstance,
  type StepInstance,
  type TaskInstance,
  type TicketInstance,
} from './domain/instance';
import { TICKET_POOL } from '@/data/tickets';
import { SLACK_CHANNELS } from '@/data/channels';
import { appForTask, windowTitle } from './domain/apps';
import type {
  ActiveTicketSnapshot,
  AppId,
  ProgramId,
  SegmentView,
  Snapshot,
  SlotSnapshot,
} from './snapshot';

/**
 * Motor do jogo — lógica pura em TS, sem React e sem timers próprios.
 * O tempo entra por `tick(dtMs)` (game loop / RAF); a UI lê via `snapshot()`.
 *
 * O cursor de progresso (tarefa/passo) vive em cada `TicketInstance`, então um
 * ticket pode esperar (segmento `wait`) na própria fila enquanto o jogador
 * trabalha em outro — sem o sistema de re-enfileiramento do PoC (ver AUDITORIA
 * em domain/types.ts).
 *
 * Mantido em TS puro (sem XState) por ora: o modelo de cursor cobre os 5 tipos
 * de segmento e mantém a iteração rápida. XState pode entrar se o fluxo crescer.
 */

const SLOT_COUNT = 5;
const DAY_START_MIN = 9 * 60;
const DAY_END_MIN = 17 * 60;
const DAY_REAL_SECONDS = 180;
const GAME_MIN_PER_SEC = (DAY_END_MIN - DAY_START_MIN) / DAY_REAL_SECONDS;

const DRAIN_BASE = 0.5;
const GRACE_SECONDS = 12;
const SPAWN_INTERVAL = 8;

const REVERSE_DIR = { up: 'down', down: 'up', left: 'right', right: 'left' } as const;

function joinPt(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(', ')} e ${items[items.length - 1]}`;
}

export class Game {
  private satisfaction = 100;
  private elapsed = 0;
  private status: Snapshot['status'] = 'playing';
  private delivered = 0;
  private slots: (TicketInstance | null)[] = new Array(SLOT_COUNT).fill(null);
  private activeSlot: number | null = null;
  private spawnTimer = 0;
  private pool: TicketTemplate[];

  constructor(pool: TicketTemplate[] = TICKET_POOL) {
    this.pool = pool;
    this.spawnTicket();
    this.spawnTicket();
  }

  tick(dtMs: number): void {
    if (this.status !== 'playing') return;
    const dt = dtMs / 1000;
    this.elapsed += dt;

    if (this.gameMinutes() >= DAY_END_MIN) {
      this.status = 'won';
      return;
    }

    if (this.elapsed > GRACE_SECONDS) {
      this.satisfaction -= DRAIN_BASE * this.drainMultiplier() * dt;
      if (this.satisfaction <= 0) {
        this.satisfaction = 0;
        this.status = 'lost';
        return;
      }
    }

    this.spawnTimer += dt;
    if (this.spawnTimer >= SPAWN_INTERVAL) {
      this.spawnTimer -= SPAWN_INTERVAL;
      this.spawnTicket();
    }

    // Segmentos por tempo: `wait` progride em qualquer slot; `hold` só no ativo, segurando.
    this.slots.forEach((inst, i) => {
      if (!inst || inst.ready) return;
      const seg = this.currentSegment(inst);
      if (!seg) return;
      if (seg.type === 'wait' && !segmentCompleted(seg)) {
        seg.elapsed += dt;
        if (segmentCompleted(seg)) this.advance(inst);
      } else if (seg.type === 'hold' && i === this.activeSlot && seg.holding) {
        seg.held += dt;
        if (segmentCompleted(seg)) this.advance(inst);
      }
    });
  }

  selectSlot(index: number): void {
    if (this.status !== 'playing') return;
    if (index < 0 || index >= SLOT_COUNT) return;
    if (!this.slots[index]) return;
    this.activeSlot = index;
  }

  /** Tecla pressionada (keydown). */
  keyDown(raw: string): void {
    if (this.status !== 'playing') return;
    const inst = this.activeInstance();
    if (!inst || inst.ready) return;

    const taskApp = this.currentApp(inst);
    const launchedBefore = this.isLaunched(inst);
    // Ações de trabalho exigem o programa aberto E em foco; "abrir" não exige nada.
    if (launchedBefore && inst.focused !== taskApp) return;

    const seg = this.currentSegment(inst);
    if (!seg) return;
    const key = raw.toLowerCase();

    switch (seg.type) {
      case 'press': {
        const idx = seg.actions.findIndex((a, i) => !seg.pressed[i] && a.key === key);
        if (idx >= 0) {
          seg.pressed[idx] = true;
        } else if (seg.distractors.some((d) => d.key === key)) {
          inst.errors += 1;
        }
        break;
      }
      case 'nav': {
        // Move o cursor; pode passar do alvo (e voltar). Não conclui — isso é o confirm().
        if (key === ARROW_KEY_BY_DIRECTION[seg.direction]) {
          seg.cursor = Math.min(seg.max, seg.cursor + 1);
        } else if (key === ARROW_KEY_BY_DIRECTION[REVERSE_DIR[seg.direction]]) {
          seg.cursor = Math.max(0, seg.cursor - 1);
        }
        break;
      }
      case 'selection': {
        if (seg.chosenIndex !== null) break;
        const idx = seg.options.findIndex((o) => o.key === key);
        if (idx >= 0) {
          seg.chosenIndex = idx;
          if (idx !== seg.correctIndex) {
            seg.wrong = true;
            inst.errors += 1;
          }
        }
        break;
      }
      case 'hold': {
        if (key === seg.action.key) seg.holding = true;
        break;
      }
      case 'file': {
        if (seg.committed) break;
        if (seg.searching) {
          if (key === 'backspace') seg.query = seg.query.slice(0, -1);
          else if (key.length === 1) seg.query += key;
        } else if (key === ARROW_KEY_BY_DIRECTION.down) {
          seg.cursor = Math.min(seg.files.length - 1, seg.cursor + 1);
        } else if (key === ARROW_KEY_BY_DIRECTION.up) {
          seg.cursor = Math.max(0, seg.cursor - 1);
        }
        break;
      }
      case 'wait':
        break;
    }

    if (stepCompleted(this.currentStep(inst)!)) this.advance(inst);

    // Ação de "abrir" recém-concluída → foca o programa que abriu.
    if (!launchedBefore && this.isLaunched(inst)) inst.focused = taskApp;
  }

  /** Ctrl+P: abre/fecha a busca rápida de arquivo (segmento `file`). */
  quickOpen(): void {
    if (this.status !== 'playing') return;
    const inst = this.activeInstance();
    if (!inst || inst.focused !== this.currentApp(inst)) return;
    const seg = this.currentSegment(inst);
    if (seg?.type === 'file' && !seg.committed) {
      seg.searching = !seg.searching;
      seg.query = '';
    }
  }

  private fileMatch(seg: FileInstance): number {
    const q = seg.query.toLowerCase();
    if (!q) return seg.cursor;
    const starts = seg.files.findIndex((f) => f.toLowerCase().startsWith(q));
    if (starts >= 0) return starts;
    const inc = seg.files.findIndex((f) => f.toLowerCase().includes(q));
    return inc >= 0 ? inc : seg.cursor;
  }

  /** Foca um programa aberto (aba). */
  focusProgram(id: ProgramId): void {
    const inst = this.activeInstance();
    if (!inst) return;
    if (id === 'details' || this.openPrograms(inst).includes(id)) inst.focused = id;
  }

  /** Alterna o foco para a próxima aba (Tab). */
  cycleFocus(): void {
    const inst = this.activeInstance();
    if (!inst) return;
    const tabs: ProgramId[] = ['details', ...this.openPrograms(inst)];
    const i = tabs.indexOf(inst.focused);
    inst.focused = tabs[(i + 1) % tabs.length];
  }

  /** Tecla solta (keyup) — relevante só para `hold`. */
  keyUp(raw: string): void {
    if (this.status !== 'playing') return;
    const inst = this.activeInstance();
    if (!inst) return;
    const seg = this.currentSegment(inst);
    if (seg?.type === 'hold' && raw.toLowerCase() === seg.action.key) {
      seg.holding = false;
      if (seg.held < seg.target) seg.held = 0; // soltou cedo: reinicia (paridade com o PoC)
    }
  }

  /** Enter: confirma o passo posicional (nav) ou entrega quando pronto. */
  confirm(): void {
    if (this.status !== 'playing') return;
    const inst = this.activeInstance();
    if (!inst) return;
    if (inst.ready) {
      this.deliver();
      return;
    }
    // Confirmar o nav é ação de trabalho — exige o programa em foco.
    if (inst.focused !== this.currentApp(inst)) return;
    const seg = this.currentSegment(inst);
    if (seg?.type === 'nav' && !seg.committed) {
      seg.committed = true;
      if (seg.cursor !== seg.target) {
        seg.wrong = true;
        inst.errors += 1;
      }
      const step = this.currentStep(inst);
      if (step && stepCompleted(step)) this.advance(inst);
    } else if (seg?.type === 'file' && !seg.committed) {
      const idx = seg.searching ? this.fileMatch(seg) : seg.cursor;
      seg.chosenIndex = idx;
      seg.committed = true;
      seg.searching = false;
      if (idx !== seg.targetIndex) {
        seg.wrong = true;
        inst.errors += 1;
      }
      const step = this.currentStep(inst);
      if (step && stepCompleted(step)) this.advance(inst);
    }
  }

  deliver(): void {
    if (this.status !== 'playing' || this.activeSlot === null) return;
    const inst = this.slots[this.activeSlot];
    if (!inst || !inst.ready) return;

    const reward = Math.max(2, 10 - inst.errors * 3);
    this.satisfaction = Math.min(100, this.satisfaction + reward);
    this.delivered += 1;
    this.slots[this.activeSlot] = null;
    this.activeSlot = null;
  }

  snapshot(): Snapshot {
    return {
      status: this.status,
      clock: this.formatClock(),
      satisfaction: Math.round(this.satisfaction),
      delivered: this.delivered,
      activeErrors: this.activeInstance()?.errors ?? 0,
      slots: this.slots.map((inst, i) => this.slotSnapshot(inst, i)),
      active: this.activeSnapshot(),
    };
  }

  // --- internos ---

  /** Avança o cursor enquanto o passo atual estiver completo; marca `ready` ao fim. */
  private advance(inst: TicketInstance): void {
    let step = this.currentStep(inst);
    while (step && stepCompleted(step)) {
      inst.stepIndex += 1;
      const task = inst.tasks[inst.taskIndex];
      if (inst.stepIndex >= task.steps.length) {
        inst.stepIndex = 0;
        inst.taskIndex += 1;
        if (inst.taskIndex >= inst.tasks.length) {
          inst.ready = true;
          return;
        }
      }
      step = this.currentStep(inst);
    }
  }

  private currentStep(inst: TicketInstance): StepInstance | undefined {
    return inst.tasks[inst.taskIndex]?.steps[inst.stepIndex];
  }

  /** O app já abriu? (1º passo "Abrir X" concluído.) */
  private isLaunched(inst: TicketInstance): boolean {
    return inst.ready || inst.stepIndex > 0;
  }

  /** App da tarefa atual. */
  private currentApp(inst: TicketInstance): AppId {
    return appForTask(inst.tasks[Math.min(inst.taskIndex, inst.tasks.length - 1)].template.id);
  }

  /** Apps abertos desta demanda (tarefas cujo 1º passo "Abrir" já foi feito). */
  private openPrograms(inst: TicketInstance): AppId[] {
    const out: AppId[] = [];
    for (let ti = 0; ti <= inst.taskIndex && ti < inst.tasks.length; ti++) {
      const opened = ti < inst.taskIndex || inst.ready || inst.stepIndex > 0;
      if (!opened) continue;
      const app = appForTask(inst.tasks[ti].template.id);
      if (!out.includes(app)) out.push(app);
    }
    return out;
  }

  private currentSegment(inst: TicketInstance): SegmentInstance | undefined {
    // Conteúdo atual tem 1 segmento por passo; pega o primeiro não concluído.
    return this.currentStep(inst)?.segments.find((s) => !segmentCompleted(s));
  }

  private activeInstance(): TicketInstance | null {
    return this.activeSlot === null ? null : this.slots[this.activeSlot];
  }

  private spawnTicket(): void {
    const free = this.slots.findIndex((s) => s === null);
    if (free === -1) return;
    this.slots[free] = instantiateTicket(this.pool[Math.floor(Math.random() * this.pool.length)]);
  }

  private drainMultiplier(): number {
    let max = 0;
    for (const inst of this.slots) {
      if (inst) max = Math.max(max, PRIORITY_DRAIN[inst.template.priority]);
    }
    return max || 1;
  }

  private gameMinutes(): number {
    return DAY_START_MIN + this.elapsed * GAME_MIN_PER_SEC;
  }

  private formatClock(): string {
    const total = Math.min(DAY_END_MIN, Math.floor(this.gameMinutes()));
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  }

  private slotSnapshot(inst: TicketInstance | null, index: number): SlotSnapshot | null {
    if (!inst) return null;
    const seg = this.currentSegment(inst);
    const waiting = seg?.type === 'wait' && !segmentCompleted(seg);
    return {
      index,
      name: inst.template.name,
      priority: inst.template.priority,
      ready: inst.ready,
      active: index === this.activeSlot,
      waitRemaining: waiting ? Math.ceil(seg.total - seg.elapsed) : null,
    };
  }

  private activeSnapshot(): ActiveTicketSnapshot | null {
    const inst = this.activeInstance();
    if (!inst) return null;
    const taskInst = inst.tasks[Math.min(inst.taskIndex, inst.tasks.length - 1)];
    const task = taskInst.template;
    const step = this.currentStep(inst);
    return {
      id: inst.id,
      editorFile: this.editorFile(taskInst),
      editorLine: this.editorLine(taskInst),
      // 1º passo de cada tarefa é "Abrir X"; antes disso, o app ainda não abriu.
      appLaunched: this.isLaunched(inst),
      focused: inst.focused,
      openPrograms: this.openPrograms(inst),
      name: inst.template.name,
      description: inst.template.description,
      priority: inst.template.priority,
      taskTitle: task.title,
      taskIndex: Math.min(inst.taskIndex, inst.tasks.length - 1),
      taskCount: inst.tasks.length,
      segments: inst.ready || !step ? [] : step.segments.map((s) => this.segmentView(s)),
      ready: inst.ready,
      app: appForTask(task.id),
      windowTitle: windowTitle(task.id, task.title),
      plan: this.buildPlan(inst),
    };
  }

  /** Comanda: por subtarefa, uma descrição em prosa com os detalhes mutáveis. */
  private buildPlan(inst: TicketInstance): ActiveTicketSnapshot['plan'] {
    return inst.tasks.map((task, ti) => ({
      title: task.template.title,
      status:
        inst.ready || ti < inst.taskIndex ? 'done' : ti === inst.taskIndex ? 'current' : 'pending',
      prose: this.taskProse(task),
    }));
  }

  // Coletores de detalhes mutáveis (valores corretos sorteados na instância).
  private selLabels(t: TaskInstance): string[] {
    const out: string[] = [];
    for (const step of t.steps)
      for (const seg of step.segments)
        if (seg.type === 'selection') out.push(seg.options[seg.correctIndex].label);
    return out;
  }
  private navTargets(t: TaskInstance): number[] {
    const out: number[] = [];
    for (const step of t.steps)
      for (const seg of step.segments) if (seg.type === 'nav') out.push(seg.target);
    return out;
  }
  private holdSecs(t: TaskInstance): number[] {
    const out: number[] = [];
    for (const step of t.steps)
      for (const seg of step.segments) if (seg.type === 'hold') out.push(seg.target);
    return out;
  }
  private pressLabelsAt(t: TaskInstance, stepIdx: number): string[] {
    const step = t.steps[stepIdx];
    if (!step) return [];
    for (const seg of step.segments)
      if (seg.type === 'press') return seg.actions.map((a) => a.label);
    return [];
  }
  /** Arquivo-alvo do segmento `file` (o que a comanda manda abrir), se houver. */
  private fileTarget(t: TaskInstance): string | null {
    for (const step of t.steps)
      for (const seg of step.segments) if (seg.type === 'file') return seg.files[seg.targetIndex];
    return null;
  }
  /** Linha-alvo (1-based) onde está o typo: parte da linha 1 e desce `target`. */
  private editorLine(t: TaskInstance): number {
    for (const step of t.steps)
      for (const seg of step.segments) if (seg.type === 'nav') return seg.target + 1;
    return 0;
  }

  /** Descrição em prosa da subtarefa, com os detalhes mutáveis embutidos. */
  private taskProse(t: TaskInstance): string {
    const sel = this.selLabels(t);
    const nav = this.navTargets(t);
    const hold = this.holdSecs(t);
    const channel = SLACK_CHANNELS[nav[0] ?? 0] ?? 'o canal certo';
    switch (t.template.id) {
      case 'study':
        return `Pesquise no navegador: leia ${joinPt(
          this.pressLabelsAt(t, 1).map((s) => s.replace(/^Ler /, '')),
        )}.`;
      case 'meeting':
        return `Entre na reunião pelo navegador e fale por ${hold[0] ?? 3}s.`;
      case 'test_feature':
        return `Acesse o staging pelo navegador e rode os testes por ${hold[0] ?? 3}s.`;
      case 'slack':
        return `Abra o Slack e responda a mensagem no ${channel}.`;
      case 'email':
        return `Abra o e-mail no navegador e arquive a mensagem.`;
      case 'document':
        return `Documente a função no VSCode; faça push, aguarde o CR e o merge.`;
      case 'fix_typo':
        return `No VSCode, corrija o typo na linha ${(nav[0] ?? 0) + 1} de ${this.fileTarget(t) ?? 'login.ts'}; faça push, aguarde o CR e o merge.`;
      case 'ui_color':
        return `Em ${this.fileTarget(t) ?? 'styles.css'}, mude a ${sel[1]} do ${sel[0]} para ${sel[2]}; faça push, aguarde o CR e o merge.`;
      case 'ui_font':
        return `Em ${this.fileTarget(t) ?? 'styles.css'}, ajuste a fonte do ${sel[0]} (${nav[0] ?? 1}×) para o estilo ${sel[1]}; faça push, aguarde o CR e o merge.`;
      default:
        return t.template.description;
    }
  }

  /** Arquivo aberto no editor (para a cena do VSCode mostrar o conteúdo certo). */
  private editorFile(t: TaskInstance): string {
    for (const step of t.steps)
      for (const seg of step.segments)
        if (seg.type === 'file') return seg.files[seg.chosenIndex ?? seg.targetIndex];
    return 'login.ts';
  }

  private segmentView(seg: SegmentInstance): SegmentView {
    switch (seg.type) {
      case 'press': {
        const firstPending = seg.pressed.findIndex((p) => !p);
        return {
          type: 'press',
          tokens: seg.actions.map((a, i) => ({
            key: a.key,
            label: a.label,
            done: seg.pressed[i],
            current: i === firstPending,
          })),
        };
      }
      case 'hold':
        return {
          type: 'hold',
          key: seg.action.key,
          label: seg.action.label,
          targetSec: seg.target,
          progress: Math.min(1, seg.held / seg.target),
          holding: seg.holding,
        };
      case 'nav':
        return {
          type: 'nav',
          symbol: SYMBOL_BY_DIRECTION[seg.direction],
          direction: seg.direction,
          cursor: seg.cursor,
          target: seg.target,
          committed: seg.committed,
          wrong: seg.wrong,
        };
      case 'selection':
        return {
          type: 'selection',
          prompt: seg.options[seg.correctIndex].label,
          options: seg.options.map((o) => ({ key: o.key, label: o.label })),
          chosenKey: seg.chosenIndex !== null ? seg.options[seg.chosenIndex].key : null,
          wrong: seg.wrong,
        };
      case 'wait':
        return {
          type: 'wait',
          remaining: Math.max(0, seg.total - seg.elapsed),
          progress: Math.min(1, seg.elapsed / seg.total),
        };
      case 'file':
        return {
          type: 'file',
          files: seg.files,
          cursor: seg.cursor,
          target: seg.targetIndex,
          chosenIndex: seg.chosenIndex,
          committed: seg.committed,
          wrong: seg.wrong,
          searching: seg.searching,
          query: seg.query,
          matchIndex: seg.searching ? this.fileMatch(seg) : seg.cursor,
        };
    }
  }
}
