'use client';

/**
 * Protótipo ISOLADO das mecânicas de PAUSA (fora do fluxo de tickets). Só gestos
 * tolerantes a latência (discreto/segurar/direcional), sem ritmo preciso.
 * Pandeiro aposentado (latência do navegador ~60ms mata ritmo).
 *
 * 1 Pescoço · 2 Esmagar · 3 Regar (troca com 1/2/3 ou os botões).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import * as A from './audio';

type Mode = 'neck' | 'keys' | 'water';

const TABS: { id: Mode; n: string; label: string }[] = [
  { id: 'neck', n: '1', label: 'Pescoço' },
  { id: 'keys', n: '2', label: 'Tecladinho' },
  { id: 'water', n: '3', label: 'Regar' },
];

export default function PausaPage() {
  const [mode, setMode] = useState<Mode>('keys');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '1') setMode('neck');
      else if (e.key === '2') setMode('keys');
      else if (e.key === '3') setMode('water');
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
        {mode === 'neck' && <Neck />}
        {mode === 'keys' && <Keys />}
        {mode === 'water' && <Water />}
      </div>

      <style>{PROTO_CSS}</style>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* 1 · Pescoço (1ª pessoa) — setas rolam a VISÃO; volta completa = alívio */
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

  // Rolar (←→) = rotação anti-horária pra direita sobe o lado direito; olhar
  // (↑↓) = pitch (translateY). Inclinar é rolar, não deslizar de lado.
  const viewTransform = `translateY(${off.dy * -26}px) rotate(${off.dx * -8}deg)`;

  return (
    <div className="flex flex-col items-center gap-10">
      <div
        className="relative overflow-hidden"
        style={{ width: 340, height: 230, borderRadius: 16, border: '1px solid var(--line)' }}
      >
        <div
          className="absolute"
          style={{
            inset: -40,
            transform: viewTransform,
            transition: 'transform .3s cubic-bezier(.2,1.3,.4,1)',
            background: 'linear-gradient(var(--surface-2), var(--bg) 62%)',
          }}
        >
          <div
            className="absolute inset-x-0"
            style={{ top: 46, height: 1, background: 'var(--line)', opacity: 0.5 }}
          />
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
          <div
            className="absolute inset-x-0 bottom-0"
            style={{ height: 66, background: 'var(--surface)', borderTop: '1px solid var(--line)' }}
          />
        </div>

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
/* 2 · Tecladinho — uma oitava (C maior, teclas brancas) na home row.  */
/*     Melódico = self-paced → latência não atrapalha. Demos de música */
/*     tocadas pelo relógio do áudio (no tempo) só pra ouvir.          */
/* ------------------------------------------------------------------ */

const WHITE: { k: string; name: string; f: number }[] = [
  { k: 'a', name: 'C', f: 261.63 },
  { k: 's', name: 'D', f: 293.66 },
  { k: 'd', name: 'E', f: 329.63 },
  { k: 'f', name: 'F', f: 349.23 },
  { k: 'g', name: 'G', f: 392.0 },
  { k: 'h', name: 'A', f: 440.0 },
  { k: 'j', name: 'B', f: 493.88 },
  { k: 'k', name: 'C', f: 523.25 },
];
const KEY_TO_I: Record<string, number> = Object.fromEntries(WHITE.map((w, i) => [w.k, i]));

// Demos: índices na escala (0..7 = C..C), -1 = pausa. Só teclas brancas.
const SONGS: { id: string; name: string; notes: number[] }[] = [
  { id: 'ode', name: 'Ode à Alegria', notes: [2, 2, 3, 4, 4, 3, 2, 1, 0, 0, 1, 2, 2, 1, 1, -1] },
  { id: 'twinkle', name: 'Brilha Estrela', notes: [0, 0, 4, 4, 5, 5, 4, -1, 3, 3, 2, 2, 1, 1, 0, -1] },
  { id: 'frere', name: 'Frère Jacques', notes: [0, 1, 2, 0, 0, 1, 2, 0, 2, 3, 4, -1, 2, 3, 4, -1] },
];

function Keys() {
  const [lit, setLit] = useState<Record<number, number>>({});
  const [song, setSong] = useState<string | null>(null);
  const [bpm, setBpm] = useState(112);
  const bpmRef = useRef(112);
  const demoT = useRef<ReturnType<typeof setInterval> | null>(null);
  const nonce = useRef(0);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  const litKey = useCallback((i: number) => {
    const n = ++nonce.current;
    setLit((l) => ({ ...l, [i]: n }));
    setTimeout(() => {
      setLit((l) => {
        if (l[i] !== n) return l; // nova batida chegou; não apaga
        const c = { ...l };
        delete c[i];
        return c;
      });
    }, 180);
  }, []);

  const press = useCallback(
    (i: number) => {
      A.pianoNote(WHITE[i].f);
      litKey(i);
    },
    [litKey],
  );

  const stopSong = useCallback(() => {
    if (demoT.current) clearInterval(demoT.current);
    demoT.current = null;
    setSong(null);
  }, []);

  const startSong = useCallback(
    (id: string) => {
      const s = SONGS.find((x) => x.id === id);
      if (!s) return;
      if (demoT.current) clearInterval(demoT.current);
      setSong(id);
      let idx = 0;
      let next = A.now() + 0.1;
      demoT.current = setInterval(() => {
        const ahead = A.now() + 0.2;
        while (next < ahead) {
          const deg = s.notes[idx % s.notes.length];
          const t = next;
          if (deg >= 0) {
            A.pianoNote(WHITE[deg].f, t);
            const dMs = Math.max(0, (t - A.now()) * 1000);
            setTimeout(() => litKey(deg), dMs);
          }
          idx++;
          next += 60 / bpmRef.current; // uma semínima por nota
        }
      }, 25);
    },
    [litKey],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const i = KEY_TO_I[e.key.toLowerCase()];
      if (i !== undefined) {
        e.preventDefault();
        press(i);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [press]);

  useEffect(
    () => () => {
      if (demoT.current) clearInterval(demoT.current);
    },
    [],
  );

  return (
    <div className="flex flex-col items-center gap-7">
      {/* teclado: uma oitava de teclas brancas */}
      <div className="flex gap-1">
        {WHITE.map((w, i) => {
          const on = lit[i] !== undefined;
          return (
            <button
              key={w.k}
              onPointerDown={() => press(i)}
              className="relative flex items-end justify-center rounded-b-md pb-2 transition-transform"
              style={{
                width: 46,
                height: 150,
                background: on ? 'var(--amber)' : '#f4f1ea',
                border: '1px solid var(--line)',
                color: '#3a3a3a',
                transform: on ? 'translateY(2px)' : 'none',
              }}
            >
              <span className="font-mono text-[11px]">{w.name}</span>
              <kbd
                className="absolute bottom-1 right-1 font-mono text-[8px] uppercase"
                style={{ color: 'rgba(0,0,0,.35)' }}
              >
                {w.k}
              </kbd>
            </button>
          );
        })}
      </div>

      <label
        className="flex items-center gap-2 font-mono text-[11px]"
        style={{ color: 'var(--ink-dim)' }}
      >
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

      <div className="flex flex-col items-center gap-2">
        <p
          className="font-mono text-[10px] uppercase tracking-[0.2em]"
          style={{ color: 'var(--ink-dim)' }}
        >
          demos de música
        </p>
        <div className="flex gap-2">
          {SONGS.map((s) => {
            const on = song === s.id;
            return (
              <button
                key={s.id}
                onClick={() => (on ? stopSong() : startSong(s.id))}
                className="rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
                style={
                  on
                    ? { background: 'var(--amber)', color: 'var(--bg)' }
                    : { background: 'var(--surface-2)', color: 'var(--ink-dim)' }
                }
              >
                {on ? '■' : '▶'} {s.name}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-center text-sm" style={{ color: 'var(--ink-dim)' }}>
        Toque <b style={{ color: 'var(--ink)' }}>A…K</b> (uma oitava) — no seu tempo, sem errar.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3 · Regar — cada tecla rega uma região da terra; a terra ABSORVE e  */
/*     a água some (fade). Discreto (latência-safe), sem falha; a       */
/*     planta é o ambiente que você cultiva.                            */
/* ------------------------------------------------------------------ */

const SOIL: string[][] = [
  ['q', 'w', 'e', 'r'],
  ['a', 's', 'd', 'f'],
  ['z', 'x', 'c', 'v'],
];
const SOILKEYS = SOIL.flat();
const DRY = '#5b4636';
const WET = '#2f241b';

function Water() {
  const [wet, setWet] = useState<Record<string, number>>({});
  const [plantN, setPlantN] = useState(0);
  const combo = useRef(0);
  const lastAt = useRef(0);

  const water = useCallback((k: string) => {
    const now = performance.now();
    combo.current = now - lastAt.current < 350 ? Math.min(combo.current + 1, 12) : 0;
    lastAt.current = now;
    A.waterDrop(combo.current);
    setWet((w) => ({ ...w, [k]: (w[k] ?? 0) + 1 }));
    setPlantN((n) => n + 1);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const k = e.key.toLowerCase();
      if (SOILKEYS.includes(k)) {
        e.preventDefault();
        water(k);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [water]);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* a planta (o ambiente) — dá um respiro/pulso a cada rega */}
      <div key={plantN} className="proto-leaf flex items-end justify-center" style={{ height: 90 }}>
        {[-28, -10, 8, 26].map((rot, i) => (
          <span
            key={i}
            style={{
              position: 'absolute',
              bottom: 0,
              width: 20,
              height: 60 + (i % 2) * 18,
              borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
              background: `color-mix(in oklab, var(--pass) ${70 - i * 8}%, #1c3a24)`,
              transform: `translateX(${rot}px) rotate(${rot * 0.6}deg)`,
              transformOrigin: 'bottom center',
            }}
          />
        ))}
      </div>

      {/* a terra: grade de regiões, cada uma uma tecla */}
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
                  onPointerDown={() => water(k)}
                  className="relative size-16 overflow-hidden rounded-lg"
                  style={{ background: DRY }}
                  aria-label={`regar ${k}`}
                >
                  {wet[k] !== undefined && (
                    <>
                      <span
                        key={wet[k]}
                        className="proto-absorb absolute inset-0"
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
                        className="proto-splash absolute left-1/2 top-1"
                        style={{ borderColor: '#9fd0e6' }}
                      />
                    </>
                  )}
                  <kbd
                    className="absolute bottom-0.5 right-1 font-mono text-[9px] uppercase"
                    style={{ color: 'rgba(255,255,255,.4)' }}
                  >
                    {k}
                  </kbd>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
      <p className="text-center text-sm" style={{ color: 'var(--ink-dim)' }}>
        Cada tecla rega uma parte da terra — <b style={{ color: 'var(--ink)' }}>a terra absorve</b> e
        seca.
      </p>
    </div>
  );
}

const PROTO_CSS = `
.proto-spark { pointer-events: none; animation: proto-spark .3s ease-out forwards; }
.proto-relief { pointer-events: none; animation: proto-relief .5s ease-out forwards; }
.proto-absorb { pointer-events: none; animation: proto-absorb 1.6s ease-out forwards; }
.proto-splash { pointer-events: none; width: 16px; height: 16px; margin-left: -8px; border-radius: 9999px; border: 2px solid #9fd0e6; animation: proto-splash .45s ease-out forwards; }
.proto-leaf { position: relative; animation: proto-leaf .32s ease-out; }
@keyframes proto-spark { 0% { transform: scale(.4); opacity: .9 } 100% { transform: scale(2); opacity: 0 } }
@keyframes proto-relief { from { transform: scale(.5); opacity: .6 } to { transform: scale(2.6); opacity: 0 } }
@keyframes proto-absorb { 0% { opacity: .92 } 100% { opacity: 0 } }
@keyframes proto-splash { 0% { transform: scale(.3); opacity: .85 } 100% { transform: scale(2); opacity: 0 } }
@keyframes proto-leaf { 0%,100% { transform: scale(1) } 45% { transform: scale(1.05) } }
@media (prefers-reduced-motion: reduce) {
  .proto-spark,.proto-relief,.proto-absorb,.proto-splash,.proto-leaf { animation: none }
}
`;
