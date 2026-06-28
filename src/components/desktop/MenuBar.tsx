import type { Mood } from './mood';

/** Barra de menu do "devOS": identidade, humor do chefe (satisfação), relógio e entregas. */
export function MenuBar({
  mood,
  satisfaction,
  clock,
  delivered,
}: {
  mood: Mood;
  satisfaction: number;
  clock: string;
  delivered: number;
}) {
  return (
    <header className="flex items-center gap-4 border-b border-line bg-surface/80 px-4 py-2 text-sm backdrop-blur">
      <span className="font-grotesk font-bold tracking-tight text-ink">devOS</span>
      <nav className="hidden gap-4 text-ink-dim sm:flex">
        <span>Arquivo</span>
        <span>Editar</span>
        <span>Ver</span>
      </nav>

      <div className="ml-auto flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none" aria-hidden>
            {mood.face}
          </span>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-ink-dim">
              chefe · {mood.label}
            </span>
            <div className="h-1.5 w-28 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full transition-[width] duration-200"
                style={{ width: `${satisfaction}%`, background: mood.accent }}
              />
            </div>
          </div>
          <span className="w-9 text-right font-mono tabular-nums text-ink">{satisfaction}%</span>
        </div>

        <span className="font-mono tabular-nums text-ink">{clock}</span>
        <span className="font-mono text-ink-dim">
          ✓ <span className="text-ink">{delivered}</span>
        </span>
      </div>
    </header>
  );
}
