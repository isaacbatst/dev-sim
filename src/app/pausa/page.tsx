'use client';

/**
 * Protótipo ISOLADO das mecânicas de PAUSA (fora do fluxo de tickets). Objetivo:
 * provar o feel — som + resposta visual — de gestos relaxantes/satisfatórios que
 * se inspiram no "suco por tecla" do doc/merge SEM copiar o padrão. A regra: no
 * trabalho você executa o padrão certo; na pausa qualquer input é válido.
 *
 * 1 Tamborilar · 2 Estalar · 3 Estourar (troca com as teclas 1/2/3 ou os botões).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import * as A from './audio';

type Mode = 'drum' | 'crack' | 'pop';

const TABS: { id: Mode; n: string; label: string }[] = [
  { id: 'drum', n: '1', label: 'Tamborilar' },
  { id: 'crack', n: '2', label: 'Estalar' },
  { id: 'pop', n: '3', label: 'Estourar' },
];

export default function PausaPage() {
  const [mode, setMode] = useState<Mode>('drum');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '1') setMode('drum');
      else if (e.key === '2') setMode('crack');
      else if (e.key === '3') setMode('pop');
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
        <p className="font-mono text-[11px] uppercase tracking-[0.3em]" style={{ color: 'var(--ink-dim)' }}>
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
        {mode === 'drum' && <Drum />}
        {mode === 'crack' && <Crack />}
        {mode === 'pop' && <Pop />}
      </div>

      <style>{PROTO_CSS}</style>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* 1 · Tamborilar — home row vira mini-instrumento. Escala pentatônica */
/*     garante que QUALQUER combinação soa bem (não tem nota errada).  */
/* ------------------------------------------------------------------ */

const DRUM_KEYS = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'];
// Dó maior pentatônica em ~2 oitavas: sem dissonância possível.
const PENTA = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99];

function Drum() {
  const [ripples, setRipples] = useState<{ id: number; idx: number }[]>([]);
  const [flash, setFlash] = useState<Record<number, number>>({});
  const [groove, setGroove] = useState(false);
  const rid = useRef(0);

  const hit = useCallback((idx: number) => {
    A.drumNote(PENTA[idx]);
    const id = ++rid.current;
    setRipples((r) => [...r, { id, idx }]);
    setFlash((f) => ({ ...f, [idx]: id }));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const idx = DRUM_KEYS.indexOf(e.key.toLowerCase());
      if (idx >= 0) {
        e.preventDefault();
        hit(idx);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hit]);

  useEffect(() => {
    if (!groove) return;
    const iv = setInterval(() => A.groove(), 700);
    return () => clearInterval(iv);
  }, [groove]);

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex items-end gap-2">
        {DRUM_KEYS.map((k, idx) => {
          const h = idx / (DRUM_KEYS.length - 1); // 0..1 grave→agudo
          return (
            <div key={k} className="relative flex flex-col items-center gap-2">
              <div
                className="proto-pad relative overflow-hidden rounded-xl"
                onPointerDown={() => hit(idx)}
                style={{
                  width: 52,
                  height: 120 - h * 34,
                  background: 'var(--surface-2)',
                  border: '1px solid var(--line)',
                }}
              >
                {flash[idx] !== undefined && (
                  <span
                    key={flash[idx]}
                    className="proto-flash absolute inset-0"
                    style={{ background: 'var(--amber)' }}
                  />
                )}
                {ripples
                  .filter((r) => r.idx === idx)
                  .map((r) => (
                    <span
                      key={r.id}
                      className="proto-ripple absolute left-1/2 top-1/2"
                      style={{ background: 'var(--amber)' }}
                      onAnimationEnd={() => setRipples((rs) => rs.filter((x) => x.id !== r.id))}
                    />
                  ))}
              </div>
              <kbd
                className="font-mono text-[11px] uppercase"
                style={{ color: 'var(--ink-dim)' }}
              >
                {k}
              </kbd>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-sm" style={{ color: 'var(--ink-dim)' }}>
          Dedilhe as teclas <b style={{ color: 'var(--ink)' }}>A…L</b> — qualquer ritmo soa bem.
        </p>
        <button
          onClick={() => setGroove((g) => !g)}
          className="rounded-md px-3 py-1 font-mono text-xs"
          style={{
            background: groove ? 'var(--teal)' : 'var(--surface-2)',
            color: groove ? 'var(--bg)' : 'var(--ink-dim)',
          }}
        >
          groove {groove ? 'on' : 'off'}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2 · Estalar — segurar acumula tensão (rangido sobe), soltar dá o    */
/*     estalo + suspiro. Sem falha; o prazer é a DESCARGA.             */
/* ------------------------------------------------------------------ */

function Crack() {
  const [tension, setTension] = useState(0);
  const [burst, setBurst] = useState(0);
  const [held, setHeld] = useState(false);
  const holding = useRef(false);
  const tRef = useRef(0);
  const raf = useRef<number | null>(null);
  const last = useRef(0);
  const lastCreak = useRef(0);

  const start = useCallback(() => {
    if (holding.current) return;
    holding.current = true;
    setHeld(true);
    last.current = performance.now();
    lastCreak.current = 0;
    const loop = (t: number) => {
      if (!holding.current) return;
      const dt = (t - last.current) / 1000;
      last.current = t;
      const nv = Math.min(1, tRef.current + dt / 1.2);
      tRef.current = nv;
      setTension(nv);
      if (t - lastCreak.current > 110) {
        A.creak(nv);
        lastCreak.current = t;
      }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
  }, []);

  const release = useCallback(() => {
    if (!holding.current) return;
    holding.current = false;
    setHeld(false);
    if (raf.current) cancelAnimationFrame(raf.current);
    A.crack(tRef.current);
    A.sigh();
    setBurst((b) => b + 1);
    tRef.current = 0;
    setTension(0);
  }, []);

  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (!e.repeat) start();
      }
    };
    const ku = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        release();
      }
    };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => {
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [start, release]);

  const squeeze = 1 - tension * 0.42;
  const warm = 0.2 + tension * 0.8;

  return (
    <div className="flex flex-col items-center gap-10">
      <div className="relative flex h-56 w-56 items-center justify-center">
        {/* anel de alívio na descarga */}
        {burst > 0 && (
          <span
            key={burst}
            className="proto-relief absolute rounded-full"
            style={{ width: 120, height: 120, border: '2px solid var(--pass)' }}
          />
        )}
        {/* o "corpo" que comprime segurando e salta ao soltar */}
        <div
          className={tension > 0.82 ? 'proto-strain' : ''}
          style={{
            width: 150,
            height: 150,
            borderRadius: 28,
            transform: `scaleY(${squeeze})`,
            transition: held ? 'none' : 'transform .3s cubic-bezier(.2,1.5,.4,1)',
            background: `color-mix(in oklab, var(--amber) ${warm * 100}%, var(--surface-2))`,
            border: '1px solid var(--line)',
          }}
        />
      </div>
      <p className="text-center text-sm" style={{ color: 'var(--ink-dim)' }}>
        Segure <b style={{ color: 'var(--ink)' }}>Espaço</b> pra acumular… e{' '}
        <b style={{ color: 'var(--ink)' }}>solte</b> pra estalar.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3 · Estourar — plástico-bolha. Press = 1 pop suculento, pitch sobe  */
/*     em sucessão rápida. Zero regra, infinito (bolhas voltam).       */
/* ------------------------------------------------------------------ */

const BUBBLES = 28;

function Pop() {
  const [popped, setPopped] = useState<Record<number, number>>({}); // id -> nonce (aceso quando estoura)
  const combo = useRef(0);
  const lastAt = useRef(0);
  const available = useRef<boolean[]>(Array.from({ length: BUBBLES }, () => true));

  const popId = useCallback((id: number) => {
    if (!available.current[id]) return;
    available.current[id] = false;
    const now = performance.now();
    combo.current = now - lastAt.current < 400 ? Math.min(combo.current + 1, 20) : 0;
    lastAt.current = now;
    A.pop(480 * Math.pow(2, combo.current / 26));
    setPopped((p) => ({ ...p, [id]: (p[id] ?? 0) + 1 }));
    setTimeout(() => {
      available.current[id] = true;
      setPopped((p) => {
        const c = { ...p };
        delete c[id];
        return c;
      });
    }, 1400);
  }, []);

  const popNext = useCallback(() => {
    const id = available.current.findIndex((v) => v);
    if (id >= 0) popId(id);
  }, [popId]);

  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (!e.repeat) popNext();
      }
    };
    window.addEventListener('keydown', kd);
    return () => window.removeEventListener('keydown', kd);
  }, [popNext]);

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="grid grid-cols-7 gap-3">
        {Array.from({ length: BUBBLES }, (_, id) => {
          const isPopped = popped[id] !== undefined;
          return (
            <button
              key={id}
              onPointerDown={() => popId(id)}
              className="relative flex size-11 items-center justify-center"
              aria-label="bolha"
            >
              {!isPopped ? (
                <span
                  className="proto-bubble size-9 rounded-full"
                  style={{
                    background:
                      'radial-gradient(circle at 32% 28%, color-mix(in oklab, var(--teal) 55%, white), var(--teal))',
                    boxShadow: 'inset -2px -3px 4px rgba(0,0,0,.25)',
                  }}
                />
              ) : (
                <span
                  key={popped[id]}
                  className="proto-burst absolute rounded-full"
                  style={{ width: 22, height: 22, border: '2px solid var(--teal)' }}
                />
              )}
            </button>
          );
        })}
      </div>
      <p className="text-center text-sm" style={{ color: 'var(--ink-dim)' }}>
        <b style={{ color: 'var(--ink)' }}>Espaço</b> (ou clique) estoura — rápido sobe o tom.
      </p>
    </div>
  );
}

const PROTO_CSS = `
.proto-pad { cursor: pointer; touch-action: none; }
.proto-flash { pointer-events: none; animation: proto-flash .4s ease-out forwards; }
.proto-ripple {
  pointer-events: none; width: 46px; height: 46px; border-radius: 9999px;
  margin-left: -23px; margin-top: -23px; animation: proto-ripple .6s ease-out forwards;
}
.proto-relief { pointer-events: none; animation: proto-relief .5s ease-out forwards; }
.proto-strain { animation: proto-strain .09s linear infinite; }
.proto-burst { pointer-events: none; animation: proto-burst .35s ease-out forwards; }
.proto-bubble { transition: transform .08s ease; }
.proto-bubble:active { transform: scale(.9); }
@keyframes proto-flash { from { opacity: .5 } to { opacity: 0 } }
@keyframes proto-ripple { from { transform: scale(.3); opacity: .5 } to { transform: scale(2.4); opacity: 0 } }
@keyframes proto-relief { from { transform: scale(.5); opacity: .6 } to { transform: scale(2.6); opacity: 0 } }
@keyframes proto-burst { 0% { transform: scale(.4); opacity: .9 } 100% { transform: scale(2.2); opacity: 0 } }
@keyframes proto-strain { 0%,100% { translate: 0 0 } 25% { translate: -1.5px 0 } 75% { translate: 1.5px 0 } }
@media (prefers-reduced-motion: reduce) {
  .proto-flash,.proto-ripple,.proto-relief,.proto-burst,.proto-strain { animation: none }
}
`;
