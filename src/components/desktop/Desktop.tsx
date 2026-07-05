import type { Snapshot } from '@/core/snapshot';
import type { Career, DayResult } from '@/store/gameStore';
import { positionName, levelProgress } from '@/data/positions';
import { COSMETICS } from '@/data/cosmetics';
import { MenuBar } from './MenuBar';
import { InboxPanel } from './InboxPanel';
import { AppWindow } from './AppWindow';
import { Comanda } from './Comanda';

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
  career,
  dayResult,
  shake,
  floatScore,
  onFocusProgram,
  onSelect,
  onNextDay,
  onBuy,
}: {
  snapshot: Snapshot;
  day: number;
  career: Career;
  dayResult: DayResult | null;
  shake: boolean;
  floatScore: string | null;
  onFocusProgram: (id: import('@/core/snapshot').ProgramId) => void;
  onSelect: (index: number) => void;
  onNextDay: () => void;
  onBuy: (id: string, preco: number) => void;
}) {
  const { status, clock, delivered, expired, score, slots, active } = snapshot;
  const openCount = slots.filter(Boolean).length;

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* Wallpaper na TELA INTEIRA do monitor (inclusive a faixa da comanda):
          gradiente + grão sutil (textura orgânica, anti-AI). */}
      <div aria-hidden className="absolute inset-0 -z-10" style={{ background: 'var(--wall)' }} />
      <div
        aria-hidden
        className="bg-noise pointer-events-none absolute inset-0 -z-10 opacity-[0.05] mix-blend-soft-light"
      />

      <MenuBar
        clock={clock}
        day={day}
        position={positionName(career.level)}
        delivered={delivered}
        expired={expired}
        score={score}
      />

      <main className="relative flex flex-1 gap-5 overflow-hidden p-5">
        <InboxPanel slots={slots} onSelect={onSelect} />

        <section className="flex min-w-0 flex-1 items-start justify-center">
          {active ? (
            <div className="relative flex max-h-full w-full max-w-[44rem] flex-col">
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
            <div className="m-auto flex max-w-md flex-col items-center gap-5 px-6 text-center">
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
      </main>

      {/* Comanda: barra full-width na base do monitor, SEMPRE presente (altura
          reservada → backlog/janela não dão resize quando a demanda abre/fecha). */}
      <Comanda active={active} />

      {status !== 'playing' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/85 p-6 backdrop-blur-sm">
          {/* Fim de dia = boletim/carreira — o artefato de share (POSICIONAMENTO §3/§5). */}
          <div className="elev-2 w-full max-w-sm rounded-xl border border-edge bg-surface p-6 text-center">
            <p className="font-code text-[11px] uppercase tracking-[0.25em] text-ink-dim">
              Dia {day} · 17:00
            </p>
            <h2 className="mt-1 font-code text-2xl font-bold text-ink">fim do expediente</h2>

            {/* Promoção (o marco) ou a posição atual */}
            {dayResult?.promotedTo ? (
              <p className="mt-4 text-sm leading-relaxed text-ink">
                <span className="font-semibold text-amber">Promovido</span> a{' '}
                <span className="font-semibold text-amber">
                  {positionName(dayResult.promotedTo)}
                </span>{' '}
                🎉
              </p>
            ) : (
              <p className="mt-4 text-sm leading-relaxed text-ink">
                Fechou o dia como{' '}
                <span className="font-semibold text-amber">{positionName(career.level)}</span>.
              </p>
            )}

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

            {/* Barra pra próxima posição (o caminho a percorrer) */}
            <CareerBar career={career} />

            <div className="mt-4 flex items-center justify-center gap-4 font-mono text-[11px] text-ink-dim">
              <span>
                🔥 <span className="text-ink">{career.streak}</span> dias seguidos
              </span>
              <span>
                💰 <span className="text-ink tabular-nums">{Math.round(career.wallet)}</span>
              </span>
            </div>

            {/* Loja: gasta $ em cosméticos da mesa (identidade, nunca poder §6). */}
            <Shop career={career} onBuy={onBuy} />

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

/** Loja de cosméticos no boletim: compra com `$` da carreira. */
function Shop({ career, onBuy }: { career: Career; onBuy: (id: string, preco: number) => void }) {
  return (
    <div className="mt-5 border-t border-line pt-4 text-left">
      <p className="mb-2 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-ink-dim">
        loja · a sua mesa
      </p>
      <div className="flex flex-col gap-1.5">
        {COSMETICS.map((c) => {
          const owned = career.owned.includes(c.id);
          const canBuy = !owned && career.wallet >= c.preco;
          return (
            <div key={c.id} className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-ink">{c.nome}</p>
                <p className="truncate font-mono text-[10px] text-ink-dim">{c.desc}</p>
              </div>
              {owned ? (
                <span className="font-mono text-[11px] text-pass">✓ seu</span>
              ) : (
                <button
                  onClick={() => onBuy(c.id, c.preco)}
                  disabled={!canBuy}
                  className={`rounded-md px-2.5 py-1 font-mono text-[11px] tabular-nums transition-colors ${
                    canBuy
                      ? 'bg-amber/15 text-amber hover:bg-amber/25'
                      : 'cursor-not-allowed text-ink-dim'
                  }`}
                >
                  💰 {c.preco}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Barra do progresso pra próxima posição — o caminho a percorrer. */
function CareerBar({ career }: { career: Career }) {
  const { level, frac, toNext } = levelProgress(career.careerTotal);
  return (
    <div className="mt-5 text-left">
      <div className="mb-1 flex items-center justify-between font-mono text-[10px] text-ink-dim">
        <span className="text-ink">{positionName(level)}</span>
        {toNext !== null ? (
          <span>
            {positionName(level + 1)} · faltam {toNext}
          </span>
        ) : (
          <span>topo da carreira</span>
        )}
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-amber transition-[width]"
          style={{ width: `${frac * 100}%` }}
        />
      </div>
    </div>
  );
}
