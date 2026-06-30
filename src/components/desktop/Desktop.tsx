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
  const { status, clock, delivered, expired, score, slots, active } = snapshot;
  const openCount = slots.filter(Boolean).length;
  // Objetivo do passo atual — só enquanto se trabalha num app (na aba Ticket o
  // plano completo já está visível). Mostrado fora da janela, acima do programa.
  const objective =
    active && !active.wrongApp && !active.ready && active.focused !== 'details'
      ? (active.plan.find((p) => p.status === 'current') ?? active.plan[0])
      : null;

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      <MenuBar clock={clock} delivered={delivered} expired={expired} score={score} />

      {/* Wallpaper: gradiente + grade técnica sutil + brilho do humor */}
      <main className="relative flex flex-1 gap-5 overflow-hidden p-5">
        <div aria-hidden className="absolute inset-0 -z-10" style={{ background: 'var(--wall)' }} />
        {/* Grão sutil no lugar da grade técnica — textura orgânica, anti-AI. */}
        <div
          aria-hidden
          className="bg-noise pointer-events-none absolute inset-0 -z-10 opacity-[0.05] mix-blend-soft-light"
        />

        <InboxPanel slots={slots} onSelect={onSelect} />

        <section className="flex min-w-0 flex-1 items-center justify-center pb-16">
          {active ? (
            <div className="relative w-full max-w-[44rem]">
              {/* Objetivo do passo: banner FORA da janela (na área do OS, acima do
                  programa) enquanto se trabalha num app — não no chrome nem no backlog. */}
              {objective && (
                <div className="elev-1 mb-2 flex items-center gap-2 rounded-lg border border-edge bg-surface/85 px-4 py-2 backdrop-blur-sm">
                  <span aria-hidden className="text-amber">
                    ▸
                  </span>
                  <p className="truncate text-sm text-ink">
                    {active.taskCount > 1 && (
                      <span className="text-ink-dim">{objective.title}: </span>
                    )}
                    {objective.prose}
                  </p>
                </div>
              )}
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
            <div className="flex max-w-md flex-col items-center gap-5 px-6 text-center">
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
