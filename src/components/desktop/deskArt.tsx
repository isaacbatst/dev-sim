'use client';

import { useSyncExternalStore } from 'react';

/**
 * Arte da MESA (planta/caneca) em SVG próprio — 3 versões de cada pra avaliar
 * (?debug=1 → toggle "arte"). Vetor casa com a cena (gradientes suaves) e fica
 * paramétrico pros estágios de crescimento do plano de evolução (PROGRESSAO
 * §2.1). Escolha persistida em localStorage.
 */

export type ArtVariant = 'a' | 'b' | 'c';
export type PlantTier = 1 | 2 | 3;
export interface DeskArtSel {
  plant: ArtVariant;
  mug: ArtVariant;
  /** Estágio de crescimento (§2.1: a planta cresce com o cuidado). */
  plantTier: PlantTier;
}

const KEY = 'devos-deskart';
const DEFAULT_SEL: DeskArtSel = { plant: 'a', mug: 'a', plantTier: 3 };

function load(): DeskArtSel {
  if (typeof window === 'undefined') return DEFAULT_SEL;
  try {
    return { ...DEFAULT_SEL, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
  } catch {
    return DEFAULT_SEL;
  }
}

let sel: DeskArtSel = load();
const subs = new Set<() => void>();

export function setDeskArt(kind: 'plant' | 'mug', v: ArtVariant): void {
  sel = { ...sel, [kind]: v };
  localStorage.setItem(KEY, JSON.stringify(sel));
  subs.forEach((f) => f());
}

export function setPlantTier(t: PlantTier): void {
  sel = { ...sel, plantTier: t };
  localStorage.setItem(KEY, JSON.stringify(sel));
  subs.forEach((f) => f());
}

export function useDeskArt(): DeskArtSel {
  return useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    () => sel,
    () => DEFAULT_SEL,
  );
}

/* ── PLANTAS ──────────────────────────────────────────────────── */

/** Vaso terracota com volume (rim + corpo cônico + terra). */
function PotTerracotta() {
  return (
    <g>
      <defs>
        <linearGradient id="potT" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#c9713a" />
          <stop offset="0.5" stopColor="#a85a2a" />
          <stop offset="1" stopColor="#7d3f1c" />
        </linearGradient>
      </defs>
      <ellipse cx="60" cy="116" rx="27" ry="5.5" fill="#3d2c20" />
      <path
        d="M30 112 Q30 108 36 108 L84 108 Q90 108 90 112 L90 120 Q90 124 84 124 L36 124 Q30 124 30 120 Z"
        fill="url(#potT)"
      />
      <path d="M35 124 L85 124 L78 154 Q77 158 71 158 L49 158 Q43 158 42 154 Z" fill="url(#potT)" />
      <path d="M38 126 L44 126 L48 156 L45 156 Q43.5 156 43 153 Z" fill="rgba(255,255,255,0.14)" />
    </g>
  );
}

/** A — PACOVÁ (Philodendron martianum): folhas largas em leque, do escuro
 *  (trás) ao claro (frente), cada uma com talo. Clássica de escritório BR. */
function PlantPacova({ tier, pot = true }: { tier: PlantTier; pot?: boolean }) {
  const leaf = (x: number, rot: number, sc: number, fill: string, vein: string, sx = 1) => (
    <g
      key={`${x}${rot}`}
      transform={`translate(${60 + x} 112) rotate(${rot}) scale(${sc * sx} ${sc})`}
    >
      <path d="M0 0 L0 -14" stroke={fill} strokeWidth="3" />
      <g transform="translate(0 -12)">
        <path
          d="M0 0 C -8 -7 -16 -22 -14 -40 C -12 -54 -5 -62 0 -64 C 5 -62 12 -54 14 -40 C 16 -22 8 -7 0 0 Z"
          fill={fill}
        />
        <path
          d="M0 -5 C -1 -22 -1 -40 0 -58"
          stroke={vein}
          strokeWidth="1.6"
          fill="none"
          opacity="0.75"
        />
        <path
          d="M0 -18 C -5 -23 -8 -28 -9 -35 M0 -18 C 5 -23 8 -28 9 -35 M0 -34 C -4 -38 -6 -43 -7 -48 M0 -34 C 4 -38 6 -43 7 -48"
          stroke={vein}
          strokeWidth="1"
          fill="none"
          opacity="0.5"
        />
      </g>
    </g>
  );
  // ordem de CRESCIMENTO: o broto central primeiro; as traseiras escuras por último
  const leaves = [
    { minTier: 1, el: leaf(-4, -12, 0.86, '#3f9a66', '#aade9f', 0.95) },
    { minTier: 1, el: leaf(3, 7, 0.9, '#4cb277', '#c2f0cf', 1.08) },
    { minTier: 2, el: leaf(-9, -33, 0.92, '#2b6e47', '#84c29a', 0.86) },
    { minTier: 2, el: leaf(11, 23, 0.88, '#317a50', '#8fceA4', 1.05) },
    { minTier: 3, el: leaf(-17, -54, 0.72, '#1d4a30', '#5f9974', 0.9) },
    { minTier: 3, el: leaf(12, 39, 0.84, '#215538', '#6aa77f', 1.12) },
  ];
  const k = tier === 1 ? 0.72 : tier === 2 ? 0.88 : 1;
  return (
    <g>
      <g transform={`translate(60 112) scale(${k}) translate(-60 -112)`}>
        {leaves.filter((l) => l.minTier <= tier).map((l) => l.el)}
      </g>
      {pot && <PotTerracotta />}
    </g>
  );
}

/** B — ESPADA-DE-SÃO-JORGE (Sansevieria trifasciata): lâminas eretas com
 *  borda variegada clara. Indestrutível — a planta de quem esquece de regar. */
function PlantEspada({ tier, pot = true }: { tier: PlantTier; pot?: boolean }) {
  const blade = (x: number, rot: number, h: number, w: number, phase = 0) => (
    <g key={`${x}${h}`} transform={`translate(${60 + x} 112) rotate(${rot})`}>
      <path
        d={`M0 0 C ${-w} ${-h * 0.3} ${-w * 1.1} ${-h * 0.65} ${-w * 0.28} ${-h} C ${-w * 0.08} ${-h * 1.06} ${w * 0.08} ${-h * 1.06} ${w * 0.28} ${-h} C ${w * 1.1} ${-h * 0.65} ${w} ${-h * 0.3} 0 0 Z`}
        fill="#2f6f49"
      />
      {/* margem variegada ('Laurentii') SÓ nas laterais, por dentro — traço
          na silhueta inteira virava "brilho"/halo */}
      <path
        d={`M${-w * 0.12} ${-h * 0.05} C ${-w * 0.86} ${-h * 0.3} ${-w * 0.94} ${-h * 0.62} ${-w * 0.24} ${-h * 0.96}`}
        stroke="#a8b06a"
        strokeWidth="1.6"
        fill="none"
        opacity="0.75"
      />
      <path
        d={`M${w * 0.12} ${-h * 0.05} C ${w * 0.86} ${-h * 0.3} ${w * 0.94} ${-h * 0.62} ${w * 0.24} ${-h * 0.96}`}
        stroke="#a8b06a"
        strokeWidth="1.6"
        fill="none"
        opacity="0.75"
      />
      {/* bandas zebradas horizontais (a assinatura da sansevieria) */}
      {[0.22, 0.38, 0.54, 0.7, 0.84].map((tb, i) => {
        const t = Math.min(0.9, tb + phase);
        return (
          <path
            key={i}
            d={`M${-w * (1 - t * 0.7)} ${-h * t} Q ${(i % 2 ? 1 : -1) * w * 0.15} ${-h * (t + 0.045)} ${w * (1 - t * 0.7)} ${-h * t}`}
            stroke={i % 2 === 0 ? '#224f34' : '#4f9c68'}
            strokeWidth={3.2 - t * 1.6}
            fill="none"
            opacity="0.65"
          />
        );
      })}
      {/* brilho central sutil */}
      <path
        d={`M0 ${-h * 0.12} C ${w * 0.12} ${-h * 0.4} ${w * 0.1} ${-h * 0.7} 0 ${-h * 0.95}`}
        stroke="rgba(255,255,255,0.14)"
        strokeWidth="2"
        fill="none"
      />
    </g>
  );
  // ordem de crescimento: brotos centrais → lâminas altas por fora
  const blades = [
    { minTier: 1, el: blade(-3, -1, 74, 8, 0.02) },
    { minTier: 1, el: blade(6, 4, 62, 7.4, 0.08) },
    { minTier: 1, el: blade(-10, -6, 55, 7, 0) },
    { minTier: 2, el: blade(11, 8, 80, 8.2, 0.05) },
    { minTier: 2, el: blade(-16, -11, 68, 7.6, 0.04) },
    { minTier: 3, el: blade(16, 12, 89, 8.6, 0.07) },
    { minTier: 3, el: blade(-21, -16, 97, 9.2, 0.03) },
  ];
  const k = tier === 1 ? 0.7 : tier === 2 ? 0.88 : 1;
  return (
    <g>
      <g transform={`translate(60 112) scale(${k}) translate(-60 -112)`}>
        {blades.filter((b) => b.minTier <= tier).map((b) => b.el)}
      </g>
      <g style={pot ? undefined : { display: 'none' }}>
        <defs>
          <linearGradient id="potG" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#3a3f4c" />
            <stop offset="0.55" stopColor="#262a34" />
            <stop offset="1" stopColor="#171a21" />
          </linearGradient>
        </defs>
        <ellipse cx="60" cy="114" rx="26" ry="5" fill="#33281e" />
        <path
          d="M33 110 L87 110 L83 152 Q82 158 75 158 L45 158 Q38 158 37 152 Z"
          fill="url(#potG)"
        />
        <path d="M33 110 L87 110 L86.2 118 L33.8 118 Z" fill="rgba(255,255,255,0.07)" />
      </g>
    </g>
  );
}

/** C — JIBOIA (Epipremnum pinnatum): corações + ramos pendentes sobre o
 *  vaso. A trepadeira de estante de todo dev. */
function PlantJiboia({ tier, pot = true }: { tier: PlantTier; pot?: boolean }) {
  const heart = (x: number, y: number, rot: number, sc: number, fill: string) => (
    <g key={`${x}${y}`} transform={`translate(${x} ${y}) rotate(${rot}) scale(${sc})`}>
      <path
        d="M0 2 C -10 -3 -15 -13 -9 -20 C -5 -24.5 -0.5 -23.5 0 -18.5 C 0.5 -23.5 5 -24.5 9 -20 C 15 -13 10 -3 0 2 Z"
        fill={fill}
      />
      <path d="M0 -1 L0 -17" stroke="rgba(255,255,255,0.3)" strokeWidth="1.1" />
    </g>
  );
  // moita em ordem de crescimento: núcleo → cheia; vinhas só de tier 2 em diante
  const mound = [
    { minTier: 1, el: heart(59, 101, -3, 1.18, '#49a86f') },
    { minTier: 1, el: heart(47, 96, -9, 0.98, '#3a8c5d') },
    { minTier: 1, el: heart(72, 98, 11, 1.02, '#3a8c5d') },
    { minTier: 1, el: heart(61, 88, 3, 0.92, '#2c6a45') },
    { minTier: 1, el: heart(50, 86, -16, 0.84, '#265c3c') },
    { minTier: 2, el: heart(70, 84, 6, 0.98, '#265c3c') },
    { minTier: 2, el: heart(34, 97, -24, 1.04, '#317a50') },
    { minTier: 2, el: heart(86, 94, 15, 0.94, '#317a50') },
    { minTier: 2, el: heart(44, 105, -17, 1.02, '#54b87a') },
    { minTier: 3, el: heart(38, 84, -31, 0.9, '#1f5031') },
    { minTier: 3, el: heart(82, 80, 19, 1.0, '#1f5031') },
    { minTier: 3, el: heart(76, 103, 9, 1.14, '#50b276') },
  ];
  const k = tier === 1 ? 0.78 : tier === 2 ? 0.9 : 1;
  return (
    <g>
      {/* vinhas pendentes: brotam no tier 2 (curtas) e escorrem no tier 3 */}
      {tier >= 2 && (
        <g>
          <path d="M44 108 C 34 114 28 122 27 130" stroke="#2f6a48" strokeWidth="2.3" fill="none" />
          <path d="M76 108 C 86 115 91 123 92 132" stroke="#2b6142" strokeWidth="2.3" fill="none" />
          {heart(27, 128, -36, 0.76, '#3c8a5c')}
          {heart(92, 130, 30, 0.82, '#38815a')}
        </g>
      )}
      {tier >= 3 && (
        <g>
          <path d="M27 130 C 23 138 21 144 20 150" stroke="#2f6a48" strokeWidth="2" fill="none" />
          <path d="M92 132 C 96 140 98 145 98 151" stroke="#2b6142" strokeWidth="2" fill="none" />
          <path d="M60 110 C 56 124 54 136 55 150" stroke="#2f6a48" strokeWidth="2" fill="none" />
          {heart(19, 149, -47, 0.62, '#316f4a')}
          {heart(99, 151, 45, 0.7, '#2d6845')}
          {heart(56, 149, 12, 0.58, '#316f4a')}
        </g>
      )}
      <g transform={`translate(60 108) scale(${k}) translate(-60 -108)`}>
        {mound.filter((m) => m.minTier <= tier).map((m) => m.el)}
      </g>
      <g style={pot ? undefined : { display: 'none' }}>
        <defs>
          <linearGradient id="potC" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#e6dfd0" />
            <stop offset="0.6" stopColor="#cfc6b2" />
            <stop offset="1" stopColor="#a89e88" />
          </linearGradient>
        </defs>
        <ellipse cx="60" cy="112" rx="25" ry="5" fill="#3d2f22" />
        <path
          d="M35 108 L85 108 Q88 108 88 112 L84 148 Q83 156 74 156 L46 156 Q37 156 36 148 L32 112 Q32 108 35 108 Z"
          fill="url(#potC)"
        />
        <path d="M38 112 L43 112 L46 152 L42 152 Z" fill="rgba(255,255,255,0.35)" />
      </g>
    </g>
  );
}

const PLANTS: Record<ArtVariant, (p: { tier: PlantTier; pot?: boolean }) => React.ReactNode> = {
  a: PlantPacova,
  b: PlantEspada,
  c: PlantJiboia,
};

/** Nome da espécie por variante (copy de loja/tooltip). */
export const PLANT_NAMES: Record<ArtVariant, string> = {
  a: 'Pacová',
  b: 'Espada-de-são-jorge',
  c: 'Jiboia',
};

/** Planta da mesa (SVG). Mesma API da antiga: size/pulseKey/highlight. */
export function PlantArt({
  variant,
  tier,
  size,
  pulseKey,
  highlight,
  hidePot,
}: {
  variant: ArtVariant;
  tier: PlantTier;
  size: number;
  pulseKey: number;
  highlight?: boolean;
  /** Só a folhagem (o close-up de regar desenha o próprio vaso). */
  hidePot?: boolean;
}) {
  const Art = PLANTS[variant];
  return (
    <div
      key={pulseKey}
      className={pulseKey > 0 ? 'animate-leafpulse relative shrink-0' : 'relative shrink-0'}
      style={{
        width: 120 * size,
        height: 160 * size,
        filter: highlight ? 'drop-shadow(0 0 18px rgba(94,208,122,0.35))' : undefined,
      }}
    >
      <svg viewBox="0 0 120 160" className="size-full" aria-hidden>
        {Art({ tier, pot: !hidePot })}
      </svg>
    </div>
  );
}

/* ── CANECAS ──────────────────────────────────────────────────── */

function Steam() {
  // fios CURVOS com contorno (a linguagem do vapor do close-up) — as barras
  // retas antigas liam como "linhas estranhas" em cima da caneca.
  return (
    <div className="absolute -top-4 left-1/2 -translate-x-1/2" aria-hidden>
      <svg viewBox="0 0 60 52" className="h-10 w-12" fill="none" strokeLinecap="round">
        {[
          { d: 'M18 50 C 13 41 22 34 18 24 C 16 18 20 12 18 6', delay: '0ms', o: 0.8 },
          { d: 'M30 50 C 25 39 34 32 30 20 C 28 13 32 8 30 2', delay: '280ms', o: 1 },
          { d: 'M42 50 C 37 42 46 34 42 25 C 40 19 44 13 42 7', delay: '560ms', o: 0.7 },
        ].map((w, i) => (
          <g
            key={i}
            className="animate-edgepulse"
            style={{ animationDelay: w.delay }}
            opacity={w.o}
          >
            <path d={w.d} stroke="rgba(60,48,38,0.5)" strokeWidth="4" />
            <path d={w.d} stroke="rgba(255,255,255,0.85)" strokeWidth="1.8" />
          </g>
        ))}
      </svg>
    </div>
  );
}

/** A — "Cerâmica clássica": cilindro com borda elíptica, café visível, alça C. */
function MugCeramic() {
  return (
    <svg viewBox="0 0 100 110" className="size-full" aria-hidden>
      <defs>
        <linearGradient id="mugA" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#454c5e" />
          <stop offset="0.45" stopColor="#333947" />
          <stop offset="1" stopColor="#1d212b" />
        </linearGradient>
      </defs>
      <path
        d="M70 38 C 90 36 94 66 71 70"
        stroke="#2a2f3b"
        strokeWidth="10"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M70 40 C 86 38.5 89 63 71 66"
        stroke="#454c5e"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M22 26 L22 82 Q22 98 40 98 L56 98 Q74 98 74 82 L74 26 Z" fill="url(#mugA)" />
      <ellipse cx="48" cy="26" rx="26" ry="8.5" fill="#565e72" />
      <ellipse cx="48" cy="26.5" rx="22.5" ry="6.8" fill="#14161c" />
      <ellipse cx="48" cy="27.5" rx="19" ry="5.4" fill="#3b2a1a" />
      <ellipse cx="43" cy="26.5" rx="7" ry="2" fill="#5c4630" opacity="0.8" />
      <path
        d="M28 34 C 27 52 27 68 29 84"
        stroke="rgba(255,255,255,0.14)"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      <ellipse cx="48" cy="102" rx="26" ry="5" fill="rgba(0,0,0,0.45)" />
    </svg>
  );
}

/** B — "Barril two-tone": corpo bojudo escuro, faixa interna creme, alça grossa. */
function MugBarrel() {
  return (
    <svg viewBox="0 0 100 110" className="size-full" aria-hidden>
      <defs>
        <linearGradient id="mugB" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7e5540" />
          <stop offset="0.5" stopColor="#5d3c2b" />
          <stop offset="1" stopColor="#3c2419" />
        </linearGradient>
      </defs>
      <path
        d="M70 44 C 92 42 94 72 70 74"
        stroke="#4a2f21"
        strokeWidth="12"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M24 34 C 22 26 74 26 72 34 L74 76 C 75 92 63 100 48 100 C 33 100 21 92 22 76 Z"
        fill="url(#mugB)"
      />
      <ellipse cx="48" cy="33" rx="24" ry="6" fill="#efe7d6" />
      <ellipse cx="48" cy="33.5" rx="20.5" ry="4.9" fill="#1a130e" />
      <ellipse cx="48" cy="34.3" rx="17" ry="3.9" fill="#43301d" />
      <path
        d="M30 44 C 28 60 28 74 31 88"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="4.5"
        fill="none"
        strokeLinecap="round"
      />
      <ellipse cx="48" cy="104" rx="25" ry="4.5" fill="rgba(0,0,0,0.45)" />
    </svg>
  );
}

/** C — "Diner": creme afunilada com faixa âmbar, alça fina. */
function MugDiner() {
  return (
    <svg viewBox="0 0 100 110" className="size-full" aria-hidden>
      <defs>
        <linearGradient id="mugC" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#f2ebdb" />
          <stop offset="0.55" stopColor="#ddd3bd" />
          <stop offset="1" stopColor="#b3a78c" />
        </linearGradient>
      </defs>
      <path
        d="M72 40 C 90 40 90 64 70 66"
        stroke="#c9bda2"
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M24 28 L72 28 L66 90 Q65 98 56 98 L40 98 Q31 98 30 90 Z" fill="url(#mugC)" />
      <path d="M25.5 42 L70.5 42 L69.5 52 L26.5 52 Z" fill="#d99a3b" />
      <ellipse cx="48" cy="28" rx="24" ry="7.5" fill="#fff8e9" />
      <ellipse cx="48" cy="28.5" rx="20.5" ry="6" fill="#181209" />
      <ellipse cx="48" cy="29.5" rx="17" ry="4.8" fill="#4a3624" />
      <path
        d="M30 36 C 29 54 30 72 32 88"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
      />
      <ellipse cx="48" cy="102" rx="24" ry="4.5" fill="rgba(0,0,0,0.4)" />
    </svg>
  );
}

const MUGS: Record<ArtVariant, () => React.ReactNode> = {
  a: MugCeramic,
  b: MugBarrel,
  c: MugDiner,
};

/** Caneca da mesa (SVG), com vapor quando o café é seu. Proporção real de
 *  mesa: bem maior que o mouse, na sombra do teclado. */
export function MugArt({ variant, steaming }: { variant: ArtVariant; steaming: boolean }) {
  return (
    <div className="relative mb-1 h-40 w-[8.5rem] shrink-0">
      {steaming && <Steam />}
      {MUGS[variant]()}
    </div>
  );
}

/* ── CAFÉ EM PRIMEIRA PESSOA (modo café) ─────────────────────── */

/** Paleta do close-up por variante (mesmas famílias dos MUGS). */
const MUG_CLOSEUP: Record<
  ArtVariant,
  { rim: string; body1: string; body2: string; interior: string; band?: string }
> = {
  a: { rim: '#565e72', body1: '#454c5e', body2: '#1d212b', interior: '#14161c' },
  b: { rim: '#efe7d6', body1: '#7e5540', body2: '#3c2419', interior: '#1a130e' },
  c: { rim: '#fff8e9', body1: '#f2ebdb', body2: '#b3a78c', interior: '#181209', band: '#d99a3b' },
};

/**
 * A xícara PERTO DA CÂMERA (vista de quem segura): borda elíptica grande,
 * café visível por dentro — o nível BAIXA a cada gole (sips 0..3). Vapor
 * enquanto tem café. Reusa a paleta da variante escolhida.
 */
export function MugCloseup({
  variant,
  sips,
  stirring = false,
  theta = 0,
}: {
  variant: ArtVariant;
  sips: number;
  /** Colher NA xícara (fase de mexer do ritual). */
  stirring?: boolean;
  /** Ângulo acumulado do giro (graus) — a colher ORBITA o centro. */
  theta?: number;
}) {
  const c = MUG_CLOSEUP[variant];
  const f = Math.max(0, (2 - sips) / 2); // fração de café restante (2 goles)
  const empty = f === 0;
  const rad = (theta * Math.PI) / 180;
  // órbita da colher na superfície (elipse: funda nas laterais, rasa no eixo)
  const bx = 46 * Math.sin(rad);
  const by = -13 * Math.cos(rad);
  return (
    <svg viewBox="0 0 260 250" className="size-full" aria-hidden>
      <defs>
        <linearGradient id="cupBody" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={c.body1} />
          <stop offset="1" stopColor={c.body2} />
        </linearGradient>
      </defs>
      {/* vapor (só com café): fios ancorados NA BORDA, finos e definidos —
          contorno escuro por baixo + fio claro por cima (lê no monitor claro
          e na parede escura), pulso defasado */}
      {!empty && (
        <g fill="none" strokeLinecap="round">
          {[
            { d: 'M104 42 C 99 34 107 27 104 19 C 102 14 106 9 104 4', o: 0.9, delay: '0ms' },
            { d: 'M130 40 C 125 31 133 25 130 15 C 128 10 132 5 130 0', o: 1, delay: '300ms' },
            { d: 'M156 42 C 151 35 159 28 156 20 C 154 15 158 11 156 6', o: 0.8, delay: '600ms' },
          ].map((w, i) => (
            <g
              key={i}
              className="animate-edgepulse"
              style={{ animationDelay: w.delay }}
              opacity={w.o}
            >
              <path d={w.d} stroke="rgba(90,75,60,0.35)" strokeWidth="4.5" />
              <path d={w.d} stroke="rgba(255,255,255,0.9)" strokeWidth="2.2" />
            </g>
          ))}
        </g>
      )}
      {/* alça (atrás do corpo, à direita) */}
      <path
        d="M212 108 C 252 106 254 168 210 172"
        stroke={c.body2}
        strokeWidth="20"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M212 112 C 244 110 246 162 210 166"
        stroke={c.body1}
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
      />
      {/* corpo (grande, sai do quadro por baixo — está na sua mão) */}
      <path
        d="M30 88 L30 210 Q30 250 78 250 L182 250 Q230 250 230 210 L230 88 Z"
        fill="url(#cupBody)"
      />
      {c.band && <rect x="30" y="150" width="200" height="22" fill={c.band} opacity="0.9" />}
      {/* brilho vertical de cerâmica */}
      <path
        d="M46 104 C 44 140 44 176 47 214"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="9"
        fill="none"
        strokeLinecap="round"
      />
      {/* borda + interior */}
      <ellipse cx="130" cy="88" rx="100" ry="34" fill={c.rim} />
      <ellipse cx="130" cy="89" rx="88" ry="28" fill={c.interior} />
      {/* CAFÉ: o nível baixa (elipse encolhe e afunda a cada gole) */}
      {!empty ? (
        <g>
          <ellipse
            cx="130"
            cy={91 + (1 - f) * 7}
            rx={80 * (0.62 + 0.38 * f)}
            ry={22 * (0.6 + 0.4 * f)}
            fill="#3b2a1a"
          />
          {/* crema REDEMOINHA atrás da colher (segue a órbita, com atraso) */}
          <g
            style={{
              transform: stirring
                ? `translate(${(10 * Math.sin(rad - 0.9)).toFixed(1)}px, ${(-3 * Math.cos(rad - 0.9)).toFixed(1)}px)`
                : 'translate(0px, 0px)',
              transition: 'transform 700ms cubic-bezier(0.3, 0.7, 0.3, 1)',
            }}
          >
            <ellipse
              cx={112 - (1 - f) * 6}
              cy={88 + (1 - f) * 7}
              rx={26 * f + 8}
              ry={6 * f + 2}
              fill="#5c4630"
              opacity="0.85"
            />
          </g>
          {/* COLHER: ORBITA o centro a cada seta (mão gira, cabo em pé com
              leve inclinação pro lado do movimento); sai antes dos goles */}
          {stirring && (
            <g
              style={{
                transform: `translate(${bx.toFixed(1)}px, ${by.toFixed(1)}px) rotate(${(7 * Math.sin(rad)).toFixed(1)}deg)`,
                transformOrigin: '130px 91px',
                transition: 'transform 520ms cubic-bezier(0.35, 0.7, 0.3, 1)',
              }}
            >
              {/* onda que a colher empurra */}
              <ellipse
                cx="130"
                cy="92"
                rx="17"
                ry="6.5"
                fill="none"
                stroke="#5c4630"
                strokeWidth="1.5"
                opacity="0.5"
              />
              <ellipse cx="130" cy="91.5" rx="12" ry="4.6" fill="#2c2117" opacity="0.85" />
              <path d="M133 88 L160 16" stroke="#39404d" strokeWidth="8.5" strokeLinecap="round" />
              <path d="M133 88 L160 16" stroke="#cdd3df" strokeWidth="5.5" strokeLinecap="round" />
              <path d="M156 22 L162 10" stroke="#f0f3f8" strokeWidth="5.5" strokeLinecap="round" />
            </g>
          )}
        </g>
      ) : (
        <ellipse cx="130" cy="96" rx="46" ry="10" fill="#241a10" opacity="0.9" />
      )}
    </svg>
  );
}

/* ── REGADOR (modo planta) ───────────────────────────────────── */

/** Regador metálico visto de lado, bico à esquerda com crivo — desliza sobre
 *  a terra e verte a cada tecla (o movimento fica no wrapper, em Break). */
export function CanArt() {
  return (
    <svg viewBox="0 0 140 90" className="size-full" aria-hidden>
      <defs>
        <linearGradient id="canBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a5262" />
          <stop offset="0.5" stopColor="#333a48" />
          <stop offset="1" stopColor="#20242e" />
        </linearGradient>
      </defs>
      {/* alça superior */}
      <path
        d="M62 26 C 62 10 102 10 102 26"
        stroke="#2a2f3b"
        strokeWidth="7"
        fill="none"
        strokeLinecap="round"
      />
      {/* corpo */}
      <path
        d="M52 30 L112 30 Q118 30 118 36 L114 74 Q113 82 104 82 L62 82 Q53 82 52 74 Z"
        fill="url(#canBody)"
      />
      <path
        d="M58 36 C 57 50 57 62 59 74"
        stroke="rgba(255,255,255,0.16)"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      {/* bico */}
      <path d="M54 42 L22 20 L16 28 L50 58 Z" fill="#3b4250" />
      {/* crivo (cabeça do bico) */}
      <ellipse cx="18" cy="23" rx="9" ry="7" fill="#4a5262" transform="rotate(-38 18 23)" />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={14 + i * 4} cy={20 + i * 2.4} r="1.1" fill="#171a21" />
      ))}
    </svg>
  );
}
