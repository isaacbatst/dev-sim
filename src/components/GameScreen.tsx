'use client';

import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Desktop } from './desktop/Desktop';
import { Workstation } from './desktop/Workstation';
import { useBreak, DeskItems, BreakHud } from './desktop/Break';

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
  const brk = useBreak(onBreak, career.owned);

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
    // CÂMERA em 1ª pessoa: UMA cena só (monitor + mesa, 130dvh). Trabalhando,
    // você está colado no monitor (scale 1, a mesa aparece só na beirada).
    // Pausar = AFASTAR a cadeira: zoom out até a cena inteira caber.
    <div className="relative h-dvh w-full overflow-hidden bg-[#06070b]">
      {/* zoom (afastar/aproximar) */}
      <div
        className="origin-top transition-transform duration-700 motion-reduce:transition-none"
        style={{
          transform: onBreak ? 'scale(0.765)' : 'scale(1)',
          transitionTimingFunction: 'cubic-bezier(0.65, 0, 0.35, 1)',
        }}
      >
        {/* pescoço: SÓ a cena diegética inclina (o HUD fica fora, parado).
            A cena tem SANGRIA em todas as direções (144vw de largura + parede
            acima + chão abaixo): nem o zoom out nem a inclinação revelam área
            sem pintura — é sempre uma extensão do cenário. */}
        <div
          className="relative w-[144vw] -ml-[22vw] transition-transform duration-300"
          style={{
            transform: `translateY(${brk.tilt.dy * -20}px) rotate(${brk.tilt.dx * -5}deg)`,
            transitionTimingFunction: 'cubic-bezier(0.2, 1.3, 0.4, 1)',
          }}
        >
          {/* sangria: parede continua acima, chão continua abaixo */}
          <div
            aria-hidden
            className="absolute inset-x-0 -top-[16dvh] h-[16dvh]"
            style={{ background: '#171a24' }}
          />
          <div
            aria-hidden
            className="absolute inset-x-0 -bottom-[16dvh] h-[16dvh]"
            style={{ background: '#0b0704' }}
          />
          <div className="h-dvh">
            <Workstation clock={snapshot.clock}>
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
          {/* a mesa continua abaixo do fold — no trabalho só a beirada aparece */}
          <div
            className="relative h-[30dvh]"
            style={{ background: 'linear-gradient(180deg, #160f0a 0%, #1d1409 45%, #0b0704 100%)' }}
          >
            <div
              aria-hidden
              className="absolute inset-0 opacity-[0.05]"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(90deg, #000 0 2px, transparent 2px 34px)',
              }}
            />
            <div className="absolute inset-x-0 -top-16 bottom-0">
              <DeskItems owned={career.owned} brk={brk} />
            </div>
          </div>
        </div>
      </div>
      {/* HUD da pausa: parado, sem zoom e sem inclinação */}
      {onBreak && (
        <BreakHud
          clock={snapshot.clock}
          mode={brk.mode}
          owned={career.owned}
          relief={brk.relief}
          onResume={() => setBreak(false)}
        />
      )}
    </div>
  );
}
