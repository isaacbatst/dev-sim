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
    <aside className="flex w-72 shrink-0 flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-xl shadow-black/40">
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
                  className={`rounded border px-1 font-mono text-[10px] transition-colors ${
                    slot.active
                      ? 'border-amber/50 text-amber'
                      : 'border-line text-ink-dim group-hover:text-ink'
                  }`}
                >
                  {i + 1}
                </kbd>
              </span>
            </button>
          ) : (
            <div
              key={i}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 opacity-40"
              aria-hidden
            >
              <StatusIcon status="empty" />
              <span className="flex-1 text-[12px] text-ink-dim">vazio</span>
              <kbd className="rounded border border-line/60 px-1 font-mono text-[10px] text-ink-dim">
                {i + 1}
              </kbd>
            </div>
          ),
        )}
      </div>

      {/* Lembrete de 2º plano: só quando NÃO se está na aba Ticket */}
      {active && sub && active.focused !== 'details' && (
        <div className="mt-auto border-t border-line bg-bg/40 p-3">
          <div className="mb-1 flex items-center gap-1.5">
            <StatusIcon status="active" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-dim">
              em foco
            </span>
          </div>
          <p className="line-clamp-1 text-xs font-semibold text-ink/90">{active.name}</p>
          {active.taskCount > 1 && (
            <p className="text-[11px] text-ink-dim">
              {sub.title} · {active.taskIndex + 1}/{active.taskCount}
            </p>
          )}
          <p className="mt-1 text-[11px] leading-relaxed text-ink-dim">{sub.prose}</p>
        </div>
      )}
    </aside>
  );
}
