import type { ActiveTicketSnapshot, Priority, SegmentView, SlotSnapshot } from '@/core/snapshot';
import { Meter } from '../primitives';

type Slots = (SlotSnapshot | null)[];

type SiteKind =
  'qa' | 'docs' | 'wiki' | 'article' | 'staging' | 'inbox' | 'meet' | 'issues' | 'home';
interface Site {
  tab: string;
  dot: string;
  url: string;
  kind: SiteKind;
}

const SITES: Record<string, Site> = {
  so: {
    tab: 'Stack Overflow',
    dot: 'bg-orange-500',
    url: 'stackoverflow.com/q/4019740',
    kind: 'qa',
  },
  docs: { tab: 'DevDocs', dot: 'bg-sky-600', url: 'devdocs.io/jwt', kind: 'docs' },
  wiki: {
    tab: 'Wiki interna',
    dot: 'bg-emerald-600',
    url: 'wiki.empresa.dev/playbook',
    kind: 'wiki',
  },
  tutorial: { tab: 'dev.to', dot: 'bg-zinc-900', url: 'dev.to/auth-do-zero', kind: 'article' },
  staging: { tab: 'Staging', dot: 'bg-amber-500', url: 'staging.empresa.dev/app', kind: 'staging' },
  inbox: { tab: 'Webmail', dot: 'bg-red-500', url: 'mail.empresa.dev/inbox', kind: 'inbox' },
  meet: { tab: 'Meet', dot: 'bg-emerald-500', url: 'meet.empresa.dev/daily', kind: 'meet' },
  issues: {
    tab: 'GitHub',
    dot: 'bg-zinc-800',
    url: 'github.com/empresa/app/issues',
    kind: 'issues',
  },
  home: { tab: 'Nova aba', dot: 'bg-zinc-400', url: '', kind: 'home' },
};

function siteKey(focus: SegmentView | undefined, browserSite: string): string {
  // "Abrir/Entrar ..." mostra a tela inicial (carregando); demais ações (Ler,
  // Arquivar, Falar…) acontecem sobre a página/app já carregado.
  if (focus?.type === 'hold') return browserSite;
  if (focus?.type === 'press') {
    const t = focus.tokens.find((x) => !x.done) ?? focus.tokens[0];
    const l = (t?.label ?? '').toLowerCase();
    if (/abrir|entrar/.test(l)) return 'home';
    return browserSite;
  }
  return 'home';
}

function Bar({ rows }: { rows: string[] }) {
  return (
    <div className="flex flex-col gap-2">
      {rows.map((w, i) => (
        <div
          key={i}
          className={`h-2 rounded ${i === 0 ? 'bg-zinc-300' : 'bg-zinc-100'}`}
          style={{ width: w }}
        />
      ))}
    </div>
  );
}

const PRIORITY_TAG: Record<Priority, { label: string; cls: string }> = {
  urgente: { label: 'urgente', cls: 'border-red-200 bg-red-100 text-red-700' },
  alta: { label: 'alta', cls: 'border-orange-200 bg-orange-100 text-orange-700' },
  normal: { label: 'normal', cls: 'border-blue-200 bg-blue-100 text-blue-700' },
  baixa: { label: 'baixa', cls: 'border-zinc-200 bg-zinc-100 text-zinc-600' },
};

function Page({
  site,
  holding,
  progress,
  slots,
}: {
  site: Site;
  holding: boolean;
  progress: number;
  slots: Slots;
}) {
  switch (site.kind) {
    case 'qa':
      return (
        <div className="flex flex-col gap-3 p-5">
          <h3 className="text-lg font-semibold text-zinc-900">
            Why does my JWT return null on login?
          </h3>
          <div className="flex gap-3">
            <div className="flex flex-col items-center text-xs text-zinc-400">
              <span>▲</span>
              <span className="text-zinc-700">12</span>
              <span>▼</span>
            </div>
            <div className="flex-1">
              <Bar rows={['90%', '100%', '70%']} />
              <pre className="mt-2 rounded bg-zinc-100 p-2 font-code text-[11px] text-zinc-600">
                const token = jwt.verify(t, SECRET)
              </pre>
            </div>
          </div>
          <p className="text-xs text-emerald-700">✓ 1 resposta aceita</p>
        </div>
      );
    case 'docs':
    case 'wiki':
      return (
        <div className="flex min-h-0 flex-1">
          <div className="w-36 shrink-0 border-r border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-500">
            <p className="font-semibold text-zinc-700">
              {site.kind === 'wiki' ? 'Playbook' : 'Guia'}
            </p>
            <p className="mt-2">• Introdução</p>
            <p className="text-zinc-900">• Autenticação</p>
            <p>• Tokens</p>
            <p>• Erros comuns</p>
          </div>
          <div className="flex-1 p-5">
            <h3 className="text-lg font-semibold text-zinc-900">
              {site.kind === 'wiki' ? 'Playbook de Autenticação' : 'JSON Web Tokens — Guia'}
            </h3>
            <div className="mt-3">
              <Bar rows={['100%', '95%', '88%', '70%']} />
            </div>
          </div>
        </div>
      );
    case 'article':
      return (
        <div className="mx-auto max-w-lg p-6">
          <h3 className="text-2xl font-bold text-zinc-900">Auth do zero, sem chorar</h3>
          <p className="mt-1 text-xs text-zinc-500">
            por @dev_influencer · 7 min de leitura · ❤️ 1.2k
          </p>
          <div className="mt-4">
            <Bar rows={['100%', '92%', '100%', '60%']} />
          </div>
        </div>
      );
    case 'issues': {
      const issues = slots.filter((s): s is SlotSnapshot => s !== null);
      return (
        <div className="flex min-h-0 flex-1 flex-col bg-white">
          <div className="flex items-center gap-2 border-b border-zinc-200 px-4 py-2.5 text-sm">
            <span className="text-zinc-500">empresa / app</span>
            <span className="font-semibold text-zinc-900">Issues</span>
            <span className="ml-auto flex items-center gap-1.5 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
              <span className="size-2 rounded-full bg-green-600" />
              {issues.length} open
            </span>
          </div>
          <div className="flex-1 divide-y divide-zinc-100 overflow-auto">
            {issues.map((s) => (
              <div key={s.id} className="flex items-center gap-3 px-4 py-2.5">
                <span
                  className="size-3.5 shrink-0 rounded-full border-2 border-green-600"
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-zinc-900">{s.name}</p>
                  <p className="text-xs text-zinc-500">
                    #{s.id} aberto
                    {s.waitRemaining !== null
                      ? ' · em review'
                      : s.readyToMerge
                        ? ' · aguardando merge'
                        : s.ready
                          ? ' · pronto'
                          : ''}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${PRIORITY_TAG[s.priority].cls}`}
                >
                  {PRIORITY_TAG[s.priority].label}
                </span>
              </div>
            ))}
            {issues.length === 0 && (
              <p className="p-6 text-center text-sm text-zinc-400">nenhuma issue aberta</p>
            )}
          </div>
        </div>
      );
    }
    case 'inbox':
      return (
        <div className="flex min-h-0 flex-1">
          <div className="hidden w-36 shrink-0 border-r border-zinc-200 bg-zinc-50 p-3 text-xs sm:block">
            <p className="rounded bg-red-500 px-2 py-1 text-center font-semibold text-white">
              Escrever
            </p>
            <p className="mt-3 font-semibold text-zinc-900">Caixa de entrada</p>
            <p className="mt-1 text-zinc-500">Enviados</p>
            <p className="text-zinc-500">Arquivados</p>
          </div>
          <div className="flex-1">
            {[
              { from: 'chefe', subj: 'RE: RE: RE: urgente', unread: true },
              { from: 'RH', subj: 'Pesquisa de clima (obrigatória)', unread: false },
              { from: 'newsletter', subj: '10 dicas de produtividade', unread: false },
            ].map((m, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 border-b border-zinc-100 px-4 py-2.5 ${
                  i === 0 ? 'bg-amber-50 ring-1 ring-inset ring-amber-300' : ''
                }`}
              >
                <span
                  className={`size-2 shrink-0 rounded-full ${m.unread ? 'bg-red-500' : 'bg-zinc-300'}`}
                />
                <span
                  className={`w-24 shrink-0 text-xs ${m.unread ? 'font-semibold text-zinc-900' : 'text-zinc-500'}`}
                >
                  {m.from}
                </span>
                <span
                  className={`flex-1 truncate text-sm ${m.unread ? 'text-zinc-900' : 'text-zinc-600'}`}
                >
                  {m.subj}
                </span>
                {i === 0 && (
                  <span className="shrink-0 rounded bg-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                    arquivar ↓
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    case 'meet':
      return (
        <div className="flex min-h-0 flex-1 flex-col bg-[#0c0e15] p-3">
          <div className="grid flex-1 grid-cols-4 gap-2">
            {['PO', 'TL', 'QA', 'UX', 'BE', 'FE', 'PM'].map((p) => (
              <div
                key={p}
                className="flex aspect-video items-center justify-center rounded-lg bg-zinc-800 text-xs font-semibold text-zinc-400"
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-zinc-900">
                  {p}
                </span>
              </div>
            ))}
            <div
              className={`relative flex aspect-video items-center justify-center rounded-lg border-2 ${
                holding ? 'border-emerald-400' : 'border-zinc-700'
              } bg-zinc-800`}
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-zinc-100">
                EU
              </span>
              {holding && (
                <span className="absolute bottom-1 flex items-end gap-0.5">
                  {[3, 6, 4, 7, 5].map((h, i) => (
                    <span
                      key={i}
                      className="w-1 animate-edgepulse rounded bg-emerald-400"
                      style={{ height: `${h * 2}px`, animationDelay: `${i * 80}ms` }}
                    />
                  ))}
                </span>
              )}
            </div>
          </div>
          <div className="mt-2 flex items-center justify-center gap-3 text-sm">
            <span
              className={`flex size-8 items-center justify-center rounded-full text-base ${
                holding ? 'bg-emerald-400 text-zinc-900' : 'bg-zinc-700 text-zinc-300'
              }`}
            >
              {holding ? '🎙' : '🔇'}
            </span>
            <span className="text-zinc-300">{holding ? 'Falando…' : 'Você está mudo'}</span>
            <span className="w-28">
              <Meter value={progress} color="#34d399" />
            </span>
          </div>
        </div>
      );
    case 'staging':
      return (
        <div className="flex flex-col gap-3 p-5">
          <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-zinc-400">preview · staging.empresa.dev</p>
            <div className="mt-2 flex items-center gap-3">
              <div className="h-8 w-24 rounded bg-zinc-100" />
              <div className="h-8 w-8 rounded-full bg-zinc-100" />
            </div>
          </div>
          <div
            className={`inline-block w-fit rounded-md px-4 py-2 text-sm font-semibold text-white ${
              holding ? 'bg-emerald-500' : 'bg-zinc-400'
            }`}
          >
            {holding ? '▶ rodando testes E2E…' : 'rodar testes'}
          </div>
          <div className="max-w-xs">
            <Meter value={progress} color="#10b981" />
          </div>
        </div>
      );
    default:
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-zinc-400">
          <span className="text-2xl">🌐</span>
          <div className="h-9 w-2/3 max-w-sm rounded-full bg-zinc-100" />
          <p className="text-xs">nova aba</p>
        </div>
      );
  }
}

export function BrowserScene({ active, slots }: { active: ActiveTicketSnapshot; slots: Slots }) {
  const focus = active.segments[0];
  const site = SITES[siteKey(focus, active.browserSite)];
  const holding = focus?.type === 'hold' ? focus.holding : false;
  const progress = focus?.type === 'hold' ? focus.progress : 0;

  return (
    <div className="flex min-h-[22rem] flex-1 flex-col bg-[#fbfbfd] text-zinc-800">
      {/* abas */}
      <div className="flex items-center gap-1 bg-zinc-200 px-2 pt-2">
        <div className="flex items-center gap-2 rounded-t-md bg-[#fbfbfd] px-3 py-1.5 text-xs text-zinc-700">
          <span className={`size-3 rounded-full ${site.dot}`} /> {site.tab}
        </div>
        <div className="px-2 text-zinc-400">+</div>
      </div>
      {/* address bar */}
      <div className="flex items-center gap-2 border-b border-zinc-200 bg-white px-3 py-2">
        <span className="text-zinc-400">←</span>
        <span className="text-zinc-400">→</span>
        <span className="flex-1 truncate rounded-full bg-zinc-100 px-3 py-1 font-code text-xs text-zinc-500">
          {site.url ? `🔒 ${site.url}` : 'Buscar ou digitar URL'}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <Page site={site} holding={holding} progress={progress} slots={slots} />
      </div>
    </div>
  );
}
