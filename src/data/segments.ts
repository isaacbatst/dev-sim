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
    actions: [{ key: 'w', label: 'Abrir Web Browser' }],
  },
  press_read_on_browser: {
    type: 'press',
    maxItems: 2,
    actions: [
      { key: 'd', label: 'Ler Documentação' },
      { key: 'p', label: 'Ler Playbook' },
      { key: 's', label: 'Ler Stack Overflow' },
      { key: 't', label: 'Ler Tutorial' },
    ],
  },
  press_enter_meeting: {
    type: 'press',
    maxItems: 1,
    actions: [{ key: 'm', label: 'Entrar na Meeting' }],
  },
  press_open_staging: {
    type: 'press',
    maxItems: 1,
    actions: [{ key: 's', label: 'Abrir Staging' }],
  },
  press_open_slack: { type: 'press', maxItems: 1, actions: [{ key: 's', label: 'Abrir Slack' }] },
  press_reply: { type: 'press', maxItems: 1, actions: [{ key: 'r', label: 'Responder' }] },
  press_open_email: { type: 'press', maxItems: 1, actions: [{ key: 'e', label: 'Abrir Email' }] },
  press_archive: { type: 'press', maxItems: 1, actions: [{ key: 'a', label: 'Arquivar' }] },
  press_open_vscode: { type: 'press', maxItems: 1, actions: [{ key: 'c', label: 'Abrir VSCode' }] },
  press_write_doc: {
    type: 'press',
    maxItems: 1,
    actions: [{ key: 'w', label: 'Escrever Documentação' }],
  },
  press_push: { type: 'press', maxItems: 1, actions: [{ key: 'p', label: 'Push' }] },
  press_merge: { type: 'press', maxItems: 1, actions: [{ key: 'm', label: 'Merge' }] },
  press_fix: { type: 'press', maxItems: 1, actions: [{ key: 'f', label: 'Corrigir' }] },
  press_open_css: { type: 'press', maxItems: 1, actions: [{ key: 'c', label: 'Abrir CSS' }] },

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
  nav_find_line: { type: 'nav', direction: 'down', minCount: 1, maxCount: 10 },
  nav_font_size: { type: 'nav', direction: 'up', minCount: 1, maxCount: 10 },
  nav_select_channel: { type: 'nav', direction: 'down', minCount: 1, maxCount: 10 },

  // --- selection ---
  selection_color: {
    type: 'selection',
    options: [
      { key: 'r', label: 'Vermelho' },
      { key: 'g', label: 'Verde' },
      { key: 'b', label: 'Azul' },
    ],
  },
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
  selection_open_file: {
    type: 'selection',
    options: [
      { key: 'h', label: 'HTML' },
      { key: 'c', label: 'CSS' },
      { key: 'j', label: 'JS' },
    ],
  },
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
