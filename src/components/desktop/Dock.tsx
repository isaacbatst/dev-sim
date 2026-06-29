import type { AppId } from '@/core/snapshot';
import { APPS, DOCK_APPS } from './apps';

/** Dock estilo SO — ancora a metáfora de área de trabalho. */
export function Dock({ activeApp }: { activeApp: AppId | null }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
      <div className="pointer-events-auto flex items-end gap-2 rounded-2xl border border-edge bg-surface/60 px-3 py-2 backdrop-blur-md">
        {DOCK_APPS.map((id) => {
          const app = APPS[id];
          const on = id === activeApp;
          return (
            <div key={id} className="group relative flex flex-col items-center">
              <span
                className={`flex size-11 items-center justify-center rounded-xl border text-lg transition-transform group-hover:-translate-y-1 ${
                  on ? 'border-amber/60 bg-amber/10' : 'border-white/10 bg-surface-2'
                }`}
                aria-hidden
              >
                {app.icon}
              </span>
              <span className={`mt-1 size-1 rounded-full ${on ? 'bg-amber' : 'bg-transparent'}`} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
