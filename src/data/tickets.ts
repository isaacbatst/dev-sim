/**
 * Port dos 13 tickets do PoC (TaskService._build_ticket_map):
 * 9 single-task (wrap de cada task, prioridade normal) + 4 multi-task.
 */
import type { Priority, TaskTemplate, TicketTemplate } from '@/core/domain/types';
import { TASKS } from './tasks';

function wrap(task: TaskTemplate, priority: Priority = 'normal'): TicketTemplate {
  return {
    id: task.id,
    name: task.title,
    description: task.description,
    priority,
    tasks: [task],
  };
}

function multi(
  id: string,
  name: string,
  tasks: TaskTemplate[],
  priority: Priority,
  description: string,
): TicketTemplate {
  return { id, name, description, priority, tasks };
}

// subir_servico só existe dentro do multi servico_novo — não vira ticket próprio.
const SINGLE: TicketTemplate[] = Object.values(TASKS)
  .filter((t) => t.id !== 'subir_servico')
  .map((t) => wrap(t));

const MULTI: TicketTemplate[] = [
  multi(
    'fix_login_bug',
    'Bug no Login',
    [TASKS.fix_bug],
    'alta',
    'Investigar o problema e corrigir o bug',
  ),
  multi(
    'new_ui_feature',
    'Nova Feature de UI',
    [TASKS.study, TASKS.ui_update],
    'normal',
    'Pesquisar e implementar mudança visual',
  ),
  multi(
    'refactor_module',
    'Refatorar Módulo',
    [TASKS.study, TASKS.refactor, TASKS.test_feature],
    'normal',
    'Estudar, simplificar e testar o módulo',
  ),
  multi(
    'deploy_hotfix',
    'Deploy de Correção',
    [TASKS.slack, TASKS.fix_typo],
    'urgente',
    'Avisar o time e corrigir urgentemente',
  ),
  // A receita longa (capstone do ramo Construtor): módulo + subir no terminal.
  multi(
    'servico_novo',
    'Implementar Serviço',
    [TASKS.modulo_novo, TASKS.subir_servico],
    'normal',
    'Criar o módulo e subir o serviço',
  ),
];

export const TICKETS: Record<string, TicketTemplate> = Object.fromEntries(
  [...SINGLE, ...MULTI].map((t) => [t.id, t]),
);

// Arquétipos novos: só entram pelo unlock da árvore (taskTree.ts) — fora do
// pool legado pra não vazarem antes da escolha do jogador.
const TREE_ONLY = new Set([
  'bump_dep',
  'rotate_keys',
  'spike',
  'modulo_novo',
  'infra_manutencao',
  'servico_novo',
]);

/** Pool legado (testes/força). O spawn real usa a árvore (taskTree.poolForUnlocked). */
export const TICKET_POOL: TicketTemplate[] = [...SINGLE, ...MULTI].filter(
  (t) => !TREE_ONLY.has(t.id),
);
