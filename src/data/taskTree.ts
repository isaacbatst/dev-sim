import { TICKETS } from './tickets';
import type { TicketTemplate } from '@/core/domain/types';

/**
 * A ÁRVORE DE TASKS (PROGRESSAO.md §3/§3.1) — o trilho RÁPIDO da progressão.
 * O boletim de fim de dia oferece 1 escolha/dia entre os nós ELEGÍVEIS
 * (raízes livres + filhos do que o jogador já possui). Não é talent tree de
 * compromisso: tudo continua alcançável, a escolha só define a ordem.
 *
 * 4 ramos = 4 identidades: Consertador / Construtor / Arquiteto / Ops.
 */

/** Pool do dia 1 — o estagiário vive de reunião/e-mail/estudo; código é escolha. */
export const INITIAL_TASKS = ['meeting', 'email', 'slack', 'study', 'test_feature', 'document'];

export interface TreeNode {
  /** Id do ticket (TICKETS). */
  id: string;
  /** Pré-requisitos (ids de nós da árvore). Vazio = raiz. */
  requires: string[];
  /** O gesto/graça, numa linha (copy do card de escolha). */
  gesto: string;
}

export const TASK_TREE: TreeNode[] = [
  // A · Consertador
  { id: 'fix_typo', requires: [], gesto: 'navegue até a linha e conserte — seu primeiro commit' },
  { id: 'fix_bug', requires: ['fix_typo'], gesto: 'pesquise no Chrome, copie e cole a correção' },
  {
    id: 'fix_login_bug',
    requires: ['fix_bug'],
    gesto: 'investigue e corrija o bug do login (multi)',
  },
  {
    id: 'deploy_hotfix',
    requires: ['fix_typo'],
    gesto: 'urgência: avise o time no Slack e corrija na hora (multi ⚡)',
  },
  // B · Construtor
  { id: 'ui_update', requires: [], gesto: 'disque cores e tamanhos com ← → (preview ao vivo)' },
  {
    id: 'new_ui_feature',
    requires: ['ui_update'],
    gesto: 'pesquise e implemente a mudança visual (multi)',
  },
  {
    id: 'modulo_novo',
    requires: ['ui_update'],
    gesto: 'crie o arquivo e escreva o módulo — a receita N → escrever → salvar',
  },
  {
    id: 'servico_novo',
    requires: ['modulo_novo'],
    gesto: 'a receita longa: módulo + subir réplicas no Terminal (multi)',
  },
  // C · Arquiteto
  { id: 'review_pr', requires: [], gesto: 'despache os comentários do PR — J/K/L' },
  {
    id: 'refactor',
    requires: ['review_pr'],
    gesto: 'segure e solte na zona certa (precisão, sem exagerar)',
  },
  {
    id: 'refactor_module',
    requires: ['refactor'],
    gesto: 'estude, refatore e teste o módulo inteiro (multi)',
  },
  {
    id: 'spike',
    requires: ['review_pr'],
    gesto: 'timebox: pesquise, rascunhe e entregue direto — sem CR, joga fora',
  },
  // D · Ops
  {
    id: 'bump_dep',
    requires: [],
    gesto: 'suba a versão no package.json e instale — J → B → I',
  },
  {
    id: 'rotate_keys',
    requires: ['bump_dep'],
    gesto: 'gere e aplique a nova key no .env — segredo não vai pra PR',
  },
  {
    id: 'infra_manutencao',
    requires: ['rotate_keys'],
    gesto: 'o Terminal: digite comandos de verdade — rst api, up × réplicas',
  },
];

/** Nós que o jogador pode escolher hoje: não possuídos, com pré-requisitos ok. */
export function eligibleNodes(unlocked: string[]): TreeNode[] {
  const owned = new Set(unlocked);
  return TASK_TREE.filter((n) => !owned.has(n.id) && n.requires.every((r) => owned.has(r)));
}

/** Pool de spawn do jogador: conjunto inicial + o que a árvore destravou. */
export function poolForUnlocked(unlocked: string[]): TicketTemplate[] {
  const ids = [...INITIAL_TASKS, ...unlocked];
  return ids.map((id) => TICKETS[id]).filter(Boolean);
}
