/**
 * Rampa da campanha — a curva de dificuldade dos primeiros dias (EXPEDIENTE §1,
 * PERSONALIDADE_DO_DIA §1). O dia 1 entra LEVE e a campanha sobe até o steady-state.
 *
 * É a semente mínima do "personalidade do dia" (§0.1/§4): só os eixos que a rampa
 * precisa. Quando o baralho de dias entrar (H-A), estes perfis viram o caso base.
 *
 * A prioridade NÃO está aqui de propósito: no dia 1 os urgentes já não aparecem
 * porque o pool inicial (6 tasks single de prioridade baixa) é gated pela árvore.
 *
 * ⚠ Valores de PARTIDA, não finais. "Só afina jogando" (§10/§11) — agora com a
 * Amplitude pra dizer onde o dia 1 está pesado/leve demais (ponto de abandono).
 */
export interface DayProfile {
  /** Fim do expediente em min-de-jogo. 17:00 = 1020; meio-período 13:00 = 780. */
  endMin: number;
  /** Duração real do dia (s). Escala com o expediente pra manter ~2,2 min-jogo/s. */
  daySeconds: number;
  /** Intervalo entre chegadas (s reais), sorteado a cada spawn. */
  spawnMin: number;
  spawnMax: number;
  /** Multiplica o deadline de cada ticket (folga do dia). */
  deadlineMult: number;
  /** Fadiga/pausa ativa? (dia 1 = off: o 1º turno ensina só o loop de ticket.) */
  fatigue: boolean;
}

/** Regime pleno (dia 3+). Espelha as constantes históricas de `game.ts`. */
export const STEADY: DayProfile = {
  endMin: 17 * 60,
  daySeconds: 220,
  spawnMin: 10,
  spawnMax: 25,
  deadlineMult: 1,
  fatigue: true,
};

/** Dia 1 — "Primeiro Commit": meio-período (13:00), volume ↓↓, deadlines folgados. */
const DAY1: DayProfile = {
  endMin: 13 * 60, // saiu no almoço no primeiro dia (~110s reais)
  daySeconds: 110,
  spawnMin: 20, // ~×1,8 mais lento que o steady → ~5 tickets no total
  spawnMax: 45,
  deadlineMult: 1.5,
  fatigue: false,
};

/** Dia 2 — transição: expediente cheio, ainda aliviado. Estreia a fadiga. */
const DAY2: DayProfile = {
  endMin: 17 * 60,
  daySeconds: 220,
  spawnMin: 13,
  spawnMax: 31,
  deadlineMult: 1.2,
  fatigue: true,
};

/** Perfil do dia da campanha. Rampa de 2 dias; do 3 em diante é steady. */
export function profileForDay(day: number): DayProfile {
  if (day <= 1) return DAY1;
  if (day === 2) return DAY2;
  return STEADY;
}
