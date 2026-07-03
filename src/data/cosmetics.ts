/**
 * Cosméticos da mesa (PROGRESSAO.md §2 — canal "comprar com $"). Pura identidade:
 * ZERO efeito no jogo (§6). Você gasta `$` (da nota) no que quer; o item aparece
 * na mesa (Workstation). Parte 2 do slice H-B.
 */

export interface Cosmetic {
  id: string;
  nome: string;
  desc: string;
  preco: number;
}

export const COSMETICS: Cosmetic[] = [
  { id: 'planta', nome: 'Plantinha', desc: 'um verde na mesa', preco: 120 },
  { id: 'teclado', nome: 'Teclado mecânico', desc: 'keycaps com brilho', preco: 200 },
  { id: 'cafe', nome: 'Café fresco', desc: 'vapor subindo da caneca', preco: 80 },
];

export function cosmeticById(id: string): Cosmetic | undefined {
  return COSMETICS.find((c) => c.id === id);
}
