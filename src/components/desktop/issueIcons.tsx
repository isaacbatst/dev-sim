import type { Priority } from '@/core/snapshot';

export type IssueStatus = 'empty' | 'open' | 'active' | 'review' | 'merge' | 'ready';

/** Ícone de status circular (estilo Linear). */
export function StatusIcon({ status }: { status: IssueStatus }) {
  switch (status) {
    case 'ready':
      return (
        <svg viewBox="0 0 14 14" className="size-3.5 shrink-0">
          <circle cx="7" cy="7" r="6" fill="var(--pass)" />
          <path
            d="M4.2 7.2 6.1 9.1 9.8 4.9"
            fill="none"
            stroke="#0b0d13"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'merge':
      return (
        <svg viewBox="0 0 14 14" className="size-3.5 shrink-0">
          <circle cx="7" cy="7" r="5.5" fill="none" stroke="var(--teal)" strokeWidth="1.5" />
          <circle cx="7" cy="7" r="2.6" fill="var(--teal)" />
        </svg>
      );
    case 'review':
      // anel + 3/4 preenchido (review em andamento, quase lá)
      return (
        <svg viewBox="0 0 14 14" className="size-3.5 shrink-0">
          <circle cx="7" cy="7" r="5.5" fill="none" stroke="#5b9bff" strokeWidth="1.5" />
          <path d="M7 7 L7 1.5 A5.5 5.5 0 1 1 1.5 7 Z" fill="#5b9bff" />
        </svg>
      );
    case 'active':
      return (
        <svg viewBox="0 0 14 14" className="size-3.5 shrink-0">
          <circle cx="7" cy="7" r="5.5" fill="none" stroke="var(--amber)" strokeWidth="1.5" />
          <path d="M7 1.5 A5.5 5.5 0 0 1 7 12.5 Z" fill="var(--amber)" />
        </svg>
      );
    case 'open':
      return (
        <svg viewBox="0 0 14 14" className="size-3.5 shrink-0">
          <circle cx="7" cy="7" r="5.5" fill="none" stroke="var(--ink-dim)" strokeWidth="1.5" />
        </svg>
      );
    case 'empty':
      return (
        <svg viewBox="0 0 14 14" className="size-3.5 shrink-0 opacity-50">
          <circle
            cx="7"
            cy="7"
            r="5.5"
            fill="none"
            stroke="var(--line)"
            strokeWidth="1.5"
            strokeDasharray="2 2.5"
          />
        </svg>
      );
  }
}

/** Indicador de prioridade (urgente = quadrado com "!", demais = barras). */
export function PriorityIcon({ priority }: { priority: Priority }) {
  if (priority === 'urgente') {
    return (
      <svg viewBox="0 0 12 12" className="size-3 shrink-0">
        <rect x="1" y="1" width="10" height="10" rx="2.5" fill="var(--fail)" />
        <rect x="5.2" y="3" width="1.6" height="3.6" rx="0.8" fill="#0b0d13" />
        <rect x="5.2" y="7.6" width="1.6" height="1.6" rx="0.8" fill="#0b0d13" />
      </svg>
    );
  }
  const filled = priority === 'alta' ? 3 : priority === 'normal' ? 2 : 1;
  return (
    <svg viewBox="0 0 12 12" className="size-3 shrink-0">
      {[0, 1, 2].map((i) => {
        const h = 3 + i * 3;
        return (
          <rect
            key={i}
            x={1 + i * 4}
            y={11 - h}
            width="2.4"
            height={h}
            rx="0.6"
            fill={i < filled ? 'var(--amber)' : 'var(--line)'}
          />
        );
      })}
    </svg>
  );
}
