import type { Priority, SlotSnapshot } from '@/core/snapshot';
import { KeyCap } from './primitives';

const PRIORITY_DOT: Record<Priority, string> = {
  urgente: 'bg-fail',
  alta: 'bg-amber',
  normal: 'bg-teal',
  baixa: 'bg-ink-dim',
};

/** A fila de demandas, apresentada como uma janela de issue tracker ("Backlog"). */
export function InboxPanel({
  slots,
  onSelect,
}: {
  slots: (SlotSnapshot | null)[];
  onSelect: (index: number) => void;
}) {
  const open = slots.filter(Boolean).length;
  return (
    <aside className="flex w-60 shrink-0 flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-xl shadow-black/40">
      <div className="flex items-center gap-2 border-b border-line bg-surface-2 px-3 py-2">
        <div className="flex gap-1.5">
          <span className="size-3 rounded-full bg-[#ff5f57]" />
          <span className="size-3 rounded-full bg-[#febc2e]" />
          <span className="size-3 rounded-full bg-[#28c840]" />
        </div>
        <span className="font-mono text-xs text-ink-dim">Backlog — hoje</span>
        <span className="ml-auto rounded bg-bg px-1.5 text-[10px] text-ink-dim">{open}/5</span>
      </div>

      <div className="flex flex-col gap-1.5 p-2">
        {slots.map((slot, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            disabled={!slot}
            aria-label={slot ? `Selecionar ${slot.name}` : `Slot ${i + 1} vazio`}
            className={`flex min-h-14 items-start gap-2.5 rounded-md border px-2.5 py-2 text-left transition-colors ${
              slot?.active
                ? 'border-amber bg-amber/5'
                : slot
                  ? 'border-line bg-bg/40 hover:border-ink-dim'
                  : 'border-dashed border-line/50 opacity-50'
            }`}
          >
            <KeyCap state={slot?.active ? 'current' : 'idle'} small>
              {i + 1}
            </KeyCap>
            {slot ? (
              <span className="flex min-w-0 flex-col gap-1">
                <span className="flex items-start gap-2">
                  <span
                    className={`mt-1 size-2 shrink-0 rounded-full ${
                      slot.ready
                        ? 'bg-pass shadow-[0_0_6px] shadow-pass/70'
                        : slot.waitRemaining !== null
                          ? 'bg-sky-400 shadow-[0_0_6px] shadow-sky-400/70'
                          : PRIORITY_DOT[slot.priority]
                    }`}
                  />
                  <span className="line-clamp-2 text-sm leading-snug text-ink">{slot.name}</span>
                </span>
                <span className="pl-4 text-[11px]">
                  {slot.ready ? (
                    <span className="text-pass">✓ pronto p/ concluir</span>
                  ) : slot.waitRemaining !== null ? (
                    <span className="text-sky-400">⏳ em review · {slot.waitRemaining}s</span>
                  ) : slot.active ? (
                    <span className="text-amber">em foco</span>
                  ) : (
                    <span className="text-ink-dim">aberto</span>
                  )}
                </span>
              </span>
            ) : (
              <span className="mt-1 text-xs text-ink-dim">—</span>
            )}
          </button>
        ))}
      </div>
    </aside>
  );
}
