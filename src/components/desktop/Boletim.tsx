import { useEffect, useMemo, useRef, useState } from 'react';
import type { Snapshot } from '@/core/snapshot';
import type { Career, DayResult } from '@/store/gameStore';
import { positionName, levelProgress } from '@/data/positions';
import { COSMETICS } from '@/data/cosmetics';
import { eligibleNodes } from '@/data/taskTree';
import { playSound } from '@/store/sound';
import { TreeView } from './TreeView';

/** Nota do dia → letra (boletim). Limiares chutados — afinar no playtest. */
function dayGrade(score: number): string {
  if (score >= 600) return 'S';
  if (score >= 400) return 'A';
  if (score >= 250) return 'B';
  if (score >= 120) return 'C';
  return 'D';
}

const GRADE_COLOR: Record<string, string> = {
  S: 'var(--amber)',
  A: 'var(--amber)',
  B: 'var(--ink)',
  C: 'var(--ink)',
  D: 'var(--fail)',
};

function reducedMotion(): boolean {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Boletim de fim de expediente — HUD (fora do monitor/câmera, como o BreakHud).
 * A cena recua da mesa; o boletim chega em BATIDAS sobre o quarto escurecido:
 * 17:00 → a nota (carimbo + contagem) → promoção (rara) → carreira/streak →
 * a escolha do dia (o presente por último). Enter/clique pula tudo.
 */
export function Boletim({
  snapshot,
  day,
  career,
  dayResult,
  onNextDay,
  onBuy,
}: {
  snapshot: Snapshot;
  day: number;
  career: Career;
  dayResult: DayResult | null;
  onNextDay: () => void;
  onBuy: (id: string, preco: number) => void;
}) {
  const { score, delivered, expired } = snapshot;
  const promoted = dayResult?.promotedTo ?? null;
  // Batidas: 1 nota · 2 promoção (se houver) · 3 carreira · 4 escolha+ações.
  const MAX = 4;
  const [beat, setBeat] = useState(() => (reducedMotion() ? MAX : 0));
  const [tree, setTree] = useState(false);

  // Avanço automático das batidas (com tick sonoro); pular = revelar tudo.
  useEffect(() => {
    if (beat >= MAX) return;
    const t = setTimeout(
      () => {
        setBeat((b) => b + 1);
        playSound(beat + 1 === 1 ? 'ready' : promoted && beat + 1 === 2 ? 'deliver' : 'step');
      },
      beat === 0 ? 650 : 750,
    );
    return () => clearTimeout(t);
  }, [beat, promoted]);

  const skip = () => setBeat(MAX);

  // Enter: revela tudo; revelado, avança o dia. (A escolha da árvore mora na
  // DAILY da manhã — o boletim só narra e dá acesso ao mapa.)
  const eligible = useMemo(() => eligibleNodes(career.unlockedTasks), [career.unlockedTasks]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (tree) {
        if (e.key === 'Enter' || e.key === 'Escape') setTree(false);
        return;
      }
      if (e.key !== 'Enter' || e.repeat) return;
      if (beat < MAX) skip();
      else onNextDay();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [beat, tree, onNextDay]);

  return (
    <div
      className="hud-night absolute inset-0 z-30 overflow-y-auto bg-black/75 backdrop-blur-[5px]"
      onClick={beat < MAX ? skip : undefined}
    >
      <div className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-6 py-10">
        {/* batida 0 — o sino das 17:00 */}
        <div className="beat-in">
          <p className="font-code text-[11px] uppercase tracking-[0.3em] text-ink-dim">
            dia {day} · 17:00
          </p>
          <h2 className="mt-1 font-code text-3xl font-bold text-ink">fim do expediente</h2>
        </div>

        {/* batida 1 — A NOTA, contada como o dia foi (narrativa, não painel) */}
        {beat >= 1 && (
          <div className="beat-in mt-7 flex items-center gap-5">
            <Carimbo grade={dayGrade(score)} />
            <div className="text-sm leading-relaxed text-ink">
              <p>
                {delivered > 0 ? (
                  <>
                    Você entregou{' '}
                    <span className="font-semibold text-pass">
                      {delivered} {delivered === 1 ? 'demanda' : 'demandas'}
                    </span>
                  </>
                ) : (
                  <>Nenhuma entrega hoje — acontece</>
                )}
                {expired > 0 ? (
                  <>
                    ; <span className="font-semibold text-fail">{expired}</span>{' '}
                    {expired === 1 ? 'estourou o prazo' : 'estouraram o prazo'}.
                  </>
                ) : (
                  '.'
                )}
              </p>
              <p className="mt-1">
                O dia rendeu <CountUp value={score} active={beat >= 1} /> de nota.
              </p>
            </div>
          </div>
        )}

        {/* batida 2 — promoção (o marco raro) */}
        {beat >= 2 && promoted && (
          <p className="beat-in mt-6 text-lg leading-relaxed text-ink">
            O esforço foi notado:{' '}
            <span className="font-bold text-amber">promovido a {positionName(promoted)}</span> 🎉
          </p>
        )}

        {/* batida 3 — a carreira enchendo + a corrente */}
        {beat >= 3 && (
          <div className="beat-in mt-6">
            <CareerFill career={career} gained={dayResult?.gained ?? 0} promoted={!!promoted} />
            <p className="mt-3 text-sm leading-relaxed text-ink-dim">
              {career.streak === 1 ? (
                <>Primeiro dia da corrente.</>
              ) : (
                <>
                  <span className="text-ink">🔥 {career.streak} dias</span> sem quebrar a corrente.
                </>
              )}{' '}
              <span className="font-mono text-ink tabular-nums">$ {Math.round(career.wallet)}</span>{' '}
              na carteira.
            </p>
          </div>
        )}

        {/* batida 4 — ações (a escolha da árvore acontece na daily de amanhã) */}
        {beat >= 4 && (
          <div className="beat-in mt-7">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm leading-relaxed text-ink-dim">
                {eligible.length > 0 ? (
                  <>
                    Amanhã, na daily, tem tipo <span className="text-amber">novo</span> de demanda
                    pra escolher.
                  </>
                ) : (
                  <>A árvore está completa — você já viu de tudo nessa firma.</>
                )}
              </p>
              <button
                onClick={() => setTree(true)}
                className="shrink-0 font-mono text-[10px] text-ink-dim underline decoration-line underline-offset-2 transition-colors hover:text-amber"
              >
                ver a árvore
              </button>
            </div>
            <ShopFold career={career} onBuy={onBuy} />
            <div className="mt-7 flex items-center justify-between">
              <span className="font-mono text-[10px] text-ink-dim">Enter avança</span>
              <button
                onClick={onNextDay}
                className="rounded-lg border border-amber px-5 py-2 font-grotesk font-semibold text-amber transition-colors hover:bg-amber/10"
              >
                Próximo dia ⏎
              </button>
            </div>
          </div>
        )}
      </div>

      {tree && (
        <TreeView
          career={career}
          eligible={eligible}
          canPick={false}
          onPick={() => {}}
          onClose={() => setTree(false)}
        />
      )}
    </div>
  );
}

/** O carimbo da nota: bate torto na página, como boletim de escola. */
function Carimbo({ grade }: { grade: string }) {
  return (
    <span
      className="carimbo-in inline-flex size-20 shrink-0 items-center justify-center rounded-xl border-[3px] font-code text-5xl font-bold"
      style={{ color: GRADE_COLOR[grade], borderColor: GRADE_COLOR[grade] }}
    >
      {grade}
    </span>
  );
}

/** Número da nota subindo (rAF ~700ms); respeita reduced motion. */
function CountUp({ value, active }: { value: number; active: boolean }) {
  const [shown, setShown] = useState(() => (reducedMotion() ? value : 0));
  const started = useRef(false);
  useEffect(() => {
    if (!active || started.current) return;
    started.current = true;
    const instant = reducedMotion() || value <= 0;
    const t0 = performance.now();
    const DUR = 700;
    let raf = 0;
    const step = (t: number) => {
      if (instant) {
        setShown(value);
        return;
      }
      const f = Math.min(1, (t - t0) / DUR);
      setShown(Math.round(value * (1 - Math.pow(1 - f, 3))));
      if (f < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [active, value]);
  return <span className="font-mono text-xl font-bold tabular-nums text-amber">{shown}</span>;
}

/** Barra da carreira ENCHENDO o ganho do dia ao vivo (de antes → depois). */
function CareerFill({
  career,
  gained,
  promoted,
}: {
  career: Career;
  gained: number;
  promoted: boolean;
}) {
  const after = levelProgress(career.careerTotal);
  // Promoveu → a barra do NOVO nível começa do zero; senão, do valor de ontem.
  const beforeFrac = promoted ? 0 : levelProgress(career.careerTotal - gained).frac;
  const [fill, setFill] = useState(() => (reducedMotion() ? after.frac : beforeFrac));
  useEffect(() => {
    const t = setTimeout(() => setFill(after.frac), 60);
    return () => clearTimeout(t);
  }, [after.frac]);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between font-mono text-[10px] text-ink-dim">
        <span className="text-ink">{positionName(after.level)}</span>
        {after.toNext !== null ? (
          <span>
            {positionName(after.level + 1)} · faltam {after.toNext}
          </span>
        ) : (
          <span>topo da carreira</span>
        )}
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
        <div
          className="h-full rounded-full bg-amber transition-[width] duration-1000 ease-out motion-reduce:transition-none"
          style={{ width: `${fill * 100}%` }}
        />
      </div>
      {gained > 0 && (
        <p className="mt-1 text-right font-mono text-[10px] text-pass">+{gained} hoje</p>
      )}
    </div>
  );
}

/** Loja recolhida atrás de um toggle — navegação opcional, não parte do rito. */
function ShopFold({
  career,
  onBuy,
}: {
  career: Career;
  onBuy: (id: string, preco: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const pendentes = COSMETICS.filter((c) => !career.owned.includes(c.id)).length;
  if (pendentes === 0 && !open) return null;
  return (
    <div className="mt-5">
      <button
        onClick={() => setOpen(!open)}
        className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-dim transition-colors hover:text-ink"
      >
        loja · a sua mesa {open ? '▾' : '▸'}
      </button>
      {open && (
        <div className="mt-2 flex flex-col gap-1.5">
          {COSMETICS.map((c) => {
            const isOwned = career.owned.includes(c.id);
            const canBuy = !isOwned && career.wallet >= c.preco;
            return (
              <div key={c.id} className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink">{c.nome}</p>
                  <p className="truncate font-mono text-[10px] text-ink-dim">{c.desc}</p>
                </div>
                {isOwned ? (
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
      )}
    </div>
  );
}
