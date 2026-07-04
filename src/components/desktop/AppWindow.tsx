import type {
  ActiveTicketSnapshot,
  AppId,
  Priority,
  ProgramId,
  SlotSnapshot,
} from '@/core/snapshot';
import { APPS } from './apps';
import { Scene } from './scenes';
import { ActionBar } from './ActionBar';

const PRIORITY_LABEL: Record<Priority, string> = {
  urgente: 'URGENTE',
  alta: 'ALTA',
  normal: 'NORMAL',
  baixa: 'BAIXA',
};

// Pill com FILL sutil (sem borda colorida). Cor só onde importa (urgente/alta);
// normal/baixa neutros — não competem com o âmbar.
const PRIORITY_CLASS: Record<Priority, string> = {
  urgente: 'bg-fail/15 text-fail',
  alta: 'bg-amber/15 text-amber',
  normal: 'bg-ink/10 text-ink-dim',
  baixa: 'bg-ink/10 text-ink-dim',
};

/** Antes de abrir o app: prompt diegético (mesmo idioma da tela vazia — mono +
 *  cursor, sem ícone). As teclas já vivem no action bar abaixo; o objetivo, no
 *  banner acima (fonte única). */
function LaunchPrompt({ appId }: { appId: AppId }) {
  const app = APPS[appId];
  return (
    <div className="flex min-h-[22rem] flex-1 flex-col items-center justify-center text-center">
      <p className="font-mono text-sm text-ink-dim">
        abra o <span className="text-ink">{app.name}</span> para começar
        <span className="animate-edgepulse ml-1 inline-block h-[1em] w-[0.5em] translate-y-[0.12em] bg-ink/70" />
      </p>
    </div>
  );
}

/** Programa aberto por engano: bloqueia até fechar com X. */
function WrongApp({ appId }: { appId: AppId }) {
  const app = APPS[appId];
  return (
    <div className="flex min-h-[22rem] flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
      <span className="text-5xl opacity-50" aria-hidden>
        {app.icon}
      </span>
      <p className="text-sm text-ink-dim">
        Nada a fazer no <span className="font-medium text-ink">{app.name}</span> agora.
      </p>
      <p className="flex items-center gap-2 text-xs text-ink-dim">
        feche para voltar
        <kbd className="keycap !h-5 !min-w-5 !text-[10px]">X</kbd>
      </p>
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
  slots,
  shake,
  onFocusProgram,
}: {
  active: ActiveTicketSnapshot;
  slots: (SlotSnapshot | null)[];
  shake: boolean;
  onFocusProgram: (id: ProgramId) => void;
}) {
  const focusedApp = active.focused !== 'details' ? APPS[active.focused] : null;
  const wrongMeta = active.wrongApp ? APPS[active.wrongApp] : null;
  const appMeta = APPS[active.app];

  // Título da janela conforme o programa em foco (ou o aberto por engano). Sem a
  // aba Ticket: antes de abrir, mostra o programa-alvo da tarefa.
  const title = wrongMeta
    ? wrongMeta.name
    : !active.appLaunched || active.focused === active.app
      ? active.windowTitle
      : `${focusedApp?.name}`;

  return (
    <div
      key={active.id}
      className={`animate-windowin elev-2 flex w-full min-h-0 flex-col overflow-hidden rounded-lg border border-edge ${
        shake ? 'animate-shake' : ''
      }`}
      // Material da janela (por identidade): leve gradiente de cima p/ baixo —
      // mais clara que o backlog → "flutua". Sem glow/borda colorida.
      style={{ background: 'var(--window-bg)' }}
    >
      {/* Barra de título */}
      <div className="flex items-center gap-3 border-b border-line bg-surface-2 px-3 py-2">
        <div className="flex gap-1.5">
          <span className="size-3 rounded-full bg-[#ff5f57]" />
          <span className="size-3 rounded-full bg-[#febc2e]" />
          <span className="size-3 rounded-full bg-[#28c840]" />
        </div>
        <span className="text-sm" aria-hidden>
          {wrongMeta?.icon ?? (active.appLaunched ? focusedApp?.icon : appMeta.icon)}
        </span>
        <span className="truncate font-mono text-xs text-ink-dim">{title}</span>
        <span
          className={`ml-auto rounded px-1.5 py-0.5 text-[10px] font-semibold ${PRIORITY_CLASS[active.priority]}`}
        >
          {PRIORITY_LABEL[active.priority]}
        </span>
      </div>

      {/* Abas = programas abertos (alterna com Tab). SEMPRE presente com altura
          fixa (vazia quando não há abas) — a janela não muda de tamanho quando
          um programa abre/fecha. */}
      <div className="flex min-h-9 items-center gap-1 border-b border-line bg-bg/40 px-2 py-1.5">
        {active.openPrograms.map((id) => (
          <ProgramTab
            key={id}
            label={APPS[id].name}
            icon={APPS[id].icon}
            active={active.focused === id}
            onClick={() => onFocusProgram(id)}
          />
        ))}
        {wrongMeta && (
          <span className="flex items-center gap-1.5 rounded-md border border-line bg-surface-2 px-2.5 py-1 text-xs font-medium text-ink-dim">
            <span aria-hidden>{wrongMeta.icon}</span>
            {wrongMeta.name}
            <span className="text-ink-dim">✕</span>
          </span>
        )}
        {active.openPrograms.length > 1 && (
          <span className="ml-auto hidden items-center gap-1 pr-1 text-[10px] text-ink-dim sm:flex">
            <kbd className="keycap !h-5 !min-w-7 !text-[10px]">Tab</kbd> alterna
          </span>
        )}
      </div>

      {/* corpo: conteúdo do programa em foco (ou o aberto por engano). Rola se a
          janela for espremida (tela baixa) — a ActionBar fica fixa acima do dock. */}
      <div className="flex min-h-0 flex-1 flex-col overflow-auto">
        {active.wrongApp ? (
          <WrongApp appId={active.wrongApp} />
        ) : !active.appLaunched ? (
          <LaunchPrompt appId={active.app} />
        ) : active.focused === active.app ? (
          <Scene active={active} slots={slots} />
        ) : (
          <IdleApp appId={active.focused} target={APPS[active.app].name} />
        )}
      </div>

      {/* hint padronizada */}
      <ActionBar active={active} />
    </div>
  );
}
