import type { ActiveTicketSnapshot, PlanStatus, Priority } from '@/core/snapshot';
import { APPS, DOCK_APPS } from './apps';
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

function statusMark(s: PlanStatus) {
  return s === 'done' ? '✓' : s === 'current' ? '▸' : '○';
}
function statusColor(s: PlanStatus) {
  return s === 'done' ? 'text-pass' : s === 'current' ? 'text-amber' : 'text-ink-dim';
}

/** "Comanda" da demanda: o pedido + plano passo a passo (estilo CSD). */
function DetailsPanel({ active }: { active: ActiveTicketSnapshot }) {
  const multi = active.plan.length > 1;
  return (
    <div className="flex min-h-[22rem] flex-1 flex-col gap-4 overflow-auto p-6">
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
        <p className="mb-2 text-[11px] uppercase tracking-wider text-ink-dim">passo a passo</p>
        <div className="flex flex-col gap-3">
          {active.plan.map((sub, i) => (
            <div key={i}>
              {multi && (
                <p
                  className={`mb-1 flex items-center gap-2 text-sm font-semibold ${statusColor(sub.status)}`}
                >
                  <span>{statusMark(sub.status)}</span>
                  {sub.title}
                </p>
              )}
              <ol
                className={`flex flex-col gap-1 ${multi ? 'border-l border-line pl-3 ml-1.5' : ''}`}
              >
                {sub.steps.map((st, j) => (
                  <li
                    key={j}
                    className={`flex items-center gap-2 text-sm ${
                      st.status === 'current'
                        ? 'text-ink'
                        : st.status === 'done'
                          ? 'text-ink-dim'
                          : 'text-ink-dim'
                    }`}
                  >
                    <span className={`text-xs ${statusColor(st.status)}`}>
                      {statusMark(st.status)}
                    </span>
                    <span className={st.status === 'done' ? 'line-through' : ''}>{st.label}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Programa fechado: mostra a área de trabalho; o app abre com a ação (rodapé). */
function DesktopBackground({ active }: { active: ActiveTicketSnapshot }) {
  return (
    <div
      className="relative flex min-h-[22rem] flex-1 items-center justify-center"
      style={{
        background:
          'radial-gradient(120% 80% at 50% 0%, color-mix(in srgb, var(--amber) 8%, transparent), transparent 55%), linear-gradient(180deg, #11131b, #0c0e14)',
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(var(--ink) 1px, transparent 1px), linear-gradient(90deg, var(--ink) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />
      <div className="relative grid grid-cols-3 gap-x-8 gap-y-6">
        {DOCK_APPS.map((id) => {
          const app = APPS[id];
          const isTarget = id === active.app;
          return (
            <div key={id} className="flex w-16 flex-col items-center gap-1.5 text-center">
              <span
                className={`flex size-12 items-center justify-center rounded-2xl border text-2xl transition ${
                  isTarget
                    ? 'animate-edgepulse border-amber bg-amber/10'
                    : 'border-white/10 bg-surface-2 opacity-50'
                }`}
                style={isTarget ? { boxShadow: `0 0 20px -4px ${app.accent}` } : undefined}
              >
                {app.icon}
              </span>
              <span className={`text-[11px] ${isTarget ? 'text-ink' : 'text-ink-dim opacity-60'}`}>
                {app.name}
              </span>
            </div>
          );
        })}
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

export function AppWindow({
  active,
  shake,
  view,
  onView,
}: {
  active: ActiveTicketSnapshot;
  shake: boolean;
  view: 'work' | 'details';
  onView: (v: 'work' | 'details') => void;
}) {
  const app = APPS[active.app];

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

      {/* Abas: comanda (detalhes) ↔ trabalho (execução) — alterna com Tab */}
      <div className="flex items-center gap-1 border-b border-line bg-bg/40 px-2 py-1.5">
        <Tab active={view === 'work'} onClick={() => onView('work')}>
          Trabalho
        </Tab>
        <Tab active={view === 'details'} onClick={() => onView('details')}>
          Detalhes
        </Tab>
        <span className="ml-1 hidden items-center gap-1 text-[10px] text-ink-dim sm:flex">
          <kbd className="keycap !h-5 !min-w-7 !text-[10px]">Tab</kbd> alterna
        </span>
        <span className="ml-auto truncate pr-2 text-[11px] text-ink-dim">
          {active.taskCount > 1
            ? `${active.taskTitle} · ${active.taskIndex + 1}/${active.taskCount}`
            : ''}
        </span>
      </div>

      {/* corpo */}
      <div className="flex flex-1 flex-col">
        {view === 'details' ? (
          <DetailsPanel active={active} />
        ) : active.appLaunched ? (
          <Scene active={active} />
        ) : (
          <DesktopBackground active={active} />
        )}
      </div>

      {/* hint padronizada */}
      <ActionBar active={active} />
    </div>
  );
}
