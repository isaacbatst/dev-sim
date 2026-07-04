'use client';

import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Desktop } from './desktop/Desktop';
import { Workstation } from './desktop/Workstation';
import { Break } from './desktop/Break';

export function GameScreen() {
  const snapshot = useGameStore((s) => s.snapshot);
  const day = useGameStore((s) => s.day);
  const career = useGameStore((s) => s.career);
  const dayResult = useGameStore((s) => s.dayResult);
  const start = useGameStore((s) => s.start);
  const nextDay = useGameStore((s) => s.nextDay);
  const selectSlot = useGameStore((s) => s.selectSlot);
  const keyDown = useGameStore((s) => s.keyDown);
  const keyUp = useGameStore((s) => s.keyUp);
  const confirm = useGameStore((s) => s.confirm);
  const focusProgram = useGameStore((s) => s.focusProgram);
  const cycleFocus = useGameStore((s) => s.cycleFocus);
  const quickOpen = useGameStore((s) => s.quickOpen);
  const buyCosmetic = useGameStore((s) => s.buyCosmetic);

  const [shake, setShake] = useState(false);
  const [floatScore, setFloatScore] = useState<string | null>(null);
  const prev = useRef<{ delivered: number; errors: number }>({ delivered: 0, errors: 0 });

  // Pausa (Esc): a visão sai do monitor pra mesa. O jogo NÃO congela (deadlines
  // correm) — só o teclado deixa de ir pro jogo. Ref pra ler no handler estável.
  const [onBreak, setOnBreak] = useState(false);
  const onBreakRef = useRef(false);
  const setBreak = (v: boolean) => {
    onBreakRef.current = v;
    setOnBreak(v);
  };

  useEffect(() => start(), [start]);

  // Fim do expediente encerra a pausa (o boletim assume a tela).
  useEffect(() => {
    if (snapshot && snapshot.status !== 'playing' && onBreakRef.current) setBreak(false);
  }, [snapshot]);

  // O gate por foco vive no core (ações de trabalho exigem o programa em foco).
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      // "-" alterna a pausa (levantar da mesa / voltar). Pode a qualquer momento.
      if (e.key === '-') {
        e.preventDefault();
        setBreak(!onBreakRef.current);
        return;
      }
      // Na pausa você não está no monitor: o teclado não vai pro jogo.
      if (onBreakRef.current) {
        if (e.key === 'Tab') e.preventDefault();
        return;
      }
      // Ctrl/Cmd+P: aborta o print do navegador e abre o Quick Open.
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyP') {
        e.preventDefault();
        e.stopPropagation();
        return quickOpen();
      }
      // Atalhos do jogo (combo): Ctrl/Cmd+C e Ctrl/Cmd+V → "ctrl+c"/"ctrl+v".
      // Casa por `code` E por `key` (robusto a layout/IME que reportem diferente).
      if (e.ctrlKey || e.metaKey) {
        const k = e.key.toLowerCase();
        const isCopy = e.code === 'KeyC' || k === 'c';
        const isPaste = e.code === 'KeyV' || k === 'v';
        if (isCopy || isPaste) {
          if (e.repeat) return;
          e.preventDefault();
          e.stopPropagation();
          return keyDown(`ctrl+${isCopy ? 'c' : 'v'}`);
        }
      }
      if (e.ctrlKey || e.metaKey) return; // não capturar outros atalhos do SO
      if (e.key.startsWith('Arrow') || e.key === 'Tab' || e.key === 'Backspace') e.preventDefault();
      if (e.repeat) return;
      if (e.key === 'Tab') return cycleFocus(e.shiftKey ? -1 : 1);
      if (e.key >= '1' && e.key <= '5') return selectSlot(Number(e.key) - 1);
      if (e.key === 'Enter') return confirm();
      keyDown(e.key);
    };
    const onUp = (e: KeyboardEvent) => keyUp(e.key);
    // Fase de captura para interceptar o atalho de print antes do navegador.
    window.addEventListener('keydown', onDown, { capture: true });
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown, { capture: true });
      window.removeEventListener('keyup', onUp);
    };
  }, [selectSlot, keyDown, keyUp, confirm, cycleFocus, quickOpen]);

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
    // CÂMERA em 1ª pessoa: o mundo tem 2 telas de altura (monitor em cima, mesa
    // embaixo). Pausar = o viewport DESLIZA pra baixo, contínuo, sem corte.
    <div className="relative h-dvh w-full overflow-hidden">
      <div
        className="transition-transform duration-700 motion-reduce:transition-none"
        style={{
          transform: onBreak ? 'translateY(-100dvh)' : 'translateY(0)',
          transitionTimingFunction: 'cubic-bezier(0.65, 0, 0.35, 1)',
        }}
      >
        <div className="h-dvh">
          <Workstation clock={snapshot.clock} owned={career.owned}>
            <Desktop
              snapshot={snapshot}
              day={day}
              career={career}
              dayResult={dayResult}
              shake={shake}
              floatScore={floatScore}
              onFocusProgram={focusProgram}
              onSelect={selectSlot}
              onNextDay={nextDay}
              onBuy={buyCosmetic}
            />
          </Workstation>
        </div>
        <div className="h-dvh">
          <Break clock={snapshot.clock} owned={career.owned} onResume={() => setBreak(false)} />
        </div>
      </div>
    </div>
  );
}
