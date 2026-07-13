import { create } from 'zustand';
import { GameLoop } from '@/core/loop';
import { Game } from '@/core/game';
import type { ProgramId, Snapshot } from '@/core/snapshot';
import { levelFor } from '@/data/positions';
import { eligibleNodes, poolForUnlocked } from '@/data/taskTree';
import { playSound } from './sound';
import { track } from './analytics';

/**
 * Teste: força um ticket no 1º slot. Por env (`NEXT_PUBLIC_FORCE_TASK=fix_typo
 * npm run dev`) ou query (`?force=fix_typo`, sem reiniciar).
 */
function forcedTask(): string | undefined {
  const fromUrl =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('force') : null;
  return fromUrl || process.env.NEXT_PUBLIC_FORCE_TASK || undefined;
}

/** Teste: estende a duração do dia (segundos) via `?day=600`. Default = 220. */
function daySeconds(): number | undefined {
  if (typeof window === 'undefined') return undefined;
  const v = Number(new URLSearchParams(window.location.search).get('day'));
  return Number.isFinite(v) && v > 0 ? v : undefined;
}

function loadDay(): number {
  if (typeof window === 'undefined') return 1;
  return Number(localStorage.getItem('devos-day')) || 1;
}

/** Estado persistente da carreira (PROGRESSAO.md §8). */
export interface Career {
  level: number;
  /** Nota acumulada — combustível da promoção. */
  careerTotal: number;
  /** Carteira de `$` (gasto em cosméticos — Parte 2). */
  wallet: number;
  streak: number;
  /** Última data-real jogada (YYYY-MM-DD local) — base do streak. */
  lastPlayedDate: string;
  /** Cosméticos comprados (Parte 2). */
  owned: string[];
  /** Árvore de tasks (§3): nós destravados — o trilho RÁPIDO. */
  unlockedTasks: string[];
  /** Dia da campanha em que a última escolha foi feita (1 escolha/dia). */
  lastPickDay: number;
}

/** Resultado de um dia (pro boletim): nota, ganho e se promoveu. */
export interface DayResult {
  nota: number;
  gained: number;
  promotedTo: number | null;
}

const CAREER_KEY = 'devos-career';
const DEFAULT_CAREER: Career = {
  level: 1,
  careerTotal: 0,
  wallet: 0,
  streak: 0,
  lastPlayedDate: '',
  // TESTE: planta+café+teclado de fábrica pra provar os rituais da pausa —
  // reverter pra [] antes de qualquer release (cosmético é conquista da loja).
  owned: ['planta', 'cafe', 'teclado'],
  unlockedTasks: [],
  lastPickDay: 0,
};

function loadCareer(): Career {
  if (typeof window === 'undefined') return { ...DEFAULT_CAREER };
  try {
    const raw = localStorage.getItem(CAREER_KEY);
    const c: Career = raw ? { ...DEFAULT_CAREER, ...JSON.parse(raw) } : { ...DEFAULT_CAREER };
    // TESTE (ver DEFAULT_CAREER): garante os itens de fábrica em saves antigos.
    c.owned = [...new Set([...DEFAULT_CAREER.owned, ...c.owned])];
    return c;
  } catch {
    return { ...DEFAULT_CAREER };
  }
}

function saveCareer(c: Career): void {
  if (typeof window !== 'undefined') localStorage.setItem(CAREER_KEY, JSON.stringify(c));
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** `prev` é o dia-real imediatamente anterior a `today`? (streak consecutivo) */
function isConsecutive(prev: string, today: string): boolean {
  if (!prev) return false;
  const p = new Date(prev + 'T00:00:00');
  const t = new Date(today + 'T00:00:00');
  return t.getTime() - p.getTime() === 86400000;
}

interface GameState {
  snapshot: Snapshot | null;
  /** Dia da campanha (1, 2, …). */
  day: number;
  career: Career;
  /** Resultado do dia atual (setado quando o expediente fecha). */
  dayResult: DayResult | null;
  /** DAILY (PROGRESSAO §3): a standup abre o dia — o relógio só anda depois
   *  da escolha do tipo de task. */
  dailyOpen: boolean;
  /** Fecha a daily e começa o expediente (o relógio passa a andar). */
  beginDay: () => void;
  start: () => () => void;
  restart: () => void;
  nextDay: () => void;
  selectSlot: (index: number) => void;
  keyDown: (key: string) => void;
  keyUp: (key: string) => void;
  confirm: () => void;
  deliver: () => void;
  focusProgram: (id: ProgramId) => void;
  cycleFocus: (dir?: 1 | -1) => void;
  quickOpen: () => void;
  /** Compra um cosmético: desconta `$` e adiciona a `owned` (persiste). */
  buyCosmetic: (id: string, preco: number) => void;
  /** Árvore de tasks: destrava um nó elegível (1 escolha por dia, no boletim). */
  pickTask: (id: string) => void;
  /** Fadiga: avisa pausa aberta/fechada; ritual restaura; debug injeta minutos. */
  setResting: (v: boolean) => void;
  restoreFatigue: () => void;
  debugFatigue: (min: number) => void;
  /** Debug: força um lapso perceptual (piscada/desfoque). */
  debugLapse: (kind: 'blink' | 'defocus') => void;
}

let loop: GameLoop | null = null;

/**
 * Dias-de-jogo já iniciados NESTA sessão (carregamento). É o sinal de "maratona"
 * — o mais barato que temos pra saber se o loop puxa "mais um dia" (EXPEDIENTE §6).
 * Por isso a limitação-por-dia NÃO entra antes de medir: ela suprimiria justo isto.
 */
let daysThisSession = 0;
/** O `day_abandon` sai no máximo uma vez por dia (pagehide pode disparar mais de uma). */
let abandonSent = false;

export const useGameStore = create<GameState>((set, get) => {
  /** Props comuns a todo evento de dia — a base de corte das análises. */
  const base = () => {
    const { day, career } = get();
    return {
      day,
      level: career.level,
      streak: career.streak,
      unlocked: career.unlockedTasks.length,
    };
  };

  /** Fecha o expediente: acumula nota→carreira/$, promove, resolve streak. Uma vez. */
  const closeDay = (snapshot: Snapshot) => {
    if (get().dayResult) return; // já fechado
    // Modo de teste (?force=) não mexe na carreira real.
    if (forcedTask()) {
      set({ dayResult: { nota: snapshot.score, gained: 0, promotedTo: null } });
      return;
    }
    const c = { ...get().career };
    const before = c.level;
    const gained = Math.max(0, snapshot.score); // dia ruim não retrocede (§6)
    c.careerTotal += gained;
    c.wallet += gained;
    // Nunca rebaixa (posição não cai — §1); protege saves de limiares antigos.
    c.level = Math.max(c.level, levelFor(c.careerTotal));
    saveCareer(c);
    set({
      career: c,
      dayResult: { nota: snapshot.score, gained, promotedTo: c.level > before ? c.level : null },
    });

    abandonSent = true; // terminou: não é abandono
    track('day_complete', {
      ...base(),
      nota: snapshot.score,
      gained,
      delivered: snapshot.delivered,
      expired: snapshot.expired,
    });
    if (c.level > before) track('promo', { ...base(), from: before, to: c.level });
  };

  /** O relógio começou a andar — o dia de fato começou (pós-daily, se houver). */
  const emitDayStart = () => {
    if (forcedTask()) return; // modo de teste não polui os dados
    daysThisSession += 1;
    abandonSent = false;
    track('day_start', { ...base(), day_in_session: daysThisSession });
  };

  /** A daily acontece quando ainda não se escolheu hoje e há nós elegíveis.
   *  `?force=` pula (modo de teste); árvore completa → dia começa direto. */
  const dailyNeeded = (career: Career, day: number): boolean =>
    !forcedTask() && career.lastPickDay < day && eligibleNodes(career.unlockedTasks).length > 0;

  const spawn = (paused = false) => {
    loop?.stop();
    // Pool do jogador = conjunto inicial + nós destravados na árvore (§3).
    const pool = poolForUnlocked(get().career.unlockedTasks);
    loop = new GameLoop(
      (snapshot) => {
        set({ snapshot });
        if (snapshot.status === 'won') closeDay(snapshot);
      },
      playSound,
      new Game(pool, forcedTask(), daySeconds()),
    );
    // Na daily o mundo espera: publica o snapshot mas o relógio não anda.
    if (paused) loop.publish();
    else {
      loop.start();
      emitDayStart(); // sem daily → o dia já começa aqui
    }
  };

  return {
    snapshot: null,
    day: 1,
    career: { ...DEFAULT_CAREER },
    dayResult: null,
    dailyOpen: false,

    start: () => {
      const career = loadCareer();
      // Streak: 1x por dia-real. Novo dia → bump (se consecutivo) ou reinicia.
      const today = todayStr();
      if (career.lastPlayedDate !== today) {
        career.streak = isConsecutive(career.lastPlayedDate, today) ? career.streak + 1 : 1;
        career.lastPlayedDate = today;
        if (!forcedTask()) saveCareer(career);
      }
      const day = loadDay();
      const daily = dailyNeeded(career, day);
      set({ day, career, dayResult: null, dailyOpen: daily });

      daysThisSession = 0;
      if (!forcedTask())
        track('session_start', { day, level: career.level, streak: career.streak });

      spawn(daily);

      // Abandono: onde a pessoa desistiu. O funil day_start→day_complete já dá a
      // TAXA; este evento dá o PONTO (o relógio em que largou). `pagehide` cobre
      // fechar a aba e navegar pra fora (o `beforeunload` é menos confiável).
      const onLeave = () => {
        const s = get().snapshot;
        if (abandonSent || forcedTask() || !s || s.status !== 'playing') return;
        abandonSent = true;
        track('day_abandon', {
          ...base(),
          clock: s.clock,
          delivered: s.delivered,
          expired: s.expired,
          nota: s.score,
          na_daily: get().dailyOpen, // largou antes mesmo de começar?
        });
      };
      if (typeof window !== 'undefined') window.addEventListener('pagehide', onLeave);

      return () => {
        if (typeof window !== 'undefined') window.removeEventListener('pagehide', onLeave);
        loop?.stop();
        loop = null;
      };
    },

    restart: () => {
      const daily = dailyNeeded(get().career, get().day);
      set({ dayResult: null, dailyOpen: daily });
      spawn(daily);
    },
    /** Próximo expediente: avança o dia da campanha e reabre (com daily). */
    nextDay: () => {
      const next = get().day + 1;
      if (typeof window !== 'undefined') localStorage.setItem('devos-day', String(next));
      const daily = dailyNeeded(get().career, next);
      set({ day: next, dayResult: null, dailyOpen: daily });
      spawn(daily);
    },
    beginDay: () => {
      if (!get().dailyOpen) return;
      set({ dailyOpen: false });
      loop?.start();
      emitDayStart(); // a daily fechou → o relógio anda, o dia começou
    },
    selectSlot: (index) => loop?.selectSlot(index),
    keyDown: (key) => loop?.keyDown(key),
    keyUp: (key) => loop?.keyUp(key),
    confirm: () => loop?.confirm(),
    deliver: () => loop?.deliver(),
    focusProgram: (id) => loop?.focusProgram(id),
    cycleFocus: (dir) => loop?.cycleFocus(dir),
    quickOpen: () => loop?.quickOpen(),
    setResting: (v) => loop?.setResting(v),
    restoreFatigue: () => {
      loop?.restoreFatigue();
      if (!forcedTask()) {
        const s = get().snapshot;
        track('pausa_usada', { ...base(), clock: s?.clock });
      }
    },
    debugFatigue: (min) => loop?.debugFatigue(min),
    debugLapse: (kind) => loop?.debugLapse(kind),
    buyCosmetic: (id, preco) => {
      const c = { ...get().career };
      if (c.owned.includes(id) || c.wallet < preco) return;
      c.wallet -= preco;
      c.owned = [...c.owned, id];
      saveCareer(c);
      set({ career: c });
    },
    pickTask: (id) => {
      const { career, day } = get();
      if (career.lastPickDay >= day) return; // já escolheu hoje
      if (!eligibleNodes(career.unlockedTasks).some((n) => n.id === id)) return;
      const c = { ...career, unlockedTasks: [...career.unlockedTasks, id], lastPickDay: day };
      saveCareer(c);
      set({ career: c });
      // Concentra num ramo ou espalha? Responde de graça se a especialização
      // (a premissa da árvore de perks) é um desejo real — ver PROGRESSAO §3.
      if (!forcedTask())
        track('pick_ramo', { ...base(), node: id, unlocked: c.unlockedTasks.length });
    },
  };
});
