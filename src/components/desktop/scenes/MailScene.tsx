import type { ActiveTicketSnapshot } from '@/core/snapshot';

const INBOX = [
  { from: 'chefe', subj: 'RE: RE: RE: urgente', unread: true },
  { from: 'RH', subj: 'Pesquisa de clima (obrigatória)', unread: false },
  { from: 'newsletter', subj: '10 dicas de produtividade', unread: false },
];

export function MailScene({ active }: { active: ActiveTicketSnapshot }) {
  // Beat de "abrir → ler": a mensagem só aparece depois do passo "Abrir a
  // mensagem"; antes disso, mostramos só a caixa de entrada (alvo destacado).
  const focus = active.segments[0];
  const label =
    focus?.type === 'press' ? (focus.tokens.find((t) => !t.done) ?? focus.tokens[0])?.label : '';
  const opening = /abrir/i.test(label ?? '');

  return (
    <div className="flex min-h-[22rem] flex-1 bg-[#fbfbfd] text-zinc-800">
      <div className="w-52 shrink-0 border-r border-zinc-200">
        {INBOX.map((m, i) => {
          const target = i === 0;
          return (
            <div
              key={i}
              className={`flex items-center gap-2 border-b border-zinc-100 px-3 py-2 ${
                target ? 'bg-amber-50 ring-1 ring-inset ring-amber-300' : ''
              }`}
            >
              <span
                className={`size-1.5 shrink-0 rounded-full ${m.unread ? 'bg-red-500' : 'bg-transparent'}`}
              />
              <div className="min-w-0">
                <p className={`text-xs ${m.unread ? 'font-bold text-zinc-900' : 'text-zinc-500'}`}>
                  {m.from}
                </p>
                <p className="truncate text-xs text-zinc-500">{m.subj}</p>
              </div>
              {target && opening && (
                <span className="ml-auto shrink-0 text-[10px] font-semibold text-amber-700">
                  abrir →
                </span>
              )}
            </div>
          );
        })}
      </div>
      {opening ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-5 text-zinc-400">
          <span className="text-2xl">✉️</span>
          <p className="text-xs">selecione uma mensagem</p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col p-5">
          <h3 className="text-lg font-semibold text-zinc-900">RE: RE: RE: urgente</h3>
          <p className="text-xs text-zinc-500">de chefe@empresa.com</p>
          <div className="mt-3 space-y-2">
            <div className="h-2 w-3/4 rounded bg-zinc-200" />
            <div className="h-2 w-full rounded bg-zinc-100" />
            <div className="h-2 w-5/6 rounded bg-zinc-100" />
          </div>
        </div>
      )}
    </div>
  );
}
