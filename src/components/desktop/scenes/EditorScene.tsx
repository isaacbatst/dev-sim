import type { ActiveTicketSnapshot, SegmentView } from '@/core/snapshot';
import { PROJECT_FILES } from '@/data/files';
import { fileRows, allFolderPaths, fileBasename } from '@/core/domain/instance';

type FileView = Extract<SegmentView, { type: 'file' }>;

const SWATCH: Record<string, string> = { Vermelho: '#ff5c57', Verde: '#5fd07a', Azul: '#5b9bff' };

/** Cor do ícone por extensão de arquivo. */
const EXT_COLOR: Record<string, string> = {
  html: '#e44d26',
  css: '#2965f1',
  js: '#f0db4f',
  ts: '#3178c6',
  md: '#8b90a6',
};
function ext(file: string): string {
  return file.split('.').pop() ?? 'ts';
}
function extColor(file: string): string {
  return EXT_COLOR[ext(file)] ?? 'var(--ink-dim)';
}

/** Conteúdo por extensão, para o editor mostrar o código certo de cada arquivo. */
const CONTENT: Record<string, string[]> = {
  html: [
    '<!doctype html>',
    '<html lang="pt-br">',
    '  <head>',
    '    <meta charset="utf-8" />',
    '    <title>App</title>',
    '  </head>',
    '  <body>',
    '    <button id="cta">Entrar</button>',
    '    <h1 class="title">Olá</h1>',
    '    <input name="email" />',
    '  </body>',
    '</html>',
  ],
  css: [
    ':root {',
    '  --primary: #3b82f6;',
    '}',
    '.button {',
    '  background: var(--primary);',
    '  color: #ffffff;',
    '}',
    '.title {',
    '  font-size: 18px;',
    '  font-weight: 600;',
    '}',
    '.input { border: 1px solid #ccc; }',
  ],
  js: [
    "import { api } from './api'",
    'export function login(user) {',
    '  const token = createSession(user)',
    "  if (!token) throw new Error('auth')",
    '  return persist(token)',
    '  return api.ok(token)',
    '}',
    'function createSession(u) {',
    '  return signJwt({ sub: u.id })',
    '}',
  ],
  ts: [
    'export function login(user: User) {',
    '  const token = createSession(user)',
    '  if (!token) throw new AuthError()',
    '  return persist(token)',
    '  return token',
    '}',
    'function createSession(user: User) {',
    '  return signJwt({ sub: user.id })',
    '}',
  ],
  md: [
    '# Projeto',
    '## Setup',
    '1. npm install',
    '2. npm run dev',
    '## Deploy',
    'Push para a main dispara o CI.',
    'Veja o guia de contribuição.',
  ],
};
function linesFor(file: string): string[] {
  return CONTENT[ext(file)] ?? CONTENT.ts;
}

/** Explorer em árvore (estilo VS Code): pastas expandem/colapsam; cursor navega. */
function ExplorerSidebar({ pick, currentFile }: { pick: FileView | null; currentFile: string }) {
  // No passo de abrir: as linhas vêm do core (com expandido). Fora dele: árvore
  // estática toda aberta, destacando o arquivo atual.
  const rows = pick
    ? pick.rows
    : fileRows(PROJECT_FILES, new Set(allFolderPaths(PROJECT_FILES))).map((r) => ({
        kind: r.kind,
        name: r.name,
        depth: r.depth,
        open: true,
        fileIndex: r.fileIndex,
      }));
  return (
    <div className="hidden w-52 shrink-0 flex-col overflow-auto border-r border-line bg-surface/60 py-2 font-mono text-xs sm:flex">
      <p className="px-3 pb-1.5 uppercase tracking-wider text-ink-dim">explorer</p>
      {rows.map((row, ri) => {
        const onCursor = pick && ri === pick.cursor;
        const isFile = row.kind === 'file';
        const isTarget = pick && isFile && row.fileIndex === pick.target && !pick.committed;
        const chosenWrong =
          pick?.committed && pick.wrong && isFile && row.fileIndex === pick.chosenIndex;
        const isCurrent = !pick && isFile && row.name === currentFile;
        return (
          <div
            key={ri}
            className={`mx-1 flex items-center gap-1.5 rounded py-1 pr-2 ${
              onCursor
                ? chosenWrong
                  ? 'bg-fail/20'
                  : 'bg-amber/15'
                : isCurrent
                  ? 'bg-amber/10'
                  : ''
            }`}
            style={{ paddingLeft: 8 + row.depth * 12 }}
          >
            {row.kind === 'folder' ? (
              <>
                <span className="w-2.5 text-center text-ink-dim">{row.open ? '▾' : '▸'}</span>
                <span className={onCursor ? 'text-ink' : 'text-ink-dim'}>{row.name}</span>
              </>
            ) : (
              <>
                <span
                  className="size-2.5 rounded-[2px]"
                  style={{ background: extColor(row.name) }}
                />
                <span className={onCursor || isCurrent ? 'text-ink' : 'text-ink-dim'}>
                  {row.name}
                </span>
                {isTarget && <span className="ml-auto text-[10px] text-teal">◀</span>}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Placeholder quando o cursor está numa pasta (nada pra prever). */
function FolderPreview({ name, open }: { name: string; open: boolean }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-1.5 text-ink-dim">
      <span className="font-mono text-2xl text-ink-dim/70">{open ? '▾' : '▸'}</span>
      <p className="text-xs">
        pasta <span className="font-mono text-ink">{name}/</span>
      </p>
      <p className="text-[11px]">Enter {open ? 'colapsa' : 'expande'}</p>
    </div>
  );
}

/** Prévia (somente leitura) do arquivo sob o cursor, na área principal. */
function Preview({ file }: { file: string }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden font-mono text-sm">
      <div className="flex shrink-0 items-center gap-2 border-b border-line bg-surface px-3 py-1 text-xs text-ink-dim">
        <span className="size-2.5 rounded-[2px]" style={{ background: extColor(file) }} />
        {file}
        <span className="text-ink-dim/70">— prévia</span>
      </div>
      <pre className="m-0 flex-1 overflow-y-auto p-3 leading-6 text-ink-dim opacity-70">
        {linesFor(file).map((line, i) => (
          <div key={i} className="flex gap-3">
            <span className="w-6 select-none text-right">{i + 1}</span>
            <span>{line || ' '}</span>
          </div>
        ))}
      </pre>
    </div>
  );
}

/** Overlay do Quick Open (Ctrl+P), centralizado sobre o editor. */
function QuickOpen({ seg }: { seg: FileView }) {
  const q = seg.query.toLowerCase();
  // Busca por nome em qualquer pasta aninhada (e por caminho).
  const matches = seg.files.filter(
    (f) => fileBasename(f).toLowerCase().includes(q) || f.toLowerCase().includes(q),
  );
  const activePath = seg.matchIndex >= 0 ? seg.files[seg.matchIndex] : null;
  return (
    <div className="absolute inset-x-0 top-0 z-10 flex justify-center px-4 pt-3">
      <div className="w-full max-w-md overflow-hidden rounded-md border border-amber bg-surface-2 shadow-2xl shadow-black/60">
        <div className="flex items-center gap-2 border-b border-line px-3 py-2 font-mono text-sm">
          <span className="text-ink-dim">›</span>
          <span className="text-ink">{seg.query}</span>
          <span className="animate-edgepulse text-amber">▌</span>
          <span className="ml-auto text-[10px] text-ink-dim">Quick Open</span>
        </div>
        <div className="max-h-48 overflow-auto py-1">
          {matches.length === 0 && (
            <p className="px-3 py-1.5 text-xs text-ink-dim">nenhum arquivo</p>
          )}
          {matches.map((f) => {
            const name = fileBasename(f);
            const dir = f.slice(0, Math.max(0, f.length - name.length - 1));
            return (
              <div
                key={f}
                className={`flex items-center gap-2 px-3 py-1 font-mono text-sm ${
                  activePath === f ? 'bg-amber/15 text-ink' : 'text-ink-dim'
                }`}
              >
                <span className="size-2.5 rounded-[2px]" style={{ background: extColor(name) }} />
                {name}
                {dir && <span className="ml-auto text-[10px] text-ink-dim/70">{dir}</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CodeArea({
  focus,
  file,
  targetLine,
}: {
  focus?: SegmentView;
  file: string;
  targetLine: number;
}) {
  const nav = focus?.type === 'nav' ? focus : null;
  const cursorWrong = nav?.committed && nav.wrong;
  // O typo já fica sublinhado (warn/erro) desde o início — é a própria pista de
  // onde navegar, em vez de só aparecer depois de marcar a linha.
  const bugLine = targetLine > 0 ? targetLine - 1 : -1;
  const lines = linesFor(file);
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden font-mono text-sm">
      <div className="flex shrink-0 border-b border-line bg-surface px-3 py-1 text-xs text-ink-dim">
        <span className="border-b-2 border-amber px-2 py-1 text-ink">{file}</span>
      </div>
      <pre className="m-0 flex-1 overflow-y-auto p-3 leading-6">
        {lines.map((line, i) => {
          const isCursor = nav && i === nav.cursor;
          const isBug = i === bugLine;
          return (
            <div
              key={i}
              className={`flex items-center gap-3 ${
                isCursor ? (cursorWrong ? 'bg-fail/20' : 'bg-amber/15') : ''
              } ${isBug ? 'bg-amber/10' : ''}`}
            >
              <span className="w-6 select-none text-right text-ink-dim">{i + 1}</span>
              <span
                className={
                  isBug ? 'text-amber underline decoration-amber decoration-wavy' : 'text-ink'
                }
              >
                {line || ' '}
              </span>
              {isCursor && (
                <span className={`animate-edgepulse ${cursorWrong ? 'text-fail' : 'text-amber'}`}>
                  ▎
                </span>
              )}
              {isBug && <span className="ml-auto pr-2 text-[10px] text-amber">🐛 typo aqui</span>}
            </div>
          );
        })}
      </pre>
    </div>
  );
}

/** Editor com terminal integrado (push/merge). A linha corrigida aparece em verde. */
function GitView({
  focus,
  file,
  targetLine,
}: {
  focus: Extract<SegmentView, { type: 'press' }>;
  file: string;
  targetLine: number;
}) {
  const merge = /merge/i.test(focus.tokens[0]?.label ?? '');
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden font-mono text-sm">
        <div className="flex shrink-0 border-b border-line bg-surface px-3 py-1 text-xs text-ink-dim">
          <span className="border-b-2 border-amber px-2 py-1 text-ink">{file}</span>
        </div>
        <pre className="m-0 flex-1 overflow-y-auto p-3 leading-6">
          {linesFor(file).map((line, i) => {
            const fixed = targetLine > 0 && i === targetLine - 1;
            return (
              <div key={i} className={`flex items-center gap-3 ${fixed ? 'bg-pass/10' : ''}`}>
                <span className="w-6 select-none text-right text-ink-dim">{i + 1}</span>
                <span className={fixed ? 'text-pass' : 'text-ink'}>{line || ' '}</span>
                {fixed && <span className="ml-auto pr-2 text-[10px] text-pass">✓ corrigido</span>}
              </div>
            );
          })}
        </pre>
      </div>
      {/* Terminal é SEMPRE escuro (qualquer tema) → cores fixas claras, não
          tokens (que no tema claro virariam texto escuro sobre fundo escuro). */}
      <div className="shrink-0 border-t border-white/10 bg-[#0c0e14] p-2.5 font-mono text-xs">
        <p className="text-[10px] uppercase tracking-wider text-zinc-500">terminal</p>
        <p className="mt-1 text-zinc-400">desenvolvedor@devOS:~/projeto$</p>
        <p className="text-emerald-400">
          $ {merge ? 'git merge --no-ff feature' : 'git push origin HEAD'}
        </p>
        <p className="text-zinc-400">
          {merge ? 'Merge made by recursive.' : 'Enumerating objects: 12, done.'}
        </p>
      </div>
    </div>
  );
}

const COMPONENTS = ['Button', 'Title', 'Input'];
const PROPERTIES = ['Texto', 'Fundo'];
const PROP_CSS: Record<string, string> = { Texto: 'color', Fundo: 'background' };
const COLOR_HEX: Record<string, string> = {
  Vermelho: '#ef4444',
  Verde: '#22c55e',
  Azul: '#3b82f6',
};

type SelKind = 'component' | 'property' | 'color' | 'size' | 'style';
function selKind(labels: string[]): SelKind {
  if (labels.some((l) => SWATCH[l])) return 'color';
  if (labels.some((l) => /px$/.test(l))) return 'size';
  if (labels.some((l) => COMPONENTS.includes(l))) return 'component';
  if (labels.some((l) => PROPERTIES.includes(l))) return 'property';
  return 'style';
}

/** Seleção renderizada como edição do CSS (componente → propriedade → valor),
 *  em vez de menu genérico. Sem keycap (tecla na ActionBar) nem destaque do alvo. */
function CssSelect({
  seg,
  file,
}: {
  seg: Extract<SegmentView, { type: 'selection' }>;
  file: string;
}) {
  const kind = selKind(seg.options.map((o) => o.label));
  const header = {
    component: 'componente',
    property: 'propriedade',
    color: 'cor',
    size: 'tamanho da fonte',
    style: 'estilo',
  }[kind];
  return (
    <div className="flex flex-1 flex-col font-mono text-sm">
      <div className="flex border-b border-line bg-surface px-3 py-1 text-xs text-ink-dim">
        <span className="border-b-2 border-amber px-2 py-1 text-ink">{file}</span>
      </div>
      <div className="p-4">
        <p className="mb-3 text-[11px] uppercase tracking-wider text-ink-dim">
          selecionar {header}
        </p>
        <div className="flex flex-col gap-1.5">
          {seg.options.map((o) => {
            const chosen = seg.chosenKey === o.key;
            const border = chosen ? (seg.wrong ? 'border-fail' : 'border-pass') : 'border-line/60';
            return (
              <div key={o.key} className={`rounded-md border ${border} bg-bg/40 px-3 py-2`}>
                {kind === 'component' && (
                  <span>
                    <span className="text-teal">.{o.label.toLowerCase()}</span>
                    <span className="text-ink-dim"> {'{ … }'}</span>
                  </span>
                )}
                {kind === 'property' && (
                  <span>
                    <span className="text-sky-400">{PROP_CSS[o.label]}</span>
                    <span className="text-ink-dim">: …;</span>
                    <span className="ml-2 text-[10px] text-ink-dim">({o.label.toLowerCase()})</span>
                  </span>
                )}
                {kind === 'color' && (
                  <span className="flex items-center gap-2">
                    <span className="size-4 rounded" style={{ background: COLOR_HEX[o.label] }} />
                    <span className="text-ink">{o.label}</span>
                    <span className="text-ink-dim">{COLOR_HEX[o.label]}</span>
                  </span>
                )}
                {kind === 'size' && (
                  <span className="flex items-baseline gap-2">
                    <span>
                      <span className="text-sky-400">font-size</span>
                      <span className="text-ink-dim">: </span>
                      <span className="text-ink">{o.label}</span>
                      <span className="text-ink-dim">;</span>
                    </span>
                    <span
                      className="leading-none text-ink-dim"
                      style={{ fontSize: o.label }}
                      aria-hidden
                    >
                      Aa
                    </span>
                  </span>
                )}
                {kind === 'style' && (
                  <span>
                    <span className="text-sky-400">font-style</span>
                    <span className="text-ink-dim">: </span>
                    <span className="text-ink">{o.label.toLowerCase()}</span>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PrPanel({ active }: { active: ActiveTicketSnapshot }) {
  const reReview = !!active.reviewComment;
  return (
    <div className="flex-1 p-4 font-mono text-sm">
      <p className="text-ink">Pull Request #482</p>
      <p className="mt-1 text-ink-dim">
        {reReview
          ? '@tech-lead revisando suas alterações…'
          : 'aguardando review de @tech-lead (online)…'}
      </p>
      {reReview && (
        <div className="mt-3 rounded bg-surface-2/60 p-2 text-xs leading-relaxed text-ink-dim">
          <span className="text-ink-dim/70">comentário anterior:</span> “{active.reviewComment}”
        </div>
      )}
      <div className="mt-4 flex items-center gap-3">
        <span className="size-4 animate-spin rounded-full border-2 border-teal border-t-transparent" />
        <span className="text-ink-dim">CI ✓ · 0 conflitos</span>
      </div>
    </div>
  );
}

export function EditorScene({ active }: { active: ActiveTicketSnapshot }) {
  const focus = active.segments[0];
  const pick = focus?.type === 'file' ? focus : null;

  let main: React.ReactNode;
  if (pick) {
    // Prévia do que está sob o cursor: arquivo → conteúdo; pasta → placeholder.
    const row = pick.rows[pick.cursor];
    if (row?.kind === 'file') main = <Preview file={fileBasename(pick.files[row.fileIndex])} />;
    else main = <FolderPreview name={row?.name ?? ''} open={row?.open ?? false} />;
  } else if (focus?.type === 'selection') main = <CssSelect seg={focus} file={active.editorFile} />;
  else if (focus?.type === 'wait') main = <PrPanel active={active} />;
  else if (focus?.type === 'press' && /push|merge/i.test(focus.tokens[0]?.label ?? ''))
    main = <GitView focus={focus} file={active.editorFile} targetLine={active.editorLine} />;
  else main = <CodeArea focus={focus} file={active.editorFile} targetLine={active.editorLine} />;

  return (
    <div className="flex h-[24rem] w-full overflow-hidden">
      <div className="flex w-10 shrink-0 flex-col items-center gap-4 border-r border-line bg-surface-2 py-3 text-ink-dim">
        <span>📄</span>
        <span>🔍</span>
        <span className="text-teal">⑂</span>
        <span>🐞</span>
      </div>
      <ExplorerSidebar pick={pick} currentFile={active.editorFile} />
      <div className="relative flex min-h-0 flex-1 flex-col">
        {active.reviewRejected && (
          <div className="shrink-0 border-b border-fail/40 bg-fail/10 px-3 py-2">
            <div className="flex items-center gap-2">
              <span
                className="flex size-5 items-center justify-center rounded-full bg-fail/25 text-[9px] font-bold text-fail"
                aria-hidden
              >
                TL
              </span>
              <span className="text-xs font-semibold text-ink">@tech-lead</span>
              <span className="rounded bg-fail/20 px-1.5 py-0.5 text-[10px] font-semibold text-fail">
                alterações solicitadas
              </span>
            </div>
            {active.reviewComment && (
              <p className="mt-1.5 pl-7 text-xs leading-relaxed text-ink">
                “{active.reviewComment}”
              </p>
            )}
          </div>
        )}
        {main}
        {pick?.searching && <QuickOpen seg={pick} />}
      </div>
    </div>
  );
}
