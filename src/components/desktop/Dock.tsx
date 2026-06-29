import type { AppId } from '@/core/snapshot';
import { APPS, DOCK_APPS } from './apps';

/** Dock estilo SO — ancora a metáfora de área de trabalho. */
export function Dock({ activeApp }: { activeApp: AppId | null }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
      {/* Dock estilo macOS: sem borda em cada ícone (chip contornado = cara de AI);
          só o glifo + um ponto embaixo do app ativo. */}
      <div className="elev-1 pointer-events-auto flex items-end gap-1 rounded-2xl border border-edge bg-surface/70 px-2 py-2 backdrop-blur-md">
        {DOCK_APPS.map((id) => {
          const app = APPS[id];
          const on = id === activeApp;
          return (
            <div key={id} className="group flex flex-col items-center">
              <span
                className={`flex size-11 items-center justify-center rounded-xl text-lg transition-all duration-100 group-hover:-translate-y-1 ${
                  on ? 'bg-ink/10' : 'group-hover:bg-ink/[0.06]'
                }`}
                aria-hidden
              >
                {app.icon}
              </span>
              <span
                className={`mt-1 size-1 rounded-full transition-colors ${on ? 'bg-amber' : 'bg-transparent'}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
