import type { Melody } from './melodies';

/** ⚠ COPYRIGHT — pool DE TESTE, NUNCA embarcar em release: melodias
 *  reconhecíveis são o núcleo protegido das composições (sem regra de
 *  "poucas notas é livre"; Mario = Nintendo, a mais litigiosa). Só entra
 *  no bundle com `NEXT_PUBLIC_MELODY_SET=proprietary` no build — teste
 *  local, nunca em deploy. O set de release é o `melodies.free.ts`.
 *
 *  Colas (2000s+80s) AUDITADAS (partituras/tabs + ouvido do Isaac no
 *  próprio jogo) e transpostas pra 1 oitava branca (A=dó4..K=dó5). */
export const MELODIES_PROPRIETARY: Melody[] = [
  {
    // Seven Nation Army (White Stripes) — o verso-VARIAÇÃO do riff, com a
    // descida dobrada (A-A-C-A-G-F-G-F-E)
    seq: [
      { k: 'h', d: 3 },
      { k: 'h', d: 1 },
      { k: 'k', d: 1 },
      { k: 'h', d: 2 },
      { k: 'g', d: 2 },
      { k: 'f', d: 1 },
      { k: 'g', d: 1 },
      { k: 'f', d: 1 },
      { k: 'd', d: 4 },
    ],
  },
  {
    // In the End (Linkin Park) — riff em Dm dentro da oitava (ouvido do
    // Isaac): D-A-A-F-E-E-E-E-F-D
    seq: [
      { k: 's', d: 3 },
      { k: 'h', d: 1 },
      { k: 'h', d: 1 },
      { k: 'f', d: 2 },
      { k: 'd', d: 1 },
      { k: 'd', d: 1 },
      { k: 'd', d: 1 },
      { k: 'd', d: 1 },
      { k: 'f', d: 2 },
      { k: 's', d: 3 },
    ],
  },
  {
    // Super Mario Bros (o tema) — transposto pra caber inteiro, intervalos
    // exatos + dó grave final
    seq: [
      { k: 'h', d: 1 },
      { k: 'h', d: 1 },
      { k: 'h', d: 2 },
      { k: 'f', d: 1 },
      { k: 'h', d: 2 },
      { k: 'k', d: 3 },
      { k: 'a', d: 3 },
    ],
  },
  {
    // Bad Romance (Lady Gaga) — refrão: o "OOOH" ondulado (C-D-E-C-F-E-F-E-D,
    // ouvido do Isaac)
    seq: [
      { k: 'a', d: 1 },
      { k: 's', d: 1 },
      { k: 'd', d: 1 },
      { k: 'a', d: 1 },
      { k: 'f', d: 1 },
      { k: 'd', d: 1 },
      { k: 'f', d: 1 },
      { k: 'd', d: 1 },
      { k: 's', d: 3 },
    ],
  },
  // anos 80
  {
    // I Want to Break Free (Queen) — 2 versos (ouvido do Isaac sobre a
    // partitura em Mi): D-G-A-A-A-B · D-G-A-^C-B
    seq: [
      { k: 's', d: 1 },
      { k: 'g', d: 2 },
      { k: 'h', d: 1 },
      { k: 'h', d: 1 },
      { k: 'h', d: 2 },
      { k: 'j', d: 4 },
      { k: 's', d: 1 },
      { k: 'g', d: 2 },
      { k: 'h', d: 1 },
      { k: 'k', d: 2 },
      { k: 'j', d: 4 },
    ],
  },
  {
    // The Final Countdown (Europe) — F#m→Em exato: o "da-da DAAA DAAA ·
    // da-da-da-da DAAA"
    seq: [
      { k: 'j', d: 1 },
      { k: 'h', d: 1 },
      { k: 'j', d: 2 },
      { k: 'd', d: 4 },
      { k: 'k', d: 1 },
      { k: 'j', d: 1 },
      { k: 'k', d: 2 },
      { k: 'j', d: 2 },
      { k: 'h', d: 4 },
    ],
  },
];
