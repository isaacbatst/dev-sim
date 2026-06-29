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

const SINGLE: TicketTemplate[] = Object.values(TASKS).map((t) => wrap(t));

const MULTI: TicketTemplate[] = [
  multi(
    'fix_login_bug',
    'Bug no Login',
    [TASKS.study, TASKS.fix_typo],
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
    [TASKS.study, TASKS.fix_typo, TASKS.test_feature],
    'normal',
    'Estudar, corrigir e testar o módulo',
  ),
  multi(
    'deploy_hotfix',
    'Deploy de Correção',
    [TASKS.slack, TASKS.fix_typo],
    'urgente',
    'Avisar o time e corrigir urgentemente',
  ),
];

export const TICKETS: Record<string, TicketTemplate> = Object.fromEntries(
  [...SINGLE, ...MULTI].map((t) => [t.id, t]),
);

/** Pool padrão de spawn (todos os tickets). A progressão por nível entra na Fase 2 item 3. */
export const TICKET_POOL: TicketTemplate[] = [...SINGLE, ...MULTI];
