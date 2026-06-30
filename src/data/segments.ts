/**
 * Port dos 24 segmentos `.tres` do PoC (Godot). As teclas vêm do input map do
 * `project.godot` (input_action → tecla física).
 *
 * AUDITORIA: `hold_*` e `wait_*` são tempo morto (ver types.ts / Seção 4).
 */
import type { Segment } from '@/core/domain/types';

export const SEGMENTS: Record<string, Segment> = {
  // --- press ---
  press_open_browser: {
    type: 'press',
    maxItems: 1,
    opens: 'browser',
    actions: [{ key: 'c', label: 'Abrir Chrome' }],
  },
  // Estudar: 1) abrir a página da fonte, 2) ler a página (duas ações).
  press_open_source: {
    type: 'press',
    maxItems: 1,
    actions: [
      { key: 'd', label: 'Abrir Documentação' },
      { key: 'p', label: 'Abrir Playbook' },
      { key: 's', label: 'Abrir Stack Overflow' },
      { key: 't', label: 'Abrir Tutorial' },
      { key: 'i', label: 'Abrir Issues do GitHub' },
    ],
  },
  press_read: { type: 'press', maxItems: 1, actions: [{ key: 'l', label: 'Ler a página' }] },
  // Meet/Webmail são SITES dentro do navegador (não apps standalone).
  press_join_meet: {
    type: 'press',
    maxItems: 1,
    actions: [{ key: 'm', label: 'Entrar na reunião' }],
  },
  press_open_webmail: {
    type: 'press',
    maxItems: 1,
    actions: [{ key: 'e', label: 'Abrir o Webmail' }],
  },
  press_open_staging: {
    type: 'press',
    maxItems: 1,
    actions: [{ key: 's', label: 'Abrir Staging' }],
  },
  // Stack Overflow como destino único (p/ a variante "colar correção" do bug fix).
  press_open_so: {
    type: 'press',
    maxItems: 1,
    actions: [{ key: 's', label: 'Abrir Stack Overflow' }],
  },
  press_open_slack: {
    type: 'press',
    maxItems: 1,
    opens: 'slack',
    actions: [{ key: 's', label: 'Abrir Slack' }],
  },
  press_reply: { type: 'press', maxItems: 1, actions: [{ key: 'r', label: 'Responder' }] },
  press_archive: { type: 'press', maxItems: 1, actions: [{ key: 'a', label: 'Arquivar' }] },
  press_open_vscode: {
    type: 'press',
    maxItems: 1,
    opens: 'editor',
    actions: [{ key: 'v', label: 'Abrir VSCode' }],
  },
  press_push: { type: 'press', maxItems: 1, actions: [{ key: 'p', label: 'Push' }] },
  press_fix: { type: 'press', maxItems: 1, actions: [{ key: 'f', label: 'Corrigir' }] },

  // --- combo (atalho modificador+tecla; mimético) ---
  // Copiar do Stack Overflow (no browser) e colar no VS Code — passos separados,
  // em apps diferentes, como no fluxo real.
  combo_copy: {
    type: 'combo',
    steps: [{ mod: 'ctrl', key: 'c', label: 'Copiar a correção' }],
  },
  combo_paste: {
    type: 'combo',
    steps: [{ mod: 'ctrl', key: 'v', label: 'Colar no código' }],
  },

  // --- mash (suco por tecla — DIRECAO_GAMEPLAY.md §6) ---
  // Merge = resolver o conflito esfregando ⬅️➡️. A assinatura tátil comum a todas
  // as tarefas de código (substitui o antigo "press M").
  mash_merge: {
    type: 'mash',
    keys: ['arrowleft', 'arrowright'],
    label: 'Resolver conflito',
    // Cada conflito = 3–5 alternâncias ⬅️➡️; 1–3 conflitos por merge.
    minCount: 3,
    maxCount: 5,
    minGroups: 1,
    maxGroups: 3,
  },
  // "Digitar": martelar o teclado e o texto sai (qualquer letra avança).
  mash_write_doc: {
    type: 'mash',
    keys: [],
    label: 'Escrever a documentação',
    anyKey: true,
    minCount: 14,
    maxCount: 20,
  },

  // --- hold (AUDITORIA: tempo morto) ---
  hold_speak: {
    type: 'hold',
    minDuration: 3,
    maxDuration: 6,
    action: { key: 'f', label: 'Falar' },
  },
  hold_test: {
    type: 'hold',
    minDuration: 3,
    maxDuration: 0,
    action: { key: 't', label: 'Testar' },
  },

  // --- nav ---
  nav_find_line: { type: 'nav', direction: 'down', minCount: 1, maxCount: 5 },
  nav_select_channel: { type: 'nav', direction: 'down', minCount: 1, maxCount: 5 },

  // --- scrub (discar valor ⬅️➡️ com preview ao vivo) ---
  scrub_color: {
    type: 'scrub',
    options: [
      { key: '1', label: 'Vermelho' },
      { key: '2', label: 'Laranja' },
      { key: '3', label: 'Amarelo' },
      { key: '4', label: 'Verde' },
      { key: '5', label: 'Azul' },
      { key: '6', label: 'Roxo' },
    ],
  },
  scrub_font_size: {
    type: 'scrub',
    options: [
      { key: '1', label: '12px' },
      { key: '2', label: '14px' },
      { key: '3', label: '16px' },
      { key: '4', label: '18px' },
      { key: '5', label: '20px' },
      { key: '6', label: '24px' },
    ],
  },

  // --- selection ---
  selection_element: {
    type: 'selection',
    options: [
      { key: 'b', label: 'Button' },
      { key: 't', label: 'Title' },
      { key: 'i', label: 'Input' },
    ],
  },
  selection_font_style: {
    type: 'selection',
    options: [
      { key: 'i', label: 'Itálico' },
      { key: 'r', label: 'Regular' },
      { key: 'b', label: 'Negrito' },
    ],
  },
  // Abrir arquivo: navegar a árvore (setas) ou Ctrl+P. Ver src/data/files.ts.
  open_file: { type: 'file' },
  open_css_file: { type: 'file', ext: 'css' },
  selection_property: {
    type: 'selection',
    options: [
      { key: 't', label: 'Texto' },
      { key: 'b', label: 'Fundo' },
    ],
  },

  // --- wait (AUDITORIA: tempo morto) ---
  wait_cr: { type: 'wait', minDuration: 8, maxDuration: 15 },
};
