import type { ActiveTicketSnapshot, SlotSnapshot } from '@/core/snapshot';
import { StatusIcon, PriorityIcon, type IssueStatus } from './issueIcons';

function statusOf(slot: SlotSnapshot): IssueStatus {
  if (slot.ready) return 'ready';
  if (slot.readyToMerge) return 'merge';
  if (slot.waitRemaining !== null) return 'review';
  if (slot.active) return 'active';
  return 'open';
}

/** A fila de demandas como um issue tracker (estilo Linear). */
export function InboxPanel({
  slots,
  active,
  onSelect,
}: {
  slots: (SlotSnapshot | null)[];
  active: ActiveTicketSnapshot | null;
  onSelect: (index: number) => void;
}) {
  const open = slots.filter(Boolean).length;
  const sub = active?.plan.find((p) => p.status === 'current') ?? active?.plan[0];

  return (
    <aside className="elev-1 flex w-72 shrink-0 flex-col overflow-hidden rounded-xl border border-edge bg-surface">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className="size-2 rounded-[3px] bg-amber" />
        <span className="font-grotesk text-sm font-semibold text-ink">Backlog</span>
        <span className="ml-auto font-mono text-[11px] text-ink-dim">{open}/5</span>
      </div>
      <div className="h-px bg-line" />

      {/* Lista de issues */}
      <div className="flex flex-col p-1">
        {slots.map((slot, i) =>
          slot ? (
            <button
              key={i}
              onClick={() => onSelect(i)}
              aria-label={`Selecionar ${slot.name}`}
              className={`group flex items-start gap-2 rounded-md px-2 py-1.5 text-left transition-colors ${
                slot.active ? 'bg-amber/[0.07]' : 'hover:bg-white/[0.03]'
              }`}
            >
              <span className="mt-0.5">
                <StatusIcon status={statusOf(slot)} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="line-clamp-2 text-[13px] font-medium leading-snug text-ink">
                  {slot.name}
                </span>
                <span className="mt-0.5 flex items-center gap-1.5 font-mono text-[10px] text-ink-dim">
                  <span>DEV-{slot.id}</span>
                  {slot.waitRemaining !== null && (
                    <span className="text-sky-400">· em review {slot.waitRemaining}s</span>
                  )}
                  {slot.readyToMerge && <span className="text-teal">· merge</span>}
                  {slot.ready && <span className="text-pass">· pronto</span>}
                </span>
              </span>
              <span className="mt-0.5 flex shrink-0 items-center gap-1.5">
                <PriorityIcon priority={slot.priority} />
                <kbd
                  className={`flex size-5 items-center justify-center rounded border font-mono text-[11px] font-semibold transition-colors ${
                    slot.active
                      ? 'border-amber/60 bg-amber/15 text-amber'
                      : 'border-line bg-surface-2 text-ink-dim group-hover:text-ink'
                  }`}
                >
                  {i + 1}
                </kbd>
              </span>
            </button>
          ) : (
            <div key={i} className="flex items-start gap-2 rounded-md px-2 py-1.5" aria-hidden>
              <span className="mt-0.5 opacity-50">
                <StatusIcon status="empty" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-medium leading-snug text-ink-dim/70">
                  vazio
                </span>
                <span className="mt-0.5 block font-mono text-[10px] text-ink-dim/50">
                  aguardando demanda
                </span>
              </span>
              <kbd className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border border-line/70 bg-surface-2/60 font-mono text-[11px] font-semibold text-ink-dim/70">
                {i + 1}
              </kbd>
            </div>
          ),
        )}
      </div>

      {/* Lembrete de 2º plano: só quando NÃO se está na aba Ticket */}
      {active && sub && active.focused !== 'details' && (
        <div className="mt-auto border-t-2 border-amber/40 bg-amber/[0.07] p-3.5">
          <div className="mb-2 flex items-center gap-2">
            <span className="size-1.5 animate-pulse rounded-full bg-amber shadow-[0_0_6px_1px] shadow-amber/60" />
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber">
              em foco agora
            </span>
            {active.taskCount > 1 && (
              <span className="ml-auto rounded bg-amber/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-amber">
                {active.taskIndex + 1}/{active.taskCount}
              </span>
            )}
          </div>
          <p className="text-sm font-semibold leading-snug text-ink">{active.name}</p>
          {active.taskCount > 1 && (
            <p className="mt-0.5 text-[11px] font-medium text-ink-dim">{sub.title}</p>
          )}
          <p className="mt-2 rounded-md bg-bg/60 p-2.5 text-[13px] leading-relaxed text-ink/90">
            {sub.prose}
          </p>
        </div>
      )}
    </aside>
  );
}
