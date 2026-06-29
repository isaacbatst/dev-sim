'use client';

import { useEffect, useState } from 'react';

/**
 * "Aparência" do devOS — Claro / Escuro / Sistema, como em System Settings.
 * Claro = identidade Daybreak; Escuro = Graveyard; Sistema segue o SO.
 * Persiste em localStorage; um script no layout aplica antes da pintura.
 */
type Mode = 'light' | 'dark' | 'system';
const KEY = 'devos-appearance';

function applyMode(mode: Mode) {
  const prefersDark =
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = mode === 'dark' || (mode === 'system' && prefersDark);
  document.documentElement.setAttribute('data-theme', dark ? 'graveyard' : 'daybreak');
}

const SunIcon = () => (
  <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.3">
    <circle cx="8" cy="8" r="3" />
    <path
      d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3 3l1 1M12 12l1 1M13 3l-1 1M4 12l-1 1"
      strokeLinecap="round"
    />
  </svg>
);
const MoonIcon = () => (
  <svg viewBox="0 0 16 16" className="size-3.5" fill="currentColor">
    <path d="M11 1.5A6.5 6.5 0 1 0 14.5 9 5 5 0 0 1 11 1.5Z" />
  </svg>
);
const SystemIcon = () => (
  <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.3">
    <rect x="1.5" y="2.5" width="13" height="8.5" rx="1.5" />
    <path d="M6 14h4M8 11v3" strokeLinecap="round" />
  </svg>
);

const OPTS: { m: Mode; label: string; Icon: () => React.ReactElement }[] = [
  { m: 'light', label: 'Claro', Icon: SunIcon },
  { m: 'dark', label: 'Escuro', Icon: MoonIcon },
  { m: 'system', label: 'Sistema', Icon: SystemIcon },
];

export function ThemeControl() {
  const [mode, setMode] = useState<Mode>('system');

  useEffect(() => {
    // Sincroniza a escolha salva após montar (SSR-safe; o script no layout já
    // aplicou o tema antes da pintura — aqui é só o destaque do botão).
    const saved = (localStorage.getItem(KEY) as Mode | null) ?? 'system';
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMode(saved);
    applyMode(saved);
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (((localStorage.getItem(KEY) as Mode | null) ?? 'system') === 'system')
        applyMode('system');
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const pick = (m: Mode) => {
    setMode(m);
    localStorage.setItem(KEY, m);
    applyMode(m);
  };

  return (
    <div
      className="flex items-center gap-0.5 rounded-md border border-line p-0.5"
      role="group"
      aria-label="Aparência"
    >
      {OPTS.map(({ m, label, Icon }) => (
        <button
          key={m}
          onClick={() => pick(m)}
          title={label}
          aria-label={label}
          aria-pressed={mode === m}
          className={`flex size-6 items-center justify-center rounded transition-colors ${
            mode === m ? 'bg-amber/20 text-amber' : 'text-ink-dim hover:text-ink'
          }`}
        >
          <Icon />
        </button>
      ))}
    </div>
  );
}
