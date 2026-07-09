import type { Melody } from './melodies';

/** Pool FREE — composições em domínio público (autor 70+ anos morto ou
 *  tradicional/folclore; a letra do Parabéns tem dono, a MELODIA não).
 *  É o set default de release. Transcrições próprias pra 1 oitava branca.
 *
 *  ⚠ PENDENTE a auditoria de ouvido do Isaac no próprio jogo (o set de
 *  teste teve) — conferir notas E durações antes do release. Candidatas
 *  pra ampliar depois de auditar: Ciranda Cirandinha, Escravos de Jó,
 *  Atirei o Pau no Gato, Marcha Soldado, O Cravo e a Rosa. */
export const MELODIES_FREE: Melody[] = [
  {
    // Ode à Alegria (Beethoven, 9ª) — a frase inteira, em dó:
    // E-E-F-G-G-F-E-D-C-C-D-E · E.-D-D
    seq: [
      { k: 'd', d: 1 },
      { k: 'd', d: 1 },
      { k: 'f', d: 1 },
      { k: 'g', d: 1 },
      { k: 'g', d: 1 },
      { k: 'f', d: 1 },
      { k: 'd', d: 1 },
      { k: 's', d: 1 },
      { k: 'a', d: 1 },
      { k: 'a', d: 1 },
      { k: 's', d: 1 },
      { k: 'd', d: 1 },
      { k: 'd', d: 2 },
      { k: 's', d: 1 },
      { k: 's', d: 3 },
    ],
  },
  {
    // Brilha Brilha Estrelinha (tradicional) — pergunta e resposta:
    // C-C-G-G-A-A-G · F-F-E-E-D-D-C
    seq: [
      { k: 'a', d: 1 },
      { k: 'a', d: 1 },
      { k: 'g', d: 1 },
      { k: 'g', d: 1 },
      { k: 'h', d: 1 },
      { k: 'h', d: 1 },
      { k: 'g', d: 3 },
      { k: 'f', d: 1 },
      { k: 'f', d: 1 },
      { k: 'd', d: 1 },
      { k: 'd', d: 1 },
      { k: 's', d: 1 },
      { k: 's', d: 1 },
      { k: 'a', d: 3 },
    ],
  },
  {
    // Frère Jacques (tradicional) — os 2 primeiros versos:
    // C-D-E-C ×2 · E-F-G ×2
    seq: [
      { k: 'a', d: 1 },
      { k: 's', d: 1 },
      { k: 'd', d: 1 },
      { k: 'a', d: 1 },
      { k: 'a', d: 1 },
      { k: 's', d: 1 },
      { k: 'd', d: 1 },
      { k: 'a', d: 1 },
      { k: 'd', d: 1 },
      { k: 'f', d: 1 },
      { k: 'g', d: 3 },
      { k: 'd', d: 1 },
      { k: 'f', d: 1 },
      { k: 'g', d: 3 },
    ],
  },
  {
    // Parabéns pra Você (melodia = "Good Morning to All", 1893) —
    // transposta pra FÁ pra caber na oitava: C-C-D-C-F-E · C-C-D-C-G-F
    seq: [
      { k: 'a', d: 1 },
      { k: 'a', d: 1 },
      { k: 's', d: 2 },
      { k: 'a', d: 2 },
      { k: 'f', d: 2 },
      { k: 'd', d: 3 },
      { k: 'a', d: 1 },
      { k: 'a', d: 1 },
      { k: 's', d: 2 },
      { k: 'a', d: 2 },
      { k: 'g', d: 2 },
      { k: 'f', d: 3 },
    ],
  },
  {
    // 5ª Sinfonia (Beethoven) — o motivo do destino, da-da-da-DUM ×2,
    // transposto pra caber na oitava branca: A-A-A-F · G-G-G-E
    seq: [
      { k: 'h', d: 1 },
      { k: 'h', d: 1 },
      { k: 'h', d: 1 },
      { k: 'f', d: 4 },
      { k: 'g', d: 1 },
      { k: 'g', d: 1 },
      { k: 'g', d: 1 },
      { k: 'd', d: 4 },
    ],
  },
  {
    // Jingle Bells (Pierpont, 1857) — do "jingle all the way" em diante
    // (ajuste de ouvido do Isaac): E-G-C-D-E · F-F-F · E-E-E · D-E-D-E-D · G
    seq: [
      { k: 'd', d: 1 },
      { k: 'g', d: 1 },
      { k: 'a', d: 1 },
      { k: 's', d: 1 },
      { k: 'd', d: 3 },
      { k: 'f', d: 1 },
      { k: 'f', d: 1 },
      { k: 'f', d: 1 },
      { k: 'd', d: 1 },
      { k: 'd', d: 1 },
      { k: 'd', d: 1 },
      { k: 's', d: 1 },
      { k: 'd', d: 1 },
      { k: 's', d: 1 },
      { k: 'd', d: 1 },
      { k: 's', d: 2 },
      { k: 'g', d: 4 },
    ],
  },
  {
    // Rainha da Noite (Mozart, Flauta Mágica) — a coloratura staccato
    // ("ah ah ah ah"), comprimida na oitava branca: escada de arpejos
    // subindo C-D-E-F e coroando no dó agudo. Tudo curto = o staccato.
    seq: [
      { k: 'a', d: 1 },
      { k: 'd', d: 1 },
      { k: 'g', d: 1 },
      { k: 'd', d: 1 },
      { k: 's', d: 1 },
      { k: 'f', d: 1 },
      { k: 'h', d: 1 },
      { k: 'f', d: 1 },
      { k: 'd', d: 1 },
      { k: 'g', d: 1 },
      { k: 'j', d: 1 },
      { k: 'g', d: 1 },
      { k: 'f', d: 1 },
      { k: 'h', d: 1 },
      { k: 'k', d: 4 },
    ],
  },
];
