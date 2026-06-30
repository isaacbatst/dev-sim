import type { Snapshot } from '@/core/snapshot';
import { MenuBar } from './MenuBar';
import { InboxPanel } from './InboxPanel';
import { AppWindow } from './AppWindow';
import { Dock } from './Dock';

/** Título de carreira por tempo de casa (leve; o rank-por-skill vem depois). */
function careerTitle(day: number): string {
  if (day <= 2) return 'Estagiário';
  if (day <= 5) return 'Júnior';
  if (day <= 10) return 'Pleno';
  if (day <= 16) return 'Sênior';
  return 'Tech Lead';
}
/** Nota do dia → letra (boletim). Limiares chutados — afinar no playtest. */
function dayGrade(score: number): string {
  if (score >= 600) return 'S';
  if (score >= 400) return 'A';
  if (score >= 250) return 'B';
  if (score >= 120) return 'C';
  return 'D';
}

/** A área de trabalho inteira. Apresentação pura — sem lógica de jogo. */
export function Desktop({
  snapshot,
  day,
  shake,
  floatScore,
  onFocusProgram,
  onSelect,
  onNextDay,
}: {
  snapshot: Snapshot;
  day: number;
  shake: boolean;
  floatScore: string | null;
  onFocusProgram: (id: import('@/core/snapshot').ProgramId) => void;
  onSelect: (index: number) => void;
  onNextDay: () => void;
}) {
  const { status, clock, delivered, expired, score, slots, active } = snapshot;
  const openCount = slots.filter(Boolean).length;
  // Objetivo do passo atual — só enquanto se trabalha num app (na aba Ticket o
  // plano completo já está visível). Mostrado fora da janela, acima do programa.
  const objective =
    active && !active.wrongApp && !active.ready && active.focused !== 'details'
      ? (active.plan.find((p) => p.status === 'current') ?? active.plan[0])
      : null;

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      <MenuBar clock={clock} day={day} delivered={delivered} expired={expired} score={score} />

      {/* Wallpaper: gradiente + grade técnica sutil + brilho do humor */}
      <main className="relative flex flex-1 gap-5 overflow-hidden p-5">
        <div aria-hidden className="absolute inset-0 -z-10" style={{ background: 'var(--wall)' }} />
        {/* Grão sutil no lugar da grade técnica — textura orgânica, anti-AI. */}
        <div
          aria-hidden
          className="bg-noise pointer-events-none absolute inset-0 -z-10 opacity-[0.05] mix-blend-soft-light"
        />

        <InboxPanel slots={slots} onSelect={onSelect} />

        <section className="flex min-w-0 flex-1 items-center justify-center pb-16">
          {active ? (
            <div className="relative w-full max-w-[44rem]">
              {/* Objetivo do passo: banner FORA da janela (na área do OS, acima do
                  programa) enquanto se trabalha num app — não no chrome nem no backlog. */}
              {objective && (
                <div className="elev-1 mb-2 flex items-center gap-2 rounded-lg border border-edge bg-surface/85 px-4 py-2 backdrop-blur-sm">
                  <span aria-hidden className="text-amber">
                    ▸
                  </span>
                  <p className="truncate text-sm text-ink">
                    {active.taskCount > 1 && (
                      <span className="text-ink-dim">{objective.title}: </span>
                    )}
                    {objective.prose}
                  </p>
                </div>
              )}
              <AppWindow
                active={active}
                slots={slots}
                shake={shake}
                onFocusProgram={onFocusProgram}
              />
              {floatScore && (
                <span className="animate-floatup pointer-events-none absolute -top-3 left-1/2 -translate-x-1/2 font-mono text-lg font-bold text-pass">
                  {floatScore}
                </span>
              )}
            </div>
          ) : (
            // Estado vazio diegético: prompt do devOS — sem caixa, faz parte da
            // área de trabalho (não um card de página web).
            <div className="flex max-w-md flex-col items-center gap-5 px-6 text-center">
              <p className="font-code text-base">
                <span className="text-pass">desenvolvedor@devOS</span>
                <span className="text-ink-dim">:</span>
                <span className="text-sky-400">~</span>
                <span className="text-ink-dim">$</span>
                <span className="animate-edgepulse ml-1 inline-block h-[1.05em] w-[0.55em] translate-y-[0.15em] bg-ink/80" />
              </p>
              <p className="text-sm text-ink-dim">
                {openCount} no backlog à esquerda — abra com <KeyHintInline /> e entregue até as
                17:00.
              </p>
            </div>
          )}
        </section>

        <Dock
          open={active?.openPrograms ?? []}
          focused={active && active.focused !== 'details' ? active.focused : null}
        />
      </main>

      {status !== 'playing' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/85 p-6 backdrop-blur-sm">
          {/* Fim de dia = boletim/identidade — o artefato de share (POSICIONAMENTO §3/§5). */}
          <div className="elev-2 w-full max-w-sm rounded-xl border border-edge bg-surface p-6 text-center">
            <p className="font-code text-[11px] uppercase tracking-[0.25em] text-ink-dim">
              Dia {day} · 17:00
            </p>
            <h2 className="mt-1 font-code text-2xl font-bold text-ink">fim do expediente</h2>

            {/* Linha de identidade (o que se compartilha) */}
            <p className="mt-4 text-sm leading-relaxed text-ink">
              Sobrevivi ao <span className="font-semibold">Dia {day}</span> como{' '}
              <span className="font-semibold text-amber">{careerTitle(day)}</span> — sem IA.
            </p>

            {/* Nota do dia */}
            <div className="mt-5 flex items-center justify-center gap-3">
              <span className="font-code text-5xl font-bold leading-none text-amber">
                {dayGrade(score)}
              </span>
              <span className="text-left">
                <span className="block font-mono text-lg tabular-nums text-ink">{score}</span>
                <span className="block font-mono text-[10px] uppercase tracking-wider text-ink-dim">
                  nota do dia
                </span>
              </span>
            </div>

            <div className="mt-4 flex justify-center gap-4 font-mono text-xs">
              <span className="text-pass">✓ {delivered} entregues</span>
              {expired > 0 && <span className="text-fail">✕ {expired} perdidas</span>}
            </div>

            <p className="mt-4 text-[11px] leading-relaxed text-ink-dim">
              Zero Copilot, zero ChatGPT. Só você e o code review.
            </p>

            <button
              onClick={onNextDay}
              className="mt-5 rounded-lg border border-amber px-5 py-2 font-grotesk font-semibold text-amber transition-colors hover:bg-amber/10"
            >
              Próximo dia →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function KeyHintInline() {
  return (
    <span className="inline-flex items-center gap-0.5 align-middle">
      <kbd className="keycap !h-5 !min-w-5 !text-[10px]">1</kbd>–
      <kbd className="keycap !h-5 !min-w-5 !text-[10px]">5</kbd>
    </span>
  );
}
