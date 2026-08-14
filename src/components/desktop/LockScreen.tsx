import { useEffect } from 'react';
import type { Career } from '@/store/gameStore';
import { positionName } from '@/data/positions';
import { playSound } from '@/store/sound';

/**
 * O MENU — a lock screen do devOS. A página carrega TRAVADA: o jogo não começa
 * sozinho, você senta e destrava a máquina.
 *
 * Diegético de propósito (POV de 1ª pessoa, DESIGN_SYSTEM): não é uma tela de
 * título por cima da ficção, é o próprio SO esperando. A senha já está salva —
 * o gesto é só o Enter, não um minigame de digitar.
 *
 * HUD sobre o quarto (`hud-night`), como a `Daily` e o `Boletim`: o dia inteiro
 * é a mesma simetria — começa longe da mesa, senta, e às 17:00 se afasta.
 */
export function LockScreen({
  day,
  career,
  clock,
  onUnlock,
}: {
  day: number;
  career: Career;
  clock: string;
  onUnlock: () => void;
}) {
  const enter = () => {
    playSound('select');
    onUnlock();
  };

  // Enter destrava. O handler do jogo já ignora tudo enquanto travado, então
  // aqui não há disputa por tecla.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        enter();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="hud-night absolute inset-0 z-30 overflow-y-auto bg-black/75 backdrop-blur-[5px]">
      <div className="mx-auto flex min-h-full w-full max-w-xs flex-col justify-center px-6 py-10">
        <div className="beat-in flex flex-col items-center">
          {/* avatar = o prompt do shell: a máquina é a personagem */}
          <div className="flex size-16 items-center justify-center rounded-full bg-surface-2 font-code text-lg text-pass">
            :~$
          </div>
          <p className="mt-3 font-code text-sm text-ink">desenvolvedor</p>

          {/* senha salva: os pontos já estão lá — o gesto é o Enter */}
          <button
            onClick={enter}
            className="mt-4 flex w-full items-center justify-between gap-3 rounded-md border border-line bg-surface px-3 py-2 text-left transition-colors hover:border-amber"
          >
            <span className="font-code text-xs tracking-[0.3em] text-ink-dim">••••••••</span>
            <span
              aria-hidden
              className="inline-block h-4 w-[2px] animate-pulse bg-amber motion-reduce:animate-none"
            />
          </button>

          <p className="mt-5 font-code text-[11px] uppercase tracking-[0.22em] text-ink-dim">
            dia {day} · {positionName(career.level)}
          </p>
          {(career.streak > 0 || career.careerTotal > 0) && (
            <p className="mt-1 font-code text-[11px] text-ink-dim tabular-nums">
              {career.streak > 0 && <>streak {career.streak}</>}
              {career.streak > 0 && career.careerTotal > 0 && ' · '}
              {career.careerTotal > 0 && <>nota {career.careerTotal.toLocaleString('pt-BR')}</>}
            </p>
          )}

          <p className="mt-6 flex items-center gap-2 font-code text-[11px] text-ink-dim">
            <kbd className="keycap !h-6 !min-w-6 !text-[10px]">⏎</kbd>
            entrar
          </p>
        </div>

        <p className="beat-in mt-10 text-center font-code text-[10px] uppercase tracking-[0.3em] text-ink-dim">
          devOS · {clock}
        </p>
      </div>
    </div>
  );
}
