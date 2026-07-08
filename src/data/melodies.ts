import { MELODIES_FREE } from './melodies.free';
import { MELODIES_PROPRIETARY } from './melodies.proprietary';

/** Nota da cola do tecladinho: `k` = tecla (1 oitava branca, A=dó4..K=dó5);
 *  `d` = duração RELATIVA da nota (1=rápida, 2=média, 3-4=segura) — vira
 *  largura do keycap (piano-roll) e o ritmo do preview mudo (espaço).
 *  O ritmo NUNCA é julgado (latência web) — é dica pra soar certo. */
export type MelodyNote = { k: string; d: number };
export type Melody = { seq: MelodyNote[] };

/** Set injetado NO BUILD (NEXT_PUBLIC_ é inlinado — o outro set sai por
 *  dead-code elimination): `NEXT_PUBLIC_MELODY_SET=proprietary` troca pro
 *  pool proprietário (SÓ teste local). Qualquer outro valor — inclusive
 *  nenhum — cai no free: release não embarca obra protegida por acidente. */
export const MELODIES: Melody[] =
  process.env.NEXT_PUBLIC_MELODY_SET === 'proprietary' ? MELODIES_PROPRIETARY : MELODIES_FREE;
