import type { ActiveTicketSnapshot } from '@/core/snapshot';

/**
 * A COMANDA (a "ordem" em foco, o CSD do devOS). INVERSE-VIDEO do tema (tokens
 * --comanda-*: claro no escuro, escuro no claro → figura-fundo), mas na língua
 * do OS: painel na GRADE (margens + raio, como backlog/janela), realce no topo,
 * grão sutil. SEMPRE presente (altura reservada) — o layout não dá resize
 * quando a demanda abre/fecha; fica aberta inclusive com programa errado.
 */
export function Comanda({ active }: { active: ActiveTicketSnapshot | null }) {
  // Sem demanda em foco: o painel some, mas o ESPAÇO fica reservado (sem resize).
  if (!active) return <div aria-hidden className="mx-5 mb-5 min-h-[9.5rem] shrink-0" />;

  return (
    <div
      className="comanda mx-5 mb-5 flex min-h-[9.5rem] shrink-0 flex-col justify-center rounded-xl px-7 py-4"
      style={{ color: 'var(--comanda-ink)' }}
    >
      <Order active={active} />
    </div>
  );
}

function Order({ active }: { active: ActiveTicketSnapshot }) {
  // Passo atual (com programa errado aberto, continua mostrando a ordem).
  const objective = active.plan.find((p) => p.status === 'current') ?? active.plan[0];

  return (
    <>
      {/* eyebrow: id + prioridade (máquina → mono, token eyebrow = 700) */}
      <div
        className="mb-2 flex items-center gap-2 font-mono text-sm font-bold uppercase tracking-[0.16em]"
        style={{ color: 'var(--comanda-dim)' }}
      >
        <span>DEV-{active.id}</span>
        <span aria-hidden>·</span>
        <span>{active.priority}</span>
        {active.taskCount > 1 && (
          <span className="ml-auto font-medium normal-case tracking-normal">
            passo {active.taskIndex + 1}/{active.taskCount}
          </span>
        )}
      </div>
      {/* título = a "ordem" (humano → grotesk). HUD → maior que o degrau comanda. */}
      <h3 className="font-grotesk text-[2.5rem] font-bold leading-[1.05] tracking-tight">
        {active.name}
      </h3>
      {/* passo atual (o gap ≈ metade do título → ritmo) */}
      {active.ready ? (
        <p className="mt-3 flex gap-2.5 text-xl leading-snug">
          <span className="mt-0.5 font-bold" style={{ color: 'var(--pass)' }} aria-hidden>
            ✓
          </span>
          <span>Pronto para entrega — aperte Enter.</span>
        </p>
      ) : (
        <p className="mt-3 flex gap-2.5 text-xl leading-snug">
          <span className="mt-0.5 font-bold" style={{ color: 'var(--amber)' }} aria-hidden>
            ▸
          </span>
          <span>
            {active.taskCount > 1 && <span className="font-semibold">{objective.title}: </span>}
            {objective.prose}
          </span>
        </p>
      )}
    </>
  );
}
