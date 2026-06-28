import type { ActiveTicketSnapshot, Priority } from '@/core/snapshot';
import { APPS } from './apps';
import { Scene } from './scenes';
import { KeyCap } from './primitives';

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

/** Janela do app aberto pela demanda ativa. Cada app renderiza sua própria cena. */
export function AppWindow({ active, shake }: { active: ActiveTicketSnapshot; shake: boolean }) {
  const app = APPS[active.app];

  return (
    <div
      key={active.app}
      className={`animate-windowin flex w-[36rem] max-w-full flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-2xl shadow-black/60 ${
        shake ? 'animate-shake' : ''
      }`}
    >
      {/* Barra de título */}
      <div className="flex items-center gap-3 border-b border-line bg-surface-2 px-3 py-2">
        <div className="flex gap-1.5">
          <span className="size-3 rounded-full bg-[#ff5f57]" />
          <span className="size-3 rounded-full bg-[#febc2e]" />
          <span className="size-3 rounded-full bg-[#28c840]" />
        </div>
        <span className="text-sm" aria-hidden>
          {app.icon}
        </span>
        <span className="truncate font-mono text-xs text-ink-dim">{active.windowTitle}</span>
        <span
          className={`ml-auto rounded border px-1.5 py-0.5 text-[10px] font-semibold ${PRIORITY_CLASS[active.priority]}`}
        >
          {PRIORITY_LABEL[active.priority]}
        </span>
      </div>

      {/* faixa de contexto da demanda */}
      <div className="flex items-baseline gap-2 border-b border-line bg-bg/40 px-4 py-2">
        <span className="truncate font-grotesk text-sm font-semibold text-ink">{active.name}</span>
        {active.taskCount > 1 && (
          <span className="ml-auto shrink-0 text-[11px] text-ink-dim">
            {active.taskTitle} · {active.taskIndex + 1}/{active.taskCount}
          </span>
        )}
      </div>

      {/* corpo: a cena do app, ou o estado "pronto" */}
      {active.ready ? (
        <div className="flex min-h-72 flex-col items-center justify-center gap-3 p-8 text-center">
          <span className="text-3xl">📦</span>
          <p className="animate-edgepulse text-pass">
            Tudo pronto — pressione <KeyCap state="current">⏎</KeyCap> para entregar
          </p>
        </div>
      ) : (
        <Scene active={active} />
      )}
    </div>
  );
}
