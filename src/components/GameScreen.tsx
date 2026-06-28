'use client';

import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import type { Priority } from '@/core/domain/types';

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

export function GameScreen() {
  const snapshot = useGameStore((s) => s.snapshot);
  const start = useGameStore((s) => s.start);
  const restart = useGameStore((s) => s.restart);
  const selectSlot = useGameStore((s) => s.selectSlot);
  const pressKey = useGameStore((s) => s.pressKey);
  const deliver = useGameStore((s) => s.deliver);

  // Inicia o loop uma vez, ao montar.
  useEffect(() => start(), [start]);

  // Captura de teclado: 1-5 seleciona, Enter entrega, demais teclas viram input.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key >= '1' && e.key <= '5') {
        selectSlot(Number(e.key) - 1);
        return;
      }
      if (e.key === 'Enter') {
        deliver();
        return;
      }
      if (e.key.length === 1) pressKey(e.key);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectSlot, pressKey, deliver]);

  if (!snapshot) {
    return <main className="flex flex-1 items-center justify-center font-mono">Carregando…</main>;
  }

  const { status, clock, satisfaction, delivered, slots, active } = snapshot;

  return (
    <main className="relative flex flex-1 flex-col gap-3 p-4 font-mono text-sm">
      {/* Top bar */}
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
        {/* Fila */}
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
                  <span
                    className={`w-fit rounded border px-1 text-[10px] ${PRIORITY_COLOR[slot.priority]}`}
                  >
                    {PRIORITY_LABEL[slot.priority]}
                    {slot.ready ? ' ✓' : ''}
                  </span>
                </span>
              ) : (
                <span className="text-xs text-zinc-600">vazio</span>
              )}
            </button>
          ))}
        </aside>

        {/* Ticket ativo */}
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
              <p className="mb-2 text-xs text-zinc-500">
                {active.taskTitle} ({active.taskIndex + 1}/{active.taskCount})
              </p>

              {active.ready ? (
                <p className="animate-pulse text-emerald-400">
                  Pronto! Pressione ENTER para entregar.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {active.inputs.map((t, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <kbd
                        className={`flex h-10 w-10 items-center justify-center rounded border text-lg font-bold uppercase ${
                          t.done
                            ? 'border-emerald-600 bg-emerald-900/40 text-emerald-400'
                            : t.current
                              ? 'border-emerald-400 bg-zinc-800 text-emerald-300 ring-2 ring-emerald-400'
                              : 'border-zinc-600 text-zinc-400'
                        }`}
                      >
                        {t.key}
                      </kbd>
                      <span className={t.done ? 'text-zinc-600 line-through' : 'text-zinc-300'}>
                        {t.label}
                      </span>
                    </div>
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
        1–5 selecionar &nbsp;·&nbsp; teclas indicadas executar &nbsp;·&nbsp; ENTER entregar
      </footer>

      {/* Overlay de fim de jogo */}
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
