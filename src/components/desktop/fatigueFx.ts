/**
 * Peso perceptual da fadiga (FOCO_FADIGA.md, D): derivado de x (horas além do
 * limiar de cansado). FONTE ÚNICA da fórmula — GameScreen aplica, FatigueDebug
 * exibe (espelhar na mão já causou drift antes).
 */
export function screenFx(x: number): {
  blur: number;
  saturate: number;
  brightness: number;
  filter: string;
} {
  const blur = Math.min(2.4, 1.1 * x);
  const saturate = Math.max(0.72, 1 - 0.09 * x);
  const brightness = Math.max(0.92, 1 - 0.025 * x);
  return {
    blur,
    saturate,
    brightness,
    filter:
      x > 0 ? `saturate(${saturate}) blur(${blur.toFixed(2)}px) brightness(${brightness})` : 'none',
  };
}
