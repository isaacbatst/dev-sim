import type { TicketTemplate } from '../domain/types';

/**
 * Conteúdo mínimo do vertical slice — apenas segmentos `press`.
 *
 * Provisório e hardcoded só para provar a arquitetura. Na Fase 2 isto vira
 * o port dos templates `.tres` para JSON em `src/data/`.
 */
export const SLICE_TICKETS: TicketTemplate[] = [
  {
    id: 'fix_login_bug',
    name: 'Corrigir bug que ninguém consegue reproduzir',
    description: 'O cliente jura que não loga. Funciona na sua máquina.',
    priority: 'alta',
    tasks: [
      {
        id: 'study',
        title: 'Estudar',
        steps: [
          { segments: [{ type: 'press', keys: [{ key: 'w', label: 'Abrir navegador' }] }] },
          { segments: [{ type: 'press', keys: [{ key: 'e', label: 'Ler Stack Overflow' }] }] },
        ],
      },
    ],
  },
  {
    id: 'deploy_hotfix',
    name: 'O estagiário fez push na main',
    description: 'Produção está fora. Todos olhando pra você.',
    priority: 'urgente',
    tasks: [
      {
        id: 'slack',
        title: 'Responder no Slack',
        steps: [
          {
            segments: [
              {
                type: 'press',
                keys: [
                  { key: 's', label: 'Abrir Slack' },
                  { key: 'd', label: 'Responder' },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'pr_review',
    name: 'PR aberto há 3 dias, 47 comentários, nenhum approval',
    description: 'Alguém precisa quebrar esse impasse.',
    priority: 'normal',
    tasks: [
      {
        id: 'document',
        title: 'Documentar',
        steps: [
          { segments: [{ type: 'press', keys: [{ key: 'r', label: 'Reler o diff' }] }] },
          { segments: [{ type: 'press', keys: [{ key: 'a', label: 'Aprovar' }] }] },
        ],
      },
    ],
  },
];
