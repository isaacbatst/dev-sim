import { useEffect, useMemo, useRef, useState } from 'react';
import type { Snapshot } from '@/core/snapshot';
import type { Career, DayResult } from '@/store/gameStore';
import { positionName, levelProgress } from '@/data/positions';
import { COSMETICS } from '@/data/cosmetics';
import { TICKETS } from '@/data/tickets';
import { BRANCHES, TASK_TREE, eligibleNodes, type TreeNode } from '@/data/taskTree';
import { playSound } from '@/store/sound';

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
  onPickTask,
}: {
  snapshot: Snapshot;
  day: number;
  career: Career;
  dayResult: DayResult | null;
  onNextDay: () => void;
  onBuy: (id: string, preco: number) => void;
  onPickTask: (id: string) => void;
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

  // Enter: revela tudo; revelado, avança o dia (só quando a escolha não fica pendente
  // por acidente: se há escolha disponível e não feita, o Enter não avança — clique).
  const pickedToday = career.lastPickDay >= day;
  const eligible = useMemo(() => eligibleNodes(career.unlockedTasks), [career.unlockedTasks]);
  const pickPending = !pickedToday && eligible.length > 0;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (tree) {
        if (e.key === 'Enter' || e.key === 'Escape') setTree(false);
        return;
      }
      if (e.key !== 'Enter' || e.repeat) return;
      if (beat < MAX) skip();
      else if (!pickPending) onNextDay();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [beat, tree, pickPending, onNextDay]);

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

        {/* batida 1 — A NOTA: carimbo + contagem */}
        {beat >= 1 && (
          <div className="beat-in mt-7 flex items-center gap-5">
            <Carimbo grade={dayGrade(score)} />
            <div>
              <CountUp value={score} active={beat >= 1} />
              <p className="font-mono text-[10px] uppercase tracking-wider text-ink-dim">
                nota do dia
              </p>
              <p className="mt-1.5 font-mono text-xs">
                <span className="text-pass">✓ {delivered} entregues</span>
                {expired > 0 && <span className="ml-3 text-fail">✕ {expired} perdidas</span>}
              </p>
            </div>
          </div>
        )}

        {/* batida 2 — promoção (o marco raro) */}
        {beat >= 2 && promoted && (
          <p className="beat-in mt-6 text-lg leading-relaxed text-ink">
            <span className="font-bold text-amber">promovido a {positionName(promoted)}</span> 🎉
          </p>
        )}

        {/* batida 3 — carreira enchendo + streak/carteira */}
        {beat >= 3 && (
          <div className="beat-in mt-6">
            <CareerFill career={career} gained={dayResult?.gained ?? 0} promoted={!!promoted} />
            <p className="mt-3 font-mono text-[11px] text-ink-dim">
              🔥 <span className="text-ink">{career.streak}</span>{' '}
              {career.streak === 1 ? 'dia' : 'dias seguidos'}
              <span className="mx-3 text-ink-dim/50">·</span>💰{' '}
              <span className="text-ink tabular-nums">{Math.round(career.wallet)}</span>
            </p>
          </div>
        )}

        {/* batida 4 — o presente: a escolha do dia + ações */}
        {beat >= 4 && (
          <div className="beat-in mt-7">
            <TaskPick
              career={career}
              pickedToday={pickedToday}
              eligible={eligible}
              onPick={onPickTask}
              onShowTree={() => setTree(true)}
            />
            <ShopFold career={career} onBuy={onBuy} />
            <div className="mt-7 flex items-center justify-between">
              <span className="font-mono text-[10px] text-ink-dim">
                {pickPending ? 'escolha a demanda de amanhã' : 'Enter avança'}
              </span>
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

      {tree && <TreeView career={career} eligible={eligible} onClose={() => setTree(false)} />}
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
  return <span className="font-mono text-3xl font-bold tabular-nums text-ink">{shown}</span>;
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

/** A escolha do dia: cards com a LOMBADA do ramo (cor + identidade). */
function TaskPick({
  career,
  pickedToday,
  eligible,
  onPick,
  onShowTree,
}: {
  career: Career;
  pickedToday: boolean;
  eligible: TreeNode[];
  onPick: (id: string) => void;
  onShowTree: () => void;
}) {
  if (pickedToday) {
    const last = career.unlockedTasks[career.unlockedTasks.length - 1];
    const name = last ? (TICKETS[last]?.name ?? last) : null;
    if (!name) return null;
    return (
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] text-ink-dim">
          <span className="text-pass">✓</span> amanhã no backlog:{' '}
          <span className="text-ink">{name}</span>
        </p>
        <TreeButton onClick={onShowTree} />
      </div>
    );
  }
  if (eligible.length === 0) return null;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber">
          nova demanda — escolha uma
        </p>
        <TreeButton onClick={onShowTree} />
      </div>
      <div className="flex flex-col gap-1.5">
        {eligible.map((n) => {
          const b = BRANCHES[n.branch];
          return (
            <button
              key={n.id}
              onClick={() => onPick(n.id)}
              className="group rounded-md border border-line/60 bg-surface/90 py-2 pl-3 pr-3 text-left transition-colors hover:border-amber/60 hover:bg-amber/10"
              style={{ borderLeft: `3px solid ${b.cor}` }}
            >
              <p
                className="font-mono text-[9px] uppercase tracking-[0.18em]"
                style={{ color: b.cor }}
              >
                {b.nome}
              </p>
              <p className="mt-0.5 text-sm font-semibold text-ink group-hover:text-amber">
                {TICKETS[n.id]?.name ?? n.id}
              </p>
              <p className="mt-0.5 font-mono text-[10px] leading-relaxed text-ink-dim">{n.gesto}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TreeButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="font-mono text-[10px] text-ink-dim underline decoration-line underline-offset-2 transition-colors hover:text-amber"
    >
      ver a árvore completa
    </button>
  );
}

/** Profundidade do nó na árvore (corrente de pré-requisitos). */
function depthOf(n: TreeNode): number {
  let d = 0;
  let cur: TreeNode | undefined = n;
  while (cur && cur.requires.length > 0) {
    cur = TASK_TREE.find((x) => x.id === cur!.requires[0]);
    d += 1;
  }
  return d;
}

/** A árvore completa: 4 colunas (ramos), estados ● seu · ◇ escolhível · 🔒. */
function TreeView({
  career,
  eligible,
  onClose,
}: {
  career: Career;
  eligible: TreeNode[];
  onClose: () => void;
}) {
  const owned = new Set(career.unlockedTasks);
  const eligibleIds = new Set(eligible.map((n) => n.id));
  const branches = Object.entries(BRANCHES) as [
    keyof typeof BRANCHES,
    { nome: string; cor: string },
  ][];
  return (
    <div
      className="absolute inset-0 z-40 overflow-y-auto bg-black/85 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="mx-auto flex min-h-full w-full max-w-3xl flex-col justify-center px-6 py-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-baseline justify-between">
          <h3 className="font-code text-xl font-bold text-ink">a árvore</h3>
          <button
            onClick={onClose}
            className="font-mono text-[11px] text-ink-dim transition-colors hover:text-amber"
          >
            voltar ⏎
          </button>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
          {branches.map(([bid, b]) => (
            <div key={bid}>
              <p
                className="mb-2 border-b pb-1 font-mono text-[10px] uppercase tracking-[0.2em]"
                style={{ color: b.cor, borderColor: `${b.cor}44` }}
              >
                {b.nome}
              </p>
              <div className="flex flex-col gap-1">
                {TASK_TREE.filter((n) => n.branch === bid).map((n) => {
                  const isOwned = owned.has(n.id);
                  const isEligible = eligibleIds.has(n.id);
                  const d = depthOf(n);
                  const req = n.requires[0]
                    ? (TICKETS[n.requires[0]]?.name ?? n.requires[0])
                    : null;
                  return (
                    <div
                      key={n.id}
                      className="flex items-start gap-1.5 font-mono text-[11px] leading-5"
                      style={{ paddingLeft: d * 14 }}
                      title={isOwned ? n.gesto : isEligible ? n.gesto : req ? `exige ${req}` : ''}
                    >
                      {d > 0 && <span className="text-ink-dim/40">└</span>}
                      {isOwned ? (
                        <span style={{ color: b.cor }}>●</span>
                      ) : isEligible ? (
                        <span className="animate-edgepulse text-amber">◇</span>
                      ) : (
                        <span className="text-ink-dim/70">○</span>
                      )}
                      <span
                        className={
                          isOwned ? 'text-ink' : isEligible ? 'text-amber' : 'text-ink-dim'
                        }
                      >
                        {TICKETS[n.id]?.name ?? n.id}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-8 font-mono text-[10px] text-ink-dim">
          <span className="text-ink">●</span> seu · <span className="text-amber">◇</span> escolhível
          hoje · ○ exige o anterior — uma escolha por dia, tudo alcançável
        </p>
      </div>
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
