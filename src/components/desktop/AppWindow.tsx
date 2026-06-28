import { useState } from 'react';
import type { ActiveTicketSnapshot, Priority } from '@/core/snapshot';
import { APPS } from './apps';
import { Scene } from './scenes';
import { ActionBar } from './ActionBar';

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

/** "Comanda" da demanda: o que foi pedido + checklist de subtarefas (estilo CSD). */
function DetailsPanel({ active }: { active: ActiveTicketSnapshot }) {
  return (
    <div className="flex min-h-[22rem] flex-1 flex-col gap-4 p-6">
      <div>
        <div className="mb-1 flex items-center gap-2">
          <span
            className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${PRIORITY_CLASS[active.priority]}`}
          >
            {PRIORITY_LABEL[active.priority]}
          </span>
          <h2 className="font-grotesk text-lg font-semibold text-ink">{active.name}</h2>
        </div>
        <p className="text-sm text-ink-dim">{active.description}</p>
      </div>

      <div>
        <p className="mb-2 text-[11px] uppercase tracking-wider text-ink-dim">subtarefas</p>
        <ol className="flex flex-col gap-1.5">
          {active.subtasks.map((s, i) => (
            <li
              key={i}
              className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                s.status === 'current'
                  ? 'border-amber bg-amber/5 text-ink'
                  : s.status === 'done'
                    ? 'border-line text-ink-dim'
                    : 'border-line/60 text-ink-dim'
              }`}
            >
              <span
                className={
                  s.status === 'done'
                    ? 'text-pass'
                    : s.status === 'current'
                      ? 'text-amber'
                      : 'text-ink-dim'
                }
              >
                {s.status === 'done' ? '✓' : s.status === 'current' ? '▸' : '○'}
              </span>
              <span className={s.status === 'done' ? 'line-through' : ''}>{s.title}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
        active ? 'bg-surface-2 text-ink' : 'text-ink-dim hover:text-ink'
      }`}
    >
      {children}
    </button>
  );
}

export function AppWindow({ active, shake }: { active: ActiveTicketSnapshot; shake: boolean }) {
  const app = APPS[active.app];
  const [view, setView] = useState<'work' | 'details'>('work');

  return (
    <div
      key={active.app}
      className={`animate-windowin flex w-full flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-2xl shadow-black/60 ${
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

      {/* Abas: comanda (detalhes) ↔ trabalho (execução) */}
      <div className="flex items-center gap-1 border-b border-line bg-bg/40 px-2 py-1.5">
        <Tab active={view === 'work'} onClick={() => setView('work')}>
          Trabalho
        </Tab>
        <Tab active={view === 'details'} onClick={() => setView('details')}>
          Detalhes
        </Tab>
        <span className="ml-auto truncate pr-2 text-[11px] text-ink-dim">
          {active.taskCount > 1
            ? `${active.taskTitle} · ${active.taskIndex + 1}/${active.taskCount}`
            : active.name}
        </span>
      </div>

      {/* corpo */}
      <div className="flex flex-1 flex-col">
        {view === 'details' ? <DetailsPanel active={active} /> : <Scene active={active} />}
      </div>

      {/* hint padronizada */}
      <ActionBar active={active} />
    </div>
  );
}
