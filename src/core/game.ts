import type { TicketTemplate } from './domain/types';
import { PRIORITY_DRAIN } from './domain/types';
import { SLICE_TICKETS } from './content/slice';
import type { ActiveTicketSnapshot, InputToken, Snapshot, SlotSnapshot } from './snapshot';

/**
 * Motor do jogo — lógica pura em TS, sem React e sem timers próprios.
 * O tempo entra por `tick(dtMs)`, chamado pelo game loop (RAF). A UI lê via `snapshot()`.
 *
 * Por enquanto é uma classe simples; o fluxo de input migra para XState quando os
 * outros tipos de segmento (hold/nav/selection/wait) entrarem (Fase 2).
 */

const SLOT_COUNT = 5;
const DAY_START_MIN = 9 * 60; // 09:00
const DAY_END_MIN = 17 * 60; // 17:00
const DAY_REAL_SECONDS = 180; // 3 min reais = jornada inteira
const GAME_MIN_PER_SEC = (DAY_END_MIN - DAY_START_MIN) / DAY_REAL_SECONDS;

const DRAIN_BASE = 0.5; // por segundo (nível 0)
const GRACE_SECONDS = 12;
const SPAWN_INTERVAL = 8; // segundos

/** Cursor de progresso e estado de runtime de um ticket na fila. */
interface TicketInstance {
  template: TicketTemplate;
  taskIndex: number;
  stepIndex: number;
  segmentIndex: number;
  keyIndex: number;
  errors: number;
  ready: boolean;
}

function instantiate(template: TicketTemplate): TicketInstance {
  return {
    template,
    taskIndex: 0,
    stepIndex: 0,
    segmentIndex: 0,
    keyIndex: 0,
    errors: 0,
    ready: false,
  };
}

export class Game {
  private satisfaction = 100;
  private elapsed = 0; // segundos reais decorridos
  private status: Snapshot['status'] = 'playing';
  private delivered = 0;
  private slots: (TicketInstance | null)[] = new Array(SLOT_COUNT).fill(null);
  private activeSlot: number | null = null;
  private spawnTimer = 0;
  private pool: TicketTemplate[];

  constructor(pool: TicketTemplate[] = SLICE_TICKETS) {
    this.pool = pool;
    // Começa com dois tickets pra fila não nascer vazia.
    this.spawnTicket();
    this.spawnTicket();
  }

  /** Avança o estado em `dtMs` milissegundos. Chamado pelo loop. */
  tick(dtMs: number): void {
    if (this.status !== 'playing') return;
    const dt = dtMs / 1000;
    this.elapsed += dt;

    // Relógio / vitória.
    if (this.gameMinutes() >= DAY_END_MIN) {
      this.status = 'won';
      return;
    }

    // Drain do chefe (após grace period), ponderado pela maior prioridade na fila.
    if (this.elapsed > GRACE_SECONDS) {
      this.satisfaction -= DRAIN_BASE * this.drainMultiplier() * dt;
      if (this.satisfaction <= 0) {
        this.satisfaction = 0;
        this.status = 'lost';
        return;
      }
    }

    // Spawn periódico de tickets em slots vazios.
    this.spawnTimer += dt;
    if (this.spawnTimer >= SPAWN_INTERVAL) {
      this.spawnTimer -= SPAWN_INTERVAL;
      this.spawnTicket();
    }
  }

  /** Seleciona o ticket do slot (0-based). Ignora slots vazios. */
  selectSlot(index: number): void {
    if (this.status !== 'playing') return;
    if (index < 0 || index >= SLOT_COUNT) return;
    if (!this.slots[index]) return;
    this.activeSlot = index;
  }

  /** Processa uma tecla de input no ticket ativo. */
  pressKey(raw: string): void {
    if (this.status !== 'playing') return;
    const inst = this.activeInstance();
    if (!inst || inst.ready) return;

    const segment = this.currentSegment(inst);
    if (!segment) return;

    const expected = segment.keys[inst.keyIndex];
    if (!expected) return;

    if (raw.toLowerCase() === expected.key.toLowerCase()) {
      this.advance(inst);
    } else {
      inst.errors += 1;
    }
  }

  /** Entrega o ticket ativo se ele estiver pronto; aplica recompensa. */
  deliver(): void {
    if (this.status !== 'playing') return;
    if (this.activeSlot === null) return;
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
      slots: this.slots.map((inst, i) => this.slotSnapshot(inst, i)),
      active: this.activeSnapshot(),
    };
  }

  // --- internos ---

  private advance(inst: TicketInstance): void {
    const segment = this.currentSegment(inst);
    if (!segment) return;

    inst.keyIndex += 1;
    if (inst.keyIndex < segment.keys.length) return;

    // Segmento concluído → próximo segmento/passo/tarefa.
    inst.keyIndex = 0;
    inst.segmentIndex += 1;
    const step = inst.template.tasks[inst.taskIndex]?.steps[inst.stepIndex];
    if (step && inst.segmentIndex < step.segments.length) return;

    inst.segmentIndex = 0;
    inst.stepIndex += 1;
    const task = inst.template.tasks[inst.taskIndex];
    if (task && inst.stepIndex < task.steps.length) return;

    inst.stepIndex = 0;
    inst.taskIndex += 1;
    if (inst.taskIndex < inst.template.tasks.length) return;

    // Todas as tarefas feitas → pronto para entregar.
    inst.ready = true;
  }

  private currentSegment(inst: TicketInstance) {
    return inst.template.tasks[inst.taskIndex]?.steps[inst.stepIndex]?.segments[inst.segmentIndex];
  }

  private activeInstance(): TicketInstance | null {
    return this.activeSlot === null ? null : this.slots[this.activeSlot];
  }

  private spawnTicket(): void {
    const free = this.slots.findIndex((s) => s === null);
    if (free === -1) return; // fila cheia
    const template = this.pool[Math.floor(Math.random() * this.pool.length)];
    this.slots[free] = instantiate(template);
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
    const h = Math.floor(total / 60);
    const m = total % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  private slotSnapshot(inst: TicketInstance | null, index: number): SlotSnapshot | null {
    if (!inst) return null;
    return {
      index,
      name: inst.template.name,
      priority: inst.template.priority,
      ready: inst.ready,
      active: index === this.activeSlot,
    };
  }

  private activeSnapshot(): ActiveTicketSnapshot | null {
    const inst = this.activeInstance();
    if (!inst) return null;
    const task = inst.template.tasks[inst.taskIndex] ?? inst.template.tasks.at(-1)!;
    return {
      name: inst.template.name,
      description: inst.template.description,
      priority: inst.template.priority,
      taskTitle: task.title,
      taskIndex: Math.min(inst.taskIndex, inst.template.tasks.length - 1),
      taskCount: inst.template.tasks.length,
      inputs: this.activeInputs(inst),
      ready: inst.ready,
    };
  }

  /** Tokens do passo atual da tarefa atual, com o cursor de input marcado. */
  private activeInputs(inst: TicketInstance): InputToken[] {
    if (inst.ready) return [];
    const step = inst.template.tasks[inst.taskIndex]?.steps[inst.stepIndex];
    if (!step) return [];
    const tokens: InputToken[] = [];
    step.segments.forEach((segment, si) => {
      segment.keys.forEach((k, ki) => {
        const done = si < inst.segmentIndex || (si === inst.segmentIndex && ki < inst.keyIndex);
        const current = si === inst.segmentIndex && ki === inst.keyIndex;
        tokens.push({ key: k.key, label: k.label, done, current });
      });
    });
    return tokens;
  }
}
