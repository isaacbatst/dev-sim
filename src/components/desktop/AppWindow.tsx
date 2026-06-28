import type { ActiveTicketSnapshot, Priority } from '@/core/snapshot';
import { APPS } from './apps';
import { Segments } from './Segments';

const PRIORITY_LABEL: Record<Priority, string> = {
  urgente: 'URGENTE',
  alta: 'ALTA',
  normal: 'NORMAL',
  baixa: 'BAIXA',
};

const PRIORITY_CLASS: Record<Priority, string> = {
  urgente: 'text-fail border-fail',
  alta: 'text-amber border-amber',
  normal: 'text-teal border-teal',
  baixa: 'text-ink-dim border-line',
};

/** Janela do app aberto pela demanda ativa. `shake` dispara o tremor de erro. */
export function AppWindow({ active, shake }: { active: ActiveTicketSnapshot; shake: boolean }) {
  const app = APPS[active.app];

  return (
    <div
      // key força a animação de abertura ao trocar de app/demanda
      key={active.windowTitle}
      className={`animate-windowin flex w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-2xl shadow-black/50 ${
        shake ? 'animate-shake' : ''
      }`}
      style={{ ['--accent' as string]: app.accent }}
    >
      {/* Barra de título */}
      <div className="flex items-center gap-3 border-b border-line bg-surface-2 px-4 py-2.5">
        <div className="flex gap-2">
          <span className="size-3 rounded-full bg-fail" />
          <span className="size-3 rounded-full bg-amber" />
          <span className="size-3 rounded-full bg-pass" />
        </div>
        <span className="text-base">{app.icon}</span>
        <span className="truncate font-mono text-sm text-ink">{active.windowTitle}</span>
        <span
          className={`ml-auto rounded border px-1.5 py-0.5 text-[10px] font-semibold ${PRIORITY_CLASS[active.priority]}`}
        >
          {PRIORITY_LABEL[active.priority]}
        </span>
      </div>

      {app.context(active.taskTitle)}

      {/* Corpo: a interação */}
      <div className="flex min-h-56 flex-col gap-4 p-6">
        <div>
          <h2 className="font-grotesk text-lg font-semibold text-ink">{active.name}</h2>
          <p className="text-sm text-ink-dim">{active.description}</p>
        </div>

        {active.taskCount > 1 && (
          <p className="text-xs text-ink-dim">
            {active.taskTitle} · subtarefa {active.taskIndex + 1}/{active.taskCount}
          </p>
        )}

        <div className="mt-2">
          {active.ready ? (
            <p className="animate-edgepulse text-pass">
              ✓ Tudo pronto — pressione <kbd className="keycap keycap--current">⏎</kbd> para
              entregar
            </p>
          ) : (
            <Segments segments={active.segments} />
          )}
        </div>
      </div>
    </div>
  );
}
