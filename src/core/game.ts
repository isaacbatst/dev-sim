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
const DAY_REAL_SECONDS = 220;

// Backlog enche mais devagar: como o deadline corre em TODOS os slots em
// paralelo (e só dá pra trabalhar um), spawn rápido = perda garantida. Calibrar
// por feel (§10/§11 — balanceamento fino só com playtest).
const SPAWN_INTERVAL = 24;
const CLOSE_KEY = 'x'; // fecha um programa aberto por engano (subjogo de abrir)

// ── Fadiga (FOCO_FADIGA.md) — tudo em MINUTOS DE JOGO ─────────────────────
// ESCALADA CONTÍNUA, SEM TETO: "exausto" é o começo do problema, não o fim.
// As curvas escalam com x = horas de trabalho além do limiar de cansado —
// às 5-6h sem pausa o dia fica comicamente disfuncional (ignorar não é viável).
const FAT_TIRED = 150; // ~2h30 de trabalho contínuo → telegraph + lapsos leves
const FAT_EXHAUSTED = 210; // ~3h30 → lapsos fortes (x = 1)

/** Horas de trabalho ALÉM do limiar de cansado (0 = fresco/limiar). */
function overworkH(fatigueMin: number): number {
  return Math.max(0, (fatigueMin - FAT_TIRED) / 60);
}

/** Curvas dos lapsos (probabilidades por MINUTO DE JOGO, salvo indicação). */
export function fatigueRates(fatigueMin: number) {
  const x = overworkH(fatigueMin);
  return {
    x,
    /** piscada — cresce sempre (rara: pontua, não metralha) */
    blinkPMin: x <= 0 ? 0 : Math.min(0.18, 0.015 + 0.03 * x),
    /** bocejo — só de exausto (x≥1) em diante */
    yawnPMin: x < 1 ? 0 : Math.min(0.15, 0.022 + 0.025 * (x - 1)),
    /** tecla emperrada — por TECLA elegível (o lapso mais frequente) */
    stuckPKey: x <= 0 ? 0 : Math.min(0.45, 0.08 + 0.1 * x),
    stuckCooldown: Math.max(3, 10 - 3 * x),
    /** "tinha algo pra fazer?" — só de exausto em diante, AGRESSIVO */
    forgetPMin: x < 1 ? 0 : Math.min(0.25, 0.04 + 0.06 * (x - 1)),
    forgetDuration: Math.min(70, 30 + 12 * (x - 1)),
    forgetCooldown: Math.max(6, 16 - 5 * (x - 1)),
    /** quantos slots podem estar esquecidos AO MESMO TEMPO */
    maxForgotten: Math.min(3, 1 + Math.floor(Math.max(0, x - 1))),
  };
}

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
  /** Demandas que expiraram (deadline estourou sem entrega). */
  private expired = 0;
  /** Nota do dia (moeda única, §9): entrega(+veloc.) sobe; expirar/errar desce. */
  private score = 0;
  private slots: (TicketInstance | null)[] = new Array(SLOT_COUNT).fill(null);
  private activeSlot: number | null = null;
  private spawnTimer = 0;
  private pool: TicketTemplate[];
  /** Minutos de jogo por segundo real (deriva da duração do dia). */
  private minPerSec: number;
  /** Fila de eventos sonoros desde o último `drainSounds()` (a UI sintetiza). */
  private sounds: SoundEvent[] = [];

  // ── Fadiga (FOCO_FADIGA.md) ──
  /** Minutos de jogo trabalhados desde a última restauração. */
  private fatigueMin = 0;
  /** Em pausa (a UI avisa): fadiga não acumula, lapsos não disparam. */
  private resting = false;
  private blinkN = 0;
  private yawnN = 0;
  private stuckN = 0;
  /** Até quando (min de jogo absolutos) cada slot está "esquecido". */
  private forgottenUntil: number[] = new Array(SLOT_COUNT).fill(0);
  private lastForgetAt = -Infinity; // min de jogo absolutos
  private lastStuckAt = -Infinity; // min de FADIGA
  private fatigueLog: string[] = [];

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
    // dt de gameplay (hold/gauge): limitado, senão voltar do background segurando
    // uma tecla encheria a barra de uma vez. Timers ambientes usam o dt real.
    const gdt = Math.min(dt, 0.1);
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

    this.tickFatigue(dt);

    // Deadline por ticket (§9): conta enquanto não está pronto pra entrega.
    // Expira em 0 → demanda perdida (tombo na nota, sem game-over).
    this.slots.forEach((inst, i) => {
      if (!inst || inst.ready) return;
      inst.remaining -= dt;
      if (inst.remaining <= 0) {
        inst.remaining = 0;
        this.expired += 1;
        this.score -= 60;
        this.slots[i] = null;
        this.forgottenUntil[i] = 0;
        if (this.activeSlot === i) this.activeSlot = null;
        this.emit('error');
      }
    });

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
        seg.held += gdt;
        if (segmentCompleted(seg)) {
          this.emit('holdEnd');
          const before = this.progKey(inst);
          this.advance(inst);
          this.progressSound(inst, before, false);
        }
      } else if (seg.type === 'gauge' && i === this.activeSlot && seg.holding && !seg.committed) {
        // Enche segurando — PODE passar do alvo (até o fim). O julgamento é só ao
        // soltar (keyUp): soltou na zona → ok; fora (cedo ou passou) → CR rejeita.
        seg.current = Math.min(1, seg.current + seg.rate * gdt);
      }
    });
  }

  // ── Fadiga (FOCO_FADIGA.md) ─────────────────────────────────────────────

  private fatigueStage(): 'fresh' | 'tired' | 'exhausted' {
    if (this.fatigueMin >= FAT_EXHAUSTED) return 'exhausted';
    if (this.fatigueMin >= FAT_TIRED) return 'tired';
    return 'fresh';
  }

  private logFatigue(msg: string): void {
    this.fatigueLog.push(`${this.formatClock()} · ${msg}`);
    if (this.fatigueLog.length > 10) this.fatigueLog.shift();
  }

  private isForgotten(i: number): boolean {
    return this.slots[i] !== null && this.forgottenUntil[i] > this.gameMinutes();
  }

  /** Acumula fadiga (min de jogo) e rola os lapsos — curvas SEM teto. */
  private tickFatigue(dt: number): void {
    if (this.resting) return;
    const dMin = dt * this.minPerSec;
    const before = this.fatigueMin;
    this.fatigueMin += dMin;

    // telegraph: o 1º bocejo ao cruzar o limiar de cansado
    if (before < FAT_TIRED && this.fatigueMin >= FAT_TIRED) {
      this.yawnN += 1;
      this.emit('yawn');
      this.logFatigue('bocejo (telegraph — 2h30 sem pausa)');
    }

    const r = fatigueRates(this.fatigueMin);
    if (r.x <= 0) return;

    // piscada pesada (frequência escala sempre)
    if (Math.random() < r.blinkPMin * dMin) {
      this.blinkN += 1;
      this.logFatigue(`piscada (p=${(r.blinkPMin * 100).toFixed(1)}%/min)`);
    }

    // bocejo ocasional
    if (Math.random() < r.yawnPMin * dMin) {
      this.yawnN += 1;
      this.emit('yawn');
      this.logFatigue(`bocejo (p=${(r.yawnPMin * 100).toFixed(1)}%/min)`);
    }

    // "tinha algo pra fazer?" — agressivo: dura mais, escala, e em fadiga alta
    // vários slots podem estar esquecidos ao mesmo tempo
    const nowMin = this.gameMinutes();
    const forgottenCount = this.slots.filter((_, i) => this.isForgotten(i)).length;
    if (
      forgottenCount < r.maxForgotten &&
      nowMin - this.lastForgetAt >= r.forgetCooldown &&
      Math.random() < r.forgetPMin * dMin
    ) {
      // candidato: não ativo, não pronto, com folga de prazo (lapso rouba
      // tempo, não pode condenar um ticket já no fio)
      const cands = this.slots
        .map((inst, i) => ({ inst, i }))
        .filter(
          ({ inst, i }) =>
            inst !== null &&
            i !== this.activeSlot &&
            !this.isForgotten(i) &&
            !inst.ready &&
            inst.remaining / inst.deadline > 0.35,
        );
      if (cands.length > 0) {
        const pick = cands[Math.floor(Math.random() * cands.length)];
        const dur = Math.round(r.forgetDuration);
        this.forgottenUntil[pick.i] = nowMin + dur;
        this.lastForgetAt = nowMin;
        this.logFatigue(
          `esqueceu DEV-${pick.inst!.id} por ${dur}min (p=${(r.forgetPMin * 100).toFixed(1)}%/min)`,
        );
      }
    }
  }

  /** Tecla emperrada: engole o input em contexto de EXECUÇÃO (nunca julgado). */
  private stickyKeySwallows(inst: TicketInstance, opening: AppId | null): boolean {
    const r = fatigueRates(this.fatigueMin);
    if (r.stuckPKey <= 0) return false;
    if (this.fatigueMin - this.lastStuckAt < r.stuckCooldown) return false;
    // elegível: passo de abrir OU segmento de execução (press/nav/mash/combo/file);
    // gauge/selection/triage/wait são julgados ou passivos — nunca emperram.
    const seg = this.currentSegment(inst);
    const eligible =
      opening !== null ||
      (seg !== undefined && ['press', 'nav', 'mash', 'combo', 'file'].includes(seg.type));
    if (!eligible) return false;
    if (Math.random() >= r.stuckPKey) return false;
    this.lastStuckAt = this.fatigueMin;
    this.stuckN += 1;
    this.emit('stuck');
    this.logFatigue(`tecla emperrou (p=${(r.stuckPKey * 100).toFixed(0)}%/tecla)`);
    return true;
  }

  /** A UI avisa quando o jogador está em pausa (fadiga não acumula). */
  setResting(v: boolean): void {
    this.resting = v;
  }

  /** Ritual completado na pausa → fresco de novo (limpa esquecimentos também). */
  restore(): void {
    if (this.fatigueMin === 0) return;
    this.fatigueMin = 0;
    this.lastStuckAt = -Infinity;
    this.forgottenUntil.fill(0);
    this.logFatigue('restaurado (ritual)');
  }

  /** Debug: injeta minutos de fadiga (overlay ?debug=1). */
  debugFatigue(min: number): void {
    this.fatigueMin = Math.max(0, this.fatigueMin + min);
  }

  selectSlot(index: number): void {
    if (this.status !== 'playing') return;
    if (index < 0 || index >= SLOT_COUNT) return;
    if (!this.slots[index]) return;
    // esquecido: "tinha algo pra fazer?" — não dá pra selecionar o que sumiu
    if (this.isForgotten(index)) return;
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

    // Fadiga: tecla emperrada — engole o input (custa tempo, nunca julga).
    if (this.stickyKeySwallows(inst, opening)) return;

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
        // Ciclo: só a PRÓXIMA tecla esperada avança; fora de ordem é ignorada
        // (apertar a mesma repetido não conta).
        if (key === seg.keys[seg.expect]) {
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
      case 'triage': {
        // Matching puro: aperta a tecla do veredito do comentário atual.
        if (seg.cursor >= seg.items.length) break;
        const item = seg.items[seg.cursor];
        const correct = seg.categories[item.cat]?.key;
        if (key === correct) {
          seg.cursor += 1;
          incidental = 'mash'; // catraca que sobe com o ritmo (fila esvaziando)
        } else if (seg.categories.some((c) => c.key === key)) {
          // veredito errado pro comentário → erro (não avança)
          inst.errors += 1;
          seg.wrong = true;
          incidental = 'error';
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
    if (id !== 'details' && this.openPrograms(inst).includes(id)) {
      if (inst.focused !== id) this.emit('tab');
      inst.focused = id;
    }
  }

  /** Alterna o foco entre as abas (Tab → frente; Shift+Tab → trás). Só entre
   *  programas abertos — a aba Ticket saiu (objetivo vive no banner). */
  cycleFocus(dir: 1 | -1 = 1): void {
    const inst = this.activeInstance();
    if (!inst || inst.wrongApp) return;
    const tabs: ProgramId[] = this.openPrograms(inst);
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
        // Soltar = decisão final. Na zona → ok; fora dela (parou cedo OU passou
        // do alvo) → erro: o CR vai rejeitar e mandar refazer. Sem retomar.
        const lo = seg.target - seg.tol;
        const hi = seg.target + seg.tol;
        const before = this.progKey(inst);
        seg.committed = true;
        if (seg.current >= lo && seg.current <= hi) {
          this.emit('select');
        } else {
          seg.wrong = true;
          inst.errors += 1;
          this.emit('error');
        }
        const step = this.currentStep(inst);
        if (step && stepCompleted(step)) this.advance(inst);
        this.progressSound(inst, before, false);
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
    // Nota (§9): base + bônus de velocidade (quanto do prazo sobrou) − precisão (erros).
    const speed = inst.deadline > 0 ? Math.max(0, inst.remaining / inst.deadline) : 0;
    const gain = 100 + Math.round(50 * speed) - 15 * inst.errors;
    this.score += Math.max(10, gain);
    this.forgottenUntil[this.activeSlot] = 0;
    this.slots[this.activeSlot] = null;
    this.activeSlot = null;
    this.emit('deliver');
  }

  snapshot(): Snapshot {
    return {
      status: this.status,
      clock: this.formatClock(),
      delivered: this.delivered,
      expired: this.expired,
      score: this.score,
      activeErrors: this.activeInstance()?.errors ?? 0,
      fatigue: {
        min: this.fatigueMin,
        stage: this.fatigueStage(),
        blinkN: this.blinkN,
        yawnN: this.yawnN,
        stuckN: this.stuckN,
        log: [...this.fatigueLog],
        rates: fatigueRates(this.fatigueMin),
      },
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
        return seg.current > seg.target
          ? 'Você simplificou demais e quebrou a abstração. Menos é mais — mas não tanto.'
          : 'Parou cedo: ainda tem código redundante pra limpar. Refatora direito?';
      default:
        return 'Isso ainda não está como o ticket pede.';
    }
  }

  /** Passo de "abrir" cujo app JÁ está aberto (task anterior da mesma demanda):
   *  conclui sozinho — não faz reabrir o que já está aberto (basta Tab pra focar). */
  private skipIfAlreadyOpen(inst: TicketInstance, step: StepInstance): boolean {
    const app = this.stepOpensApp(step);
    if (!app || !this.openPrograms(inst).includes(app)) return false;
    step.segments.forEach((s) => {
      if (s.type === 'press') s.pressed = s.pressed.map(() => true);
    });
    // NÃO auto-foca: o app reusado já está aberto, mas o foco fica no app anterior
    // de propósito → a janela mostra "Tab pra ir pro <app>" (troca explícita, sem
    // pulo silencioso). Abrir um app novo (C/V/S) é que foca sozinho (linha ~331).
    return true;
  }

  /** Avança o cursor enquanto o passo atual estiver completo; marca `ready` ao fim. */
  private advance(inst: TicketInstance): void {
    let step = this.currentStep(inst);
    while (step && (stepCompleted(step) || this.skipIfAlreadyOpen(inst, step))) {
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
      // Deadline: pronto pra entrega não expira mais (trabalho feito).
      deadlineRemaining: inst.ready ? null : Math.ceil(inst.remaining),
      deadlineFrac: inst.ready ? 1 : Math.max(0, Math.min(1, inst.remaining / inst.deadline)),
      forgotten: this.isForgotten(index),
      forgottenRemaining: this.isForgotten(index)
        ? Math.ceil(this.forgottenUntil[index] - this.gameMinutes())
        : null,
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
      case 'review_pr':
        return `Abra o PR no Chrome e despache cada comentário do review: Bloquear (J) / Comentar (K) / Elogiar (L), conforme o rótulo.`;
      case 'refactor':
        return `Refatore ${this.fileTarget(t) ?? 'o módulo'}: segure pra simplificar e solte na zona certa (sem exagerar); faça push, aguarde o CR e o merge.`;
      case 'fix_typo': {
        const line = (nav[0] ?? 0) + 1;
        const file = this.fileTarget(t) ?? 'login.ts';
        return `No VSCode, corrija o typo na linha ${line} de ${file}; faça push, aguarde o CR e o merge.`;
      }
      case 'fix_bug': {
        const line = (nav[0] ?? 0) + 1;
        const file = this.fileTarget(t) ?? 'login.ts';
        return this.isPasteFix(t)
          ? `Pesquise no Chrome e copie a correção do Stack Overflow (Ctrl+C); no VSCode, vá até a linha ${line} de ${file} e cole (Ctrl+V); faça push, aguarde o CR e o merge.`
          : `Corrija o bug na linha ${line} de ${file} no VSCode; faça push, aguarde o CR e o merge.`;
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
      case 'triage':
        return {
          type: 'triage',
          categories: seg.categories.map((c) => ({ key: c.key, label: c.label, color: c.color })),
          items: seg.items.map((it, i) => ({ text: it.text, cat: it.cat, done: i < seg.cursor })),
          cursor: seg.cursor,
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
