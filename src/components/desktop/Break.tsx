'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as S from '@/store/breakSound';
import { MugArt, useDeskArt } from './deskArt';

/**
 * PAUSA ("-", a qualquer momento): o personagem se AFASTA do computador — zoom
 * out na MESMA cena (nada de troca de tela). O expediente não para: pausar
 * custa tempo. Camadas:
 *   - CENA (diegética, inclina com o pescoço, recebe o zoom): Workstation +
 *     DeskItems (a mesa à frente, sempre visível — no trabalho só a beirada).
 *   - HUD (BreakHud): relógio/dicas/voltar — NUNCA inclina nem escala.
 * Atividades (sem falha, sem ritmo julgado), cada uma um MODO ou gesto direto:
 * P pescoço (setas dentro do modo) · R regar (grade de terra) · C gole ·
 * A–K tecladinho · ⌫ volta à mesa.
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

export type BreakMode = 'mesa' | 'planta' | 'pescoco';

export interface BreakState {
  /** Pausa aberta? (prompts da cena só aparecem na pausa) */
  active: boolean;
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
  /** Ângulos já apertados na sequência atual (o HUD afunda esses keycaps). */
  neckHits: number[];
  /** Progresso dos rituais de objeto (pips nos prompts da cena). */
  waterN: number;
  sipDoneN: number;
  noteDoneN: number;
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
  const [neckHits, setNeckHits] = useState<number[]>([]);
  const [waterN, setWaterN] = useState(0);
  const [sipDoneN, setSipDoneN] = useState(0);
  const [noteDoneN, setNoteDoneN] = useState(0);
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

  // Ao voltar pro trabalho: próxima pausa reabre na mesa e o progresso de
  // ritual zera (cada pausa recomeça os gestos). Estados ajustam na render
  // (padrão sancionado); refs limpam em effect (não se toca ref na render).
  const [prevActive, setPrevActive] = useState(active);
  if (prevActive !== active) {
    setPrevActive(active);
    if (!active) {
      setMode('mesa');
      setWaterN(0);
      setSipDoneN(0);
      setNoteDoneN(0);
    }
  }
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
        setNeckHits(s.map((e) => e.a));
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
          setNeckHits([]);
        }, 1300);
      }
      if (rot !== 0) {
        if (seqT.current) clearTimeout(seqT.current);
        setNeckProgress(4);
        setNeckNexts([]);
        setNeckHits([]);
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
      setNoteDoneN(noteCount.current);
      if (noteCount.current >= 8) {
        noteCount.current = 0;
        setNoteDoneN(0);
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
      setWaterN(wateredCells.current.size);
      if (wateredCells.current.size >= SOILKEYS.length) {
        wateredCells.current.clear();
        setWaterN(0);
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
      if (mode === 'pescoco') {
        if (e.key === 'Backspace') {
          e.preventDefault();
          return setMode('mesa');
        }
        if (DIRS[e.key]) {
          e.preventDefault();
          return roll(e.key);
        }
        return;
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
      if (k === 'p') {
        e.preventDefault();
        return setMode('pescoco');
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
        setSipDoneN(sipCount.current);
        if (sipCount.current >= 3) {
          sipCount.current = 0;
          setTimeout(() => {
            setSipDoneN(0);
            completeRitual(true);
          }, 500); // depois do "ahh" do gole
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
    active,
    mode,
    tilt,
    flowing,
    spinning,
    neckProgress,
    neckNexts,
    neckHits,
    waterN,
    sipDoneN,
    noteDoneN,
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
  const { mode, notes, setNotes, lit, sipN, wet, setWet, water } = brk;
  const art = useDeskArt();

  return (
    <div className="relative flex h-full items-start justify-center">
      {/* grade de terra (regar): um "olhar de perto" no vaso, flutua sobre a mesa */}
      {mode === 'planta' && (
        <div className="absolute bottom-[70%] left-1/2 z-10 -translate-x-1/2">
          <SoilGrid wet={wet} setWet={setWet} onWater={water} />
        </div>
      )}

      <div className="flex items-end gap-14">
        {/* caneca FORA do plano inclinado: é arte de frente — dentro do
            rotateX ela sai cisalhada ("itálico") por estar fora do eixo. */}
        <div key={sipN} className={`mb-1 ${sipN > 0 ? 'animate-sipmug' : ''}`}>
          <MugArt variant={art.mug} steaming={has('cafe')} />
        </div>

        <div style={{ perspective: '1100px' }}>
          <div
            className="flex items-end gap-16"
            style={{ transform: 'rotateX(26deg)', transformOrigin: 'center 20%' }}
          >
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
  neckHits,
  waterN,
  sipDoneN,
  noteDoneN,
  spinning,
  onResume,
}: {
  clock: string;
  mode: BreakMode;
  owned: string[];
  relief: number;
  neckProgress: number;
  neckNexts: number[];
  neckHits: number[];
  waterN: number;
  sipDoneN: number;
  noteDoneN: number;
  spinning: boolean;
  onResume: () => void;
}) {
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
      {/* PESCOÇO como MODO (igual à planta): na mesa é um prompt [P] de mesmo
          peso dos outros; P entra no modo → o cluster assume o centro; ⌫ sai. */}
      {mode === 'pescoco' && (
        <div className="beat-in absolute inset-0 flex items-center justify-center">
          <NeckCluster
            progress={neckProgress}
            nexts={neckNexts}
            hits={neckHits}
            spinning={spinning}
          />
        </div>
      )}
      {mode === 'mesa' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="hud-night flex items-start gap-10" aria-hidden>
            <RitualOption k="P" label="pescoço" total={4} done={0} />
            {owned.includes('planta') && (
              <RitualOption k="R" label="regar" total={12} done={waterN} />
            )}
            {owned.includes('cafe') && (
              <RitualOption k="C" label="café" total={3} done={sipDoneN} />
            )}
            {owned.includes('teclado') && (
              <RitualOption k="A–K" label="tocar" total={8} done={noteDoneN} wide />
            )}
          </div>
        </div>
      )}
      {/* rodapé: relógio + voltar (os rituais têm prompts NOS objetos da cena) */}
      <div className="pointer-events-auto mt-auto flex items-center justify-center gap-6 pb-5 font-mono text-xs text-white/50">
        <span className="tabular-nums text-white/75">{clock}</span>
        <span className="uppercase tracking-[0.2em] text-white/35">o expediente continua</span>
        {mode !== 'mesa' && <Hint k="⌫" label="voltar à mesa" />}
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

/** Prompt do pescoço — GAME UI, não modal: as teclas de seta flutuam em cruz
 *  no centro (sem caixa; o keycap já é sólido e legível sobre qualquer cena).
 *  Apertada afunda (--done), a próxima do giro pulsa (--current), pips embaixo
 *  marcam a volta. Some sozinho: é prompt de interação, não painel. */
function NeckCluster({
  progress,
  nexts,
  hits,
  spinning,
}: {
  progress: number;
  nexts: number[];
  hits: number[];
  spinning: boolean;
}) {
  const done = spinning || progress >= 4;
  // hud-night: o cluster flutua sobre o QUARTO/monitor — keycaps sempre escuros
  const cap = (i: number, g: string) => (
    <kbd
      className={`keycap ${
        !done && nexts.includes(i)
          ? 'keycap--current animate-edgepulse'
          : done || hits.includes(i)
            ? 'keycap--done'
            : ''
      }`}
    >
      {g}
    </kbd>
  );
  return (
    <div className="hud-night flex flex-col items-center gap-2.5" aria-hidden>
      {/* cruz de setas (o cluster físico do teclado, virado pro giro) */}
      <div className="flex flex-col items-center gap-1.5">
        {cap(0, '↑')}
        <div className="flex items-center gap-14">
          {cap(3, '←')}
          {cap(1, '→')}
        </div>
        {cap(2, '↓')}
      </div>
      <Pips total={4} done={done ? 4 : progress} />
      <span
        className="font-mono text-[10px] uppercase tracking-[0.2em]"
        style={{
          color: done ? 'var(--pass)' : 'rgba(255,255,255,0.75)',
          textShadow: '0 1px 10px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.9)',
        }}
      >
        {done ? 'pescoço solto ✓' : 'gire o pescoço'}
      </span>
    </div>
  );
}

/** Pips de progresso de ritual (linguagem de jogo, não "n/m" de site). */
function Pips({ total, done }: { total: number; done: number }) {
  return (
    <span className="flex items-center gap-1" aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className="size-1.5 rounded-full transition-colors"
          style={{
            background: i < done ? 'var(--pass)' : 'rgba(255,255,255,0.25)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.8)',
          }}
        />
      ))}
    </span>
  );
}

/** Opção de ritual da pausa — mesmo peso pra todos (P/R/C/A–K), centralizada.
 *  Keycap + rótulo + pips; a com progresso acende o keycap (--current). */
function RitualOption({
  k,
  label,
  total,
  done,
  wide,
}: {
  k: string;
  label: string;
  total: number;
  done: number;
  wide?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2" aria-hidden>
      <kbd className={`keycap ${wide ? '!min-w-14' : ''} ${done > 0 ? 'keycap--current' : ''}`}>
        {k}
      </kbd>
      <span
        className="whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.18em]"
        style={{
          color: 'rgba(255,255,255,0.8)',
          textShadow: '0 1px 10px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.9)',
        }}
      >
        {label}
      </span>
      <Pips total={total} done={done} />
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

function Hint({ k, label, wide }: { k: string; label: string; wide?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <kbd className={`keycap !h-5 !text-[10px] ${wide ? '!min-w-10' : '!min-w-5'}`}>{k}</kbd>
      {label}
    </span>
  );
}
