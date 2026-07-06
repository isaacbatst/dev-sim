import type { AppId } from '@/core/snapshot';

/** Identidade de cada "app" do desktop para barra de título e dock. */
export interface AppMeta {
  name: string;
  icon: string;
  accent: string;
}

export const APPS: Record<AppId, AppMeta> = {
  editor: { name: 'VS Code', icon: '</>', accent: '#4ec9b0' },
  browser: { name: 'Chrome', icon: '🌐', accent: '#5b9bff' },
  slack: { name: 'Slack', icon: '💬', accent: '#c084fc' },
  mail: { name: 'Mail', icon: '✉️', accent: '#5b9bff' },
  meet: { name: 'Meet', icon: '🎥', accent: '#5fd07a' },
  terminal: { name: 'Terminal', icon: '>_', accent: '#5fd07a' },
};

/** Ordem fixa dos apps de desktop no dock (mail/meet são sites do navegador). */
export const DOCK_APPS: AppId[] = ['editor', 'browser', 'slack', 'terminal'];
