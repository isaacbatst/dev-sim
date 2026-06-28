import type { ActiveTicketSnapshot } from '@/core/snapshot';
import { KeyCap } from '../primitives';

const CHANNELS = ['#geral', '#dev', '#incidentes', '#random'];

export function SlackScene({ active }: { active: ActiveTicketSnapshot }) {
  const focus = active.segments[0];
  const navTarget = focus?.type === 'nav' ? focus.target : -1;
  const navCount = focus?.type === 'nav' ? focus.count : -1;

  return (
    <div className="flex min-h-72 bg-[#1a1d29]">
      {/* sidebar de canais */}
      <div className="w-40 shrink-0 bg-[#3f0e40] p-2 text-sm">
        <p className="px-2 pb-2 font-semibold text-white">Empresa</p>
        {CHANNELS.map((c, i) => {
          const active = focus?.type === 'nav' && i === Math.min(navCount, navTarget);
          return (
            <p
              key={c}
              className={`flex items-center justify-between rounded px-2 py-1 ${
                active ? 'bg-[#1164a3] text-white' : 'text-purple-200'
              }`}
            >
              {c}
              {focus?.type === 'nav' && i === navTarget && (
                <KeyCap state="current" small>
                  ↓
                </KeyCap>
              )}
            </p>
          );
        })}
      </div>

      {/* conversa */}
      <div className="flex flex-1 flex-col">
        <div className="border-b border-line px-4 py-2 font-semibold text-ink">#geral</div>
        <div className="flex flex-1 flex-col justify-end gap-3 p-4">
          <div className="flex gap-2">
            <span className="flex size-7 items-center justify-center rounded bg-fail/30 text-xs">
              CH
            </span>
            <div>
              <p className="text-xs text-ink-dim">chefe · agora</p>
              <p className="text-sm text-ink">e aí, cadê aquilo que pedi?</p>
            </div>
          </div>
          {focus?.type === 'nav' ? (
            <p className="flex items-center gap-2 text-sm text-ink-dim">
              <KeyCap state="current" small>
                ↓
              </KeyCap>{' '}
              navegue até o canal certo ({navCount}/{navTarget})
            </p>
          ) : (
            focus?.type === 'press' && (
              <div className="flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2">
                <KeyCap state="current">{focus.tokens[0].key}</KeyCap>
                <span className="text-sm text-ink">{focus.tokens[0].label}</span>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
