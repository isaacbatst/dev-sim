import type { Snapshot } from '@/core/snapshot';
import { MenuBar } from './MenuBar';
import { InboxPanel } from './InboxPanel';
import { AppWindow } from './AppWindow';
import { Dock } from './Dock';

/** A área de trabalho inteira. Apresentação pura — sem lógica de jogo. */
export function Desktop({
  snapshot,
  shake,
  floatScore,
  onFocusProgram,
  onSelect,
  onRestart,
}: {
  snapshot: Snapshot;
  shake: boolean;
  floatScore: string | null;
  onFocusProgram: (id: import('@/core/snapshot').ProgramId) => void;
  onSelect: (index: number) => void;
  onRestart: () => void;
}) {
  const { status, clock, delivered, slots, active } = snapshot;

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      <MenuBar clock={clock} delivered={delivered} />

      {/* Wallpaper: gradiente + grade técnica sutil + brilho do humor */}
      <main className="relative flex flex-1 gap-5 overflow-hidden p-5">
        <div aria-hidden className="absolute inset-0 -z-10" style={{ background: 'var(--wall)' }} />
        {/* Grão sutil no lugar da grade técnica — textura orgânica, anti-AI. */}
        <div
          aria-hidden
          className="bg-noise pointer-events-none absolute inset-0 -z-10 opacity-[0.05] mix-blend-soft-light"
        />

        <InboxPanel slots={slots} active={active} onSelect={onSelect} />

        <section className="flex min-w-0 flex-1 items-center justify-center pb-16">
          {active ? (
            <div className="relative w-full max-w-[44rem]">
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
            <div className="elev-2 max-w-sm rounded-lg border border-edge bg-surface p-6 text-center">
              <p className="font-grotesk text-lg font-semibold text-ink">09:00 — bom dia ☕</p>
              <p className="mt-2 text-sm text-ink-dim">
                As demandas do dia estão no backlog à esquerda. Abra uma com as teclas{' '}
                <KeyHintInline /> e entregue o máximo até as 17:00.
              </p>
            </div>
          )}
        </section>

        <Dock
          open={active?.openPrograms ?? []}
          focused={active && active.focused !== 'details' ? active.focused : null}
        />
      </main>

      {status !== 'playing' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-black/85 backdrop-blur-sm">
          <span className="text-5xl">{status === 'won' ? '🎉' : '💀'}</span>
          <h2 className="px-6 text-center font-grotesk text-2xl font-bold">
            {status === 'won' ? '17:00 — fim do expediente' : 'Game over'}
          </h2>
          <p className="font-mono text-ink-dim">demandas entregues: {delivered}</p>
          <button
            onClick={onRestart}
            className="rounded-lg border border-amber px-5 py-2 font-grotesk font-semibold text-amber transition-colors hover:bg-amber/10"
          >
            Recomeçar o dia
          </button>
        </div>
      )}
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
