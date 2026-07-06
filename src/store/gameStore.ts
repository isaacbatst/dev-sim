import { create } from 'zustand';
import { GameLoop } from '@/core/loop';
import { Game } from '@/core/game';
import type { ProgramId, Snapshot } from '@/core/snapshot';
import { levelFor } from '@/data/positions';
import { eligibleNodes, poolForUnlocked } from '@/data/taskTree';
import { playSound } from './sound';

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
  owned: [],
};

function loadCareer(): Career {
  if (typeof window === 'undefined') return { ...DEFAULT_CAREER };
  try {
    const raw = localStorage.getItem(CAREER_KEY);
    return raw ? { ...DEFAULT_CAREER, ...JSON.parse(raw) } : { ...DEFAULT_CAREER };
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
  /** Fadiga: avisa pausa aberta/fechada; ritual restaura; debug injeta minutos. */
  setResting: (v: boolean) => void;
  restoreFatigue: () => void;
  debugFatigue: (min: number) => void;
}

let loop: GameLoop | null = null;

export const useGameStore = create<GameState>((set, get) => {
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
    c.level = levelFor(c.careerTotal);
    saveCareer(c);
    set({
      career: c,
      dayResult: { nota: snapshot.score, gained, promotedTo: c.level > before ? c.level : null },
    });
  };

  const spawn = () => {
    loop?.stop();
    loop = new GameLoop(
      (snapshot) => {
        set({ snapshot });
        if (snapshot.status === 'won') closeDay(snapshot);
      },
      playSound,
      new Game(undefined, forcedTask(), daySeconds()),
    );
    loop.start();
  };

  return {
    snapshot: null,
    day: 1,
    career: { ...DEFAULT_CAREER },
    dayResult: null,

    start: () => {
      const career = loadCareer();
      // Streak: 1x por dia-real. Novo dia → bump (se consecutivo) ou reinicia.
      const today = todayStr();
      if (career.lastPlayedDate !== today) {
        career.streak = isConsecutive(career.lastPlayedDate, today) ? career.streak + 1 : 1;
        career.lastPlayedDate = today;
        if (!forcedTask()) saveCareer(career);
      }
      set({ day: loadDay(), career, dayResult: null });
      spawn();
      return () => {
        loop?.stop();
        loop = null;
      };
    },

    restart: () => {
      set({ dayResult: null });
      spawn();
    },
    /** Próximo expediente: avança o dia da campanha e reabre. */
    nextDay: () => {
      const next = get().day + 1;
      if (typeof window !== 'undefined') localStorage.setItem('devos-day', String(next));
      set({ day: next, dayResult: null });
      spawn();
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
    restoreFatigue: () => loop?.restoreFatigue(),
    debugFatigue: (min) => loop?.debugFatigue(min),
    buyCosmetic: (id, preco) => {
      const c = { ...get().career };
      if (c.owned.includes(id) || c.wallet < preco) return;
      c.wallet -= preco;
      c.owned = [...c.owned, id];
      saveCareer(c);
      set({ career: c });
    },
  };
});
