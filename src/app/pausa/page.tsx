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

// Grooves de exemplo (8 colcheias). T = tum(meio), c = cima, b = baixo, . = pausa.
const PATTERNS: { id: string; name: string; steps: (Stroke | null)[] }[] = [
  { id: 'basico', name: 'Básico', steps: ['tum', 'top', 'bottom', 'top', 'tum', 'top', 'bottom', 'top'] },
  { id: 'balanco', name: 'Balanço', steps: ['tum', 'top', 'top', 'bottom', 'tum', 'top', 'top', 'bottom'] },
  { id: 'sincope', name: 'Síncope', steps: ['tum', null, 'top', 'bottom', 'top', 'tum', 'bottom', 'top'] },
];
const STROKE_CH: Record<Stroke, string> = { top: 'c', tum: 'T', bottom: 'b' };

function Pandeiro() {
  const [shakeN, setShakeN] = useState(0);
  const [zone, setZone] = useState<{ n: number; kind: Stroke } | null>(null);
  const [demo, setDemo] = useState<string | null>(null);
  const [step, setStep] = useState(-1);
  const [bpm, setBpm] = useState(110);
  const [lat, setLat] = useState<number | null>(null);
  const nonce = useRef(0);
  const demoT = useRef<ReturnType<typeof setInterval> | null>(null);
  const bpmRef = useRef(110);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  // Só o áudio (aceita `when` pra agendar no relógio do áudio).
  const strike = useCallback((kind: Stroke, when?: number) => {
    if (kind === 'tum') A.pandeiroTum(when);
    else if (kind === 'top') A.pandeiroTop(when);
    else A.pandeiroBottom(when);
  }, []);

  // Só o visual (flash da zona + tremida).
  const flash = useCallback((kind: Stroke) => {
    const n = ++nonce.current;
    setShakeN(n);
    setZone({ n, kind });
  }, []);

  // Toque manual = áudio imediato + visual + mede a latência de saída.
  const play = useCallback(
    (kind: Stroke) => {
      strike(kind);
      flash(kind);
      setLat(A.outLatencyMs());
    },
    [strike, flash],
  );

  const stopDemo = useCallback(() => {
    if (demoT.current) clearInterval(demoT.current);
    demoT.current = null;
    setDemo(null);
    setStep(-1);
  }, []);

  const startDemo = useCallback(
    (id: string) => {
      const pat = PATTERNS.find((p) => p.id === id);
      if (!pat) return;
      if (demoT.current) clearInterval(demoT.current);
      setDemo(id);
      let idx = 0;
      let next = A.now() + 0.08; // pequeno lookahead inicial
      // Agenda o ÁUDIO no relógio do áudio (preciso); visual segue por setTimeout.
      demoT.current = setInterval(() => {
        const ahead = A.now() + 0.15;
        while (next < ahead) {
          const i = idx % pat.steps.length;
          const s = pat.steps[i];
          const t = next;
          if (s) strike(s, t);
          const dMs = Math.max(0, (t - A.now()) * 1000);
          setTimeout(() => {
            setStep(i);
            if (s) flash(s);
          }, dMs);
          idx++;
          next += 30 / bpmRef.current; // colcheia = 60/bpm/2 s
        }
      }, 25);
    },
    [strike, flash],
  );

  useEffect(
    () => () => {
      if (demoT.current) clearInterval(demoT.current);
    },
    [],
  );

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

      {/* Demos de ritmo: tocam sozinhos acendendo as zonas no tempo. */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-3">
          <p
            className="font-mono text-[10px] uppercase tracking-[0.2em]"
            style={{ color: 'var(--ink-dim)' }}
          >
            demos de ritmo
          </p>
          {lat !== null && (
            <span className="font-mono text-[10px]" style={{ color: 'var(--ink-dim)' }}>
              · latência saída ~{lat}ms
            </span>
          )}
        </div>
        <label className="flex items-center gap-2 font-mono text-[11px]" style={{ color: 'var(--ink-dim)' }}>
          {bpm} bpm
          <input
            type="range"
            min={60}
            max={180}
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            style={{ accentColor: 'var(--amber)' }}
          />
        </label>
        <div className="flex gap-2">
          {PATTERNS.map((p) => {
            const on = demo === p.id;
            return (
              <button
                key={p.id}
                onClick={() => (on ? stopDemo() : startDemo(p.id))}
                className="rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
                style={
                  on
                    ? { background: 'var(--amber)', color: 'var(--bg)' }
                    : { background: 'var(--surface-2)', color: 'var(--ink-dim)' }
                }
              >
                {on ? '■' : '▶'} {p.name}
              </button>
            );
          })}
        </div>
        {demo && (
          <div className="flex gap-1">
            {PATTERNS.find((p) => p.id === demo)!.steps.map((s, i) => (
              <span
                key={i}
                className="flex size-7 items-center justify-center rounded font-mono text-xs"
                style={{
                  background: i === step ? 'var(--amber)' : 'var(--surface-2)',
                  color: i === step ? 'var(--bg)' : s ? 'var(--ink)' : 'var(--ink-dim)',
                  border: '1px solid var(--line)',
                }}
              >
                {s ? STROKE_CH[s] : '·'}
              </span>
            ))}
          </div>
        )}
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

  // 1ª pessoa: a VISÃO inclina (não um avatar). Olhar cima/baixo = pitch;
  // pender pros lados = roll. O mundo se move; você não se vê.
  const viewTransform = `translate(${off.dx * -18}px, ${off.dy * -26}px) rotate(${off.dx * 7}deg)`;

  return (
    <div className="flex flex-col items-center gap-10">
      <div
        className="relative overflow-hidden"
        style={{ width: 340, height: 230, borderRadius: 16, border: '1px solid var(--line)' }}
      >
        {/* cena em 1ª pessoa: parede/teto + mesa + monitor, tudo rola junto */}
        <div
          className="absolute"
          style={{
            inset: -40,
            transform: viewTransform,
            transition: 'transform .3s cubic-bezier(.2,1.3,.4,1)',
            background: 'linear-gradient(var(--surface-2), var(--bg) 62%)',
          }}
        >
          {/* linha do teto */}
          <div
            className="absolute inset-x-0"
            style={{ top: 46, height: 1, background: 'var(--line)', opacity: 0.5 }}
          />
          {/* monitor à frente */}
          <div
            className="absolute left-1/2 -translate-x-1/2 rounded-md"
            style={{
              top: 92,
              width: 190,
              height: 118,
              background: 'var(--bg)',
              border: '6px solid var(--surface)',
              boxShadow: 'inset 0 0 0 1px var(--line)',
            }}
          />
          {/* mesa */}
          <div
            className="absolute inset-x-0 bottom-0"
            style={{ height: 66, background: 'var(--surface)', borderTop: '1px solid var(--line)' }}
          />
        </div>

        {/* estalo (no eixo do pescoço = base da visão) */}
        {spark > 0 && (
          <span
            key={spark}
            className="proto-spark absolute left-1/2 top-1/2"
            style={{
              width: 30,
              height: 30,
              marginLeft: -15,
              marginTop: -15,
              borderRadius: 9999,
              background: 'var(--amber)',
            }}
          />
        )}
        {/* alívio da volta completa: respiro que preenche a visão */}
        {relief > 0 && (
          <span
            key={relief}
            className="proto-relief absolute left-1/2 top-1/2"
            style={{
              width: 160,
              height: 160,
              marginLeft: -80,
              marginTop: -80,
              borderRadius: 9999,
              border: '2px solid var(--pass)',
            }}
          />
        )}
      </div>
      <p className="text-center text-sm" style={{ color: 'var(--ink-dim)' }}>
        <b style={{ color: 'var(--ink)' }}>↑ ↓ ← →</b> rolam a cabeça (a visão inclina) — faça a
        volta completa.
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
