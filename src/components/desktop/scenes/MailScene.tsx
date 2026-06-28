import type { ActiveTicketSnapshot } from '@/core/snapshot';

const INBOX = [
  { from: 'chefe', subj: 'RE: RE: RE: urgente', unread: true },
  { from: 'RH', subj: 'Pesquisa de clima (obrigatória)', unread: false },
  { from: 'newsletter', subj: '10 dicas de produtividade', unread: false },
];

export function MailScene({ active }: { active: ActiveTicketSnapshot }) {
  // active é mantido para futura ambientação por passo (arquivar, etc.)
  void active;
  return (
    <div className="flex min-h-[22rem] flex-1 bg-[#fbfbfd] text-zinc-800">
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
          <div className="h-2 w-5/6 rounded bg-zinc-100" />
        </div>
      </div>
    </div>
  );
}
