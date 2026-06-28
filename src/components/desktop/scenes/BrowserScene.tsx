import type { ActiveTicketSnapshot } from '@/core/snapshot';
import { Meter } from '../primitives';

function urlFor(label: string): string {
  if (/staging/i.test(label)) return 'https://staging.empresa.dev/app';
  if (/stack/i.test(label)) return 'https://stackoverflow.com/questions/4019740';
  if (/playbook/i.test(label)) return 'https://wiki.empresa.dev/playbook';
  if (/tutorial/i.test(label)) return 'https://dev.to/tutorial/auth';
  if (/email/i.test(label)) return 'https://mail.empresa.dev';
  return 'https://devdocs.io/auth';
}

export function BrowserScene({ active }: { active: ActiveTicketSnapshot }) {
  const focus = active.segments[0];
  const reading =
    focus?.type === 'press' ? (focus.tokens.find((t) => !t.done) ?? focus.tokens[0]) : null;
  const url = reading ? urlFor(reading.label) : 'https://devdocs.io';

  return (
    <div className="flex min-h-[22rem] flex-1 flex-col bg-[#fbfbfd] text-zinc-800">
      <div className="flex items-center gap-1 bg-zinc-200 px-2 pt-2">
        <div className="flex items-center gap-2 rounded-t-md bg-[#fbfbfd] px-3 py-1.5 text-xs">
          <span className="size-3 rounded-full bg-orange-400" /> Stack Overflow
        </div>
        <div className="px-2 text-zinc-400">+</div>
      </div>
      <div className="flex items-center gap-2 border-b border-zinc-200 bg-white px-3 py-2">
        <span className="text-zinc-400">←</span>
        <span className="text-zinc-400">→</span>
        <span className="flex-1 truncate rounded-full bg-zinc-100 px-3 py-1 font-mono text-xs text-zinc-500">
          🔒 {url}
        </span>
      </div>

      <div className="flex-1 p-5">
        {focus?.type === 'hold' ? (
          <div className="flex flex-col gap-3">
            <h3 className="text-lg font-semibold text-zinc-900">Testar feature em staging</h3>
            <div className="rounded-lg border border-zinc-200 p-4">
              <div
                className={`inline-block rounded-md px-4 py-2 text-sm font-semibold text-white ${
                  focus.holding ? 'bg-emerald-500' : 'bg-zinc-400'
                }`}
              >
                {focus.holding ? '▶ rodando testes…' : 'pronto para testar'}
              </div>
              <div className="mt-3 max-w-xs">
                <Meter value={focus.progress} color="#10b981" />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <h3 className="text-lg font-semibold text-zinc-900">
              Why does my JWT return null on login?
            </h3>
            <div className="h-2 w-3/4 rounded bg-zinc-200" />
            <div className="h-2 w-full rounded bg-zinc-100" />
            <div className="h-2 w-5/6 rounded bg-zinc-100" />
            <div className="mt-2 h-2 w-2/3 rounded bg-zinc-100" />
          </div>
        )}
      </div>
    </div>
  );
}
