import type { ActiveTicketSnapshot } from '@/core/snapshot';
import { KeyCap } from '../primitives';

const INBOX = [
  { from: 'chefe', subj: 'RE: RE: RE: urgente', unread: true },
  { from: 'RH', subj: 'Pesquisa de clima (obrigatória)', unread: false },
  { from: 'newsletter', subj: '10 dicas de produtividade', unread: false },
];

export function MailScene({ active }: { active: ActiveTicketSnapshot }) {
  const focus = active.segments[0];
  const cue =
    focus?.type === 'press' ? (focus.tokens.find((t) => !t.done) ?? focus.tokens[0]) : null;

  return (
    <div className="flex min-h-72 bg-[#fbfbfd] text-zinc-800">
      <div className="w-52 shrink-0 border-r border-zinc-200">
        {INBOX.map((m, i) => (
          <div
            key={i}
            className={`border-b border-zinc-100 px-3 py-2 ${i === 0 ? 'bg-blue-50' : ''}`}
          >
            <p className={`text-xs ${m.unread ? 'font-bold text-zinc-900' : 'text-zinc-500'}`}>
              {m.from}
            </p>
            <p className="truncate text-xs text-zinc-500">{m.subj}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-semibold text-zinc-900">RE: RE: RE: urgente</h3>
        <p className="text-xs text-zinc-500">de chefe@empresa.com</p>
        <div className="mt-3 space-y-2">
          <div className="h-2 w-3/4 rounded bg-zinc-200" />
          <div className="h-2 w-full rounded bg-zinc-100" />
        </div>
        {cue && (
          <p className="mt-auto flex items-center gap-2 text-sm text-zinc-600">
            <KeyCap state="current" small>
              {cue.key}
            </KeyCap>{' '}
            {cue.label}
          </p>
        )}
      </div>
    </div>
  );
}
