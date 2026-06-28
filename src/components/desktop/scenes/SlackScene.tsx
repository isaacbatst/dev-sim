import type { ActiveTicketSnapshot } from '@/core/snapshot';

const CHANNELS = [
  '#geral',
  '#dev-frontend',
  '#dev-backend',
  '#incidentes',
  '#deploys',
  '#random',
  '#design',
  '#produto',
  '#rh-avisos',
  '#memes',
];

export function SlackScene({ active }: { active: ActiveTicketSnapshot }) {
  const nav = active.segments[0]?.type === 'nav' ? active.segments[0] : null;
  const cursorWrong = nav?.committed && nav.wrong;

  return (
    <div className="flex min-h-[22rem] flex-1 bg-[#1a1d29]">
      <div className="w-44 shrink-0 overflow-y-auto bg-[#3f0e40] p-2 text-sm">
        <p className="px-2 pb-2 font-semibold text-white">Empresa</p>
        {CHANNELS.map((c, i) => {
          const onCursor = nav && i === nav.cursor;
          const isTarget = nav && i === nav.target;
          return (
            <p
              key={c}
              className={`flex items-center justify-between rounded px-2 py-1 ${
                onCursor
                  ? cursorWrong
                    ? 'bg-fail/40 text-white'
                    : 'bg-[#1164a3] text-white'
                  : isTarget
                    ? 'text-white'
                    : 'text-purple-200/80'
              }`}
            >
              {c}
              {isTarget && !nav?.committed && (
                <span className="text-[10px] text-emerald-300">◀</span>
              )}
            </p>
          );
        })}
      </div>

      <div className="flex flex-1 flex-col">
        <div className="border-b border-line px-4 py-2 font-semibold text-ink">
          {nav ? CHANNELS[Math.min(nav.cursor, CHANNELS.length - 1)] : '#geral'}
        </div>
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
        </div>
      </div>
    </div>
  );
}
