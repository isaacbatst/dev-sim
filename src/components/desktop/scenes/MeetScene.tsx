import type { ActiveTicketSnapshot } from '@/core/snapshot';

const PEERS = ['PO', 'TL', 'QA', 'UX', 'BE', 'FE', 'PM'];

export function MeetScene({ active }: { active: ActiveTicketSnapshot }) {
  const focus = active.segments[0];
  const speaking = focus?.type === 'hold' && focus.holding;

  return (
    <div className="flex min-h-72 flex-1 flex-col bg-[#0c0e15]">
      <div className="grid flex-1 grid-cols-4 gap-2 p-3">
        {PEERS.map((p) => (
          <div
            key={p}
            className="flex aspect-video items-center justify-center rounded-lg bg-surface-2 text-sm font-semibold text-ink-dim"
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-bg">{p}</span>
          </div>
        ))}
        <div
          className={`relative flex aspect-video items-center justify-center rounded-lg border-2 ${
            speaking ? 'border-pass' : 'border-line'
          } bg-surface-2`}
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-bg text-sm font-semibold text-ink">
            EU
          </span>
          {speaking && (
            <span className="absolute bottom-1 flex items-end gap-0.5">
              {[3, 6, 4, 7, 5].map((h, i) => (
                <span
                  key={i}
                  className="w-1 animate-edgepulse rounded bg-pass"
                  style={{ height: `${h * 2}px`, animationDelay: `${i * 80}ms` }}
                />
              ))}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 border-t border-line bg-surface/80 py-3">
        <span
          className={`flex size-10 items-center justify-center rounded-full text-lg ${
            speaking ? 'bg-pass text-bg' : 'bg-fail/20 text-fail'
          }`}
        >
          {speaking ? '🎙️' : '🔇'}
        </span>
        <span className="text-sm text-ink-dim">{speaking ? 'Falando…' : 'Você está mudo'}</span>
      </div>
    </div>
  );
}
