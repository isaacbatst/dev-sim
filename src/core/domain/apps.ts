import type { AppId } from '../snapshot';

/**
 * Mapeia cada tarefa ao "app" do desktop que ela representa (UI diegética).
 * Tarefa não mapeada cai no editor.
 */
const APP_BY_TASK: Record<string, AppId> = {
  study: 'browser',
  meeting: 'meet',
  test_feature: 'browser',
  slack: 'slack',
  email: 'mail',
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
