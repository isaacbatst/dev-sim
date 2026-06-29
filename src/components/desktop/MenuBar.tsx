import { SoundToggle } from './SoundToggle';
import { ThemeControl } from './ThemeControl';

/** Barra de menu do "devOS": identidade, relógio do expediente e entregas. */
export function MenuBar({ clock, delivered }: { clock: string; delivered: number }) {
  return (
    <header className="flex items-center gap-4 border-b border-edge bg-surface/80 px-4 py-2 text-sm backdrop-blur">
      <span className="font-grotesk font-bold tracking-tight text-ink">devOS</span>
      <nav className="hidden gap-4 text-ink-dim sm:flex">
        <span>Arquivo</span>
        <span>Editar</span>
        <span>Ver</span>
      </nav>

      <div className="ml-auto flex items-center gap-3">
        <ThemeControl />
        <SoundToggle />
        <span className="font-mono tabular-nums text-ink">{clock}</span>
        <span className="font-mono text-ink-dim">
          ✓ <span className="text-ink">{delivered}</span>
        </span>
      </div>
    </header>
  );
}
