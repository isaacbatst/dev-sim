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
  /** Contra-giro automático do fecho do combo em curso. */
  spinning: boolean;
  /** Progresso do combo circular (0..4 — uma volta completa). */
  neckProgress: number;
  /** Ângulos (0=↑ 1=→ 2=↓ 3=←) que continuam o giro agora (pro HUD pulsar). */
  neckNexts: number[];
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
 *  o jogo na captura) e só com a pausa aberta. `onRitual` = completou um gesto
 *  de restauração (FOCO_FADIGA.md §5): pescoço = combo circular; regar = todas
 *  as células; café = 3 goles; tocar = 8 notas. Efeito idêntico pra todos. */
export function useBreak(active: boolean, owned: string[], onRitual?: () => void): BreakState {
  const [mode, setMode] = useState<BreakMode>('mesa');
  const [tilt, setTiltState] = useState({ dx: 0, dy: 0 });
  const [flowing, setFlowing] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [neckProgress, setNeckProgress] = useState(0);
  const [neckNexts, setNeckNexts] = useState<number[]>([]);
  const [relief, setRelief] = useState(0);
  const tiltRef = useRef({ dx: 0, dy: 0 });
  const seq = useRef<{ a: number; t: number }[]>([]);
  const seqT = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  // Progresso dos RITUAIS de restauração (por pausa).
  const wateredCells = useRef<Set<string>>(new Set());
  const sipCount = useRef(0);
  const noteCount = useRef(0);

  // Ao voltar pro trabalho, a próxima pausa reabre na mesa (ajuste na render).
  const [prevActive, setPrevActive] = useState(active);
  if (prevActive !== active) {
    setPrevActive(active);
    if (!active) setMode('mesa');
  }

  // Progresso de ritual zera ao fechar a pausa (cada pausa recomeça os gestos).
  useEffect(() => {
    if (!active) {
      wateredCells.current.clear();
      sipCount.current = 0;
      noteCount.current = 0;
    }
  }, [active]);

  /** Ritual completado: restaura a fadiga + feedback de alívio (o pescoço já
   *  tem o próprio — contra-giro + mix). */
  const completeRitual = useCallback(
    (withSigh: boolean) => {
      onRitual?.();
      if (withSigh) {
        S.sigh();
        setRelief((r) => r + 1);
      }
    },
    [onRitual],
  );

  // Alongamento natural: entra suave (~650ms), SEGURA no fundo (~1s) e solta
  // devagar (~1s) — nada de tique mecânico. CADA aperto agenda o SEU estalo
  // (independente, ~380ms depois, perto do fundo do movimento) — encadear
  // rápido toca todos, em série. COMBO CIRCULAR: uma volta completa (4 setas
  // em ordem de rotação, qualquer sentido) = ritual do pescoço.
  const setTilt = useCallback((d: { dx: number; dy: number }) => {
    tiltRef.current = d;
    setTiltState(d);
  }, []);

  // Timers de som do pescoço: os estalos individuais pendentes são CANCELADOS
  // quando o combo fecha (senão caem em cima do mix e embola).
  const crackTs = useRef<ReturnType<typeof setTimeout>[]>([]);

  const roll = useCallback(
    (key: string) => {
      if (spinning) return; // o contra-giro do combo termina sozinho
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
      if (tiltT.current) clearTimeout(tiltT.current);
      tiltT.current = setTimeout(() => setTilt({ dx: 0, dy: 0 }), 1650);
      // sequência circular: UMA volta completa (4 setas em ordem de rotação,
      // qualquer sentido). Mantém só o SUFIXO consistente — errar uma direção
      // não zera tudo, recomeça dali.
      const now = performance.now();
      let s = seq.current;
      if (s.length && now - s[s.length - 1].t > 1300) s = [];
      s.push({ a, t: now });
      let rotDelta: number | null = null; // 1 = horário, 3 = anti-horário
      let start = s.length - 1;
      for (let i = s.length - 1; i > 0; i--) {
        const d = (s[i].a - s[i - 1].a + 4) % 4;
        if (d !== 1 && d !== 3) break;
        if (rotDelta === null) rotDelta = d;
        else if (d !== rotDelta) break;
        start = i - 1;
      }
      s = s.slice(start);
      seq.current = s;
      const rot: 1 | -1 | 0 = s.length >= 4 ? (rotDelta === 1 ? 1 : -1) : 0;
      // HUD: progresso + quais direções continuam o giro agora
      if (rot === 0) {
        setNeckProgress(s.length);
        setNeckNexts(
          s.length === 1
            ? [(a + 1) % 4, (a + 3) % 4]
            : rotDelta !== null
              ? [(a + rotDelta) % 4]
              : [],
        );
        // sem seguir o giro, o progresso esfria junto com a janela da sequência
        if (seqT.current) clearTimeout(seqT.current);
        seqT.current = setTimeout(() => {
          seq.current = [];
          setNeckProgress(0);
          setNeckNexts([]);
        }, 1300);
      }
      if (rot !== 0) {
        if (seqT.current) clearTimeout(seqT.current);
        setNeckProgress(4);
        setNeckNexts([]);
        // COMBO: contra-giro automático no sentido INVERSO, junto com o mix
        // (que já contém o estalo → cancela os individuais pendentes).
        seq.current.length = 0;
        crackTs.current.forEach(clearTimeout);
        crackTs.current = [];
        if (tiltT.current) clearTimeout(tiltT.current);
        spinTs.current.forEach(clearTimeout);
        spinTs.current = [];
        setSpinning(true);
        const ANGLES = [
          { dx: 0, dy: -1 },
          { dx: 1, dy: 0 },
          { dx: 0, dy: 1 },
          { dx: -1, dy: 0 },
        ];
        // som + primeiro passo do desenrolar juntos, aos 420ms. O combo é o
        // RITUAL do pescoço (grátis) → restaura a fadiga.
        spinTs.current.push(
          setTimeout(() => {
            S.neckCombo();
            setRelief((r) => r + 1);
            completeRitual(false); // feedback próprio (contra-giro + mix)
          }, 420),
        );
        for (let i = 1; i <= 4; i++) {
          spinTs.current.push(
            setTimeout(() => setTilt(ANGLES[(a - rot * i + 8) % 4]), 420 + (i - 1) * 240),
          );
        }
        spinTs.current.push(
          setTimeout(
            () => {
              setTilt({ dx: 0, dy: 0 });
              setSpinning(false);
              setNeckProgress(0);
            },
            420 + 4 * 240,
          ),
        );
      } else {
        // um estalo POR aperto (não cancela os anteriores — série ao encadear)
        const t = setTimeout(() => {
          crackTs.current = crackTs.current.filter((x) => x !== t);
          S.neckCrack();
        }, 380);
        crackTs.current.push(t);
      }
    },
    [spinning, setTilt, completeRitual],
  );

  const playNote = useCallback(
    (idx: number) => {
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
      // ritual: 8 notas tocadas
      noteCount.current += 1;
      if (noteCount.current >= 8) {
        noteCount.current = 0;
        completeRitual(true);
      }
    },
    [completeRitual],
  );

  const water = useCallback(
    (k: string) => {
      const now = performance.now();
      waterCombo.current = now - waterAt.current < 350 ? Math.min(waterCombo.current + 1, 12) : 0;
      waterAt.current = now;
      S.waterDrop(waterCombo.current);
      setWet((w) => ({ ...w, [k]: (w[k] ?? 0) + 1 }));
      setLeafN((n) => n + 1);
      // ritual: todas as células regadas
      wateredCells.current.add(k);
      if (wateredCells.current.size >= SOILKEYS.length) {
        wateredCells.current.clear();
        completeRitual(true);
      }
    },
    [completeRitual],
  );

  useEffect(() => {
    if (!active) return;
    S.preload(); // samples prontos antes do 1º gesto
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
        setSipN((n) => n + 1);
        // ritual: 3 goles
        sipCount.current += 1;
        if (sipCount.current >= 3) {
          sipCount.current = 0;
          setTimeout(() => completeRitual(true), 500); // depois do "ahh" do gole
        }
        return;
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
    neckProgress,
    neckNexts,
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
  neckProgress,
  neckNexts,
  spinning,
  onResume,
}: {
  clock: string;
  mode: BreakMode;
  owned: string[];
  relief: number;
  neckProgress: number;
  neckNexts: number[];
  spinning: boolean;
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
      {/* o RITUAL do pescoço: mostrador circular CENTRAL — keycaps de seta em
          roda, o próximo aceso (--current), o arco enchendo. É a instrução. */}
      {mode === 'mesa' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <NeckDial progress={neckProgress} nexts={neckNexts} spinning={spinning} />
        </div>
      )}
      {/* rodapé: relógio + dicas + voltar */}
      <div className="pointer-events-auto mt-auto flex items-center justify-center gap-6 pb-5 font-mono text-xs text-white/50">
        <span className="tabular-nums text-white/75">{clock}</span>
        <span className="uppercase tracking-[0.2em] text-white/35">o expediente continua</span>
        {mode === 'planta' ? (
          <Hint k="⌫" label="voltar à mesa" />
        ) : (
          <>
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

/** Mostrador do combo do pescoço, na LINGUAGEM da casa: as setas são KEYCAPS
 *  (a assinatura tátil do devOS) em roda; o próximo do giro acende `--current`
 *  (âmbar, "aperte agora" — um só por vez); o arco fecha a volta. Pastilha com
 *  os tokens hud-night + elevação. Sem texto de tutorial: o mostrador É a
 *  instrução. */
function NeckDial({
  progress,
  nexts,
  spinning,
}: {
  progress: number;
  nexts: number[];
  spinning: boolean;
}) {
  const R = 44;
  const C = 2 * Math.PI * R;
  const frac = Math.min(1, progress / 4);
  const ARROWS = ['↑', '→', '↓', '←'];
  const POS: React.CSSProperties[] = [
    { top: 0, left: '50%', transform: 'translateX(-50%)' },
    { right: 0, top: '50%', transform: 'translateY(-50%)' },
    { bottom: 0, left: '50%', transform: 'translateX(-50%)' },
    { left: 0, top: '50%', transform: 'translateY(-50%)' },
  ];
  const done = spinning || progress >= 4;
  return (
    <div
      className="hud-night flex flex-col items-center gap-2.5 rounded-xl px-6 py-5"
      style={{
        background: 'color-mix(in srgb, var(--surface) 92%, transparent)',
        boxShadow:
          '0 24px 60px -18px rgba(0,0,0,0.7), 0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
      aria-hidden
    >
      <div className="relative size-32">
        <svg viewBox="0 0 128 128" className="absolute inset-0 size-full -rotate-90">
          <circle cx="64" cy="64" r={R} fill="none" stroke="var(--line)" strokeWidth="2.5" />
          <circle
            cx="64"
            cy="64"
            r={R}
            fill="none"
            stroke={done ? 'var(--pass)' : 'var(--amber)'}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - (done ? 1 : frac))}
            style={{ transition: 'stroke-dashoffset 220ms ease, stroke 220ms ease' }}
          />
        </svg>
        {ARROWS.map((g, i) => {
          const isNext = !done && nexts.includes(i);
          return (
            <kbd
              key={g}
              className={`keycap absolute !h-7 !min-w-7 !text-xs ${
                isNext ? 'keycap--current animate-edgepulse' : done ? 'keycap--done' : ''
              }`}
              style={POS[i]}
            >
              {g}
            </kbd>
          );
        })}
        <span className="absolute inset-0 flex items-center justify-center font-mono text-[11px] tabular-nums text-ink-dim">
          {done ? <span className="text-pass">✓</span> : `${progress}/4`}
        </span>
      </div>
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-dim">
        {done ? 'pescoço solto' : 'gire o pescoço'}
      </span>
    </div>
  );
}

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
