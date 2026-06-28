import type { ActiveTicketSnapshot, SegmentView } from '@/core/snapshot';
import { Meter } from '../primitives';

type SiteKind = 'qa' | 'docs' | 'wiki' | 'article' | 'staging' | 'home';
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
  home: { tab: 'Nova aba', dot: 'bg-zinc-400', url: '', kind: 'home' },
};

function siteKey(focus: SegmentView | undefined, browserSite: string): string {
  // "Abrir o navegador / a página" → tela inicial; só ao LER (ou testar) carrega a página.
  if (focus?.type === 'hold') return 'staging';
  if (focus?.type === 'press') {
    const t = focus.tokens.find((x) => !x.done) ?? focus.tokens[0];
    const l = (t?.label ?? '').toLowerCase();
    if (/ler/.test(l)) return browserSite; // passo "Ler a página" → a página aberta
    return 'home'; // qualquer "Abrir ..." → nova aba / tela inicial
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

function Page({ site, holding, progress }: { site: Site; holding: boolean; progress: number }) {
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
              <pre className="mt-2 rounded bg-zinc-100 p-2 font-mono text-[11px] text-zinc-600">
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

export function BrowserScene({ active }: { active: ActiveTicketSnapshot }) {
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
        <span className="flex-1 truncate rounded-full bg-zinc-100 px-3 py-1 font-mono text-xs text-zinc-500">
          {site.url ? `🔒 ${site.url}` : 'Buscar ou digitar URL'}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <Page site={site} holding={holding} progress={progress} />
      </div>
    </div>
  );
}
