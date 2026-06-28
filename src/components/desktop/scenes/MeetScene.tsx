import type { ActiveTicketSnapshot } from '@/core/snapshot';
import { KeyCap } from '../primitives';

const PEERS = ['PO', 'TL', 'QA', 'UX', 'BE', 'FE', 'PM'];

export function MeetScene({ active }: { active: ActiveTicketSnapshot }) {
  const focus = active.segments[0];
  const speaking = focus?.type === 'hold' && focus.holding;
  const holdKey = focus?.type === 'hold' ? focus.key : 'f';
  const progress = focus?.type === 'hold' ? focus.progress : 0;

  return (
    <div className="flex min-h-72 flex-col bg-[#0c0e15]">
      {/* grade de participantes */}
      <div className="grid flex-1 grid-cols-4 gap-2 p-3">
        {PEERS.map((p) => (
          <div
            key={p}
            className="flex aspect-video items-center justify-center rounded-lg bg-surface-2 text-sm font-semibold text-ink-dim"
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-bg">{p}</span>
          </div>
        ))}
        {/* você */}
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

      {/* barra de controles */}
      <div className="flex items-center justify-center gap-4 border-t border-line bg-surface/80 px-4 py-3">
        {focus?.type === 'hold' ? (
          <div className="flex items-center gap-3">
            <span
              className={`flex size-10 items-center justify-center rounded-full text-lg ${
                speaking ? 'bg-pass text-bg' : 'bg-fail/20 text-fail'
              }`}
            >
              {speaking ? '🎙️' : '🔇'}
            </span>
            <div className="flex flex-col">
              <span className="text-sm text-ink">
                {speaking ? 'Falando…' : 'Você está mudo'} — segure{' '}
                <KeyCap state={speaking ? 'current' : 'idle'} small>
                  {holdKey}
                </KeyCap>{' '}
                para falar
              </span>
              <div className="mt-1 h-1.5 w-48 overflow-hidden rounded-full bg-black/40">
                <div className="h-full bg-pass" style={{ width: `${progress * 100}%` }} />
              </div>
            </div>
          </div>
        ) : (
          <GenericControls active={active} />
        )}
      </div>
    </div>
  );
}

function GenericControls({ active }: { active: ActiveTicketSnapshot }) {
  const focus = active.segments[0];
  if (focus?.type !== 'press') return null;
  const t = focus.tokens.find((x) => !x.done) ?? focus.tokens[0];
  return (
    <div className="flex items-center gap-3">
      <KeyCap state="current">{t.key}</KeyCap>
      <span className="text-sm text-ink">{t.label}</span>
    </div>
  );
}
