'use client';

import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Desktop } from './desktop/Desktop';
import { Workstation } from './desktop/Workstation';

export function GameScreen() {
  const snapshot = useGameStore((s) => s.snapshot);
  const start = useGameStore((s) => s.start);
  const restart = useGameStore((s) => s.restart);
  const selectSlot = useGameStore((s) => s.selectSlot);
  const keyDown = useGameStore((s) => s.keyDown);
  const keyUp = useGameStore((s) => s.keyUp);
  const confirm = useGameStore((s) => s.confirm);

  const [shake, setShake] = useState(false);
  const [floatScore, setFloatScore] = useState<string | null>(null);
  // Aba da janela: começa em "details" (a comanda) e alterna com Tab.
  const [view, setView] = useState<'work' | 'details'>('details');
  const prev = useRef<{ delivered: number; errors: number }>({ delivered: 0, errors: 0 });

  useEffect(() => start(), [start]);

  // Ao pegar uma nova demanda, abre nos Detalhes (#1) — reset por mudança de id,
  // padrão do React de ajustar estado durante o render (sem effect).
  const activeId = snapshot?.active?.id ?? null;
  const [seenId, setSeenId] = useState<number | null>(activeId);
  if (activeId !== seenId) {
    setSeenId(activeId);
    if (activeId !== null) setView('details');
  }

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.key.startsWith('Arrow') || e.key === 'Tab') e.preventDefault();
      if (e.repeat) return;
      if (e.key === 'Tab') return setView((v) => (v === 'work' ? 'details' : 'work'));
      if (e.key >= '1' && e.key <= '5') return selectSlot(Number(e.key) - 1);
      // Na aba Detalhes as ações ficam desativadas — só leitura da comanda.
      if (view === 'details') return;
      if (e.key === 'Enter') return confirm();
      keyDown(e.key);
    };
    const onUp = (e: KeyboardEvent) => keyUp(e.key);
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [selectSlot, keyDown, keyUp, confirm, view]);

  // Juice por diff de snapshot: entrega → "+", erro → shake.
  useEffect(() => {
    if (!snapshot) return;
    if (snapshot.delivered > prev.current.delivered) {
      setFloatScore('entregue ✓');
      const t = setTimeout(() => setFloatScore(null), 900);
      prev.current.delivered = snapshot.delivered;
      return () => clearTimeout(t);
    }
    const errs = snapshot.activeErrors;
    if (errs > prev.current.errors) {
      setShake(true);
      const t = setTimeout(() => setShake(false), 220);
      prev.current.errors = errs;
      return () => clearTimeout(t);
    }
    prev.current.errors = errs;
  }, [snapshot]);

  if (!snapshot) {
    return (
      <main className="flex h-dvh items-center justify-center font-mono text-ink-dim">
        carregando devOS…
      </main>
    );
  }

  return (
    <Workstation clock={snapshot.clock}>
      <Desktop
        snapshot={snapshot}
        shake={shake}
        floatScore={floatScore}
        view={view}
        onView={setView}
        onSelect={selectSlot}
        onRestart={restart}
      />
    </Workstation>
  );
}
