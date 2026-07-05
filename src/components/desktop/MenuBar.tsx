import type { FatigueStage } from '@/core/snapshot';
import { SoundToggle } from './SoundToggle';
import { ThemeControl } from './ThemeControl';

/** Barra de menu do "devOS": identidade, relógio, nota do dia e entregas/perdas. */
export function MenuBar({
  clock,
  day,
  position,
  delivered,
  expired,
  score,
  fatigue,
}: {
  clock: string;
  day: number;
  position: string;
  delivered: number;
  expired: number;
  score: number;
  fatigue: FatigueStage;
}) {
  return (
    <header className="flex items-center gap-4 border-b border-edge bg-surface/80 px-4 py-2 text-sm backdrop-blur">
      <span className="font-grotesk font-bold tracking-tight text-ink">devOS</span>
      <span className="font-mono text-xs text-ink-dim">
        Dia {day} · <span className="text-amber">{position}</span>
      </span>
      <nav className="hidden gap-4 text-ink-dim sm:flex">
        <span>Arquivo</span>
        <span>Editar</span>
        <span>Ver</span>
      </nav>

      <div className="ml-auto flex items-center gap-3">
        {/* Fadiga (descoberta): cansado → o hint acende em âmbar; exausto →
            pulsa. Âmbar = "a ação de agora" — e agora a ação é pausar. */}
        <span
          className={`hidden items-center gap-1.5 font-mono text-[10px] md:flex ${
            fatigue === 'exhausted'
              ? 'animate-edgepulse text-amber'
              : fatigue === 'tired'
                ? 'text-amber'
                : 'text-ink-dim'
          }`}
        >
          <kbd
            className={`keycap !h-5 !min-w-5 !text-[10px] ${fatigue !== 'fresh' ? 'keycap--current' : ''}`}
          >
            -
          </kbd>{' '}
          pausa
        </span>
        <ThemeControl />
        <SoundToggle />
        <span className="font-mono tabular-nums text-ink">{clock}</span>
        {/* Nota do dia (moeda única) + entregues e perdidas. */}
        <span className="font-mono text-ink-dim">
          nota <span className="font-semibold text-amber tabular-nums">{score}</span>
        </span>
        <span className="font-mono text-ink-dim">
          ✓ <span className="text-ink tabular-nums">{delivered}</span>
        </span>
        {expired > 0 && (
          <span className="font-mono text-fail tabular-nums" title="demandas expiradas">
            ✕ {expired}
          </span>
        )}
      </div>
    </header>
  );
}
