/**
 * Port dos 24 segmentos `.tres` do PoC (Godot). As teclas vêm do input map do
 * `project.godot` (input_action → tecla física).
 *
 * AUDITORIA: `hold_*` e `wait_*` são tempo morto (ver types.ts / Seção 4).
 */
import type { Segment } from '@/core/domain/types';

// Pool de comentários de code review (humor dev amplo). `cat`: 0 Bloquear (🔴),
// 1 Comentar (🟡), 2 Aprovar (🟢). A instância sorteia N — matching puro.
const REVIEW_COMMENTS: { text: string; cat: number }[] = [
  { text: "console.log('aqui') esquecido", cat: 0 },
  { text: 'senha hardcoded no código', cat: 0 },
  { text: 'catch (e) {} engolindo o erro', cat: 0 },
  { text: 'commit direto na main', cat: 0 },
  { text: 'credencial no .env versionado', cat: 0 },
  { text: 'off-by-one no laço', cat: 0 },
  { text: 'variável não usada', cat: 1 },
  { text: 'faltou teste pra esse caso', cat: 1 },
  { text: 'esse método tá gigante', cat: 1 },
  { text: 'extrai isso numa função', cat: 1 },
  { text: 'comentário desatualizado', cat: 1 },
  { text: 'nome pouco claro: `data`', cat: 1 },
  { text: 'limpo, pode ir', cat: 2 },
  { text: 'boa solução', cat: 2 },
  { text: 'nada a apontar', cat: 2 },
  { text: 'gostei da abordagem', cat: 2 },
  { text: 'simples e direto', cat: 2 },
];

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

  // --- arquétipos de ASSINATURA FIXA (PROGRESSAO.md §3.2): combos decoráveis ---
  press_open_terminal: {
    type: 'press',
    maxItems: 1,
    opens: 'terminal',
    actions: [{ key: 't', label: 'Abrir Terminal' }],
  },
  // Bump de dependência: V → J → B → I (sempre igual — decorável).
  press_open_package: {
    type: 'press',
    maxItems: 1,
    actions: [{ key: 'j', label: 'Abrir package.json' }],
  },
  press_bump: { type: 'press', maxItems: 1, actions: [{ key: 'b', label: 'Bump da versão' }] },
  press_install: { type: 'press', maxItems: 1, actions: [{ key: 'i', label: 'Instalar (npm i)' }] },
  // Rotacionar keys: V → E → G → K (segredo não vai pra PR — sem CR).
  press_open_env: { type: 'press', maxItems: 1, actions: [{ key: 'e', label: 'Abrir .env' }] },
  press_gen_key: { type: 'press', maxItems: 1, actions: [{ key: 'g', label: 'Gerar nova key' }] },
  press_apply_key: {
    type: 'press',
    maxItems: 1,
    actions: [{ key: 'k', label: 'Aplicar a key' }],
  },
  // Spike: o slot de variação — a instância sorteia a FONTE (S ou D); a outra
  // vira distrator. O esqueleto C→?→L→V→rascunho não muda.
  press_spike_source: {
    type: 'press',
    maxItems: 1,
    actions: [
      { key: 's', label: 'Abrir Stack Overflow' },
      { key: 'd', label: 'Abrir Documentação' },
    ],
  },
  // Módulo novo: a receita de criação (N → escrever → S → push → CR → merge).
  press_new_file: { type: 'press', maxItems: 1, actions: [{ key: 'n', label: 'Novo arquivo' }] },
  press_save: { type: 'press', maxItems: 1, actions: [{ key: 's', label: 'Salvar' }] },

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
    // Cada conflito = 2 alternâncias ⬅️➡️; 1–3 conflitos por merge.
    minCount: 2,
    maxCount: 2,
    minGroups: 1,
    maxGroups: 3,
  },
  // "Digitar": percorrer a home row em ORDEM (A S D J K L, ciclando) — só a
  // próxima tecla avança; apertar a mesma repetido não conta.
  mash_write_doc: {
    type: 'mash',
    keys: ['a', 's', 'd', 'j', 'k', 'l'],
    label: 'Escrever a documentação',
    minCount: 12,
    maxCount: 18,
  },
  // Spike: rascunho CURTO (timeboxed — in-and-out, depois joga fora).
  mash_spike_draft: {
    type: 'mash',
    keys: ['a', 's', 'd', 'j', 'k', 'l'],
    label: 'Rascunhar a prova de conceito',
    minCount: 6,
    maxCount: 9,
  },
  mash_write_module: {
    type: 'mash',
    keys: ['a', 's', 'd', 'j', 'k', 'l'],
    label: 'Escrever o módulo',
    minCount: 12,
    maxCount: 18,
  },
  // Terminal: comandos como combos de luta (PROGRESSAO §3.2). Cada comando é um
  // mash de UM ciclo em ordem — digitar as letras do comando. O alvo (api/web)
  // é a última letra: variantes da task escolhem qual.
  mash_cmd_restart_api: {
    type: 'mash',
    keys: ['r', 's', 't', 'a'],
    label: 'Digitar: rst api',
    minCount: 4,
    maxCount: 4,
  },
  mash_cmd_restart_web: {
    type: 'mash',
    keys: ['r', 's', 't', 'w'],
    label: 'Digitar: rst web',
    minCount: 4,
    maxCount: 4,
  },
  // "up" × réplicas: cada GRUPO é uma execução do comando (a contagem do CSD:
  // o pedido dita quantas réplicas, você executa U·P de memória).
  mash_cmd_up: {
    type: 'mash',
    keys: ['u', 'p'],
    label: 'Subir réplicas: up',
    minCount: 2,
    maxCount: 2,
    minGroups: 2,
    maxGroups: 3,
  },

  // --- gauge (segurar e soltar na zona-alvo — "encher até a linha" do CSD) ---
  // Refatorar: segure pra simplificar e solte na faixa certa; passar = exagerou.
  gauge_simplify: { type: 'gauge', key: 'r', label: 'Refatorar', rate: 0.42 },

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

  // --- triage (fazer code review: despachar comentários já rotulados) ---
  press_open_pr: {
    type: 'press',
    maxItems: 1,
    actions: [{ key: 'p', label: 'Abrir o PR' }],
  },
  triage_review: {
    type: 'triage',
    categories: [
      { key: 'j', label: 'Bloquear', color: '#e5484d' },
      { key: 'k', label: 'Comentar', color: '#e8a13a' },
      { key: 'l', label: 'Elogiar', color: '#3fb765' },
    ],
    comments: REVIEW_COMMENTS,
    minItems: 6,
    maxItems: 9,
  },

  // --- wait (AUDITORIA: tempo morto) ---
  wait_cr: { type: 'wait', minDuration: 8, maxDuration: 15 },
};
