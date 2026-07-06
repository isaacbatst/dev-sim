/**
 * Escada de carreira (PROGRESSAO.md §1). A POSIÇÃO é a progressão — ganha pela
 * NOTA acumulada (`careerTotal`), não por day-count. Nível 1 = Estagiário (posição
 * inicial, pós-onboarding). Limiares placeholder — só afinam jogando.
 */

export const POSITIONS = [
  'Estagiário',
  'Júnior',
  'Pleno',
  'Sênior',
  'Tech Lead',
  'Staff',
  'Principal',
] as const;

/** Nota acumulada pra ATINGIR cada nível (índice = nível − 1). Estagiário = 0.
 *  Limiares LONGOS de propósito (PROGRESSAO §2): cargo é prestígio/arco da
 *  campanha (Júnior dia 1-2, Pleno ~1 semana, Sênior ~2, TL ~1 mês) — a
 *  variedade mecânica vem do trilho rápido (árvore de tasks, taskTree.ts). */
export const PROMO_AT = [0, 400, 1500, 4000, 8000, 14000, 22000];

/** Nível (1..N) para uma nota acumulada. */
export function levelFor(careerTotal: number): number {
  let level = 1;
  for (let i = 1; i < PROMO_AT.length; i++) if (careerTotal >= PROMO_AT[i]) level = i + 1;
  return level;
}

export function positionName(level: number): string {
  return POSITIONS[Math.min(Math.max(level, 1), POSITIONS.length) - 1];
}

/** Progresso 0..1 dentro da posição + quanto falta pra próxima (null se no topo). */
export function levelProgress(careerTotal: number): {
  level: number;
  frac: number;
  toNext: number | null;
} {
  const level = levelFor(careerTotal);
  const cur = PROMO_AT[level - 1] ?? 0;
  const next = PROMO_AT[level]; // undefined = topo da escada
  if (next === undefined) return { level, frac: 1, toNext: null };
  const frac = Math.max(0, Math.min(1, (careerTotal - cur) / (next - cur)));
  return { level, frac, toNext: Math.ceil(next - careerTotal) };
}
