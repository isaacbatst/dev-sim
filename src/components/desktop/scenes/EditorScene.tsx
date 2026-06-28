import type { ActiveTicketSnapshot, SegmentView } from '@/core/snapshot';

/** Cores idiomáticas por tipo de arquivo e por cor selecionável. */
const FILE_COLOR: Record<string, string> = { HTML: '#e44d26', CSS: '#2965f1', JS: '#f0db4f' };
const FILE_NAME: Record<string, string> = { HTML: 'index.html', CSS: 'styles.css', JS: 'app.js' };
const SWATCH: Record<string, string> = { Vermelho: '#ff5c57', Verde: '#5fd07a', Azul: '#5b9bff' };

/** Conteúdo por arquivo aberto, para o editor mostrar o código certo. */
const FILES: Record<string, string[]> = {
  'login.ts': [
    'export function login(user: User) {',
    '  const token = createSession(user)',
    '  if (!token) throw new AuthError()',
    '  return persist(token)',
    '}',
    '',
    'function createSession(user: User) {',
    '  return signJwt({ sub: user.id })',
    '}',
  ],
  'index.html': [
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
  'styles.css': [
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
  'app.js': [
    "import { api } from './api'",
    '',
    'export function login(user) {',
    '  const token = createSession(user)',
    "  if (!token) throw new Error('auth')",
    '  return persist(token)',
    '}',
    'function createSession(u) {',
    '  return signJwt({ sub: u.id })',
    '}',
  ],
};

/** Explorer com destaque do arquivo-alvo (sem keycap — a tecla mora na ActionBar). */
function FileTree({ seg }: { seg: Extract<SegmentView, { type: 'selection' }> }) {
  return (
    <div className="flex flex-col gap-0.5 p-3 font-mono text-sm">
      <p className="px-2 pb-1 text-[11px] uppercase tracking-wider text-ink-dim">explorer</p>
      {seg.options.map((o) => {
        const chosen = seg.chosenKey === o.key;
        return (
          <div
            key={o.key}
            className={`flex items-center gap-2 rounded px-2 py-1.5 ${
              chosen ? (seg.wrong ? 'bg-fail/15' : 'bg-pass/15') : ''
            }`}
          >
            <span
              className="size-3 rounded-[3px]"
              style={{ background: FILE_COLOR[o.label] ?? 'var(--ink-dim)' }}
            />
            <span className="text-ink">{FILE_NAME[o.label] ?? o.label.toLowerCase()}</span>
          </div>
        );
      })}
    </div>
  );
}

function CodeArea({ focus, file }: { focus?: SegmentView; file: string }) {
  const nav = focus?.type === 'nav' ? focus : null;
  const fixing = focus?.type === 'press' && focus.tokens.some((t) => /corrigir/i.test(t.label));
  const cursorWrong = nav?.committed && nav.wrong;
  const lines = FILES[file] ?? FILES['login.ts'];
  return (
    <div className="flex-1 overflow-hidden font-mono text-sm">
      <div className="flex border-b border-line bg-surface px-3 py-1 text-xs text-ink-dim">
        <span className="border-b-2 border-amber px-2 py-1 text-ink">{file}</span>
      </div>
      <pre className="m-0 p-3 leading-6">
        {lines.map((line, i) => {
          const isCursor = nav && i === nav.cursor;
          const isTarget = nav && i === nav.target;
          const isBug = fixing && i === 2;
          return (
            <div
              key={i}
              className={`flex items-center gap-3 ${
                isCursor ? (cursorWrong ? 'bg-fail/20' : 'bg-amber/15') : ''
              } ${isBug ? 'bg-fail/10' : ''}`}
            >
              <span className="w-6 select-none text-right text-ink-dim">{i + 1}</span>
              <span className={isBug ? 'text-fail underline decoration-wavy' : 'text-ink'}>
                {line || ' '}
              </span>
              {isCursor && (
                <span className={`animate-edgepulse ${cursorWrong ? 'text-fail' : 'text-amber'}`}>
                  ▎
                </span>
              )}
              {isTarget && !nav?.committed && (
                <span className="ml-auto pr-2 text-[10px] text-teal">◀ alvo</span>
              )}
            </div>
          );
        })}
      </pre>
    </div>
  );
}

function GitTerminal({ focus }: { focus: Extract<SegmentView, { type: 'press' }> }) {
  const merge = /merge/i.test(focus.tokens[0]?.label ?? '');
  return (
    <div className="flex-1 bg-black/50 p-3 font-mono text-sm">
      <p className="text-ink-dim">desenvolvedor@devOS:~/projeto$</p>
      <p className="mt-1 text-pass">
        $ {merge ? 'git merge --no-ff feature' : 'git push origin HEAD'}
      </p>
      <p className="mt-1 text-ink-dim">
        {merge ? 'Merge made by recursive.' : 'Enumerating objects: 12, done.'}
      </p>
      <p className="text-ink-dim">_</p>
    </div>
  );
}

function SelectMenu({ seg }: { seg: Extract<SegmentView, { type: 'selection' }> }) {
  const isColor = seg.options.some((o) => SWATCH[o.label]);
  return (
    <div className="flex-1 p-4">
      <p className="mb-3 text-xs uppercase tracking-wider text-ink-dim">
        {isColor ? 'paleta' : 'propriedades'}
      </p>
      <div className={`flex flex-wrap gap-2 ${isColor ? '' : 'flex-col'}`}>
        {seg.options.map((o) => {
          const chosen = seg.chosenKey === o.key;
          return (
            <div
              key={o.key}
              className={`flex items-center gap-2 rounded-md border px-3 py-2 ${
                chosen ? (seg.wrong ? 'border-fail' : 'border-pass') : 'border-line'
              }`}
            >
              {isColor && (
                <span className="size-4 rounded" style={{ background: SWATCH[o.label] }} />
              )}
              <span className="text-sm text-ink">{o.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PrPanel() {
  return (
    <div className="flex-1 p-4 font-mono text-sm">
      <p className="text-ink">Pull Request #482</p>
      <p className="mt-1 text-ink-dim">aguardando review de @tech-lead (online)…</p>
      <div className="mt-4 flex items-center gap-3">
        <span className="size-4 animate-spin rounded-full border-2 border-teal border-t-transparent" />
        <span className="text-ink-dim">CI ✓ · 0 conflitos</span>
      </div>
    </div>
  );
}

export function EditorScene({ active }: { active: ActiveTicketSnapshot }) {
  const focus = active.segments[0];

  let main: React.ReactNode;
  if (focus?.type === 'selection')
    main = FILE_COLOR[focus.options[0]?.label] ? (
      <FileTree seg={focus} />
    ) : (
      <SelectMenu seg={focus} />
    );
  else if (focus?.type === 'wait') main = <PrPanel />;
  else if (focus?.type === 'press' && /push|merge/i.test(focus.tokens[0]?.label ?? ''))
    main = <GitTerminal focus={focus} />;
  else main = <CodeArea focus={focus} file={active.editorFile} />;

  return (
    <div className="flex min-h-[22rem] flex-1">
      <div className="flex w-10 flex-col items-center gap-4 border-r border-line bg-surface-2 py-3 text-ink-dim">
        <span>📄</span>
        <span>🔍</span>
        <span className="text-teal">⑂</span>
        <span>🐞</span>
      </div>
      <div className="hidden w-40 shrink-0 flex-col border-r border-line bg-surface/60 p-2 font-mono text-xs text-ink-dim sm:flex">
        <p className="pb-1 uppercase tracking-wider">projeto</p>
        <p className="text-ink">▸ src</p>
        {['index.html', 'styles.css', 'app.js', 'login.ts'].map((f) => (
          <p key={f} className={`pl-3 ${f === active.editorFile ? 'text-amber' : ''}`}>
            {f}
          </p>
        ))}
      </div>
      {main}
    </div>
  );
}
