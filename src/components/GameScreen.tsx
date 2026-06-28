'use client';

import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import type { Priority } from '@/core/domain/types';
import type { SegmentView } from '@/core/snapshot';

const PRIORITY_LABEL: Record<Priority, string> = {
  urgente: 'URGENTE',
  alta: 'ALTA',
  normal: 'NORMAL',
  baixa: 'BAIXA',
};

const PRIORITY_COLOR: Record<Priority, string> = {
  urgente: 'text-red-400 border-red-400',
  alta: 'text-orange-400 border-orange-400',
  normal: 'text-sky-400 border-sky-400',
  baixa: 'text-zinc-400 border-zinc-400',
};

const ARROW_GLYPH: Record<string, string> = {
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
};

function Key({
  children,
  state,
}: {
  children: React.ReactNode;
  state: 'done' | 'current' | 'idle' | 'wrong';
}) {
  const styles = {
    done: 'border-emerald-600 bg-emerald-900/40 text-emerald-400',
    current: 'border-emerald-400 bg-zinc-800 text-emerald-300 ring-2 ring-emerald-400',
    idle: 'border-zinc-600 text-zinc-400',
    wrong: 'border-red-500 bg-red-900/40 text-red-300',
  }[state];
  return (
    <kbd
      className={`flex h-10 min-w-10 items-center justify-center rounded border px-2 text-lg font-bold uppercase ${styles}`}
    >
      {children}
    </kbd>
  );
}

function Segment({ seg }: { seg: SegmentView }) {
  switch (seg.type) {
    case 'press':
      return (
        <div className="flex flex-col gap-3">
          {seg.tokens.map((t, i) => (
            <div key={i} className="flex items-center gap-3">
              <Key state={t.done ? 'done' : t.current ? 'current' : 'idle'}>{t.key}</Key>
              <span className={t.done ? 'text-zinc-600 line-through' : 'text-zinc-300'}>
                {t.label}
              </span>
            </div>
          ))}
        </div>
      );
    case 'hold':
      return (
        <div className="flex items-center gap-3">
          <Key state={seg.holding ? 'current' : 'idle'}>{seg.key}</Key>
          <div className="flex flex-col gap-1">
            <span className="text-zinc-300">
              Segurar — {seg.label} ({seg.targetSec}s)
            </span>
            <div className="h-2 w-48 overflow-hidden rounded bg-zinc-800">
              <div className="h-full bg-amber-400" style={{ width: `${seg.progress * 100}%` }} />
            </div>
          </div>
        </div>
      );
    case 'nav':
      return (
        <div className="flex items-center gap-3">
          <Key state="current">{ARROW_GLYPH[seg.direction] ?? seg.symbol}</Key>
          <span className="text-zinc-300">
            {seg.symbol} {seg.count}/{seg.target}
          </span>
        </div>
      );
    case 'selection':
      return (
        <div className="flex flex-col gap-2">
          <span className="text-zinc-300">
            Selecionar: <strong className="text-emerald-300">{seg.prompt}</strong>
          </span>
          <div className="flex gap-2">
            {seg.options.map((o) => (
              <div key={o.key} className="flex items-center gap-1">
                <Key state={seg.chosenKey === o.key ? (seg.wrong ? 'wrong' : 'done') : 'idle'}>
                  {o.key}
                </Key>
                <span className="text-xs text-zinc-400">{o.label}</span>
              </div>
            ))}
          </div>
        </div>
      );
    case 'wait':
      return (
        <div className="flex items-center gap-3">
          <span className="text-2xl">⏳</span>
          <div className="flex flex-col gap-1">
            <span className="text-zinc-400">
              Aguardando code review… {Math.ceil(seg.remaining)}s (trabalhe em outra demanda)
            </span>
            <div className="h-2 w-48 overflow-hidden rounded bg-zinc-800">
              <div className="h-full bg-sky-500" style={{ width: `${seg.progress * 100}%` }} />
            </div>
          </div>
        </div>
      );
  }
}

export function GameScreen() {
  const snapshot = useGameStore((s) => s.snapshot);
  const start = useGameStore((s) => s.start);
  const restart = useGameStore((s) => s.restart);
  const selectSlot = useGameStore((s) => s.selectSlot);
  const keyDown = useGameStore((s) => s.keyDown);
  const keyUp = useGameStore((s) => s.keyUp);
  const deliver = useGameStore((s) => s.deliver);

  useEffect(() => start(), [start]);

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.key.startsWith('Arrow')) e.preventDefault();
      if (e.repeat) return;
      if (e.key >= '1' && e.key <= '5') return selectSlot(Number(e.key) - 1);
      if (e.key === 'Enter') return deliver();
      keyDown(e.key);
    };
    const onUp = (e: KeyboardEvent) => keyUp(e.key);
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [selectSlot, keyDown, keyUp, deliver]);

  if (!snapshot) {
    return <main className="flex flex-1 items-center justify-center font-mono">Carregando…</main>;
  }

  const { status, clock, satisfaction, delivered, slots, active } = snapshot;

  return (
    <main className="relative flex flex-1 flex-col gap-3 p-4 font-mono text-sm">
      <header className="flex items-center gap-4 rounded-md border border-zinc-700 px-4 py-2">
        <span className="text-lg">{satisfaction > 30 ? ':)' : ':('}</span>
        <div className="h-3 flex-1 overflow-hidden rounded bg-zinc-800">
          <div
            className={`h-full transition-[width] duration-150 ${
              satisfaction > 30 ? 'bg-emerald-500' : 'bg-red-500'
            }`}
            style={{ width: `${satisfaction}%` }}
          />
        </div>
        <span className="w-10 text-right tabular-nums">{satisfaction}%</span>
        <span className="tabular-nums text-zinc-400">{clock}</span>
        <span className="text-zinc-400">DONE: {delivered}</span>
      </header>

      <div className="flex flex-1 gap-3">
        <aside className="flex w-64 flex-col gap-2">
          <h2 className="text-xs uppercase tracking-wider text-zinc-500">Inbox</h2>
          {slots.map((slot, i) => (
            <button
              key={i}
              onClick={() => selectSlot(i)}
              className={`flex min-h-14 items-start gap-2 rounded-md border px-2 py-2 text-left ${
                slot?.active ? 'border-emerald-400 bg-zinc-800' : 'border-zinc-700'
              } ${slot ? 'cursor-pointer' : 'cursor-default opacity-40'}`}
            >
              <span className="text-zinc-500">{i + 1}</span>
              {slot ? (
                <span className="flex flex-col gap-1">
                  <span className="line-clamp-2 text-xs leading-tight">{slot.name}</span>
                  <span className="flex items-center gap-1">
                    <span
                      className={`w-fit rounded border px-1 text-[10px] ${PRIORITY_COLOR[slot.priority]}`}
                    >
                      {PRIORITY_LABEL[slot.priority]}
                    </span>
                    {slot.ready && <span className="text-[10px] text-emerald-400">✓ pronto</span>}
                    {slot.waitRemaining !== null && (
                      <span className="text-[10px] text-sky-400">⏳ {slot.waitRemaining}s</span>
                    )}
                  </span>
                </span>
              ) : (
                <span className="text-xs text-zinc-600">vazio</span>
              )}
            </button>
          ))}
        </aside>

        <section className="flex flex-1 flex-col rounded-md border border-zinc-700 p-4">
          {active ? (
            <>
              <div className="mb-1 flex items-center gap-2">
                <h3 className="text-base font-bold">{active.name}</h3>
                <span
                  className={`rounded border px-1 text-[10px] ${PRIORITY_COLOR[active.priority]}`}
                >
                  {PRIORITY_LABEL[active.priority]}
                </span>
              </div>
              <p className="mb-4 text-xs text-zinc-400">{active.description}</p>
              <p className="mb-3 text-xs text-zinc-500">
                {active.taskTitle} ({active.taskIndex + 1}/{active.taskCount})
              </p>

              {active.ready ? (
                <p className="animate-pulse text-emerald-400">
                  Pronto! Pressione ENTER para entregar.
                </p>
              ) : (
                <div className="flex flex-col gap-4">
                  {active.segments.map((seg, i) => (
                    <Segment key={i} seg={seg} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-zinc-500">
              Selecione uma demanda (teclas 1–5)
            </div>
          )}
        </section>
      </div>

      <footer className="rounded-md border border-zinc-700 px-4 py-2 text-xs text-zinc-500">
        1–5 selecionar &nbsp;·&nbsp; teclas/setas executar &nbsp;·&nbsp; ENTER entregar
      </footer>

      {status !== 'playing' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80">
          <h2 className="text-3xl font-bold">
            {status === 'won' ? '17:00 — Você sobreviveu! 🎉' : 'Game Over — chefe a 0% 💀'}
          </h2>
          <p className="text-zinc-400">Demandas entregues: {delivered}</p>
          <button
            onClick={restart}
            className="rounded border border-emerald-400 px-4 py-2 text-emerald-300 hover:bg-emerald-400/10"
          >
            Jogar de novo
          </button>
        </div>
      )}
    </main>
  );
}
