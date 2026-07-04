'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as S from '@/store/breakSound';

/**
 * PAUSA ("-", a qualquer momento): a câmera desce do monitor pra MESA — 1ª
 * pessoa, diegético. O expediente NÃO para (o relógio segue, visível): pausar
 * custa tempo, é decisão. As atividades vivem na mesa, sem falha e sem ritmo
 * julgado (tolerantes a latência):
 *   ←↑↓→ pescoço (sempre) · A–K tecladinho (se comprou) · C gole (se comprou)
 *   R regar → close da planta com a grade de terra (se comprou).
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

export function Break({
  clock,
  owned,
  active,
  onResume,
}: {
  clock: string;
  owned: string[];
  /** Só escuta teclado quando a pausa está de fato aberta. */
  active: boolean;
  onResume: () => void;
}) {
  const has = (id: string) => owned.includes(id);

  const [mode, setMode] = useState<'mesa' | 'planta'>('mesa');
  // pescoço: a visão inclina
  const [tilt, setTilt] = useState({ dx: 0, dy: 0 });
  const [relief, setRelief] = useState(0);
  const hitDirs = useRef<Set<string>>(new Set());
  const tiltT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirsT = useRef<ReturnType<typeof setTimeout> | null>(null);
  // tecladinho: notas flutuando + tecla acesa
  const [notes, setNotes] = useState<{ id: number; idx: number }[]>([]);
  const [lit, setLit] = useState<Record<number, number>>({});
  const nonce = useRef(0);
  // gole
  const [sipN, setSipN] = useState(0);
  // regar: terra molhada absorve + folhas respiram
  const [wet, setWet] = useState<Record<string, number>>({});
  const [leafN, setLeafN] = useState(0);
  const waterCombo = useRef(0);
  const waterAt = useRef(0);

  // Ao voltar pro trabalho, a próxima pausa reabre na mesa (padrão React de
  // ajustar estado quando a prop muda — sem effect).
  const [prevActive, setPrevActive] = useState(active);
  if (prevActive !== active) {
    setPrevActive(active);
    if (!active) setMode('mesa');
  }

  const roll = useCallback((key: string) => {
    const d = DIRS[key];
    if (!d) return;
    S.neckCrack();
    setTilt(d);
    if (tiltT.current) clearTimeout(tiltT.current);
    tiltT.current = setTimeout(() => setTilt({ dx: 0, dy: 0 }), 260);
    hitDirs.current.add(key);
    if (hitDirs.current.size >= 4) {
      hitDirs.current.clear();
      S.sigh();
      setRelief((r) => r + 1);
    }
    if (dirsT.current) clearTimeout(dirsT.current);
    dirsT.current = setTimeout(() => hitDirs.current.clear(), 1800);
  }, []);

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

  const drinkSip = useCallback(() => {
    S.sip();
    setSipN((n) => n + 1);
  }, []);

  // Teclado da pausa (fase bubble — o GameScreen já engoliu o jogo na captura).
  useEffect(() => {
    if (!active) return;
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
      // mesa (hub)
      if (k === 'r' && has('planta')) {
        e.preventDefault();
        return setMode('planta');
      }
      if (k === 'c' && has('cafe')) {
        e.preventDefault();
        return drinkSip();
      }
      if (PIANO_IDX[k] !== undefined && has('teclado')) {
        e.preventDefault();
        return playNote(PIANO_IDX[k]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, mode, owned.join(','), roll, water, playNote, drinkSip]);

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      {/* a mesa em close (você olhou pra baixo). O topo EMENDA na cor da mesa do
          Workstation (#160f0a) — o pan da câmera é contínuo, sem costura. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #160f0a 0%, #3d2e1e 32%, #2a1f15 68%, #120c07 100%)',
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: 'repeating-linear-gradient(90deg, #000 0 2px, transparent 2px 34px)',
        }}
      />
      {/* luz do monitor vindo de cima (a tela ficou lá em cima) */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-1/3 blur-3xl"
        style={{
          background: 'radial-gradient(60% 90% at 50% 0%, rgba(90,120,190,0.28), transparent 70%)',
        }}
      />

      {/* conteúdo (inclina com o pescoço) */}
      <div
        className="relative flex h-full flex-col transition-transform duration-300"
        style={{
          transform: `translateY(${tilt.dy * -20}px) rotate(${tilt.dx * -5}deg)`,
          transitionTimingFunction: 'cubic-bezier(0.2, 1.3, 0.4, 1)',
        }}
      >
        {/* relógio: o dia continua correndo — o custo da pausa é visível */}
        <div className="relative mt-12 flex flex-col items-center gap-1">
          <span className="font-mono text-6xl font-bold tabular-nums text-white/85">{clock}</span>
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-white/40">
            o expediente continua
          </span>
        </div>

        {/* alívio da volta completa do pescoço */}
        {relief > 0 && (
          <span
            key={relief}
            className="animate-reliefring pointer-events-none absolute left-1/2 top-1/2 -ml-20 -mt-20 size-40 rounded-full border-2"
            style={{ borderColor: 'var(--pass)' }}
            aria-hidden
          />
        )}

        {mode === 'planta' ? (
          <Regar wet={wet} setWet={setWet} leafN={leafN} onWater={water} />
        ) : (
          <Mesa has={has} notes={notes} setNotes={setNotes} lit={lit} sipN={sipN} leafN={leafN} />
        )}

        {/* dicas + voltar */}
        <div className="relative mb-8 flex items-center justify-center gap-6 font-mono text-xs text-white/45">
          {mode === 'planta' ? (
            <span className="flex items-center gap-1.5">
              <kbd className="keycap !h-5 !min-w-7 !text-[10px]">⌫</kbd> voltar à mesa
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <kbd className="keycap !h-5 !min-w-5 !text-[10px]">←</kbd>
              <kbd className="keycap !h-5 !min-w-5 !text-[10px]">→</kbd>
              alongar o pescoço
            </span>
          )}
          <button
            onClick={onResume}
            className="flex items-center gap-1.5 transition-colors hover:text-white/80"
          >
            <kbd className="keycap !h-5 !min-w-5 !text-[10px]">-</kbd>
            voltar ao trabalho
          </button>
        </div>
      </div>

      {/* vinheta */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: 'inset 0 0 220px 70px rgba(0,0,0,0.5)' }}
      />
    </div>
  );
}

/* ── a mesa (hub): itens + verbos ─────────────────────────────── */

function Mesa({
  has,
  notes,
  setNotes,
  lit,
  sipN,
  leafN,
}: {
  has: (id: string) => boolean;
  notes: { id: number; idx: number }[];
  setNotes: React.Dispatch<React.SetStateAction<{ id: number; idx: number }[]>>;
  lit: Record<number, number>;
  sipN: number;
  leafN: number;
}) {
  return (
    <div
      className="relative flex flex-1 items-center justify-center"
      style={{ perspective: '900px' }}
    >
      <div
        className="flex items-end gap-14"
        style={{ transform: 'rotateX(28deg)', transformOrigin: 'center 70%' }}
      >
        {/* planta (se comprou) → R abre o regar */}
        {has('planta') && (
          <div className="flex flex-col items-center gap-3">
            <Plant size={1} pulseKey={leafN} />
            <Hint k="R" label="regar" />
          </div>
        )}

        {/* caneca (+ vapor/gole se comprou o café) */}
        <div className="flex flex-col items-center gap-3">
          <div key={sipN} className={sipN > 0 ? 'animate-sipmug' : ''}>
            <Mug steaming={has('cafe')} />
          </div>
          {has('cafe') && <Hint k="C" label="gole" />}
        </div>

        {/* teclado (tecladinho se comprou o mecânico) */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="relative h-36 w-[min(560px,52vw)] rounded-2xl"
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
            {/* oitava acesa (A–K) + notas subindo */}
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
          {has('teclado') && <Hint k="A–K" label="tocar" wide />}
        </div>

        {/* mouse */}
        <div
          className="mb-3 h-16 w-11 shrink-0 rounded-[45%]"
          style={{
            background: 'linear-gradient(180deg, #1c1f29, #0d0f15)',
            boxShadow: '0 22px 26px -10px rgba(0,0,0,0.75)',
          }}
        >
          <div className="mx-auto mt-2.5 h-6 w-px bg-white/10" />
        </div>
      </div>
    </div>
  );
}

/* ── regar (close da planta + grade de terra) ─────────────────── */

const DRY = '#5b4636';
const WET = '#2f241b';

function Regar({
  wet,
  setWet,
  leafN,
  onWater,
}: {
  wet: Record<string, number>;
  setWet: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  leafN: number;
  onWater: (k: string) => void;
}) {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center gap-5">
      <Plant size={1.6} pulseKey={leafN} />
      <div
        className="rounded-2xl p-2"
        style={{ background: '#7a5c44', boxShadow: 'inset 0 3px 6px rgba(0,0,0,.35)' }}
      >
        <div className="flex flex-col gap-1.5">
          {SOIL.map((row, ri) => (
            <div key={ri} className="flex gap-1.5">
              {row.map((k) => (
                <button
                  key={k}
                  onPointerDown={() => onWater(k)}
                  className="relative size-14 overflow-hidden rounded-lg"
                  style={{ background: DRY }}
                  aria-label={`regar ${k}`}
                >
                  {wet[k] !== undefined && (
                    <>
                      <span
                        key={wet[k]}
                        className="animate-waterabsorb absolute inset-0"
                        style={{ background: WET }}
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
      <p className="font-mono text-xs text-white/45">
        cada tecla rega uma parte da terra — <span className="text-white/70">a terra absorve</span>
      </p>
    </div>
  );
}

/* ── peças ────────────────────────────────────────────────────── */

function Plant({ size, pulseKey }: { size: number; pulseKey: number }) {
  const s = size;
  return (
    <div
      key={pulseKey}
      className={pulseKey > 0 ? 'animate-leafpulse relative shrink-0' : 'relative shrink-0'}
      style={{ width: 96 * s, height: 128 * s }}
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
    <div className="relative mb-2 h-20 w-16 shrink-0">
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
    <span className="flex items-center gap-1.5 font-mono text-[11px] text-white/45">
      <kbd className={`keycap !h-5 !text-[10px] ${wide ? '!min-w-10' : '!min-w-5'}`}>{k}</kbd>
      {label}
    </span>
  );
}
