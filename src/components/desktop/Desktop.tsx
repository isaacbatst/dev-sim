import type { Snapshot } from '@/core/snapshot';
import { moodFor } from './mood';
import { MenuBar } from './MenuBar';
import { InboxPanel } from './InboxPanel';
import { AppWindow } from './AppWindow';

/** A área de trabalho inteira. Apresentação pura — sem lógica de jogo. */
export function Desktop({
  snapshot,
  shake,
  floatScore,
  onSelect,
  onRestart,
}: {
  snapshot: Snapshot;
  shake: boolean;
  floatScore: string | null;
  onSelect: (index: number) => void;
  onRestart: () => void;
}) {
  const { status, clock, satisfaction, delivered, slots, active } = snapshot;
  const mood = moodFor(satisfaction);

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden">
      <MenuBar mood={mood} satisfaction={satisfaction} clock={clock} delivered={delivered} />

      {/* Wallpaper */}
      <main
        className="relative flex flex-1 gap-4 p-4"
        style={{
          background:
            'radial-gradient(120% 80% at 50% -10%, color-mix(in srgb, var(--amber) 6%, transparent), transparent 60%), var(--bg)',
        }}
      >
        <InboxPanel slots={slots} onSelect={onSelect} />

        <section className="flex flex-1 items-center justify-center">
          {active ? (
            <div className="relative">
              <AppWindow active={active} shake={shake} />
              {floatScore && (
                <span className="animate-floatup pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 font-mono text-lg font-bold text-pass">
                  {floatScore}
                </span>
              )}
            </div>
          ) : (
            <div className="max-w-xs -rotate-2 rounded-md border border-amber/40 bg-amber/10 px-5 py-4 text-center text-sm text-ink shadow-lg">
              <p className="font-grotesk font-semibold">Bom dia. 🌅</p>
              <p className="mt-1 text-ink-dim">
                Escolha uma demanda na inbox — teclas{' '}
                <kbd className="keycap !h-6 !min-w-6 !text-xs">1</kbd>–
                <kbd className="keycap !h-6 !min-w-6 !text-xs">5</kbd>
              </p>
            </div>
          )}
        </section>

        {/* Vinheta de humor (assinatura) */}
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-0 ${mood.vignette.pulse ? 'animate-edgepulse' : ''}`}
          style={{
            boxShadow: `inset 0 0 140px 24px color-mix(in srgb, ${mood.vignette.color} ${Math.round(
              mood.vignette.opacity * 100,
            )}%, transparent)`,
            transition: 'box-shadow 0.4s ease',
          }}
        />
      </main>

      <footer className="border-t border-line bg-surface/60 px-4 py-2 text-center text-xs text-ink-dim">
        <kbd className="keycap !h-6 !min-w-6 !text-xs">1–5</kbd> selecionar ·{' '}
        <span className="text-ink">teclas/setas</span> executar ·{' '}
        <kbd className="keycap !h-6 !min-w-6 !text-xs">⏎</kbd> entregar
      </footer>

      {status !== 'playing' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-black/85 backdrop-blur-sm">
          <span className="text-5xl">{status === 'won' ? '🎉' : '💀'}</span>
          <h2 className="font-grotesk text-2xl font-bold">
            {status === 'won'
              ? '17:00 — você sobreviveu ao expediente'
              : 'Game over — o chefe desistiu de você'}
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
