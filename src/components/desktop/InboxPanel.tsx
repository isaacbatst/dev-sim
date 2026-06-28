import type { Priority, SlotSnapshot } from '@/core/snapshot';

const PRIORITY_DOT: Record<Priority, string> = {
  urgente: 'bg-fail',
  alta: 'bg-amber',
  normal: 'bg-teal',
  baixa: 'bg-ink-dim',
};

/** Painel de demandas na fila — as 5 "tarefas abertas" do dia. */
export function InboxPanel({
  slots,
  onSelect,
}: {
  slots: (SlotSnapshot | null)[];
  onSelect: (index: number) => void;
}) {
  return (
    <aside className="flex w-72 shrink-0 flex-col gap-2 rounded-xl border border-line bg-surface/70 p-3">
      <h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-ink-dim">Demandas</h2>
      {slots.map((slot, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          disabled={!slot}
          aria-label={slot ? `Selecionar ${slot.name}` : `Slot ${i + 1} vazio`}
          className={`flex min-h-16 items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
            slot?.active
              ? 'border-amber bg-surface-2'
              : slot
                ? 'border-line bg-surface hover:border-ink-dim'
                : 'border-dashed border-line/60 opacity-50'
          }`}
        >
          <kbd className="keycap mt-0.5 !h-7 !min-w-7 !text-sm">{i + 1}</kbd>
          {slot ? (
            <span className="flex min-w-0 flex-col gap-1.5">
              <span className="flex items-center gap-2">
                <span className={`size-2 shrink-0 rounded-full ${PRIORITY_DOT[slot.priority]}`} />
                <span className="line-clamp-2 text-sm leading-snug text-ink">{slot.name}</span>
              </span>
              <span className="flex items-center gap-2 text-[11px]">
                {slot.ready && <span className="text-pass">✓ pronto p/ entregar</span>}
                {slot.waitRemaining !== null && (
                  <span className="text-teal">⏳ review {slot.waitRemaining}s</span>
                )}
                {!slot.ready && slot.waitRemaining === null && !slot.active && (
                  <span className="text-ink-dim">em aberto</span>
                )}
                {slot.active && <span className="text-amber">em foco</span>}
              </span>
            </span>
          ) : (
            <span className="mt-1 text-xs text-ink-dim">vazio</span>
          )}
        </button>
      ))}
    </aside>
  );
}
