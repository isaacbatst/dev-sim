/**
 * Assinatura do design: o humor do chefe é o "clima" do desktop.
 * Traduz a satisfação (0–100) em carinha, vinheta de borda e estado de perigo,
 * unificando os avisos por faixa do GDD (3.3) num só sistema ambiental.
 */
export interface Mood {
  face: string;
  label: string;
  /** Cor + intensidade da vinheta nas bordas da tela. */
  vignette: { color: string; opacity: number; pulse: boolean };
  /** Tremor ambiente da janela ativa (faixa crítica). */
  ambientShake: boolean;
  accent: string;
}

export function moodFor(satisfaction: number): Mood {
  if (satisfaction >= 60) {
    return {
      face: '🙂',
      label: 'tranquilo',
      vignette: { color: 'transparent', opacity: 0, pulse: false },
      ambientShake: false,
      accent: 'var(--pass)',
    };
  }
  if (satisfaction >= 30) {
    return {
      face: '😐',
      label: 'impaciente',
      vignette: { color: 'var(--amber)', opacity: 0.18, pulse: false },
      ambientShake: false,
      accent: 'var(--amber)',
    };
  }
  if (satisfaction >= 20) {
    return {
      face: '😟',
      label: 'irritado',
      vignette: { color: 'var(--fail)', opacity: 0.3, pulse: true },
      ambientShake: false,
      accent: 'var(--fail)',
    };
  }
  if (satisfaction >= 15) {
    return {
      face: '😠',
      label: 'furioso',
      vignette: { color: 'var(--fail)', opacity: 0.5, pulse: true },
      ambientShake: true,
      accent: 'var(--fail)',
    };
  }
  return {
    face: '😡',
    label: 'à beira da demissão',
    vignette: { color: 'var(--fail)', opacity: 0.7, pulse: true },
    ambientShake: true,
    accent: 'var(--fail)',
  };
}
