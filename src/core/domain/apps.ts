import type { AppId } from '../snapshot';

/**
 * Mapeia cada tarefa ao "app" do desktop que ela representa (UI diegética).
 * Tarefa não mapeada cai no editor.
 */
const APP_BY_TASK: Record<string, AppId> = {
  study: 'browser',
  meeting: 'browser',
  test_feature: 'browser',
  slack: 'slack',
  email: 'browser',
  document: 'editor',
  fix_typo: 'editor',
  ui_color: 'editor',
  ui_font: 'editor',
};

const APP_NAME: Record<AppId, string> = {
  editor: 'VS Code',
  browser: 'Chrome',
  slack: 'Slack',
  mail: 'Mail',
  meet: 'Meet',
};

/** Tecla que abre cada app de desktop (coincide com a ação "Abrir X"). */
export const LAUNCH_KEY: Record<AppId, string> = {
  editor: 'v',
  browser: 'c',
  slack: 's',
  mail: 'm', // mail/meet viram sites do navegador; não abrem standalone
  meet: 'o',
};

/** Mapa inverso (só apps de desktop reais) p/ detectar "abriu o programa errado". */
export const APP_BY_LAUNCH_KEY: Record<string, AppId> = {
  v: 'editor',
  c: 'browser',
  s: 'slack',
};

export function appForTask(taskId: string): AppId {
  return APP_BY_TASK[taskId] ?? 'editor';
}

export function windowTitle(taskId: string, taskTitle: string): string {
  const app = appForTask(taskId);
  if (app === 'slack') return 'Slack — #geral';
  if (app === 'mail') return 'Mail — Caixa de entrada';
  if (app === 'meet') return 'Meet — Daily';
  return `${APP_NAME[app]} — ${taskTitle}`;
}
