import type { AppId } from '@/core/snapshot';

/** Aparência de cada "app" do desktop: ícone, cor de destaque e cena de contexto. */
export interface AppMeta {
  icon: string;
  accent: string;
  /** Tira de contexto sob a barra de título — dá identidade ao app (flavor). */
  context: (taskTitle: string) => React.ReactNode;
}

function Strip({ children, mono = false }: { children: React.ReactNode; mono?: boolean }) {
  return (
    <div
      className={`border-b border-line bg-bg/40 px-4 py-2 text-xs text-ink-dim ${
        mono ? 'font-mono' : ''
      }`}
    >
      {children}
    </div>
  );
}

export const APPS: Record<AppId, AppMeta> = {
  editor: {
    icon: '</>',
    accent: 'var(--teal)',
    context: () => (
      <Strip mono>
        <span className="text-ink-dim">src/auth/</span>
        <span className="text-ink">login.ts</span>
        <span className="ml-3 text-amber">● não salvo</span>
      </Strip>
    ),
  },
  browser: {
    icon: '🌐',
    accent: '#5b9bff',
    context: () => (
      <Strip mono>
        <span className="rounded bg-surface-2 px-2 py-0.5 text-ink-dim">
          🔒 https://stackoverflow.com/questions/...
        </span>
      </Strip>
    ),
  },
  slack: {
    icon: '💬',
    accent: '#c084fc',
    context: () => (
      <Strip>
        <span className="text-ink">#geral</span>
        <span className="ml-2">chefe está digitando…</span>
      </Strip>
    ),
  },
  mail: {
    icon: '✉️',
    accent: '#5b9bff',
    context: () => (
      <Strip>
        De: <span className="text-ink">chefe@empresa.com</span> · Assunto:{' '}
        <span className="text-ink">RE: RE: RE: urgente</span>
      </Strip>
    ),
  },
  meet: {
    icon: '🎥',
    accent: 'var(--pass)',
    context: () => (
      <Strip>
        <span className="text-fail">●</span> Ao vivo · 8 participantes · você está mudo
      </Strip>
    ),
  },
};
