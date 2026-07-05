'use client';

import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Desktop } from './desktop/Desktop';
import { Room } from './desktop/Workstation';
import { useBreak, BreakHud } from './desktop/Break';
import { FatigueDebug } from './desktop/FatigueDebug';

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
  const setResting = useGameStore((s) => s.setResting);
  const restoreFatigue = useGameStore((s) => s.restoreFatigue);

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
    setResting(v); // fadiga não acumula na pausa
  };
  const brk = useBreak(onBreak, career.owned, restoreFatigue);

  // Piscada pesada (fadiga): a UI diffa o contador do core e fecha as pálpebras.
  // SEM cleanup do timer: o efeito roda a cada snapshot (60fps) e o cleanup
  // cancelaria o "reabrir" no frame seguinte — olho ficava fechado pra sempre.
  const [blink, setBlink] = useState(false);
  const prevBlinkN = useRef(0);
  useEffect(() => {
    const n = snapshot?.fatigue.blinkN ?? 0;
    if (n > prevBlinkN.current) {
      prevBlinkN.current = n;
      setBlink(true);
      setTimeout(() => setBlink(false), 240);
    } else if (n < prevBlinkN.current) {
      prevBlinkN.current = n; // novo dia (contador zerou)
    }
  }, [snapshot]);

  // Overlay de debug da fadiga (?debug=1). Sem risco de mismatch SSR: o 1º
  // render (cliente e servidor) mostra só o "carregando" (snapshot null).
  const [debug] = useState(
    () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug'),
  );

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
    // MUNDO + CÂMERA: o Room é uma cena única pintada por inteiro (150dvh de
    // parede→mesa, 152vw de largura); a câmera é só um transform sobre ela.
    // Trabalho = enquadrado no monitor (scale 1, nítido); pausa = afastar a
    // cadeira (zoom out até o quarto inteiro). Geometria em Workstation.tsx.
    <div className="relative h-dvh w-full overflow-hidden bg-[#04050a]">
      {/* câmera: zoom/enquadramento */}
      <div
        className="origin-top transition-transform duration-700 motion-reduce:transition-none"
        style={{
          transform: onBreak ? 'translateY(-7.1dvh) scale(0.71)' : 'translateY(-25dvh) scale(1)',
          transitionTimingFunction: 'cubic-bezier(0.65, 0, 0.35, 1)',
        }}
      >
        {/* pescoço: SÓ o mundo diegético inclina (o HUD fica fora, parado).
            Alongamento, não tique: entra suave e assenta (650ms, sem quicar),
            segura (o timer no useBreak solta a ~1.65s) e volta devagar (1.1s).
            Emendas: nova direção com o pescoço inclinado flui em 450ms.
            Pivô abaixo do centro (gira como cabeça). */}
        <div
          className="w-[170vw] -ml-[35vw] transition-transform motion-reduce:transition-none"
          style={{
            // roll (←→) = rotate 2D; pitch (↑↓) = rotateX com perspectiva —
            // ângulo bem maior: a parede "deita" ao olhar pra cima, a mesa
            // "vem" ao olhar pra baixo, com o deslize acompanhando.
            transform: `perspective(1200px) translate(${brk.tilt.dx * -12}px, ${brk.tilt.dy * -52}px) rotate(${brk.tilt.dx * -6}deg) rotateX(${brk.tilt.dy * -14}deg)`,
            transformOrigin: '50% 62%',
            transitionDuration:
              brk.tilt.dx !== 0 || brk.tilt.dy !== 0
                ? brk.spinning
                  ? '270ms' // contra-giro do combo: passos contínuos
                  : brk.flowing
                    ? '450ms'
                    : '650ms'
                : '1100ms',
            transitionTimingFunction:
              brk.tilt.dx !== 0 || brk.tilt.dy !== 0
                ? brk.spinning
                  ? 'cubic-bezier(0.4, 0, 0.6, 1)' // giro: quase-linear, emenda
                  : 'cubic-bezier(0.22, 0.9, 0.3, 1)' // entra: assenta macio
                : 'cubic-bezier(0.45, 0.05, 0.25, 1)', // solta: lenta e uniforme
          }}
        >
          <Room clock={snapshot.clock} owned={career.owned} brk={brk}>
            {/* Fadiga na TELA (diegético): cansado dessatura de leve; exausto
                embaça sutilmente — o "foco" óptico indo embora. */}
            <div
              className="h-full"
              style={{
                filter:
                  snapshot.fatigue.stage === 'exhausted'
                    ? 'saturate(0.84) blur(0.4px) brightness(0.97)'
                    : snapshot.fatigue.stage === 'tired'
                      ? 'saturate(0.93) brightness(0.985)'
                      : 'none',
                transition: 'filter 2s ease',
              }}
            >
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
            </div>
          </Room>
        </div>
      </div>
      {/* vinheta da LENTE: efeito de câmera, fixo no viewport (não no mundo) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: 'inset 0 0 220px 70px rgba(0,0,0,0.55)' }}
      />
      {/* piscada pesada (fadiga): as pálpebras fecham por um instante */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-40 bg-black"
        style={{
          opacity: blink ? 0.94 : 0,
          transition: `opacity ${blink ? 90 : 180}ms ease`,
        }}
      />
      {/* overlay de debug da fadiga (?debug=1) */}
      {debug && <FatigueDebug snapshot={snapshot} resting={onBreak} />}
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
