/**
 * Port das 9 tasks `.tres` do PoC. Cada passo referencia um segmento de `SEGMENTS`.
 */
import type { StepTemplate, TaskTemplate } from '@/core/domain/types';
import { SEGMENTS } from './segments';

const step = (...ids: string[]): StepTemplate => ({ segments: ids.map((id) => SEGMENTS[id]) });

export const TASKS: Record<string, TaskTemplate> = {
  study: {
    id: 'study',
    title: 'Estudar',
    description: 'Abrir o Chrome, acessar a página e ler',
    steps: [step('press_open_browser'), step('press_open_source'), step('press_read')],
  },
  meeting: {
    id: 'meeting',
    title: 'Participar da Reunião',
    description: 'Abrir o Chrome, entrar na reunião e falar',
    steps: [step('press_open_browser'), step('press_join_meet'), step('hold_speak')],
  },
  test_feature: {
    id: 'test_feature',
    title: 'Testar Funcionalidade',
    description: 'Abrir o Chrome, acessar staging e testar',
    steps: [step('press_open_browser'), step('press_open_staging'), step('hold_test')],
  },
  slack: {
    id: 'slack',
    title: 'Responder Slack',
    description: 'Abrir o Slack, navegar até o canal e responder',
    steps: [step('press_open_slack'), step('nav_select_channel'), step('press_reply')],
  },
  email: {
    id: 'email',
    title: 'Verificar Email',
    description: 'Abrir o Chrome, abrir o webmail e arquivar',
    steps: [step('press_open_browser'), step('press_open_webmail'), step('press_archive')],
  },
  document: {
    id: 'document',
    title: 'Documentar Classe/Função',
    description: 'Abrir o VSCode, escrever documentação, fazer push, aguardar CR e merge',
    steps: [
      step('press_open_vscode'),
      step('press_write_doc'),
      step('press_push'),
      step('wait_cr'),
      step('press_merge'),
    ],
  },
  fix_typo: {
    id: 'fix_typo',
    title: 'Corrigir Typo',
    description: 'Abrir o VSCode, abrir o arquivo, navegar até a linha, corrigir, push, CR e merge',
    steps: [
      step('press_open_vscode'),
      step('open_file'),
      step('nav_find_line'),
      step('press_fix'),
      step('press_push'),
      step('wait_cr'),
      step('press_merge'),
    ],
  },
  ui_color: {
    id: 'ui_color',
    title: 'Atualizar Cor da UI',
    description: 'Abrir o VSCode, abrir CSS, selecionar elemento/propriedade/cor, push, CR e merge',
    steps: [
      step('press_open_vscode'),
      step('open_css_file'),
      step('selection_element'),
      step('selection_property'),
      step('selection_color'),
      step('press_push'),
      step('wait_cr'),
      step('press_merge'),
    ],
  },
  ui_font: {
    id: 'ui_font',
    title: 'Atualizar Fonte da UI',
    description:
      'Abrir o VSCode, abrir CSS, selecionar elemento, ajustar fonte e estilo, push, CR e merge',
    steps: [
      step('press_open_vscode'),
      step('open_css_file'),
      step('selection_element'),
      step('selection_font_size'),
      step('selection_font_style'),
      step('press_push'),
      step('wait_cr'),
      step('press_merge'),
    ],
  },
};
