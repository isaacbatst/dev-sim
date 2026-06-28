import type { ActiveTicketSnapshot, PlanStatus, Priority, ProgramId } from '@/core/snapshot';
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
                className={`flex flex-col gap-1 ${multi ? 'ml-1.5 border-l border-line pl-3' : ''}`}
              >
                {sub.steps.map((st, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm text-ink-dim">
                    <span className={`text-xs ${statusColor(st.status)}`}>
                      {statusMark(st.status)}
                    </span>
                    <span
                      className={
                        st.status === 'done'
                          ? 'line-through'
                          : st.status === 'current'
                            ? 'text-ink'
                            : ''
                      }
                    >
                      {st.label}
                    </span>
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

/** App aberto, mas não é onde está a ação agora. */
function IdleApp({ appId, target }: { appId: ProgramId; target: string }) {
  const app = appId === 'details' ? null : APPS[appId];
  return (
    <div className="flex min-h-[22rem] flex-1 flex-col items-center justify-center gap-2 text-center">
      <span className="text-4xl opacity-30" aria-hidden>
        {app?.icon}
      </span>
      <p className="text-sm text-ink-dim">{app?.name} aberto — sem ação aqui agora</p>
      <p className="text-xs text-ink-dim">
        a tarefa atual está em <span className="text-amber">{target}</span> ·{' '}
        <kbd className="keycap !h-5 !min-w-7 !text-[10px]">Tab</kbd>
      </p>
    </div>
  );
}

function ProgramTab({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
        active ? 'bg-surface-2 text-ink' : 'text-ink-dim hover:text-ink'
      }`}
    >
      {icon && <span aria-hidden>{icon}</span>}
      {label}
    </button>
  );
}

export function AppWindow({
  active,
  shake,
  onFocusProgram,
}: {
  active: ActiveTicketSnapshot;
  shake: boolean;
  onFocusProgram: (id: ProgramId) => void;
}) {
  const focusedApp = active.focused !== 'details' ? APPS[active.focused] : null;

  // Título da janela conforme o programa em foco.
  const title =
    active.focused === 'details'
      ? `Comanda — ${active.name}`
      : active.focused === active.app
        ? active.windowTitle
        : `${focusedApp?.name}`;

  return (
    <div
      key={active.id}
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
          {focusedApp?.icon ?? '📋'}
        </span>
        <span className="truncate font-mono text-xs text-ink-dim">{title}</span>
        <span
          className={`ml-auto rounded border px-1.5 py-0.5 text-[10px] font-semibold ${PRIORITY_CLASS[active.priority]}`}
        >
          {PRIORITY_LABEL[active.priority]}
        </span>
      </div>

      {/* Abas = Comanda + programas abertos (alterna com Tab) */}
      <div className="flex items-center gap-1 border-b border-line bg-bg/40 px-2 py-1.5">
        <ProgramTab
          label="Comanda"
          icon="📋"
          active={active.focused === 'details'}
          onClick={() => onFocusProgram('details')}
        />
        {active.openPrograms.map((id) => (
          <ProgramTab
            key={id}
            label={APPS[id].name}
            icon={APPS[id].icon}
            active={active.focused === id}
            onClick={() => onFocusProgram(id)}
          />
        ))}
        <span className="ml-auto hidden items-center gap-1 pr-1 text-[10px] text-ink-dim sm:flex">
          <kbd className="keycap !h-5 !min-w-7 !text-[10px]">Tab</kbd> alterna
        </span>
      </div>

      {/* corpo: conteúdo do programa em foco */}
      <div className="flex flex-1 flex-col">
        {active.focused === 'details' ? (
          <DetailsPanel active={active} />
        ) : active.focused === active.app && active.appLaunched ? (
          <Scene active={active} />
        ) : (
          <IdleApp appId={active.focused} target={APPS[active.app].name} />
        )}
      </div>

      {/* hint padronizada */}
      <ActionBar active={active} />
    </div>
  );
}
