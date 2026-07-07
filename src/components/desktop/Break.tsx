'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as S from '@/store/breakSound';
import { CanArt, MugArt, MugCloseup, PlantArt, useDeskArt } from './deskArt';

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
  ['q', 'w', 'e'],
  ['a', 's', 'd'],
  ['z', 'x', 'c'],
];
const SOILKEYS = SOIL.flat();
/** Café: DUAS voltas de colher (8 setas em círculo) antes dos goles. */
const STIR_TOTAL = 8;
/** Pescoço: DUAS voltas completas (8 setas em ordem de rotação). */
const NECK_TOTAL = 8;

/** Cada célula bebe 2 regas: na 1ª a água INFILTRA (escurece e seca aos
 *  poucos); na 2ª fica molhada de vez. */
const WATER_PER_CELL = 2;
const WATER_TOTAL = SOILKEYS.length * WATER_PER_CELL; // 18
const DIRS: Record<string, { dx: number; dy: number }> = {
  ArrowUp: { dx: 0, dy: -1 },
  ArrowDown: { dx: 0, dy: 1 },
  ArrowLeft: { dx: -1, dy: 0 },
  ArrowRight: { dx: 1, dy: 0 },
};

export type BreakMode = 'mesa' | 'planta' | 'pescoco' | 'cafe';

export interface BreakState {
  /** Pausa aberta? (prompts da cena só aparecem na pausa) */
  active: boolean;
  mode: BreakMode;
  tilt: { dx: number; dy: number };
  /** Encadeou uma direção com o pescoço ainda inclinado (movimento emenda). */
  flowing: boolean;
  /** Contra-giro automático do fecho do combo em curso. */
  spinning: boolean;
  /** Progresso do combo circular (0..8 — duas voltas completas). */
  neckProgress: number;
  /** Ângulos (0=↑ 1=→ 2=↓ 3=←) que continuam o giro agora (pro HUD pulsar). */
  neckNexts: number[];
  /** Fecho do pescoço: alongamentos laterais completados (0..2, ← depois →). */
  stretchN: number;
  /** Progresso do SEGURAR atual (0..1 — enche o medidor do keycap). */
  stretchHold: number;
  /** Ângulos já apertados na sequência atual (o HUD afunda esses keycaps). */
  neckHits: number[];
  /** Progresso dos rituais de objeto (pips nos prompts da cena). */
  waterN: number;
  /** Células já regadas (a terra FICA molhada até completar). */
  wateredKeys: string[];
  /** Café: mexidas com a colher (0..4) — CÍRCULO como o pescoço. */
  stirN: number;
  /** Ângulos já mexidos (0=↑ 1=→ 2=↓ 3=←) e os que continuam o giro. */
  stirHits: number[];
  stirNexts: number[];
  /** Ângulo acumulado da colher (graus — anima a órbita no close-up). */
  stirTheta: number;
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
  const [stretchN, setStretchN] = useState(0);
  const [stretchHold, setStretchHold] = useState(0);
  const stretchRef = useRef(0);
  const holdT = useRef<ReturnType<typeof setInterval> | null>(null);
  const [waterN, setWaterN] = useState(0);
  const [wateredKeys, setWateredKeys] = useState<string[]>([]);
  const [stirN, setStirN] = useState(0);
  const [stirHits, setStirHits] = useState<number[]>([]);
  const [stirNexts, setStirNexts] = useState<number[]>([0, 1, 2, 3]);
  const [stirTheta, setStirTheta] = useState(0);
  const stirSeq = useRef<number[]>([]);
  const [sipDoneN, setSipDoneN] = useState(0);
  const [noteDoneN, setNoteDoneN] = useState(0);
  const [relief, setRelief] = useState(0);
  const tiltRef = useRef({ dx: 0, dy: 0 });
  const seq = useRef<{ a: number; t: number }[]>([]);
  const seqT = useRef<ReturnType<typeof setTimeout> | null>(null);
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
      setNeckProgress(0);
      setStretchN(0);
      setStretchHold(0);
      setWaterN(0);
      setWateredKeys([]);
      setStirN(0);
      setStirHits([]);
      setStirNexts([0, 1, 2, 3]);
      setStirTheta(0);
      setSipDoneN(0);
      setNoteDoneN(0);
    }
  }
  useEffect(() => {
    if (!active) {
      sipCount.current = 0;
      noteCount.current = 0;
      stirSeq.current = [];
      stretchRef.current = 0;
      seq.current = [];
      if (holdT.current) clearInterval(holdT.current);
    }
  }, [active]);

  /** Mexida circular da colher (café): 4 setas em ordem de rotação, qualquer
   *  sentido — o espelho do combo do pescoço. Direção errada RECOMEÇA dali
   *  (sufixo consistente); a colher orbita a xícara (stirTheta). */
  const stirPress = useCallback((key: string) => {
    const ANGLE: Record<string, number> = { ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, ArrowLeft: 3 };
    const a = ANGLE[key];
    if (a === undefined || stirSeq.current.length >= STIR_TOTAL) return;
    const seq = stirSeq.current;
    let delta = 0;
    let ok = seq.length === 0;
    if (!ok) {
      const last = seq[seq.length - 1];
      const diff = (a - last + 4) % 4; // 1 = horário, 3 = anti-horário
      if (diff === 1 || diff === 3) {
        const dirNew = diff === 1 ? 1 : -1;
        const dir = seq.length >= 2 ? ((seq[1] - seq[0] + 4) % 4 === 1 ? 1 : -1) : dirNew;
        if (dirNew === dir) {
          ok = true;
          delta = dir * 90;
        }
      }
    }
    if (ok) {
      seq.push(a);
      setStirTheta((t) => (seq.length === 1 ? a * 90 : t + delta));
    } else {
      stirSeq.current = [a]; // recomeça DALI, sem punir
      setStirTheta(a * 90);
    }
    const cur = stirSeq.current;
    S.stir(cur.length - 1);
    setStirN(cur.length);
    // sequência inteira: o keycap fica ÂMBAR na 1ª volta e VERDE na 2ª
    setStirHits([...cur]);
    const lastA = cur[cur.length - 1];
    setStirNexts(
      cur.length >= STIR_TOTAL
        ? []
        : cur.length === 1
          ? [(lastA + 1) % 4, (lastA + 3) % 4]
          : [(lastA + ((cur[1] - cur[0] + 4) % 4 === 1 ? 1 : 3)) % 4],
    );
  }, []);

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

  /** Um gole no MODO café: 3 goles completam o ritual e a xícara volta pra
   *  mesa (sai do close-up). */
  const sip = useCallback(() => {
    const isLast = sipCount.current + 1 >= 2;
    // o último gole tem sample próprio (gulp-final, com o "ahh" embutido —
    // completeRitual(false) pra não dobrar com o sigh sintetizado)
    if (isLast) S.sipFinal();
    else S.sip();
    setSipN((n) => n + 1);
    sipCount.current += 1;
    setSipDoneN(sipCount.current);
    if (isLast) {
      sipCount.current = 0;
      setTimeout(() => {
        setSipDoneN(0);
        setStirN(0);
        stirSeq.current = [];
        setStirHits([]);
        setStirNexts([0, 1, 2, 3]);
        setStirTheta(0);
        completeRitual(false);
        setRelief((r) => r + 1); // anel de alívio (o "ahh" veio do sample)
        setMode('mesa'); // devolve a xícara à mesa
      }, 650);
    }
  }, [completeRitual]);

  // Alongamento natural: entra suave (~650ms), SEGURA no fundo (~1s) e solta
  // devagar (~1s) — nada de tique mecânico. CADA aperto agenda o SEU estalo
  // (independente, ~380ms depois, perto do fundo do movimento) — encadear
  // rápido toca todos, em série. COMBO CIRCULAR: DUAS voltas completas (8
  // setas em ordem de rotação, qualquer sentido) = ritual do pescoço.
  const setTilt = useCallback((d: { dx: number; dy: number }) => {
    tiltRef.current = d;
    setTiltState(d);
  }, []);

  // Timers de som do pescoço: os estalos individuais pendentes são CANCELADOS
  // quando o combo fecha (senão caem em cima do mix e embola).
  const crackTs = useRef<ReturnType<typeof setTimeout>[]>([]);

  /** Fecho do pescoço: alongamento lateral COM PESO. Segura ← (depois →) por
   *  ~1s — a câmera inclina fundo e FICA; o medidor enche; soltar antes só
   *  recomeça (sem falha). Cada lado fecha com um crack grave; o segundo
   *  dispara o mix + alívio e devolve à mesa. */
  const stretchStart = useCallback(
    (key: string) => {
      const side = stretchRef.current === 0 ? 'ArrowLeft' : 'ArrowRight';
      if (key !== side || holdT.current) return;
      setTilt(key === 'ArrowLeft' ? { dx: -1, dy: 0 } : { dx: 1, dy: 0 });
      if (tiltT.current) clearTimeout(tiltT.current);
      const t0 = performance.now();
      holdT.current = setInterval(() => {
        const p = Math.min(1, (performance.now() - t0) / 950);
        setStretchHold(p);
        if (p >= 1) {
          if (holdT.current) clearInterval(holdT.current);
          holdT.current = null;
          S.neckCrack(0.76); // grave: o alongamento fundo
          setTilt({ dx: 0, dy: 0 });
          setStretchHold(0);
          stretchRef.current += 1;
          setStretchN(stretchRef.current);
          if (stretchRef.current >= 2) {
            // fecho do ritual: mix + alívio, e a mesa
            setSpinning(true); // trava inputs do giro durante o fecho
            setTimeout(() => {
              S.neckCombo();
              setRelief((r) => r + 1);
              completeRitual(false);
            }, 320);
            setTimeout(() => {
              setSpinning(false);
              setNeckProgress(0);
              stretchRef.current = 0;
              setStretchN(0);
              setMode('mesa');
            }, 1100);
          }
        }
      }, 40);
    },
    [completeRitual, setTilt],
  );

  const stretchCancel = useCallback(() => {
    if (!holdT.current) return;
    clearInterval(holdT.current);
    holdT.current = null;
    setStretchHold(0);
    setTilt({ dx: 0, dy: 0 }); // soltou antes: volta, sem falha
  }, [setTilt]);

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
      // sequência circular: DUAS voltas completas (8 setas em ordem de
      // rotação, qualquer sentido). Mantém só o SUFIXO consistente — errar
      // uma direção não zera tudo, recomeça dali.
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
      const rot: 1 | -1 | 0 = s.length >= NECK_TOTAL ? (rotDelta === 1 ? 1 : -1) : 0;
      // HUD: progresso + quais direções continuam o giro agora
      if (rot === 0) {
        setNeckProgress(s.length);
        // sequência inteira: o keycap fica ÂMBAR na 1ª volta e VERDE na 2ª
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
        // voltas completas → fase do ALONGAMENTO (segurar ← e →). O fecho
        // agora é ATIVO e com peso, não um contra-giro automático.
        setNeckProgress(NECK_TOTAL);
        setNeckNexts([]);
        setNeckHits([]);
        seq.current.length = 0;
      } else {
        // um estalo POR aperto (não cancela os anteriores — série ao encadear)
        const t = setTimeout(() => {
          crackTs.current = crackTs.current.filter((x) => x !== t);
          S.neckCrack();
        }, 380);
        crackTs.current.push(t);
      }
    },
    [spinning, setTilt],
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
      setWateredKeys((keys) => {
        if (keys.filter((x) => x === k).length >= WATER_PER_CELL) return keys;
        const next = [...keys, k];
        setWaterN(next.length);
        if (next.length >= WATER_TOTAL) {
          setTimeout(() => {
            setWateredKeys([]);
            setWaterN(0);
            S.success(); // rega completa = conquista (não o suspiro corporal)
            completeRitual(false);
            setRelief((r) => r + 1);
            setMode('mesa'); // terra regada — de volta à mesa
          }, 650);
        }
        return next;
      });
    },
    [completeRitual],
  );

  const ownedKey = owned.join(',');

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
          stretchCancel();
          return setMode('mesa');
        }
        if (DIRS[e.key]) {
          e.preventDefault();
          // voltas fechadas → fase do alongamento (segurar; e.repeat ignorado)
          if (neckProgress >= NECK_TOTAL) {
            if (!e.repeat) stretchStart(e.key);
            return;
          }
          return roll(e.key);
        }
        return;
      }
      if (mode === 'cafe') {
        if (e.key === 'Backspace') {
          e.preventDefault();
          return setMode('mesa');
        }
        // mexer com a colher: CÍRCULO de setas (como o pescoço)
        if (e.key.startsWith('Arrow')) {
          e.preventDefault();
          if (stirN < STIR_TOTAL) stirPress(e.key);
          return;
        }
        // goles só depois de mexer (a colher sai da xícara)
        if (k === 'c' && stirN >= STIR_TOTAL) {
          e.preventDefault();
          return sip();
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
        return setMode('cafe'); // pega a xícara (o gole acontece no close-up)
      }
      if (PIANO_IDX[k] !== undefined && has('teclado')) {
        e.preventDefault();
        return playNote(PIANO_IDX[k]);
      }
    };
    const onUp = (e: KeyboardEvent) => {
      if (mode === 'pescoco' && DIRS[e.key]) stretchCancel();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    active,
    mode,
    ownedKey,
    roll,
    water,
    playNote,
    sip,
    stirN,
    stirPress,
    neckProgress,
    stretchStart,
    stretchCancel,
  ]);

  return {
    active,
    mode,
    tilt,
    flowing,
    spinning,
    neckProgress,
    neckNexts,
    neckHits,
    stretchN,
    stretchHold,
    waterN,
    wateredKeys,
    stirN,
    stirHits,
    stirNexts,
    stirTheta,
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
  const { mode, notes, setNotes, lit } = brk;
  const art = useDeskArt();

  return (
    <div className="relative flex h-full items-start justify-center">
      <div className="flex items-end gap-14">
        {/* caneca FORA do plano inclinado: é arte de frente — dentro do
            rotateX ela sai cisalhada ("itálico") por estar fora do eixo. */}
        {mode !== 'cafe' && (
          <div className="mb-1">
            <MugArt variant={art.mug} steaming={has('cafe')} />
          </div>
        )}

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
  owned,
  brk,
  onResume,
}: {
  clock: string;
  owned: string[];
  brk: BreakState;
  onResume: () => void;
}) {
  const {
    mode,
    relief,
    neckProgress,
    neckNexts,
    neckHits,
    stretchN,
    stretchHold,
    waterN,
    stirN,
    sipDoneN,
    noteDoneN,
    spinning,
  } = brk;
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
            stretchN={stretchN}
            stretchHold={stretchHold}
          />
        </div>
      )}
      {/* CAFÉ em primeira pessoa: a xícara na SUA mão, perto da câmera.
          Cada gole (C) inclina pra boca; o nível baixa; 3º gole devolve à mesa. */}
      {mode === 'cafe' && <CoffeeCloseup brk={brk} />}
      {mode === 'cafe' && (
        <div className="beat-in absolute inset-0 flex items-center justify-center">
          <CoffeePrompt brk={brk} />
        </div>
      )}
      {/* REGAR em primeira pessoa: a planta perto, regador na mão, terra que
          escurece de verdade — célula a célula, até cobrir tudo. */}
      {mode === 'planta' && <PlantCloseup brk={brk} />}
      {mode === 'planta' && (
        <div className="beat-in absolute inset-0 flex items-center justify-center">
          <RegarPrompt brk={brk} />
        </div>
      )}
      {mode === 'mesa' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="hud-night flex items-start gap-10" aria-hidden>
            <RitualOption k="P" label="pescoço" total={NECK_TOTAL + 2} done={0} />
            {owned.includes('planta') && (
              <RitualOption k="R" label="regar" total={12} done={waterN} />
            )}
            {owned.includes('cafe') && (
              <RitualOption k="C" label="café" total={STIR_TOTAL + 2} done={stirN + sipDoneN} />
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
  stretchN,
  stretchHold,
}: {
  progress: number;
  nexts: number[];
  hits: number[];
  spinning: boolean;
  stretchN: number;
  stretchHold: number;
}) {
  const done = spinning || progress >= NECK_TOTAL;
  // fase do FECHO: voltas completas → segurar ← e → (alongamento com peso)
  const stretching = progress >= NECK_TOTAL && !spinning;
  // hud-night: o cluster flutua sobre o QUARTO/monitor — keycaps sempre
  // escuros. Como na rega: 1ª passada = ÂMBAR (meio), 2ª = VERDE (feito);
  // a que continua o giro PULSA.
  const cap = (i: number, g: string) => {
    const cnt = hits.filter((h) => h === i).length;
    return (
      <kbd
        className={`keycap ${
          done || cnt >= 2
            ? 'keycap--done'
            : nexts.includes(i)
              ? 'keycap--current animate-edgepulse'
              : cnt === 1
                ? 'keycap--current'
                : ''
        }`}
      >
        {g}
      </kbd>
    );
  };
  // keycap do SEGURAR: enche de baixo pra cima enquanto pressionado
  const holdCap = (g: string, idx: number) => {
    const doneSide = spinning || stretchN > idx;
    const activeSide = !doneSide && stretchN === idx;
    return (
      <span key={g} className="relative inline-flex">
        <kbd
          className={`keycap ${doneSide ? 'keycap--done' : activeSide ? 'keycap--current' : ''} ${
            activeSide && stretchHold === 0 ? 'animate-edgepulse' : ''
          }`}
        >
          {g}
        </kbd>
        {/* o medidor: preenchimento subindo dentro do keycap */}
        {activeSide && stretchHold > 0 && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-[3px] bottom-[3px] rounded-[4px]"
            style={{
              height: `${Math.round(stretchHold * 82)}%`,
              background: 'color-mix(in srgb, var(--amber) 45%, transparent)',
            }}
          />
        )}
      </span>
    );
  };
  return (
    <div className="hud-night flex flex-col items-center gap-2.5" aria-hidden>
      {stretching ? (
        // FECHO: segurar ← fundo (~1s), depois → — solta com crack grave
        <div className="flex items-center gap-14">
          {holdCap('←', 0)}
          {holdCap('→', 1)}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1.5">
          {cap(0, '↑')}
          <div className="flex items-center gap-14">
            {cap(3, '←')}
            {cap(1, '→')}
          </div>
          {cap(2, '↓')}
        </div>
      )}
      <Pips total={NECK_TOTAL + 2} done={(done ? NECK_TOTAL : progress) + stretchN} />
      <span
        className="font-mono text-[10px] uppercase tracking-[0.2em]"
        style={{
          color: spinning ? 'var(--pass)' : 'rgba(255,255,255,0.75)',
          textShadow: '0 1px 10px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.9)',
        }}
      >
        {spinning ? 'pescoço solto ✓' : stretching ? 'segure — alongue fundo' : 'gire o pescoço'}
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

/** Grão da terra: pontinhos ínfimos num pattern repetido (1 data-URI pra
 *  todas as células — custo de UMA imagem, não de N nós). */
const SOIL_GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='26' height='20'%3E%3Cg fill='%23000' fill-opacity='.25'%3E%3Ccircle cx='3' cy='4' r='1'/%3E%3Ccircle cx='12' cy='2' r='.8'/%3E%3Ccircle cx='20' cy='6' r='1.1'/%3E%3Ccircle cx='7' cy='11' r='.9'/%3E%3Ccircle cx='16' cy='13' r='1'/%3E%3Ccircle cx='23' cy='16' r='.7'/%3E%3Ccircle cx='4' cy='17' r='.8'/%3E%3C/g%3E%3Cg fill='%23fff' fill-opacity='.06'%3E%3Ccircle cx='9' cy='6' r='.8'/%3E%3Ccircle cx='19' cy='10' r='.7'/%3E%3Ccircle cx='13' cy='17' r='.8'/%3E%3C/g%3E%3C/svg%3E\")";

/** Aro do vaso por espécie (terracota / grafite / creme — deskArt). */
const POT_RIM: Record<'a' | 'b' | 'c', [string, string, string]> = {
  a: ['#c9713a', '#a85a2a', '#7d3f1c'],
  b: ['#3a3f4c', '#262a34', '#171a21'],
  c: ['#d8cdb4', '#bfb296', '#9a8f74'],
};

/** Forma orgânica por célula (a terra não é um grid perfeito). */
const SOIL_SHAPE: Record<string, string> = Object.fromEntries(
  SOILKEYS.map((k, i) => {
    const r = [
      '52% 48% 55% 45% / 48% 55% 45% 52%',
      '45% 55% 48% 52% / 55% 45% 52% 48%',
      '58% 42% 50% 50% / 45% 52% 48% 55%',
      '48% 52% 42% 58% / 52% 48% 55% 45%',
    ][i % 4];
    return [k, r];
  }),
);

/** REGAR em primeira pessoa: a SUA planta (espécie/tier) perto da câmera, o
 *  regador desliza até a coluna regada e VERTE; a terra escurece célula a
 *  célula (e fica molhada) até cobrir as 12 — aí o alívio e a volta à mesa. */
function PlantCloseup({ brk }: { brk: BreakState }) {
  const art = useDeskArt();
  const { wateredKeys, waterN, leafN, wet, setWet, water } = brk;
  // coluna da última célula regada → o regador desliza até ela
  const last = wateredKeys[wateredKeys.length - 1];
  let col = 1.5;
  if (last)
    for (const row of SOIL) {
      const i = row.indexOf(last);
      if (i >= 0) col = i;
    }
  const canX = (col - 1) * 90;
  return (
    <div className="absolute inset-x-0 bottom-0 flex justify-center">
      <div className="animate-mugrise relative" style={{ width: 520, height: '72vh' }}>
        {/* halo escuro: separa o close-up da cena atrás (mesa/teclado) */}
        <div
          aria-hidden
          className="absolute inset-x-[-30%] bottom-[-12%] top-[36%]"
          style={{
            background: 'radial-gradient(58% 62% at 50% 72%, rgba(0,0,0,0.55), transparent 72%)',
          }}
        />
        {/* CORPO do vaso (esconde o vasinho da arte e sustenta a boca) */}
        <div
          aria-hidden
          className="absolute bottom-0 left-1/2 -translate-x-1/2"
          style={{
            width: 296,
            height: 205,
            clipPath: 'polygon(2% 0, 98% 0, 82% 100%, 18% 100%)',
            background: `linear-gradient(105deg, ${POT_RIM[art.plant][0]} 0%, ${POT_RIM[art.plant][1]} 52%, ${POT_RIM[art.plant][2]} 100%)`,
          }}
        />
        {/* a BOCA DO VASO: elipse assentada no topo do corpo (mesma direção),
            terra com GRÃO fino; 1ª rega infiltra e seca, 2ª fica molhada */}
        <div
          className="pointer-events-auto absolute bottom-[150px] left-1/2 -translate-x-1/2"
          style={{
            width: 300,
            height: 110,
            borderRadius: '50%',
            background: `linear-gradient(165deg, ${POT_RIM[art.plant][0]} 0%, ${POT_RIM[art.plant][1]} 55%, ${POT_RIM[art.plant][2]} 100%)`,
            boxShadow: '0 22px 44px -14px rgba(0,0,0,0.75), inset 0 -3px 8px rgba(0,0,0,0.35)',
          }}
        >
          <div
            className="absolute overflow-hidden"
            style={{
              inset: 11,
              borderRadius: '50%',
              background: `${SOIL_GRAIN}, radial-gradient(80% 80% at 50% 38%, #4a3826, #332517)`,
              backgroundSize: '17px 13px, 100% 100%',
              boxShadow: 'inset 0 6px 14px rgba(0,0,0,0.6), inset 0 -2px 6px rgba(0,0,0,0.4)',
            }}
          >
            {SOIL.map((row, ri) =>
              row.map((k, ci) => {
                const cnt = wateredKeys.filter((x) => x === k).length;
                return (
                  <button
                    key={k}
                    onPointerDown={() => water(k)}
                    className="absolute overflow-hidden"
                    style={{
                      width: 84,
                      height: 24,
                      left: 8 + ci * 90,
                      top: 6 + ri * 28,
                      borderRadius: SOIL_SHAPE[k],
                      background:
                        'radial-gradient(65% 75% at 50% 40%, rgba(255,255,255,0.05), transparent 80%)',
                    }}
                    aria-label={`regar ${k} (${cnt}/2)`}
                  >
                    {/* a água: 1ª rega INFILTRA (escurece → seca aos poucos);
                        2ª rega permanece (key remonta a animação) */}
                    {cnt > 0 && (
                      <span
                        key={cnt}
                        aria-hidden
                        className={`absolute inset-0 ${cnt >= WATER_PER_CELL ? '' : 'animate-infiltrate'}`}
                        style={{
                          borderRadius: SOIL_SHAPE[k],
                          background: '#170f08',
                          opacity: cnt >= WATER_PER_CELL ? 0.82 : undefined,
                          transition: 'opacity 300ms ease',
                        }}
                      />
                    )}
                    {/* brilho d'água só quando molhada de vez */}
                    {cnt >= WATER_PER_CELL && (
                      <span
                        aria-hidden
                        className="absolute left-1/2 top-1 -translate-x-1/2 rounded-full"
                        style={{ width: 36, height: 5, background: 'rgba(159,208,230,0.2)' }}
                      />
                    )}
                    {wet[k] !== undefined && (
                      <span
                        key={`s${wet[k]}`}
                        className="animate-watersplash absolute left-1/2 top-0.5 -ml-1.5 size-3 rounded-full border-2"
                        style={{ borderColor: '#9fd0e6' }}
                        onAnimationEnd={() =>
                          setWet((w) => {
                            const c = { ...w };
                            delete c[k];
                            return c;
                          })
                        }
                      />
                    )}
                  </button>
                );
              }),
            )}
          </div>
        </div>
        {/* a SUA planta: SÓ a folhagem (hidePot), plantada POR CIMA da terra
            — a base some dentro da elipse, como brotando dela */}
        <div className="pointer-events-none absolute bottom-[36px] left-1/2 -translate-x-1/2">
          <PlantArt variant={art.plant} tier={art.plantTier} size={3.4} pulseKey={leafN} hidePot />
        </div>
        {/* regador na mão: desliza pra coluna regada e VERTE a cada tecla */}
        <div
          className="pointer-events-none absolute left-1/2 h-24 w-36"
          style={{
            bottom: 150 + 110 + 22,
            transform: `translateX(calc(-50% + ${canX}px))`,
            transition: 'transform 240ms ease',
          }}
        >
          <div key={waterN} className={`size-full ${waterN > 0 ? 'animate-pour' : ''}`}>
            <CanArt />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Prompt do REGAR — o molde do NeckCluster: teclado 3×3 da terra no CENTRO
 *  DA TELA; 2/2 afunda em verde, 1/2 pulsa (falta uma). */
function RegarPrompt({ brk }: { brk: BreakState }) {
  const { wateredKeys, waterN } = brk;
  return (
    <div className="hud-night flex flex-col items-center gap-2.5" aria-hidden>
      <div className="flex flex-col items-center gap-1.5">
        {SOIL.map((row, ri) => (
          <div key={ri} className="flex items-center gap-1.5">
            {row.map((k) => {
              const cnt = wateredKeys.filter((x) => x === k).length;
              return (
                <kbd
                  key={k}
                  className={`keycap ${
                    cnt >= WATER_PER_CELL
                      ? 'keycap--done'
                      : cnt === 1
                        ? 'keycap--current animate-edgepulse'
                        : ''
                  }`}
                >
                  {k.toUpperCase()}
                </kbd>
              );
            })}
          </div>
        ))}
      </div>
      <Pips total={WATER_TOTAL} done={waterN} />
      <span
        className="font-mono text-[10px] uppercase tracking-[0.2em]"
        style={{
          color: waterN >= WATER_TOTAL ? 'var(--pass)' : 'rgba(255,255,255,0.75)',
          textShadow: '0 1px 10px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.9)',
        }}
      >
        {waterN >= WATER_TOTAL ? 'terra regada ✓' : 'regue toda a terra (2× cada)'}
      </span>
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

/** O modo café: xícara GRANDE em primeira pessoa, subindo do peito pra perto
 *  da câmera (mugrise); cada gole inclina em direção à boca (sipdrink) e o
 *  nível de café baixa. Keycap C + pips embaixo — a mesma gramática. */
function CoffeeCloseup({ brk }: { brk: BreakState }) {
  const art = useDeskArt();
  const { sipDoneN: sips, sipN, stirN, stirTheta } = brk;
  const stirring = stirN < STIR_TOTAL;
  return (
    <div className="absolute inset-x-0 bottom-0 flex justify-center">
      <div className="animate-mugrise relative flex flex-col items-center">
        <div
          key={sipN}
          className={`h-[46vh] w-[46vh] ${sipN > 0 ? 'animate-sipdrink' : ''}`}
          style={{ transformOrigin: '30% 85%' }}
        >
          <MugCloseup variant={art.mug} sips={sips} stirring={stirring} theta={stirTheta} />
        </div>
      </div>
    </div>
  );
}

/** Prompt do CAFÉ — o molde do NeckCluster, no CENTRO DA TELA: cruz de setas
 *  pra mexer em círculo; depois C C pros goles. */
function CoffeePrompt({ brk }: { brk: BreakState }) {
  const { sipDoneN: sips, stirN, stirHits, stirNexts } = brk;
  const stirring = stirN < STIR_TOTAL;
  const finished = !stirring && sips >= 2;
  const ARROWS = ['↑', '→', '↓', '←'];
  // como na rega: 1ª volta = ÂMBAR (meio), 2ª = VERDE; a próxima pulsa
  const arrowKey = (a: number) => {
    const cnt = stirHits.filter((h) => h === a).length;
    return (
      <kbd
        key={a}
        className={`keycap ${
          !stirring || cnt >= 2
            ? 'keycap--done'
            : stirNexts.includes(a)
              ? 'keycap--current animate-edgepulse'
              : cnt === 1
                ? 'keycap--current'
                : ''
        }`}
      >
        {ARROWS[a]}
      </kbd>
    );
  };
  return (
    <div className="hud-night flex flex-col items-center gap-2.5" aria-hidden>
      {stirring ? (
        <div className="flex flex-col items-center gap-1.5">
          {arrowKey(0)}
          <div className="flex items-center gap-14">
            {arrowKey(3)}
            {arrowKey(1)}
          </div>
          {arrowKey(2)}
        </div>
      ) : (
        <div className="flex items-center gap-3">
          {[0, 1].map((i) => (
            <kbd
              key={i}
              className={`keycap ${
                i < sips ? 'keycap--done' : i === sips ? 'keycap--current animate-edgepulse' : ''
              }`}
            >
              C
            </kbd>
          ))}
        </div>
      )}
      <Pips total={STIR_TOTAL + 2} done={stirN + sips} />
      <span
        className="font-mono text-[10px] uppercase tracking-[0.2em]"
        style={{
          color: finished ? 'var(--pass)' : 'rgba(255,255,255,0.75)',
          textShadow: '0 1px 10px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.9)',
        }}
      >
        {finished ? 'café tomado ✓' : stirring ? 'mexa em círculo' : 'beba'}
      </span>
    </div>
  );
}
