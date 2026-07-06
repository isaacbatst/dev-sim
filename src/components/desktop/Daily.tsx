import { useEffect, useMemo, useState } from 'react';
import type { Career } from '@/store/gameStore';
import { TICKETS } from '@/data/tickets';
import { BRANCHES, eligibleNodes } from '@/data/taskTree';
import { playSound } from '@/store/sound';
import { TreeView } from './TreeView';

/**
 * A DAILY (PROGRESSAO §3): a standup abre o expediente. O chefe apresenta os
 * nós elegíveis da árvore e o jogador LIBERA UM TIPO de task por dia — o
 * relógio só anda depois da escolha ("o chefe não aceita silêncio na daily").
 * HUD sobre o quarto (hud-night), como o boletim — a simetria do dia: começa
 * longe da mesa (daily), senta (trabalho), 17:00 se afasta (boletim).
 */
export function Daily({
  day,
  career,
  onPick,
  onBegin,
}: {
  day: number;
  career: Career;
  onPick: (id: string) => void;
  onBegin: () => void;
}) {
  const [tree, setTree] = useState(false);
  const eligible = useMemo(() => eligibleNodes(career.unlockedTasks), [career.unlockedTasks]);
  // Escolheu → a confirmação deriva do estado persistido (robusto a reload).
  const picked = career.lastPickDay >= day;
  const pickedName = picked
    ? (TICKETS[career.unlockedTasks[career.unlockedTasks.length - 1]]?.name ?? '')
    : null;

  const pick = (id: string) => {
    playSound('select');
    onPick(id);
  };

  // Teclado: 1–N escolhe (como tudo no jogo); Enter começa o dia após escolher.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (tree) {
        if (e.key === 'Enter' || e.key === 'Escape') setTree(false);
        return;
      }
      if (e.repeat) return;
      if (!picked && e.key >= '1' && e.key <= String(Math.min(9, eligible.length))) {
        const n = eligible[Number(e.key) - 1];
        if (n) pick(n.id);
        return;
      }
      if (e.key === 'Enter' && picked) onBegin();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="hud-night absolute inset-0 z-30 overflow-y-auto bg-black/75 backdrop-blur-[5px]">
      <div className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-6 py-10">
        <div className="beat-in">
          <p className="font-code text-[11px] uppercase tracking-[0.3em] text-ink-dim">
            dia {day} · 09:00 · daily
          </p>
          <h2 className="mt-1 font-code text-3xl font-bold text-ink">
            {day === 1 ? 'seu primeiro dia' : 'bom dia'}
          </h2>
        </div>

        {!picked ? (
          <div className="beat-in mt-6">
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <p className="text-sm leading-relaxed text-ink">
                {day === 1 ? (
                  <>
                    Na daily, o chefe pergunta:{' '}
                    <span className="font-semibold">que tipo de dev você é?</span> Libere seu
                    primeiro tipo de demanda:
                  </>
                ) : (
                  <>
                    O chefe distribui as demandas. Libere um tipo{' '}
                    <span className="font-semibold text-amber">novo</span> — aprofunde um ramo ou
                    abra outro:
                  </>
                )}
              </p>
              <button
                onClick={() => setTree(true)}
                className="shrink-0 font-mono text-[10px] text-ink-dim underline decoration-line underline-offset-2 transition-colors hover:text-amber"
              >
                ver a árvore
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              {eligible.map((n, i) => {
                const b = BRANCHES[n.branch];
                return (
                  <button
                    key={n.id}
                    onClick={() => pick(n.id)}
                    className="pick-card flex items-center gap-3 rounded-md px-3 py-2 text-left"
                  >
                    <kbd className="keycap !h-8 !min-w-8 shrink-0 !text-sm">{i + 1}</kbd>
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-dim">
                        <span
                          aria-hidden
                          className="size-2 rounded-[2px]"
                          style={{ background: b.cor }}
                        />
                        {b.nome}
                      </span>
                      <span className="mt-0.5 block text-sm font-semibold text-ink">
                        {TICKETS[n.id]?.name ?? n.id}
                      </span>
                      <span className="mt-0.5 block font-mono text-[10px] leading-relaxed text-ink-dim">
                        {n.gesto}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-4 font-mono text-[10px] text-ink-dim">
              o chefe não aceita silêncio na daily — o expediente começa depois da escolha
            </p>
          </div>
        ) : (
          <div className="beat-in mt-6">
            <p className="text-sm leading-relaxed text-ink">
              Fechado: <span className="font-semibold text-amber">{pickedName}</span> começa a
              chegar no seu backlog hoje. <span className="text-pass">✓</span>
            </p>
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => setTree(true)}
                className="font-mono text-[10px] text-ink-dim underline decoration-line underline-offset-2 transition-colors hover:text-amber"
              >
                ver a árvore
              </button>
              <button
                onClick={onBegin}
                className="rounded-lg border border-amber px-5 py-2 font-grotesk font-semibold text-amber transition-colors hover:bg-amber/10"
              >
                Começar o dia ⏎
              </button>
            </div>
          </div>
        )}
      </div>

      {tree && (
        <TreeView
          career={career}
          eligible={eligible}
          canPick={!picked}
          onPick={pick}
          onClose={() => setTree(false)}
        />
      )}
    </div>
  );
}
