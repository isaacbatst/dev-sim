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
  // Refatorar: simplificar o módulo segurando e soltando na zona certa (gauge);
  // exagerar (passar do alvo) quebra a abstração → CR rejeita.
  refactor: {
    id: 'refactor',
    title: 'Refatorar',
    description: 'Abrir o VSCode, simplificar o módulo, push, CR e merge',
    steps: [
      step('press_open_vscode'),
      step('open_file'),
      step('gauge_simplify'),
      step('press_push'),
      step('wait_cr'),
      step('mash_merge'),
    ],
  },
  document: {
    id: 'document',
    title: 'Documentar Classe/Função',
    description: 'Abrir o VSCode, escrever documentação, fazer push, aguardar CR e merge',
    steps: [
      step('press_open_vscode'),
      step('mash_write_doc'),
      step('press_push'),
      step('wait_cr'),
      step('mash_merge'),
    ],
  },
  // Corrigir typo: correção DIRETA (você só conserta a linha). Sem pesquisar/colar
  // — copiar do Stack Overflow só faz sentido pra bug.
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
      step('mash_merge'),
    ],
  },
  // Revisar PR: você é o revisor — abra o PR no Chrome e despache cada comentário
  // (já rotulado) com o veredito certo. Task ativa, sem CR/merge (você não espera).
  review_pr: {
    id: 'review_pr',
    title: 'Revisar PR',
    description: 'Abrir o PR no Chrome e despachar os comentários do review',
    steps: [step('press_open_browser'), step('press_open_pr'), step('triage_review')],
  },
  // Corrigir bug: a cada vez sorteia COMO resolver — você já sabe (digita o fix)
  // ou pesquisa no Stack Overflow e cola (Ctrl+C/Ctrl+V). Ver `variants`.
  fix_bug: {
    id: 'fix_bug',
    title: 'Corrigir Bug',
    description: 'Investigar o bug e corrigir no VSCode; push, CR e merge',
    steps: [],
    variants: [
      // variante DIRETA (você sabe a correção, digita)
      [
        step('press_open_vscode'),
        step('open_file'),
        step('nav_find_line'),
        step('press_fix'),
        step('press_push'),
        step('wait_cr'),
        step('mash_merge'),
      ],
      // variante PESQUISAR: ler o Stack Overflow no Chrome, copiar lá e colar no
      // VS Code — fluxo de 2 apps, como no real.
      [
        step('press_open_browser'),
        step('press_open_so'),
        step('press_read'),
        step('combo_copy'),
        step('press_open_vscode'),
        step('open_file'),
        step('nav_find_line'),
        step('combo_paste'),
        step('press_push'),
        step('wait_cr'),
        step('mash_merge'),
      ],
    ],
  },
  // ── Arquétipos de ASSINATURA FIXA (PROGRESSAO.md §3.2) — combos decoráveis ──
  // Bump de dependência: o "renovate manual". V→J→B→I, sempre igual; sem CR.
  bump_dep: {
    id: 'bump_dep',
    title: 'Bump de Dependência',
    description: 'Abrir o package.json, subir a versão e instalar',
    steps: [
      step('press_open_vscode'),
      step('press_open_package'),
      step('press_bump'),
      step('press_install'),
    ],
  },
  // Rotacionar keys: V→E→G→K; sem CR (segredo não vai pra PR).
  rotate_keys: {
    id: 'rotate_keys',
    title: 'Rotacionar Keys',
    description: 'Abrir o .env, gerar a nova key e aplicar',
    steps: [
      step('press_open_vscode'),
      step('press_open_env'),
      step('press_gen_key'),
      step('press_apply_key'),
    ],
  },
  // Spike: timeboxed, sem CR/merge (joga fora). A fonte (S/D) é o slot de variação.
  spike: {
    id: 'spike',
    title: 'Fazer um Spike',
    description: 'Pesquisar, rascunhar uma prova de conceito e entregar direto',
    steps: [
      step('press_open_browser'),
      step('press_spike_source'),
      step('press_read'),
      step('press_open_vscode'),
      step('mash_spike_draft'),
    ],
  },
  // Módulo novo: a receita de CRIAÇÃO (hoje tudo é manutenção). 100% fixa.
  modulo_novo: {
    id: 'modulo_novo',
    title: 'Implementar Módulo',
    description: 'Criar o arquivo, escrever o módulo, salvar; push, CR e merge',
    steps: [
      step('press_open_vscode'),
      step('press_new_file'),
      step('mash_write_module'),
      step('press_save'),
      step('press_push'),
      step('wait_cr'),
      step('mash_merge'),
    ],
  },
  // Infra: comandos de terminal como combos — o alvo (api/web) varia por instância.
  infra_manutencao: {
    id: 'infra_manutencao',
    title: 'Manutenção na Infra',
    description: 'Abrir o Terminal, reiniciar o serviço e subir as réplicas',
    steps: [],
    variants: [
      [step('press_open_terminal'), step('mash_cmd_restart_api'), step('mash_cmd_up')],
      [step('press_open_terminal'), step('mash_cmd_restart_web'), step('mash_cmd_up')],
    ],
  },
  // Subir o serviço: só existe DENTRO do multi servico_novo (não vira ticket).
  subir_servico: {
    id: 'subir_servico',
    title: 'Subir o Serviço',
    description: 'Abrir o Terminal e subir as réplicas',
    steps: [step('press_open_terminal'), step('mash_cmd_up')],
  },

  // Uma só task: a cada vez sorteia uma mudança de COR ou de FONTE (o detalhe
  // do ticket descreve qual). Ver `variants` (sorteado ao instanciar).
  ui_update: {
    id: 'ui_update',
    title: 'Atualizar UI',
    description: 'Abrir o VSCode, ajustar o CSS da UI, push, CR e merge',
    steps: [],
    variants: [
      // variante COR (discar a cor ⬅️➡️ com preview)
      [
        step('press_open_vscode'),
        step('open_css_file'),
        step('selection_element'),
        step('selection_property'),
        step('scrub_color'),
        step('press_push'),
        step('wait_cr'),
        step('mash_merge'),
      ],
      // variante FONTE (discar o tamanho ⬅️➡️ com preview)
      [
        step('press_open_vscode'),
        step('open_css_file'),
        step('selection_element'),
        step('scrub_font_size'),
        step('selection_font_style'),
        step('press_push'),
        step('wait_cr'),
        step('mash_merge'),
      ],
    ],
  },
};
