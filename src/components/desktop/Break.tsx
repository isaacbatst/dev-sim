'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as S from '@/store/breakSound';

/**
 * PAUSA ("-", a qualquer momento): o personagem se AFASTA do computador — zoom
 * out na MESMA cena (nada de troca de tela). O expediente não para: pausar
 * custa tempo. Camadas:
 *   - CENA (diegética, inclina com o pescoço, recebe o zoom): Workstation +
 *     DeskItems (a mesa à frente, sempre visível — no trabalho só a beirada).
 *   - HUD (BreakHud): relógio/dicas/voltar — NUNCA inclina nem escala.
 * Atividades (sem falha, sem ritmo julgado): ←↑↓→ pescoço · A–K tecladinho ·
 * C gole · R regar (grade de terra) · ⌫ volta à mesa.
 */

const PIANO: { k: string; f: number }[] = [
  { k: 'a', f: 261.63 },
  { k: 's', f: 293.66 },
  { k: 'd', f: 329.63 },
  { k: 'f', f: 349.23 },
  { k: 'g', f: 392.0 },
  { k: 'h', f: 440.0 },
  { k: 'j', f: 493.88 },
  { k: 'k', f: 523.25 },
];
const PIANO_IDX: Record<string, number> = Object.fromEntries(PIANO.map((p, i) => [p.k, i]));

const SOIL: string[][] = [
  ['q', 'w', 'e', 'r'],
  ['a', 's', 'd', 'f'],
  ['z', 'x', 'c', 'v'],
];
const SOILKEYS = SOIL.flat();
const DIRS: Record<string, { dx: number; dy: number }> = {
  ArrowUp: { dx: 0, dy: -1 },
  ArrowDown: { dx: 0, dy: 1 },
  ArrowLeft: { dx: -1, dy: 0 },
  ArrowRight: { dx: 1, dy: 0 },
};

export type BreakMode = 'mesa' | 'planta';

export interface BreakState {
  mode: BreakMode;
  tilt: { dx: number; dy: number };
  /** Encadeou uma direção com o pescoço ainda inclinado (movimento emenda). */
  flowing: boolean;
  /** Giro completo automático em curso (combo circular). */
  spinning: boolean;
  relief: number;
  notes: { id: number; idx: number }[];
  setNotes: React.Dispatch<React.SetStateAction<{ id: number; idx: number }[]>>;
  lit: Record<number, number>;
  sipN: number;
  wet: Record<string, number>;
  setWet: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  leafN: number;
  water: (k: string) => void;
}

/** Estado + teclado das pausas. Escuta na fase bubble (o GameScreen já engoliu
 *  o jogo na captura) e só com a pausa aberta. */
export function useBreak(active: boolean, owned: string[]): BreakState {
  const [mode, setMode] = useState<BreakMode>('mesa');
  const [tilt, setTiltState] = useState({ dx: 0, dy: 0 });
  const [flowing, setFlowing] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [relief, setRelief] = useState(0);
  const tiltRef = useRef({ dx: 0, dy: 0 });
  const seq = useRef<{ a: number; t: number }[]>([]);
  const spinTs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const tiltT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [notes, setNotes] = useState<{ id: number; idx: number }[]>([]);
  const [lit, setLit] = useState<Record<number, number>>({});
  const nonce = useRef(0);
  const [sipN, setSipN] = useState(0);
  const [wet, setWet] = useState<Record<string, number>>({});
  const [leafN, setLeafN] = useState(0);
  const waterCombo = useRef(0);
  const waterAt = useRef(0);

  // Ao voltar pro trabalho, a próxima pausa reabre na mesa (ajuste na render).
  const [prevActive, setPrevActive] = useState(active);
  if (prevActive !== active) {
    setPrevActive(active);
    if (!active) setMode('mesa');
  }

  // Alongamento natural: entra suave (~650ms), SEGURA no fundo (~1s) e solta
  // devagar (~1s) — nada de tique mecânico. O estalo soa perto do ponto máximo.
  // COMBO CIRCULAR: as 4 setas em ordem de rotação (qualquer sentido, cada uma
  // até 1.3s da anterior) emendam e disparam um GIRO completo automático da
  // cabeça — o payoff (suspiro + anel de alívio).
  const crackT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setTilt = useCallback((d: { dx: number; dy: number }) => {
    tiltRef.current = d;
    setTiltState(d);
  }, []);

  const startSpin = useCallback(
    (rot: 1 | -1, fromAngle: number) => {
      setSpinning(true);
      if (tiltT.current) clearTimeout(tiltT.current);
      if (crackT.current) clearTimeout(crackT.current);
      spinTs.current.forEach(clearTimeout);
      spinTs.current = [];
      // percorre o círculo inteiro a partir do ângulo atual, no mesmo sentido
      const ANGLES = [
        { dx: 0, dy: -1 },
        { dx: 1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
      ];
      for (let i = 1; i <= 4; i++) {
        spinTs.current.push(
          setTimeout(() => setTilt(ANGLES[(fromAngle + rot * i + 8) % 4]), 60 + (i - 1) * 240),
        );
      }
      spinTs.current.push(
        setTimeout(
          () => {
            setTilt({ dx: 0, dy: 0 });
            S.sigh();
            setRelief((r) => r + 1);
            setSpinning(false);
          },
          60 + 4 * 240,
        ),
      );
    },
    [setTilt],
  );

  const roll = useCallback(
    (key: string) => {
      if (spinning) return; // deixa o giro terminar
      const d = DIRS[key];
      if (!d) return;
      const ANGLE: Record<string, number> = {
        ArrowUp: 0,
        ArrowRight: 1,
        ArrowDown: 2,
        ArrowLeft: 3,
      };
      const a = ANGLE[key];
      // emendou? (nova direção com o pescoço ainda inclinado)
      setFlowing(tiltRef.current.dx !== 0 || tiltRef.current.dy !== 0);
      setTilt(d);
      if (crackT.current) clearTimeout(crackT.current);
      crackT.current = setTimeout(() => S.neckCrack(), 380);
      if (tiltT.current) clearTimeout(tiltT.current);
      tiltT.current = setTimeout(() => setTilt({ dx: 0, dy: 0 }), 1650);
      // sequência circular (ordem de rotação, qualquer sentido)
      const now = performance.now();
      const s = seq.current;
      if (s.length && now - s[s.length - 1].t > 1300) s.length = 0;
      s.push({ a, t: now });
      if (s.length > 4) s.shift();
      if (s.length === 4) {
        const deltas = [1, 2, 3].map((i) => (s[i].a - s[i - 1].a + 4) % 4);
        if (deltas.every((x) => x === 1) || deltas.every((x) => x === 3)) {
          s.length = 0;
          startSpin(deltas[0] === 1 ? 1 : -1, a);
        }
      }
    },
    [spinning, setTilt, startSpin],
  );

  const playNote = useCallback((idx: number) => {
    S.pianoNote(PIANO[idx].f);
    const id = ++nonce.current;
    setNotes((ns) => [...ns, { id, idx }]);
    setLit((l) => ({ ...l, [idx]: id }));
    setTimeout(() => {
      setLit((l) => {
        if (l[idx] !== id) return l;
        const c = { ...l };
        delete c[idx];
        return c;
      });
    }, 180);
  }, []);

  const water = useCallback((k: string) => {
    const now = performance.now();
    waterCombo.current = now - waterAt.current < 350 ? Math.min(waterCombo.current + 1, 12) : 0;
    waterAt.current = now;
    S.waterDrop(waterCombo.current);
    setWet((w) => ({ ...w, [k]: (w[k] ?? 0) + 1 }));
    setLeafN((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!active) return;
    const has = (id: string) => owned.includes(id);
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.repeat) return;
      const k = e.key.toLowerCase();
      if (DIRS[e.key]) {
        e.preventDefault();
        return roll(e.key);
      }
      if (mode === 'planta') {
        if (e.key === 'Backspace') {
          e.preventDefault();
          return setMode('mesa');
        }
        if (SOILKEYS.includes(k)) {
          e.preventDefault();
          return water(k);
        }
        return;
      }
      if (k === 'r' && has('planta')) {
        e.preventDefault();
        return setMode('planta');
      }
      if (k === 'c' && has('cafe')) {
        e.preventDefault();
        S.sip();
        return setSipN((n) => n + 1);
      }
      if (PIANO_IDX[k] !== undefined && has('teclado')) {
        e.preventDefault();
        return playNote(PIANO_IDX[k]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, mode, owned.join(','), roll, water, playNote]);

  return {
    mode,
    tilt,
    flowing,
    spinning,
    relief,
    notes,
    setNotes,
    lit,
    sipN,
    wet,
    setWet,
    leafN,
    water,
  };
}

/* ── A MESA (camada diegética, sempre na cena — na frente do monitor) ── */

export function DeskItems({ owned, brk }: { owned: string[]; brk: BreakState }) {
  const has = (id: string) => owned.includes(id);
  const { mode, notes, setNotes, lit, sipN, wet, setWet, leafN, water } = brk;

  return (
    <div className="relative flex h-full items-start justify-center">
      {/* grade de terra (regar): um "olhar de perto" no vaso, flutua sobre a mesa */}
      {mode === 'planta' && (
        <div className="absolute bottom-[70%] left-1/2 z-10 -translate-x-1/2">
          <SoilGrid wet={wet} setWet={setWet} onWater={water} />
        </div>
      )}

      <div style={{ perspective: '1100px' }}>
        <div
          className="flex items-end gap-16"
          style={{ transform: 'rotateX(26deg)', transformOrigin: 'center 20%' }}
        >
          {has('planta') && <Plant size={1} pulseKey={leafN} highlight={mode === 'planta'} />}

          <div key={sipN} className={sipN > 0 ? 'animate-sipmug' : ''}>
            <Mug steaming={has('cafe')} />
          </div>

          {/* teclado (tecladinho se comprou o mecânico) */}
          <div
            className="relative h-32 w-[min(520px,46vw)] rounded-2xl"
            style={{
              background: 'linear-gradient(180deg, #191b24, #0c0e14)',
              boxShadow: has('teclado')
                ? '0 40px 50px -16px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.06) inset, 0 -3px 34px -6px rgba(120,160,255,0.5)'
                : '0 40px 50px -16px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.06) inset',
              backgroundImage: has('teclado')
                ? 'repeating-linear-gradient(90deg, rgba(140,120,255,0.22) 0 4.5%, transparent 4.5% 6.5%), repeating-linear-gradient(0deg, rgba(90,200,255,0.18) 0 24%, transparent 24% 32%)'
                : 'repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0 4.5%, transparent 4.5% 6.5%), repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0 24%, transparent 24% 32%)',
            }}
          >
            {has('teclado') && (
              <div className="absolute inset-x-4 bottom-4 top-4 flex gap-1">
                {PIANO.map((p, i) => (
                  <div
                    key={p.k}
                    className="relative flex-1 rounded transition-colors duration-150"
                    style={{
                      background: lit[i] !== undefined ? 'rgba(245,166,35,0.4)' : 'transparent',
                    }}
                  />
                ))}
              </div>
            )}
            {notes.map((n) => (
              <span
                key={n.id}
                className="animate-notefloat pointer-events-none absolute bottom-full font-mono text-xl text-white/70"
                style={{ left: `${((n.idx + 0.5) / PIANO.length) * 100}%` }}
                onAnimationEnd={() => setNotes((ns) => ns.filter((x) => x.id !== n.id))}
                aria-hidden
              >
                ♪
              </span>
            ))}
          </div>

          {/* mouse */}
          <div
            className="mb-2 h-14 w-10 shrink-0 rounded-[45%]"
            style={{
              background: 'linear-gradient(180deg, #1c1f29, #0d0f15)',
              boxShadow: '0 22px 26px -10px rgba(0,0,0,0.75)',
            }}
          >
            <div className="mx-auto mt-2 h-5 w-px bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── HUD da pausa (NÃO inclina, NÃO escala — fora da cena) ─────── */

export function BreakHud({
  clock,
  mode,
  owned,
  relief,
  onResume,
}: {
  clock: string;
  mode: BreakMode;
  owned: string[];
  relief: number;
  onResume: () => void;
}) {
  const has = (id: string) => owned.includes(id);
  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex flex-col">
      {/* alívio da volta completa do pescoço */}
      {relief > 0 && (
        <span
          key={relief}
          className="animate-reliefring absolute left-1/2 top-1/2 -ml-20 -mt-20 size-40 rounded-full border-2"
          style={{ borderColor: 'var(--pass)' }}
          aria-hidden
        />
      )}
      {/* rodapé: relógio + dicas + voltar */}
      <div className="pointer-events-auto mt-auto flex items-center justify-center gap-6 pb-5 font-mono text-xs text-white/50">
        <span className="tabular-nums text-white/75">{clock}</span>
        <span className="uppercase tracking-[0.2em] text-white/35">o expediente continua</span>
        {mode === 'planta' ? (
          <Hint k="⌫" label="voltar à mesa" />
        ) : (
          <>
            <Hint k="← →" label="pescoço" wide />
            {has('planta') && <Hint k="R" label="regar" />}
            {has('cafe') && <Hint k="C" label="gole" />}
            {has('teclado') && <Hint k="A–K" label="tocar" wide />}
          </>
        )}
        <button
          onClick={onResume}
          className="flex items-center gap-1.5 transition-colors hover:text-white/85"
        >
          <kbd className="keycap !h-5 !min-w-5 !text-[10px]">-</kbd>
          voltar ao trabalho
        </button>
      </div>
    </div>
  );
}

/* ── peças ────────────────────────────────────────────────────── */

function SoilGrid({
  wet,
  setWet,
  onWater,
}: {
  wet: Record<string, number>;
  setWet: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  onWater: (k: string) => void;
}) {
  return (
    <div
      className="rounded-2xl p-2 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.7)]"
      style={{ background: '#7a5c44' }}
    >
      <div className="flex flex-col gap-1.5">
        {SOIL.map((row, ri) => (
          <div key={ri} className="flex gap-1.5">
            {row.map((k) => (
              <button
                key={k}
                onPointerDown={() => onWater(k)}
                className="relative size-14 overflow-hidden rounded-lg"
                style={{ background: '#5b4636' }}
                aria-label={`regar ${k}`}
              >
                {wet[k] !== undefined && (
                  <>
                    <span
                      key={wet[k]}
                      className="animate-waterabsorb absolute inset-0"
                      style={{ background: '#2f241b' }}
                      onAnimationEnd={() =>
                        setWet((w) => {
                          const c = { ...w };
                          delete c[k];
                          return c;
                        })
                      }
                    />
                    <span
                      key={`s${wet[k]}`}
                      className="animate-watersplash absolute left-1/2 top-1 -ml-2 size-4 rounded-full border-2"
                      style={{ borderColor: '#9fd0e6' }}
                    />
                  </>
                )}
                <kbd className="absolute bottom-0.5 right-1 font-mono text-[9px] uppercase text-white/40">
                  {k}
                </kbd>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Plant({
  size,
  pulseKey,
  highlight,
}: {
  size: number;
  pulseKey: number;
  highlight?: boolean;
}) {
  const s = size;
  return (
    <div
      key={pulseKey}
      className={pulseKey > 0 ? 'animate-leafpulse relative shrink-0' : 'relative shrink-0'}
      style={{
        width: 96 * s,
        height: 128 * s,
        filter: highlight ? 'drop-shadow(0 0 18px rgba(94,208,122,0.35))' : undefined,
      }}
    >
      {[-16, -5, 6, 17].map((x, i) => (
        <span
          key={i}
          className="absolute"
          style={{
            bottom: 40 * s,
            left: (44 + x) * s,
            width: 13 * s,
            height: (52 + (i % 2) * 20) * s,
            borderRadius: '50% 50% 50% 50% / 70% 70% 30% 30%',
            background: `color-mix(in oklab, #4ec07a ${72 - i * 8}%, #1c3a24)`,
            transform: `rotate(${x * 1.6}deg)`,
            transformOrigin: 'bottom center',
          }}
        />
      ))}
      <div
        className="absolute rounded-b-[8px] rounded-t-[3px]"
        style={{
          left: 12 * s,
          right: 12 * s,
          bottom: 0,
          height: 44 * s,
          background: 'linear-gradient(180deg, #b5622f, #7d3f1c)',
        }}
      />
    </div>
  );
}

function Mug({ steaming }: { steaming: boolean }) {
  return (
    <div className="relative mb-1 h-20 w-16 shrink-0">
      {steaming && (
        <div className="absolute -top-9 left-1/2 -translate-x-1/2">
          {[-7, 0, 7].map((x, i) => (
            <span
              key={i}
              className="animate-edgepulse absolute bottom-0 w-1 rounded-full bg-white/25"
              style={{ left: x, height: 28, animationDelay: `${i * 220}ms` }}
            />
          ))}
        </div>
      )}
      <div
        className="absolute inset-0 rounded-b-[22px] rounded-t-[8px]"
        style={{ background: 'linear-gradient(180deg, #2c3140, #171a22)' }}
      />
      <div className="absolute right-[-16px] top-4 size-10 rounded-full border-4 border-[#2c3140]" />
      <div className="absolute inset-x-2 top-0 h-3.5 rounded-full bg-[#0c0e14]" />
    </div>
  );
}

function Hint({ k, label, wide }: { k: string; label: string; wide?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <kbd className={`keycap !h-5 !text-[10px] ${wide ? '!min-w-10' : '!min-w-5'}`}>{k}</kbd>
      {label}
    </span>
  );
}
