'use client';

import { useSyncExternalStore } from 'react';

/**
 * Arte da MESA (planta/caneca) em SVG próprio — 3 versões de cada pra avaliar
 * (?debug=1 → toggle "arte"). Vetor casa com a cena (gradientes suaves) e fica
 * paramétrico pros estágios de crescimento do plano de evolução (PROGRESSAO
 * §2.1). Escolha persistida em localStorage.
 */

export type ArtVariant = 'a' | 'b' | 'c';
export interface DeskArtSel {
  plant: ArtVariant;
  mug: ArtVariant;
}

const KEY = 'devos-deskart';
const DEFAULT_SEL: DeskArtSel = { plant: 'a', mug: 'a' };

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

export function setDeskArt(kind: keyof DeskArtSel, v: ArtVariant): void {
  sel = { ...sel, [kind]: v };
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
function PlantPacova() {
  const leaf = (x: number, rot: number, sc: number, fill: string, vein: string) => (
    <g transform={`translate(${60 + x} 112) rotate(${rot}) scale(${sc})`}>
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
  return (
    <g>
      {leaf(-14, -46, 0.78, '#1d4a30', '#5f9974')}
      {leaf(14, 44, 0.8, '#215538', '#6aa77f')}
      {leaf(-9, -26, 0.95, '#2b6e47', '#84c29a')}
      {leaf(9, 25, 0.98, '#317a50', '#8fceA4')}
      {leaf(-3, -9, 1.1, '#3f9a66', '#aade9f')}
      {leaf(3, 8, 1.14, '#4cb277', '#c2f0cf')}
      <PotTerracotta />
    </g>
  );
}

/** B — ESPADA-DE-SÃO-JORGE (Sansevieria trifasciata): lâminas eretas com
 *  borda variegada clara. Indestrutível — a planta de quem esquece de regar. */
function PlantEspada() {
  const blade = (x: number, rot: number, h: number, w: number) => (
    <g transform={`translate(${60 + x} 112) rotate(${rot})`}>
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
      {[0.22, 0.38, 0.54, 0.7, 0.84].map((t, i) => (
        <path
          key={i}
          d={`M${-w * (1 - t * 0.7)} ${-h * t} Q 0 ${-h * (t + 0.045)} ${w * (1 - t * 0.7)} ${-h * t}`}
          stroke={i % 2 === 0 ? '#224f34' : '#4f9c68'}
          strokeWidth={3.2 - t * 1.6}
          fill="none"
          opacity="0.65"
        />
      ))}
      {/* brilho central sutil */}
      <path
        d={`M0 ${-h * 0.12} C ${w * 0.12} ${-h * 0.4} ${w * 0.1} ${-h * 0.7} 0 ${-h * 0.95}`}
        stroke="rgba(255,255,255,0.14)"
        strokeWidth="2"
        fill="none"
      />
    </g>
  );
  return (
    <g>
      {blade(-19, -13, 60, 7.5)}
      {blade(17, 12, 64, 7.5)}
      {blade(-11, -7, 82, 8.5)}
      {blade(10, 6, 78, 8.5)}
      {blade(-4, -2, 96, 9)}
      {blade(4, 2, 90, 9)}
      <g>
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
function PlantJiboia() {
  const heart = (x: number, y: number, rot: number, sc: number, fill: string) => (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${sc})`}>
      <path
        d="M0 2 C -10 -3 -15 -13 -9 -20 C -5 -24.5 -0.5 -23.5 0 -18.5 C 0.5 -23.5 5 -24.5 9 -20 C 15 -13 10 -3 0 2 Z"
        fill={fill}
      />
      <path d="M0 -1 L0 -17" stroke="rgba(255,255,255,0.3)" strokeWidth="1.1" />
    </g>
  );
  return (
    <g>
      {/* vinhas pendentes: caem do vaso e escorrem pelas laterais */}
      <path d="M44 108 C 30 116 22 130 20 148" stroke="#2f6a48" strokeWidth="2.4" fill="none" />
      <path d="M76 108 C 90 118 97 132 98 150" stroke="#2b6142" strokeWidth="2.4" fill="none" />
      <path d="M60 110 C 56 124 54 136 55 150" stroke="#2f6a48" strokeWidth="2" fill="none" />
      {/* folhas das vinhas (escala cai conforme desce) */}
      {heart(30, 122, -34, 0.85, '#3c8a5c')}
      {heart(20, 148, -44, 0.7, '#316f4a')}
      {heart(90, 124, 32, 0.9, '#38815a')}
      {heart(98, 150, 42, 0.72, '#2d6845')}
      {heart(55, 150, 8, 0.65, '#316f4a')}
      {/* MOITA sobre o vaso: 3 camadas (escura → clara), sobrepostas */}
      {heart(40, 82, -26, 0.95, '#1f5031')}
      {heart(80, 82, 24, 0.95, '#1f5031')}
      {heart(52, 76, -10, 1.0, '#265c3c')}
      {heart(68, 76, 10, 1.0, '#265c3c')}
      {heart(60, 72, 0, 1.05, '#2c6a45')}
      {heart(36, 96, -20, 1.05, '#317a50')}
      {heart(84, 96, 20, 1.05, '#317a50')}
      {heart(48, 92, -7, 1.15, '#3a8c5d')}
      {heart(72, 92, 7, 1.15, '#3a8c5d')}
      {heart(60, 100, 0, 1.3, '#49a86f')}
      {heart(46, 104, -13, 1.1, '#54b87a')}
      {heart(74, 104, 13, 1.1, '#50b276')}
      <g>
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

const PLANTS: Record<ArtVariant, () => React.ReactNode> = {
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
  size,
  pulseKey,
  highlight,
}: {
  variant: ArtVariant;
  size: number;
  pulseKey: number;
  highlight?: boolean;
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
        {Art()}
      </svg>
    </div>
  );
}

/* ── CANECAS ──────────────────────────────────────────────────── */

function Steam() {
  return (
    <div className="absolute -top-10 left-1/2 -translate-x-1/2">
      {[-8, 0, 8].map((x, i) => (
        <span
          key={i}
          className="animate-edgepulse absolute bottom-0 w-1 rounded-full bg-white/25"
          style={{ left: x, height: 32, animationDelay: `${i * 220}ms` }}
        />
      ))}
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
      <path d="M24 34 C 22 26 74 26 72 34 L73 46 C 73 52 23 52 23 46 Z" fill="#e9e1cf" />
      <ellipse cx="48" cy="31" rx="24.5" ry="7.5" fill="#efe7d6" />
      <ellipse cx="48" cy="31.5" rx="20.5" ry="6" fill="#1a130e" />
      <ellipse cx="48" cy="32.5" rx="17" ry="4.8" fill="#43301d" />
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
