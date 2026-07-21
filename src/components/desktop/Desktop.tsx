import type { Snapshot } from '@/core/snapshot';
import type { Career } from '@/store/gameStore';
import { positionName } from '@/data/positions';
import { MenuBar } from './MenuBar';
import { InboxPanel } from './InboxPanel';
import { AppWindow } from './AppWindow';
import { Comanda } from './Comanda';

/** A área de trabalho inteira. Apresentação pura — sem lógica de jogo.
 *  O boletim de fim de dia NÃO mora aqui: é HUD (Boletim.tsx), fora do monitor. */
export function Desktop({
  snapshot,
  day,
  career,
  shake,
  floatScore,
  onFocusProgram,
  onSelect,
  onEndShift,
}: {
  snapshot: Snapshot;
  day: number;
  career: Career;
  shake: boolean;
  floatScore: string | null;
  onFocusProgram: (id: import('@/core/snapshot').ProgramId) => void;
  onSelect: (index: number) => void;
  onEndShift: () => void;
}) {
  const { clock, delivered, expired, score, slots, active } = snapshot;
  const openCount = slots.filter(Boolean).length;

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* Wallpaper na TELA INTEIRA do monitor (inclusive a faixa da comanda):
          gradiente + grão sutil (textura orgânica, anti-AI). */}
      <div aria-hidden className="absolute inset-0 -z-10" style={{ background: 'var(--wall)' }} />
      <div
        aria-hidden
        className="bg-noise pointer-events-none absolute inset-0 -z-10 opacity-[0.05] mix-blend-soft-light"
      />

      <MenuBar
        clock={clock}
        day={day}
        position={positionName(career.level)}
        delivered={delivered}
        expired={expired}
        score={score}
        fatigue={snapshot.fatigue.stage}
        overtime={snapshot.overtime}
        onEndShift={onEndShift}
      />

      <main className="relative flex flex-1 gap-5 overflow-hidden p-5">
        <InboxPanel slots={slots} onSelect={onSelect} />

        <section className="flex min-w-0 flex-1 items-start justify-center">
          {active ? (
            <div className="relative flex max-h-full w-full max-w-[44rem] flex-col">
              <AppWindow
                active={active}
                slots={slots}
                shake={shake}
                onFocusProgram={onFocusProgram}
              />
              {floatScore && (
                <span className="animate-floatup pointer-events-none absolute -top-3 left-1/2 -translate-x-1/2 font-mono text-lg font-bold text-pass">
                  {floatScore}
                </span>
              )}
            </div>
          ) : (
            // Estado vazio diegético: prompt do devOS — sem caixa, faz parte da
            // área de trabalho (não um card de página web).
            <div className="m-auto flex max-w-md flex-col items-center gap-5 px-6 text-center">
              <p className="font-code text-base">
                <span className="text-pass">desenvolvedor@devOS</span>
                <span className="text-ink-dim">:</span>
                <span className="text-sky-400">~</span>
                <span className="text-ink-dim">$</span>
                <span className="animate-edgepulse ml-1 inline-block h-[1.05em] w-[0.55em] translate-y-[0.15em] bg-ink/80" />
              </p>
              <p className="text-sm text-ink-dim">
                {openCount} no backlog à esquerda — abra com <KeyHintInline /> e entregue até as
                17:00.
              </p>
            </div>
          )}
        </section>
      </main>

      {/* Comanda: barra full-width na base do monitor, SEMPRE presente (altura
          reservada → backlog/janela não dão resize quando a demanda abre/fecha). */}
      <Comanda active={active} />
    </div>
  );
}

function KeyHintInline() {
  return (
    <span className="inline-flex items-center gap-0.5 align-middle">
      <kbd className="keycap !h-5 !min-w-5 !text-[10px]">1</kbd>–
      <kbd className="keycap !h-5 !min-w-5 !text-[10px]">5</kbd>
    </span>
  );
}
