import { create } from 'zustand';
import { GameLoop } from '@/core/loop';
import type { Snapshot } from '@/core/snapshot';

/**
 * Bridge entre o `core` (loop em RAF) e a UI React. Substitui o EventBus do Godot.
 *
 * O loop é dono da lógica; a store só guarda o último snapshot e expõe as
 * intenções de input. A UI lê o snapshot de forma reativa e despacha intenções.
 */
interface GameState {
  snapshot: Snapshot | null;
  start: () => () => void;
  restart: () => void;
  selectSlot: (index: number) => void;
  keyDown: (key: string) => void;
  keyUp: (key: string) => void;
  deliver: () => void;
}

let loop: GameLoop | null = null;

export const useGameStore = create<GameState>((set) => {
  const spawn = () => {
    loop?.stop();
    loop = new GameLoop((snapshot) => set({ snapshot }));
    loop.start();
  };

  return {
    snapshot: null,

    /** Inicia o loop e devolve uma função de cleanup (para o useEffect). */
    start: () => {
      spawn();
      return () => {
        loop?.stop();
        loop = null;
      };
    },

    restart: () => spawn(),
    selectSlot: (index) => loop?.selectSlot(index),
    keyDown: (key) => loop?.keyDown(key),
    keyUp: (key) => loop?.keyUp(key),
    deliver: () => loop?.deliver(),
  };
});
