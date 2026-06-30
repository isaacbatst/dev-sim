import { create } from 'zustand';
import { GameLoop } from '@/core/loop';
import { Game } from '@/core/game';
import type { ProgramId, Snapshot } from '@/core/snapshot';
import { playSound } from './sound';

/**
 * Teste: força um ticket no 1º slot. Por env (`NEXT_PUBLIC_FORCE_TASK=fix_typo
 * npm run dev`) ou query (`?force=fix_typo`, sem reiniciar). Ids: das tasks
 * (fix_typo, ui_update, study, meeting, test_feature, slack, email, document) ou
 * dos multis (fix_login_bug, new_ui_feature, refactor_module, deploy_hotfix).
 */
function forcedTask(): string | undefined {
  const fromUrl =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('force') : null;
  return fromUrl || process.env.NEXT_PUBLIC_FORCE_TASK || undefined;
}

/** Teste: estende a duração do dia (segundos) via `?day=600`. Default = 180. */
function daySeconds(): number | undefined {
  if (typeof window === 'undefined') return undefined;
  const v = Number(new URLSearchParams(window.location.search).get('day'));
  return Number.isFinite(v) && v > 0 ? v : undefined;
}

/**
 * Bridge entre o `core` (loop em RAF) e a UI React. Substitui o EventBus do Godot.
 *
 * O loop é dono da lógica; a store só guarda o último snapshot e expõe as
 * intenções de input. A UI lê o snapshot de forma reativa e despacha intenções.
 */
/** Dia atual da campanha (persistido em localStorage — "em que dia você está"). */
function loadDay(): number {
  if (typeof window === 'undefined') return 1;
  return Number(localStorage.getItem('devos-day')) || 1;
}

interface GameState {
  snapshot: Snapshot | null;
  /** Dia da campanha (1, 2, …) — a espinha da carreira (§2). */
  day: number;
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
}

let loop: GameLoop | null = null;

export const useGameStore = create<GameState>((set, get) => {
  const spawn = () => {
    loop?.stop();
    loop = new GameLoop(
      (snapshot) => set({ snapshot }),
      playSound,
      new Game(undefined, forcedTask(), daySeconds()),
    );
    loop.start();
  };

  return {
    snapshot: null,
    day: 1,

    /** Inicia o loop e devolve uma função de cleanup (para o useEffect). */
    start: () => {
      set({ day: loadDay() });
      spawn();
      return () => {
        loop?.stop();
        loop = null;
      };
    },

    restart: () => spawn(),
    /** Fim de dia → próximo: avança a carreira (persiste) e abre um novo expediente. */
    nextDay: () => {
      const next = get().day + 1;
      if (typeof window !== 'undefined') localStorage.setItem('devos-day', String(next));
      set({ day: next });
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
  };
});
