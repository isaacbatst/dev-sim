import type { Snapshot } from '@/core/snapshot';
import { moodFor } from './mood';
import { MenuBar } from './MenuBar';
import { InboxPanel } from './InboxPanel';
import { AppWindow } from './AppWindow';
import { Dock } from './Dock';

/** A área de trabalho inteira. Apresentação pura — sem lógica de jogo. */
export function Desktop({
  snapshot,
  shake,
  floatScore,
  view,
  onView,
  onSelect,
  onRestart,
}: {
  snapshot: Snapshot;
  shake: boolean;
  floatScore: string | null;
  view: 'work' | 'details';
  onView: (v: 'work' | 'details') => void;
  onSelect: (index: number) => void;
  onRestart: () => void;
}) {
  const { status, clock, satisfaction, delivered, slots, active } = snapshot;
  const mood = moodFor(satisfaction);

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      <MenuBar mood={mood} satisfaction={satisfaction} clock={clock} delivered={delivered} />

      {/* Wallpaper: gradiente + grade técnica sutil + brilho do humor */}
      <main className="relative flex flex-1 gap-5 overflow-hidden p-5">
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(140% 90% at 50% -20%, color-mix(in srgb, var(--amber) 7%, transparent), transparent 55%), linear-gradient(180deg, #0f1118, #181b27)',
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(var(--ink) 1px, transparent 1px), linear-gradient(90deg, var(--ink) 1px, transparent 1px)',
            backgroundSize: '34px 34px',
          }}
        />

        <InboxPanel slots={slots} onSelect={onSelect} />

        <section className="flex min-w-0 flex-1 items-center justify-center pb-16">
          {active ? (
            <div className="relative w-full max-w-[44rem]">
              <AppWindow active={active} shake={shake} view={view} onView={onView} />
              {floatScore && (
                <span className="animate-floatup pointer-events-none absolute -top-3 left-1/2 -translate-x-1/2 font-mono text-lg font-bold text-pass">
                  {floatScore}
                </span>
              )}
            </div>
          ) : (
            <div className="max-w-sm rounded-lg border border-line bg-surface/80 p-6 text-center shadow-xl">
              <p className="font-grotesk text-lg font-semibold text-ink">09:00 — bom dia ☕</p>
              <p className="mt-2 text-sm text-ink-dim">
                As demandas do dia estão no backlog à esquerda. Abra uma com as teclas{' '}
                <KeyHintInline /> e sobreviva até as 17:00.
              </p>
            </div>
          )}
        </section>

        {/* Vinheta de humor (assinatura) */}
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-0 ${mood.vignette.pulse ? 'animate-edgepulse' : ''}`}
          style={{
            boxShadow: `inset 0 0 160px 30px color-mix(in srgb, ${mood.vignette.color} ${Math.round(
              mood.vignette.opacity * 100,
            )}%, transparent)`,
            transition: 'box-shadow 0.4s ease',
          }}
        />

        <Dock activeApp={active?.app ?? null} />
      </main>

      {status !== 'playing' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-black/85 backdrop-blur-sm">
          <span className="text-5xl">{status === 'won' ? '🎉' : '💀'}</span>
          <h2 className="px-6 text-center font-grotesk text-2xl font-bold">
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

function KeyHintInline() {
  return (
    <span className="inline-flex items-center gap-0.5 align-middle">
      <kbd className="keycap !h-5 !min-w-5 !text-[10px]">1</kbd>–
      <kbd className="keycap !h-5 !min-w-5 !text-[10px]">5</kbd>
    </span>
  );
}
