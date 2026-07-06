/**
 * Peso perceptual da fadiga (FOCO_FADIGA.md, D): derivado de x (horas além do
 * limiar de cansado). FONTE ÚNICA das fórmulas — GameScreen aplica,
 * FatigueDebug exibe (espelhar na mão já causou drift antes).
 *
 * O AMBIENTE (dessaturação/brilho) é contínuo e segue x direto, sem transição.
 * O DESFOQUE é um LAPSO discreto (defocusN no core): a vista desfoca em ~1s
 * REAL até `blurMaxPx` e refoca em ~1s — nunca blur permanente.
 */
export function screenFx(x: number): {
  saturate: number;
  brightness: number;
  filter: string;
} {
  const saturate = Math.max(0.72, 1 - 0.09 * x);
  const brightness = Math.max(0.92, 1 - 0.025 * x);
  return {
    saturate,
    brightness,
    filter: x > 0 ? `saturate(${saturate}) brightness(${brightness})` : 'none',
  };
}

/** Pico do desfoque (px) quando o lapso dispara — mais fundo com a fadiga. */
export function blurMaxPx(x: number): number {
  return Math.min(3.2, 1.6 + 0.6 * x);
}
