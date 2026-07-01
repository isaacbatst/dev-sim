'use client';

/**
 * Protótipo ISOLADO das mecânicas de PAUSA (fora do fluxo de tickets). Rev 2 —
 * feedback: (1) pandeiro, não kalimba, e sem latência; (2) girar o pescoço em
 * todas as direções; (3) manter a mecânica boa mas re-tematizar + tecla por alvo.
 *
 * 1 Pandeiro · 2 Pescoço · 3 Esmagar (troca com 1/2/3 ou os botões).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import * as A from './audio';

type Mode = 'pandeiro' | 'neck' | 'squash';

const TABS: { id: Mode; n: string; label: string }[] = [
  { id: 'pandeiro', n: '1', label: 'Pandeiro' },
  { id: 'neck', n: '2', label: 'Pescoço' },
  { id: 'squash', n: '3', label: 'Esmagar' },
];

export default function PausaPage() {
  const [mode, setMode] = useState<Mode>('pandeiro');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '1') setMode('pandeiro');
      else if (e.key === '2') setMode('neck');
      else if (e.key === '3') setMode('squash');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <main
      className="flex min-h-dvh flex-col items-center gap-8 px-6 py-10"
      style={{ background: 'var(--bg)', color: 'var(--ink)' }}
    >
      <header className="flex flex-col items-center gap-4 text-center">
        <p
          className="font-mono text-[11px] uppercase tracking-[0.3em]"
          style={{ color: 'var(--ink-dim)' }}
        >
          protótipo · mecânicas de pausa
        </p>
        <div className="flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setMode(t.id)}
              className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              style={
                mode === t.id
                  ? { background: 'var(--ink)', color: 'var(--bg)' }
                  : { background: 'var(--surface-2)', color: 'var(--ink-dim)' }
              }
            >
              <span className="font-mono opacity-60">{t.n}</span> {t.label}
            </button>
          ))}
        </div>
      </header>

      <div className="flex w-full max-w-2xl flex-1 items-center justify-center">
        {mode === 'pandeiro' && <Pandeiro />}
        {mode === 'neck' && <Neck />}
        {mode === 'squash' && <Squash />}
      </div>

      <style>{PROTO_CSS}</style>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* 1 · Pandeiro — três toques por POSIÇÃO: cima, tum do meio, baixo.   */
/*     Teclas em coluna vertical (E/D/C ou I/K/M) = cima/meio/baixo.   */
/*     Percussão pura; ataque seco = onset no tempo.                   */
/* ------------------------------------------------------------------ */

type Stroke = 'top' | 'tum' | 'bottom';

function Pandeiro() {
  const [shakeN, setShakeN] = useState(0);
  const [zone, setZone] = useState<{ n: number; kind: Stroke } | null>(null);
  const nonce = useRef(0);

  const play = useCallback((kind: Stroke) => {
    if (kind === 'tum') A.pandeiroTum();
    else if (kind === 'top') A.pandeiroTop();
    else A.pandeiroBottom();
    const n = ++nonce.current;
    setShakeN(n);
    setZone({ n, kind });
  }, []);

  useEffect(() => {
    const map: Record<string, Stroke> = {
      e: 'top',
      i: 'top',
      d: 'tum',
      k: 'tum',
      c: 'bottom',
      m: 'bottom',
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const s = map[e.key.toLowerCase()];
      if (s) {
        e.preventDefault();
        play(s);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [play]);

  const JINGLES = 10;
  const band = { width: 128, height: 40, left: 46 } as const;
  return (
    <div className="flex flex-col items-center gap-8">
      <div key={shakeN} className="proto-shake relative" style={{ width: 220, height: 220 }}>
        {/* aro + platinelas */}
        <div
          className="absolute inset-0 rounded-full"
          style={{ border: '10px solid var(--surface-2)', boxShadow: 'inset 0 0 0 1px var(--line)' }}
        />
        {Array.from({ length: JINGLES }, (_, i) => {
          const a = (i / JINGLES) * Math.PI * 2;
          const r = 104;
          const on = zone?.kind !== 'tum';
          return (
            <span
              key={i}
              className={zone && on ? 'proto-jingle' : ''}
              style={{
                position: 'absolute',
                left: 110 + Math.cos(a) * r - 4,
                top: 110 + Math.sin(a) * r - 4,
                width: 8,
                height: 8,
                borderRadius: 9999,
                background: 'var(--amber)',
                opacity: 0.4,
              }}
            />
          );
        })}
        {/* pele */}
        <div
          className="absolute rounded-full"
          style={{ inset: 18, background: 'var(--surface)', border: '1px solid var(--line)' }}
        />

        {/* três zonas de toque (clicáveis) + rótulo */}
        <ZoneBtn label="cima" onHit={() => play('top')} style={{ top: 34, left: band.left, width: band.width, height: band.height, borderRadius: 20 }} />
        <ZoneBtn label="tum" onHit={() => play('tum')} style={{ top: 76, left: 72, width: 76, height: 76, borderRadius: 9999 }} />
        <ZoneBtn label="baixo" onHit={() => play('bottom')} style={{ top: 146, left: band.left, width: band.width, height: band.height, borderRadius: 20 }} />

        {/* flash da zona tocada */}
        {zone && (
          <span
            key={zone.n}
            className="proto-flash absolute"
            style={{
              background: 'var(--amber)',
              borderRadius: zone.kind === 'tum' ? 9999 : 20,
              top: zone.kind === 'top' ? 34 : zone.kind === 'tum' ? 76 : 146,
              left: zone.kind === 'tum' ? 72 : band.left,
              width: zone.kind === 'tum' ? 76 : band.width,
              height: zone.kind === 'tum' ? 76 : band.height,
            }}
          />
        )}
      </div>

      <div className="flex gap-3 font-mono text-xs" style={{ color: 'var(--ink-dim)' }}>
        <span>
          <b style={{ color: 'var(--ink)' }}>E</b> cima
        </span>
        <span>
          <b style={{ color: 'var(--ink)' }}>D</b> tum
        </span>
        <span>
          <b style={{ color: 'var(--ink)' }}>C</b> baixo
        </span>
        <span className="opacity-60">(ou I / K / M)</span>
      </div>
    </div>
  );
}

function ZoneBtn({
  label,
  onHit,
  style,
}: {
  label: string;
  onHit: () => void;
  style: React.CSSProperties;
}) {
  return (
    <button
      onPointerDown={onHit}
      className="absolute flex items-center justify-center font-mono text-[10px] uppercase tracking-wider"
      style={{ color: 'var(--ink-dim)', background: 'transparent', ...style }}
    >
      {label}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* 2 · Pescoço — setas rolam a cabeça pra cada lado (estalo). Fazer a  */
/*     volta completa (as 4) = alívio maior. Livre, sem falha.         */
/* ------------------------------------------------------------------ */

const DIRS: Record<string, { dx: number; dy: number }> = {
  ArrowUp: { dx: 0, dy: -1 },
  ArrowDown: { dx: 0, dy: 1 },
  ArrowLeft: { dx: -1, dy: 0 },
  ArrowRight: { dx: 1, dy: 0 },
};

function Neck() {
  const [off, setOff] = useState({ dx: 0, dy: 0 });
  const [spark, setSpark] = useState(0);
  const [relief, setRelief] = useState(0);
  const hitDirs = useRef<Set<string>>(new Set());
  const clearT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetT = useRef<ReturnType<typeof setTimeout> | null>(null);

  const roll = useCallback((key: string) => {
    const d = DIRS[key];
    if (!d) return;
    A.neckCrack();
    setOff({ dx: d.dx, dy: d.dy });
    setSpark((s) => s + 1);
    if (resetT.current) clearTimeout(resetT.current);
    resetT.current = setTimeout(() => setOff({ dx: 0, dy: 0 }), 160);

    hitDirs.current.add(key);
    if (hitDirs.current.size >= 4) {
      hitDirs.current.clear();
      A.sigh();
      setRelief((r) => r + 1);
    }
    if (clearT.current) clearTimeout(clearT.current);
    clearT.current = setTimeout(() => hitDirs.current.clear(), 1600);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (DIRS[e.key]) {
        e.preventDefault();
        roll(e.key);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (clearT.current) clearTimeout(clearT.current);
      if (resetT.current) clearTimeout(resetT.current);
    };
  }, [roll]);

  return (
    <div className="flex flex-col items-center gap-10">
      <div className="relative flex h-64 w-64 items-end justify-center">
        {relief > 0 && (
          <span
            key={relief}
            className="proto-relief absolute rounded-full"
            style={{ bottom: 96, width: 120, height: 120, border: '2px solid var(--pass)' }}
          />
        )}
        {/* ombros */}
        <div
          style={{
            width: 180,
            height: 70,
            borderRadius: '40px 40px 16px 16px',
            background: 'var(--surface-2)',
            border: '1px solid var(--line)',
          }}
        />
        {/* cabeça */}
        <div
          className="absolute"
          style={{
            bottom: 70,
            width: 92,
            height: 92,
            borderRadius: 9999,
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            transform: `translate(${off.dx * 26}px, ${off.dy * 20}px) rotate(${off.dx * 10}deg)`,
            transition: 'transform .28s cubic-bezier(.2,1.3,.4,1)',
          }}
        />
        {spark > 0 && (
          <span
            key={spark}
            className="proto-spark absolute"
            style={{
              bottom: 78,
              width: 26,
              height: 26,
              borderRadius: 9999,
              background: 'var(--amber)',
            }}
          />
        )}
      </div>
      <p className="text-center text-sm" style={{ color: 'var(--ink-dim)' }}>
        <b style={{ color: 'var(--ink)' }}>↑ ↓ ← →</b> rolam o pescoço — faça a volta completa.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3 · Esmagar — grade de bugs, CADA tecla um bug. Press/clique esmaga */
/*     (splat), respawna. Rápido sobe o tom. (re-tema: bolha → bug.)   */
/* ------------------------------------------------------------------ */

const GRID: string[][] = [
  ['q', 'w', 'e', 'r'],
  ['a', 's', 'd', 'f'],
  ['z', 'x', 'c', 'v'],
];
const KEYS = GRID.flat();

function Squash() {
  const [dead, setDead] = useState<Record<string, number>>({}); // key -> nonce (esmagado)
  const alive = useRef<Record<string, boolean>>(Object.fromEntries(KEYS.map((k) => [k, true])));
  const combo = useRef(0);
  const lastAt = useRef(0);

  const squash = useCallback((k: string) => {
    if (!alive.current[k]) return;
    alive.current[k] = false;
    const now = performance.now();
    combo.current = now - lastAt.current < 400 ? Math.min(combo.current + 1, 20) : 0;
    lastAt.current = now;
    A.squash(460 * Math.pow(2, combo.current / 26));
    setDead((d) => ({ ...d, [k]: (d[k] ?? 0) + 1 }));
    setTimeout(() => {
      alive.current[k] = true;
      setDead((d) => {
        const c = { ...d };
        delete c[k];
        return c;
      });
    }, 1200);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const k = e.key.toLowerCase();
      if (KEYS.includes(k)) {
        e.preventDefault();
        squash(k);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [squash]);

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex flex-col gap-3">
        {GRID.map((row, ri) => (
          <div key={ri} className="flex gap-3">
            {row.map((k) => {
              const isDead = dead[k] !== undefined;
              return (
                <button
                  key={k}
                  onPointerDown={() => squash(k)}
                  className="relative flex size-16 items-center justify-center rounded-xl"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}
                >
                  {!isDead ? (
                    <span className="proto-bug text-2xl" aria-hidden>
                      🐛
                    </span>
                  ) : (
                    <span
                      key={dead[k]}
                      className="proto-splat absolute text-2xl"
                      aria-hidden
                      style={{ color: 'var(--pass)' }}
                    >
                      ✳
                    </span>
                  )}
                  <kbd
                    className="absolute bottom-0.5 right-1 font-mono text-[9px] uppercase"
                    style={{ color: 'var(--ink-dim)' }}
                  >
                    {k}
                  </kbd>
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <p className="text-center text-sm" style={{ color: 'var(--ink-dim)' }}>
        Cada tecla é um bug — <b style={{ color: 'var(--ink)' }}>esmague</b> (tecla ou clique). Rápido
        sobe o tom.
      </p>
    </div>
  );
}

const PROTO_CSS = `
.proto-shake { animation: proto-shake .18s ease-out; }
.proto-flash { pointer-events: none; animation: proto-flash .35s ease-out forwards; }
.proto-jingle { animation: proto-jingle .3s ease-out; }
.proto-relief { pointer-events: none; animation: proto-relief .5s ease-out forwards; }
.proto-spark { pointer-events: none; animation: proto-spark .3s ease-out forwards; }
.proto-splat { pointer-events: none; animation: proto-splat .4s ease-out forwards; }
.proto-bug { transition: transform .08s ease; }
.proto-bug:active { transform: scale(.85); }
@keyframes proto-shake { 0%,100% { transform: translate(0,0) } 20% { transform: translate(-4px,2px) rotate(-2deg) } 60% { transform: translate(4px,-2px) rotate(2deg) } }
@keyframes proto-flash { from { opacity: .55 } to { opacity: 0 } }
@keyframes proto-jingle { 0% { opacity: 1; transform: scale(1.6) } 100% { opacity: .4; transform: scale(1) } }
@keyframes proto-relief { from { transform: scale(.5); opacity: .6 } to { transform: scale(2.6); opacity: 0 } }
@keyframes proto-spark { 0% { transform: scale(.4); opacity: .9 } 100% { transform: scale(2); opacity: 0 } }
@keyframes proto-splat { 0% { transform: scale(.4); opacity: 1 } 45% { transform: scale(1.5); opacity: 1 } 100% { transform: scale(1.9); opacity: 0 } }
@media (prefers-reduced-motion: reduce) {
  .proto-shake,.proto-flash,.proto-jingle,.proto-relief,.proto-spark,.proto-splat { animation: none }
}
`;
