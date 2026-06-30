import { ARROW_KEY_BY_DIRECTION, SYMBOL_BY_DIRECTION } from './domain/types';
import type { TicketTemplate } from './domain/types';
import {
  instantiateTicket,
  resetSegment,
  segmentCompleted,
  segmentWrong,
  stepCompleted,
  fileBasename,
  fileRows,
  type FileInstance,
  type SegmentInstance,
  type StepInstance,
  type TaskInstance,
  type TicketInstance,
} from './domain/instance';
import { TICKET_POOL } from '@/data/tickets';
import { SLACK_CHANNELS } from '@/data/channels';
import { APP_BY_LAUNCH_KEY, LAUNCH_KEY, appForTask, windowTitle } from './domain/apps';
import type {
  ActiveTicketSnapshot,
  AppId,
  ProgramId,
  SegmentView,
  Snapshot,
  SlotSnapshot,
  SoundEvent,
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

const SPAWN_INTERVAL = 8;
const CLOSE_KEY = 'x'; // fecha um programa aberto por engano (subjogo de abrir)

const REVERSE_DIR = { up: 'down', down: 'up', left: 'right', right: 'left' } as const;

function joinPt(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(', ')} e ${items[items.length - 1]}`;
}

export class Game {
  private elapsed = 0;
  private status: Snapshot['status'] = 'playing';
  private delivered = 0;
  private slots: (TicketInstance | null)[] = new Array(SLOT_COUNT).fill(null);
  private activeSlot: number | null = null;
  private spawnTimer = 0;
  private pool: TicketTemplate[];
  /** Minutos de jogo por segundo real (deriva da duração do dia). */
  private minPerSec: number;
  /** Fila de eventos sonoros desde o último `drainSounds()` (a UI sintetiza). */
  private sounds: SoundEvent[] = [];

  constructor(
    pool: TicketTemplate[] = TICKET_POOL,
    forceId?: string,
    daySeconds: number = DAY_REAL_SECONDS,
  ) {
    this.pool = pool;
    this.minPerSec = (DAY_END_MIN - DAY_START_MIN) / daySeconds;
    // Teste: força um ticket específico no 1º slot (id de single = id da task).
    if (forceId) {
      const t = pool.find((p) => p.id === forceId);
      if (t) this.slots[0] = instantiateTicket(t);
    }
    while (this.slots.filter(Boolean).length < 2) this.spawnTicket();
  }

  tick(dtMs: number): void {
    if (this.status !== 'playing') return;
    const dt = dtMs / 1000;
    this.elapsed += dt;

    if (this.gameMinutes() >= DAY_END_MIN) {
      this.status = 'won';
      this.emit('win');
      return;
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
        if (segmentCompleted(seg)) {
          // Fim do CR: se a tarefa foi entregue com escolha errada, rejeita e
          // volta pro 1º passo com erro (refazer escolha + push + CR + merge).
          if (this.rejectIfFlawed(inst)) {
            this.emit('error');
          } else {
            const before = this.progKey(inst);
            this.advance(inst);
            this.progressSound(inst, before, false);
          }
        }
      } else if (seg.type === 'hold' && i === this.activeSlot && seg.holding) {
        seg.held += dt;
        if (segmentCompleted(seg)) {
          this.emit('holdEnd');
          const before = this.progKey(inst);
          this.advance(inst);
          this.progressSound(inst, before, false);
        }
      } else if (seg.type === 'gauge' && i === this.activeSlot && seg.holding && !seg.committed) {
        seg.current += seg.rate * dt;
        // Passou da zona-alvo segurando demais → exagerou (over-engineer): erro.
        if (seg.current >= seg.target + seg.tol) {
          seg.current = Math.min(1, seg.current);
          seg.committed = true;
          seg.wrong = true;
          seg.holding = false;
          this.emit('error');
          const before = this.progKey(inst);
          this.advance(inst);
          this.progressSound(inst, before, false);
        }
      }
    });
  }

  selectSlot(index: number): void {
    if (this.status !== 'playing') return;
    if (index < 0 || index >= SLOT_COUNT) return;
    if (!this.slots[index]) return;
    if (this.activeSlot !== index) this.emit('tab');
    this.activeSlot = index;
  }

  /** Tecla pressionada (keydown). */
  keyDown(raw: string): void {
    if (this.status !== 'playing') return;
    const inst = this.activeInstance();
    if (!inst || inst.ready) return;

    const opening = this.pendingOpenApp(inst); // app a abrir agora (passo de abrir), ou null
    const key = raw.toLowerCase();

    // Subjogo de abrir: no passo de abrir, pode-se abrir o programa ERRADO e é
    // preciso fechá-lo com X antes de tentar de novo. (Sem foco exigido aqui.)
    if (opening) {
      if (inst.wrongApp) {
        if (key === CLOSE_KEY) {
          inst.wrongApp = null;
          this.emit('tab');
        } else {
          this.emit('error');
        }
        return;
      }
      if (key !== LAUNCH_KEY[opening]) {
        const wrong = APP_BY_LAUNCH_KEY[key];
        if (wrong) {
          inst.wrongApp = wrong;
          inst.errors += 1;
          this.emit('open');
        }
        return; // tecla errada (app ou não): não abre o programa certo
      }
      // key === abrir correto → segue para o fluxo normal (o press abre o app)
    } else if (inst.focused !== this.currentApp(inst)) {
      // Ações de trabalho exigem o programa aberto E em foco.
      return;
    }

    const seg = this.currentSegment(inst);
    if (!seg) return;
    const before = this.progKey(inst);
    let incidental: SoundEvent | null = null;

    switch (seg.type) {
      case 'press': {
        const idx = seg.actions.findIndex((a, i) => !seg.pressed[i] && a.key === key);
        if (idx >= 0) {
          seg.pressed[idx] = true;
          incidental = 'key';
        } else if (seg.distractors.some((d) => d.key === key)) {
          inst.errors += 1;
          incidental = 'error';
        }
        break;
      }
      case 'nav': {
        // Move o cursor; pode passar do alvo (e voltar). Não conclui — isso é o confirm().
        const at = seg.cursor;
        if (key === ARROW_KEY_BY_DIRECTION[seg.direction]) {
          seg.cursor = Math.min(seg.max, seg.cursor + 1);
        } else if (key === ARROW_KEY_BY_DIRECTION[REVERSE_DIR[seg.direction]]) {
          seg.cursor = Math.max(0, seg.cursor - 1);
        }
        if (seg.cursor !== at) incidental = 'nav';
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
            incidental = 'error';
          } else {
            incidental = 'select';
          }
        }
        break;
      }
      case 'hold': {
        if (key === seg.action.key && !seg.holding) {
          seg.holding = true;
          incidental = 'holdStart';
        }
        break;
      }
      case 'mash': {
        if (segmentCompleted(seg)) break;
        if (seg.anyKey) {
          // "Digitar": martelar — qualquer letra avança (forgiving).
          if (/^[a-z0-9]$/.test(key)) {
            seg.count += 1;
            incidental = 'mash';
          }
        } else if (key === seg.keys[seg.expect]) {
          // Ciclo (⬅️➡️): só a próxima tecla avança; fora de ordem é ignorada.
          seg.count += 1;
          seg.expect = (seg.expect + 1) % seg.keys.length;
          incidental = 'mash';
        }
        break;
      }
      case 'combo': {
        const next = seg.done.findIndex((d) => !d);
        if (next < 0) break;
        const step = seg.steps[next];
        const expected = step.mod ? `${step.mod}+${step.key}` : step.key;
        // Só o próximo atalho da sequência avança (ordem importa: copiar→colar).
        if (key === expected) {
          seg.done[next] = true;
          incidental = 'key';
        }
        break;
      }
      case 'scrub': {
        // Disca o valor ⬅️➡️ (preview ao vivo). Confirma com Enter (confirm()).
        if (seg.committed) break;
        const at = seg.cursor;
        if (key === ARROW_KEY_BY_DIRECTION.right) {
          seg.cursor = Math.min(seg.options.length - 1, seg.cursor + 1);
        } else if (key === ARROW_KEY_BY_DIRECTION.left) {
          seg.cursor = Math.max(0, seg.cursor - 1);
        }
        if (seg.cursor !== at) incidental = 'nav';
        break;
      }
      case 'gauge': {
        // Segurar enche a barra (tick); soltar (keyUp) avalia. Começa a segurar.
        if (key === seg.key && !seg.committed && !seg.holding) {
          seg.holding = true;
          incidental = 'holdStart';
        }
        break;
      }
      case 'file': {
        if (seg.committed) break;
        if (seg.searching) {
          if (key === 'backspace') {
            seg.query = seg.query.slice(0, -1);
            incidental = 'type';
          } else if (key.length === 1) {
            seg.query += key;
            incidental = 'type';
          }
        } else {
          // Cursor anda sobre as LINHAS visíveis da árvore (pastas + arquivos).
          const rows = fileRows(seg.files, new Set(seg.expanded));
          const at = seg.cursor;
          if (key === ARROW_KEY_BY_DIRECTION.down) {
            seg.cursor = Math.min(rows.length - 1, seg.cursor + 1);
          } else if (key === ARROW_KEY_BY_DIRECTION.up) {
            seg.cursor = Math.max(0, seg.cursor - 1);
          }
          if (seg.cursor !== at) incidental = 'nav';
        }
        break;
      }
      case 'wait':
        break;
    }

    if (stepCompleted(this.currentStep(inst)!)) this.advance(inst);

    // Ação de "abrir" recém-concluída → foca o programa que abriu.
    const launched = !!opening && this.openPrograms(inst).includes(opening);
    if (launched) inst.focused = opening;

    // Abrir um programa soa só como "abrir" (clique neutro) — sem o blip de tecla
    // por cima, que delataria a ação como acerto.
    if (incidental && !launched) this.emit(incidental);
    this.progressSound(inst, before, launched);
  }

  /** Ctrl+P: abre/fecha a busca; se o arquivo já foi aberto, REABRE pra trocar. */
  quickOpen(): void {
    if (this.status !== 'playing') return;
    const inst = this.activeInstance();
    if (!inst || inst.wrongApp || inst.focused !== this.currentApp(inst)) return;
    const seg = this.currentSegment(inst);
    if (seg?.type === 'file' && !seg.committed) {
      seg.searching = !seg.searching;
      seg.query = '';
      this.emit('tab');
      return;
    }
    // Já passou do passo de abrir: reabre o seletor pra trocar o arquivo
    // (abrir o errado não deve ser problema — igual abrir o programa errado).
    this.reopenFile(inst);
  }

  /** Volta ao passo de abrir arquivo (antes do push), resetando o que vier depois. */
  private reopenFile(inst: TicketInstance): void {
    const task = inst.tasks[inst.taskIndex];
    if (!task) return;
    const fileStep = task.steps.findIndex((s) => s.segments.some((x) => x.type === 'file'));
    if (fileStep < 0) return;
    const pushStep = task.steps.findIndex((s) =>
      s.segments.some((x) => x.type === 'press' && x.actions.some((a) => /push/i.test(a.label))),
    );
    if (pushStep >= 0 && inst.stepIndex >= pushStep) return; // depois do push não reabre
    for (let si = fileStep; si < task.steps.length; si++)
      task.steps[si].segments.forEach(resetSegment);
    const seg = task.steps[fileStep].segments.find((x) => x.type === 'file');
    if (seg?.type === 'file') seg.searching = true;
    inst.stepIndex = fileStep;
    this.emit('tab');
  }

  /** Ctrl+P: melhor match por nome do arquivo (em qualquer pasta). -1 se nenhum. */
  private fileMatch(seg: FileInstance): number {
    const q = seg.query.toLowerCase();
    if (!q) return -1;
    const byName = (pred: (name: string) => boolean) =>
      seg.files.findIndex((f) => pred(fileBasename(f).toLowerCase()));
    let i = byName((n) => n.startsWith(q));
    if (i >= 0) return i;
    i = byName((n) => n.includes(q));
    if (i >= 0) return i;
    return seg.files.findIndex((f) => f.toLowerCase().includes(q));
  }

  /** Foca um programa aberto (aba). */
  focusProgram(id: ProgramId): void {
    const inst = this.activeInstance();
    if (!inst || inst.wrongApp) return;
    if (id === 'details' || this.openPrograms(inst).includes(id)) {
      if (inst.focused !== id) this.emit('tab');
      inst.focused = id;
    }
  }

  /** Alterna o foco entre as abas (Tab → frente; Shift+Tab → trás). */
  cycleFocus(dir: 1 | -1 = 1): void {
    const inst = this.activeInstance();
    if (!inst || inst.wrongApp) return;
    const tabs: ProgramId[] = ['details', ...this.openPrograms(inst)];
    if (tabs.length < 2) return;
    const i = tabs.indexOf(inst.focused);
    inst.focused = tabs[(i + dir + tabs.length) % tabs.length];
    this.emit('tab');
  }

  /** Tecla solta (keyup) — relevante só para `hold`. */
  keyUp(raw: string): void {
    if (this.status !== 'playing') return;
    const inst = this.activeInstance();
    if (!inst) return;
    const seg = this.currentSegment(inst);
    if (seg?.type === 'hold' && raw.toLowerCase() === seg.action.key) {
      seg.holding = false;
      this.emit('holdEnd');
      if (seg.held < seg.target) seg.held = 0; // soltou cedo: reinicia (paridade com o PoC)
    } else if (seg?.type === 'gauge' && raw.toLowerCase() === seg.key && seg.holding) {
      seg.holding = false;
      this.emit('holdEnd');
      if (!seg.committed) {
        const lo = seg.target - seg.tol;
        const hi = seg.target + seg.tol;
        if (seg.current >= lo && seg.current <= hi) {
          // Soltou na zona → sucesso.
          seg.committed = true;
          const before = this.progKey(inst);
          this.emit('select');
          const step = this.currentStep(inst);
          if (step && stepCompleted(step)) this.advance(inst);
          this.progressSound(inst, before, false);
        }
        // Soltou antes da zona: fica onde está (pode retomar segurando de novo).
      }
    }
  }

  /** Enter: confirma o passo posicional (nav) ou entrega quando pronto. */
  confirm(): void {
    if (this.status !== 'playing') return;
    const inst = this.activeInstance();
    if (!inst || inst.wrongApp) return;
    if (inst.ready) {
      this.deliver();
      return;
    }
    // Confirmar o nav é ação de trabalho — exige o programa em foco.
    if (inst.focused !== this.currentApp(inst)) return;
    const seg = this.currentSegment(inst);
    const before = this.progKey(inst);
    if (seg?.type === 'scrub' && !seg.committed) {
      seg.committed = true;
      if (seg.cursor !== seg.correctIndex) {
        seg.wrong = true;
        inst.errors += 1;
        this.emit('error');
      } else {
        this.emit('select');
      }
      const step = this.currentStep(inst);
      if (step && stepCompleted(step)) this.advance(inst);
      this.progressSound(inst, before, false);
    } else if (seg?.type === 'nav' && !seg.committed) {
      seg.committed = true;
      if (seg.cursor !== seg.target) {
        seg.wrong = true;
        inst.errors += 1;
        this.emit('error');
      }
      const step = this.currentStep(inst);
      if (step && stepCompleted(step)) this.advance(inst);
      this.progressSound(inst, before, false);
    } else if (seg?.type === 'file' && !seg.committed) {
      if (seg.searching) {
        // Ctrl+P: confirma o arquivo do match (qualquer pasta). Sem match, ignora.
        const idx = this.fileMatch(seg);
        if (idx >= 0) this.commitFile(inst, seg, idx, before);
      } else {
        const row = fileRows(seg.files, new Set(seg.expanded))[seg.cursor];
        if (!row) return;
        if (row.kind === 'folder') {
          // Enter numa pasta: expande/colapsa (não conclui o passo).
          seg.expanded = seg.expanded.includes(row.path)
            ? seg.expanded.filter((p) => p !== row.path)
            : [...seg.expanded, row.path];
          const rows = fileRows(seg.files, new Set(seg.expanded));
          seg.cursor = Math.min(seg.cursor, rows.length - 1);
          this.emit('tab');
        } else {
          this.commitFile(inst, seg, row.fileIndex, before);
        }
      }
    }
  }

  /** Commita a escolha de arquivo (índice em files) e avança o passo. */
  private commitFile(inst: TicketInstance, seg: FileInstance, idx: number, before: string): void {
    seg.chosenIndex = idx;
    seg.committed = true;
    seg.searching = false;
    if (idx !== seg.targetIndex) {
      seg.wrong = true;
      inst.errors += 1;
      this.emit('error');
    }
    const step = this.currentStep(inst);
    if (step && stepCompleted(step)) this.advance(inst);
    this.progressSound(inst, before, false);
  }

  deliver(): void {
    if (this.status !== 'playing' || this.activeSlot === null) return;
    const inst = this.slots[this.activeSlot];
    if (!inst || !inst.ready) return;

    this.delivered += 1;
    this.slots[this.activeSlot] = null;
    this.activeSlot = null;
    this.emit('deliver');
  }

  snapshot(): Snapshot {
    return {
      status: this.status,
      clock: this.formatClock(),
      delivered: this.delivered,
      activeErrors: this.activeInstance()?.errors ?? 0,
      slots: this.slots.map((inst, i) => this.slotSnapshot(inst, i)),
      active: this.activeSnapshot(),
    };
  }

  /** Esvazia a fila de eventos sonoros acumulados desde a última chamada. */
  drainSounds(): SoundEvent[] {
    if (this.sounds.length === 0) return [];
    const out = this.sounds;
    this.sounds = [];
    return out;
  }

  // --- internos ---

  private emit(s: SoundEvent): void {
    this.sounds.push(s);
  }

  /** Assinatura de progresso (tarefa.passo + ready) — muda quando algo avança. */
  private progKey(inst: TicketInstance): string {
    return `${inst.ready ? 'r' : ''}${inst.taskIndex}.${inst.stepIndex}`;
  }

  /** Emite o som de progressão certo se o cursor avançou desde `before`. */
  private progressSound(inst: TicketInstance, before: string, launched: boolean): void {
    if (this.progKey(inst) === before) return;
    if (inst.ready) this.emit('ready');
    else if (launched) this.emit('open');
    else this.emit('step');
  }

  /**
   * Se a tarefa atual tem alguma escolha errada commitada, rejeita o CR: reseta
   * do 1º passo com erro até o fim da tarefa e devolve o cursor pra lá. Retorna
   * true se rejeitou. Se estava tudo certo, limpa a flag e retorna false.
   */
  private rejectIfFlawed(inst: TicketInstance): boolean {
    const task = inst.tasks[inst.taskIndex];
    if (!task) return false;
    const firstWrong = task.steps.findIndex((s) => s.segments.some(segmentWrong));
    if (firstWrong < 0) {
      inst.reviewRejected = false;
      inst.reviewComment = null;
      return false;
    }
    // Comentário do reviewer ANTES de resetar (depois a escolha errada some).
    const wrongSeg = task.steps[firstWrong].segments.find(segmentWrong);
    inst.reviewComment = wrongSeg ? this.reviewComment(wrongSeg) : null;
    for (let si = firstWrong; si < task.steps.length; si++) {
      task.steps[si].segments.forEach(resetSegment);
    }
    inst.stepIndex = firstWrong;
    inst.reviewRejected = true;
    return true;
  }

  /** Texto do comentário de CR conforme o tipo de escolha errada. */
  private reviewComment(seg: SegmentInstance): string {
    switch (seg.type) {
      case 'selection': {
        const chose = seg.chosenIndex !== null ? seg.options[seg.chosenIndex].label : '?';
        const want = seg.options[seg.correctIndex].label;
        const labels = seg.options.map((o) => o.label);
        if (labels.some((l) => /vermelho|verde|azul/i.test(l)))
          return `A cor ficou ${chose}, mas o ticket pede ${want}. Ajusta?`;
        if (labels.some((l) => /px$/.test(l)))
          return `A fonte ficou ${chose}, mas o ticket pede ${want}. Ajusta?`;
        if (labels.some((l) => /it[áa]lico|negrito|regular/i.test(l)))
          return `O estilo ficou ${chose}, mas o ticket pede ${want}. Ajusta?`;
        if (labels.some((l) => /button|title|input/i.test(l)))
          return `Você editou o ${chose}, mas a mudança é no ${want}.`;
        if (labels.some((l) => /^(texto|fundo)$/i.test(l)))
          return `Você alterou o ${chose.toLowerCase()}, mas era pra mexer no ${want.toLowerCase()}.`;
        return `Ficou ${chose}, mas o ticket pede ${want}.`;
      }
      case 'nav':
        return `Você mexeu na linha ${seg.cursor + 1}, mas o problema é na linha ${seg.target + 1}.`;
      case 'scrub': {
        const chose = seg.options[seg.cursor]?.label ?? '?';
        const want = seg.options[seg.correctIndex].label;
        const isSize = /px$/.test(want);
        return isSize
          ? `A fonte ficou ${chose}, mas o ticket pede ${want}. Ajusta?`
          : `A cor ficou ${chose}, mas o ticket pede ${want}. Ajusta?`;
      }
      case 'file': {
        const chose = seg.chosenIndex !== null ? fileBasename(seg.files[seg.chosenIndex]) : '?';
        return `Esse PR alterou ${chose}, mas era pra ser ${fileBasename(seg.files[seg.targetIndex])}.`;
      }
      case 'gauge':
        return 'Você simplificou demais e quebrou a abstração. Menos é mais — mas não tanto.';
      default:
        return 'Isso ainda não está como o ticket pede.';
    }
  }

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

  /** App que um passo ABRE (se for um passo de "abrir programa"); senão null. */
  private stepOpensApp(step: StepInstance | undefined): AppId | null {
    if (!step) return null;
    for (const seg of step.segments) if (seg.type === 'press' && seg.opens) return seg.opens;
    return null;
  }

  /** App de trabalho do passo atual = app aberto mais recente (≤ passo atual) na
   *  task corrente. Permite uma task abrir Chrome e depois VS Code (app por passo). */
  private currentApp(inst: TicketInstance): AppId {
    const task = inst.tasks[Math.min(inst.taskIndex, inst.tasks.length - 1)];
    let app: AppId | null = null;
    for (let si = 0; si <= inst.stepIndex && si < task.steps.length; si++) {
      const opened = this.stepOpensApp(task.steps[si]);
      if (opened) app = opened;
    }
    return app ?? appForTask(task.template.id);
  }

  /** Se o passo ATUAL é um "abrir programa" ainda não concluído, o app a abrir. */
  private pendingOpenApp(inst: TicketInstance): AppId | null {
    const step = this.currentStep(inst);
    const app = this.stepOpensApp(step);
    return app && step && !stepCompleted(step) ? app : null;
  }

  /** O app de trabalho atual já está aberto? (passo de abrir já concluído.) */
  private isLaunched(inst: TicketInstance): boolean {
    return inst.ready || this.openPrograms(inst).includes(this.currentApp(inst));
  }

  /** Apps abertos desta demanda (passos de "abrir" já concluídos, em todas as tasks). */
  private openPrograms(inst: TicketInstance): AppId[] {
    const out: AppId[] = [];
    for (let ti = 0; ti <= inst.taskIndex && ti < inst.tasks.length; ti++) {
      const task = inst.tasks[ti];
      for (let si = 0; si < task.steps.length; si++) {
        const app = this.stepOpensApp(task.steps[si]);
        if (!app) continue;
        const opened = inst.ready || ti < inst.taskIndex || si < inst.stepIndex;
        if (opened && !out.includes(app)) out.push(app);
      }
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

  private gameMinutes(): number {
    return DAY_START_MIN + this.elapsed * this.minPerSec;
  }

  private formatClock(): string {
    const total = Math.min(DAY_END_MIN, Math.floor(this.gameMinutes()));
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  }

  private slotSnapshot(inst: TicketInstance | null, index: number): SlotSnapshot | null {
    if (!inst) return null;
    const seg = this.currentSegment(inst);
    const waiting = seg?.type === 'wait' && !segmentCompleted(seg);
    // Review voltou e o passo atual é o merge → pronto pro merge. O merge agora é
    // um `mash` (resolver conflito); aceita também o press legado por segurança.
    const readyToMerge =
      !inst.ready &&
      ((seg?.type === 'mash' && /merge|conflito/i.test(seg.label)) ||
        (seg?.type === 'press' && seg.actions.some((a) => /merge/i.test(a.label))));
    return {
      index,
      id: inst.id,
      name: inst.template.name,
      priority: inst.template.priority,
      ready: inst.ready,
      active: index === this.activeSlot,
      waitRemaining: waiting ? Math.ceil(seg.total - seg.elapsed) : null,
      readyToMerge,
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
      editorFixedLine: this.editorFixedLine(taskInst),
      browserSite: this.browserSite(taskInst),
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
      reviewRejected: inst.reviewRejected,
      reviewComment: inst.reviewComment,
      wrongApp: inst.wrongApp,
      app: this.currentApp(inst),
      windowTitle: windowTitle(this.currentApp(inst), task.title),
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
  // Inclui `selection` e `scrub` (o valor discado) na ordem dos passos.
  private selLabels(t: TaskInstance): string[] {
    const out: string[] = [];
    for (const step of t.steps)
      for (const seg of step.segments)
        if (seg.type === 'selection' || seg.type === 'scrub')
          out.push(seg.options[seg.correctIndex].label);
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
      for (const seg of step.segments)
        if (seg.type === 'file') return fileBasename(seg.files[seg.targetIndex]);
    return null;
  }
  /** Site aberto no navegador (deriva das ações "Abrir {fonte}" / staging da tarefa). */
  private browserSite(t: TaskInstance): string {
    for (const step of t.steps)
      for (const seg of step.segments)
        if (seg.type === 'press')
          for (const a of seg.actions) {
            const l = a.label.toLowerCase();
            if (/stack/.test(l)) return 'so';
            if (/playbook/.test(l)) return 'wiki';
            if (/tutorial/.test(l)) return 'tutorial';
            if (/document/.test(l)) return 'docs';
            if (/staging/.test(l)) return 'staging';
            if (/issue/.test(l)) return 'issues';
            if (/webmail|e-?mail/.test(l)) return 'inbox';
            if (/reuni|meet/.test(l)) return 'meet';
          }
    return 'home';
  }
  /** A tarefa corrige uma linha? (passo "Corrigir" F, ou o combo de colar.) */
  private hasFixStep(t: TaskInstance): boolean {
    return t.steps.some((s) =>
      s.segments.some(
        (seg) =>
          (seg.type === 'press' && seg.actions.some((a) => /corrigir/i.test(a.label))) ||
          seg.type === 'combo',
      ),
    );
  }
  /** A tarefa de bug é resolvida colando (combo Ctrl+C/Ctrl+V) em vez de digitar? */
  private isPasteFix(t: TaskInstance): boolean {
    return t.steps.some((s) => s.segments.some((seg) => seg.type === 'combo'));
  }
  /** Linha-alvo (1-based) do bug — só p/ tarefas que têm um passo de correção. */
  private editorLine(t: TaskInstance): number {
    if (!this.hasFixStep(t)) return 0;
    for (const step of t.steps)
      for (const seg of step.segments) if (seg.type === 'nav') return seg.target + 1;
    return 0;
  }

  /** Linha que o jogador realmente corrigiu = cursor commitado (pode ser a errada). */
  private editorFixedLine(t: TaskInstance): number {
    if (this.editorLine(t) === 0) return 0;
    for (const step of t.steps)
      for (const seg of step.segments)
        if (seg.type === 'nav') return (seg.committed ? seg.cursor : seg.target) + 1;
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
        return `Abra o Chrome, acesse ${joinPt(
          this.pressLabelsAt(t, 1).map((s) => s.replace(/^Abrir /, '')),
        )} e leia a página.`;
      case 'meeting':
        return `Abra o Chrome, entre na reunião e fale por ${hold[0] ?? 3}s.`;
      case 'test_feature':
        return `Abra o Chrome, acesse o staging e rode os testes por ${hold[0] ?? 3}s.`;
      case 'slack':
        return `Abra o Slack e responda a mensagem no ${channel}.`;
      case 'email':
        return `Abra o Chrome, abra o webmail e arquive a mensagem do chefe.`;
      case 'document':
        return `Documente a função no VSCode; faça push, aguarde o CR e o merge.`;
      case 'refactor':
        return `Refatore ${this.fileTarget(t) ?? 'o módulo'}: segure pra simplificar e solte na zona certa (sem exagerar); faça push, aguarde o CR e o merge.`;
      case 'fix_typo': {
        const line = (nav[0] ?? 0) + 1;
        const file = this.fileTarget(t) ?? 'login.ts';
        return this.isPasteFix(t)
          ? `Pesquise no Chrome e copie a correção do Stack Overflow (Ctrl+C); no VSCode, vá até a linha ${line} de ${file} e cole (Ctrl+V); faça push, aguarde o CR e o merge.`
          : `No VSCode, corrija o typo na linha ${line} de ${file}; faça push, aguarde o CR e o merge.`;
      }
      case 'ui_update': {
        // Variante fonte tem um valor em "px"; senão é a variante cor.
        const file = this.fileTarget(t) ?? 'styles.css';
        const isSize = sel.some((l) => /px$/.test(l));
        return isSize
          ? `Em ${file}, deixe a fonte do ${sel[0]} em ${sel[1]} e o estilo ${sel[2]}; faça push, aguarde o CR e o merge.`
          : `Em ${file}, mude a ${sel[1]} do ${sel[0]} para ${sel[2]}; faça push, aguarde o CR e o merge.`;
      }
      default:
        return t.template.description;
    }
  }

  /** Arquivo aberto no editor (para a cena do VSCode mostrar o conteúdo certo). */
  private editorFile(t: TaskInstance): string {
    for (const step of t.steps)
      for (const seg of step.segments)
        if (seg.type === 'file') return fileBasename(seg.files[seg.chosenIndex ?? seg.targetIndex]);
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
          // Opções "erradas" do mesmo passo (ex.: outros sites): a UI mostra todas
          // para o jogador escolher — qual é a certa vem do ticket.
          distractors: seg.distractors.map((a) => ({ key: a.key, label: a.label })),
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
      case 'mash': {
        const perGroup = seg.target / seg.groups;
        const activeGroup = Math.min(seg.groups - 1, Math.floor(seg.count / perGroup));
        const groupProgress = Math.min(1, (seg.count - activeGroup * perGroup) / perGroup);
        return {
          type: 'mash',
          keys: seg.keys,
          label: seg.label,
          expectKey: seg.keys[seg.expect] ?? '',
          count: seg.count,
          target: seg.target,
          progress: Math.min(1, seg.count / seg.target),
          groups: seg.groups,
          activeGroup,
          groupProgress,
          anyKey: seg.anyKey,
        };
      }
      case 'combo': {
        const firstPending = seg.done.findIndex((d) => !d);
        return {
          type: 'combo',
          tokens: seg.steps.map((s, i) => ({
            combo: s.mod ? `${s.mod}+${s.key}` : s.key,
            label: s.label,
            done: seg.done[i],
            current: i === firstPending,
          })),
        };
      }
      case 'scrub':
        return {
          type: 'scrub',
          options: seg.options.map((o) => ({ key: o.key, label: o.label })),
          cursor: seg.cursor,
          committed: seg.committed,
          wrong: seg.wrong,
        };
      case 'gauge':
        return {
          type: 'gauge',
          key: seg.key,
          label: seg.label,
          current: Math.min(1, seg.current),
          target: seg.target,
          tol: seg.tol,
          holding: seg.holding,
          committed: seg.committed,
          wrong: seg.wrong,
        };
      case 'file': {
        const expanded = new Set(seg.expanded);
        const rows = fileRows(seg.files, expanded).map((r) => ({
          kind: r.kind,
          name: r.name,
          depth: r.depth,
          open: r.kind === 'folder' ? expanded.has(r.path) : false,
          fileIndex: r.fileIndex,
        }));
        return {
          type: 'file',
          files: seg.files,
          rows,
          cursor: Math.min(seg.cursor, Math.max(0, rows.length - 1)),
          target: seg.targetIndex,
          chosenIndex: seg.chosenIndex,
          committed: seg.committed,
          wrong: seg.wrong,
          searching: seg.searching,
          query: seg.query,
          matchIndex: seg.searching ? this.fileMatch(seg) : -1,
        };
      }
    }
  }
}
