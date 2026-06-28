import type { ActiveTicketSnapshot, Priority } from '@/core/snapshot';

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

/**
 * Nota fixa no canto com a instrução atual do ticket — visível enquanto se
 * trabalha num app, pra não precisar voltar à aba Ticket o tempo todo.
 */
export function TicketWidget({ active }: { active: ActiveTicketSnapshot }) {
  const sub = active.plan.find((p) => p.status === 'current') ?? active.plan[0];
  const multi = active.plan.length > 1;

  return (
    <div className="pointer-events-none absolute right-4 top-4 z-10 w-64 max-w-[40%]">
      <div className="rotate-1 rounded-md border border-amber/40 bg-amber/10 p-3 shadow-xl shadow-black/40 backdrop-blur-sm">
        <div className="mb-1.5 flex items-center gap-2">
          <span className="text-xs">📌</span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-ink-dim">
            Ticket
          </span>
          <span
            className={`ml-auto rounded border px-1 text-[9px] font-semibold ${PRIORITY_CLASS[active.priority]}`}
          >
            {PRIORITY_LABEL[active.priority]}
          </span>
        </div>
        <p className="mb-1 line-clamp-1 font-grotesk text-sm font-semibold text-ink">
          {active.name}
        </p>
        {multi && (
          <p className="mb-1 text-[11px] text-amber">
            {sub?.title} · {active.taskIndex + 1}/{active.taskCount}
          </p>
        )}
        <p className="text-xs leading-relaxed text-ink-dim">{sub?.prose}</p>
      </div>
    </div>
  );
}
