import type { ActiveTicketSnapshot, SegmentView } from '@/core/snapshot';
import { KeyCap, Meter } from '../primitives';

/** Cores idiomáticas por tipo de arquivo e por cor selecionável. */
const FILE_COLOR: Record<string, string> = { HTML: '#e44d26', CSS: '#2965f1', JS: '#f0db4f' };
const FILE_NAME: Record<string, string> = { HTML: 'index.html', CSS: 'styles.css', JS: 'app.js' };
const SWATCH: Record<string, string> = {
  Vermelho: '#ff5c57',
  Verde: '#5fd07a',
  Azul: '#5b9bff',
};

const FAUX_CODE = [
  'export function login(user: User) {',
  '  const token = createSession(user)',
  '  if (!token) throw new AuthError()',
  '  return persist(token)',
  '}',
  '',
  'function createSession(user: User) {',
  '  return signJwt({ sub: user.id })',
  '}',
];

function keyState(t: { done: boolean; current: boolean }) {
  return t.done ? 'done' : t.current ? 'current' : 'idle';
}

/** Explorador de arquivos — usado quando o passo é selecionar arquivo (HTML/CSS/JS). */
function FileTree({ seg }: { seg: Extract<SegmentView, { type: 'selection' }> }) {
  return (
    <div className="flex flex-col gap-0.5 p-2 font-mono text-sm">
      <p className="px-2 pb-1 text-[11px] uppercase tracking-wider text-ink-dim">
        explorer · abra {seg.prompt}
      </p>
      {seg.options.map((o) => {
        const chosen = seg.chosenKey === o.key;
        const target = o.label === seg.prompt;
        return (
          <div
            key={o.key}
            className={`flex items-center gap-2 rounded px-2 py-1 ${
              chosen ? (seg.wrong ? 'bg-fail/15' : 'bg-pass/15') : target ? 'bg-amber/10' : ''
            }`}
          >
            <span
              className="size-3 rounded-[3px]"
              style={{ background: FILE_COLOR[o.label] ?? 'var(--ink-dim)' }}
            />
            <span className="text-ink">{FILE_NAME[o.label] ?? o.label.toLowerCase()}</span>
            <span className="ml-auto">
              <KeyCap
                state={chosen ? (seg.wrong ? 'wrong' : 'done') : target ? 'current' : 'idle'}
                small
              >
                {o.key}
              </KeyCap>
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Editor de código com cursor de linha (nav) ou squiggle de erro (fix). */
function CodeArea({ active, focus }: { active: ActiveTicketSnapshot; focus: SegmentView }) {
  const navLine = focus.type === 'nav' ? focus.count : -1;
  const fixing = focus.type === 'press' && focus.tokens.some((t) => /corrigir/i.test(t.label));
  return (
    <div className="flex-1 overflow-hidden font-mono text-sm">
      <div className="flex border-b border-line bg-surface px-3 py-1 text-xs text-ink-dim">
        <span className="border-b-2 border-amber px-2 py-1 text-ink">login.ts</span>
      </div>
      <pre className="m-0 p-3 leading-6">
        {FAUX_CODE.map((line, i) => {
          const isCursor = i === navLine;
          const isBug = fixing && i === 2;
          return (
            <div
              key={i}
              className={`flex gap-3 ${isCursor ? 'bg-amber/15' : ''} ${isBug ? 'bg-fail/10' : ''}`}
            >
              <span className="w-6 select-none text-right text-ink-dim">{i + 1}</span>
              <span className={isBug ? 'text-fail underline decoration-wavy' : 'text-ink'}>
                {line || ' '}
              </span>
              {isCursor && <span className="animate-edgepulse text-amber">▎</span>}
            </div>
          );
        })}
      </pre>
      {focus.type === 'nav' && (
        <div className="flex items-center gap-3 border-t border-line px-3 py-2">
          <KeyCap state="current">↓</KeyCap>
          <span className="text-ink">
            descer até a linha · <span className="text-amber">{focus.count}</span>
            <span className="text-ink-dim">/{focus.target}</span>
          </span>
        </div>
      )}
      {fixing && (
        <div className="flex items-center gap-3 border-t border-line px-3 py-2">
          <KeyCap
            state={keyState(
              focus.type === 'press' ? focus.tokens[0] : { done: false, current: true },
            )}
          >
            {focus.type === 'press' ? focus.tokens[0].key : 'f'}
          </KeyCap>
          <span className="text-ink">corrigir a linha apontada</span>
        </div>
      )}
      <span className="sr-only">{active.taskTitle}</span>
    </div>
  );
}

/** Terminal integrado para git push/merge. */
function GitTerminal({ focus }: { focus: Extract<SegmentView, { type: 'press' }> }) {
  const t = focus.tokens[0];
  const cmd = /merge/i.test(t.label) ? 'git merge --no-ff feature' : 'git push origin HEAD';
  return (
    <div className="flex-1 bg-black/50 p-3 font-mono text-sm">
      <p className="text-ink-dim">desenvolvedor@devOS:~/projeto$</p>
      <p className="mt-1 text-pass">$ {cmd}</p>
      <p className="mt-3 flex items-center gap-3 text-ink">
        <KeyCap state={keyState(t)}>{t.key}</KeyCap>
        {/merge/i.test(t.label) ? 'confirmar o merge' : 'enviar o commit'}
      </p>
    </div>
  );
}

/** Popover de cor / menu de seleção genérico. */
function SelectMenu({ seg }: { seg: Extract<SegmentView, { type: 'selection' }> }) {
  const isColor = seg.options.some((o) => SWATCH[o.label]);
  return (
    <div className="flex-1 p-4">
      <p className="mb-3 text-sm text-ink-dim">
        selecione <span className="font-semibold text-amber">{seg.prompt}</span>
      </p>
      <div className={`flex flex-wrap gap-2 ${isColor ? '' : 'flex-col'}`}>
        {seg.options.map((o) => {
          const chosen = seg.chosenKey === o.key;
          const target = o.label === seg.prompt;
          return (
            <div
              key={o.key}
              className={`flex items-center gap-2 rounded-md border px-3 py-2 ${
                target ? 'border-amber bg-amber/5' : 'border-line'
              }`}
            >
              {isColor && (
                <span className="size-4 rounded" style={{ background: SWATCH[o.label] }} />
              )}
              <span className="text-sm text-ink">{o.label}</span>
              <KeyCap
                state={chosen ? (seg.wrong ? 'wrong' : 'done') : target ? 'current' : 'idle'}
                small
              >
                {o.key}
              </KeyCap>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PrPanel({ focus }: { focus: Extract<SegmentView, { type: 'wait' }> }) {
  return (
    <div className="flex-1 p-4 font-mono text-sm">
      <p className="text-ink">Pull Request #482</p>
      <p className="mt-1 text-ink-dim">aguardando review de @tech-lead (online)…</p>
      <div className="mt-4 flex items-center gap-3">
        <span className="size-4 animate-spin rounded-full border-2 border-teal border-t-transparent" />
        <span className="text-teal">{Math.ceil(focus.remaining)}s</span>
        <span className="text-ink-dim">— trabalhe em outra demanda</span>
      </div>
      <div className="mt-3 max-w-xs">
        <Meter value={focus.progress} color="var(--teal)" />
      </div>
    </div>
  );
}

function GenericPress({ seg }: { seg: Extract<SegmentView, { type: 'press' }> }) {
  return (
    <div className="flex flex-1 flex-col justify-center gap-3 p-4">
      {seg.tokens.map((t, i) => (
        <div key={i} className="flex items-center gap-3">
          <KeyCap state={keyState(t)}>{t.key}</KeyCap>
          <span className={`text-sm ${t.done ? 'text-ink-dim line-through' : 'text-ink'}`}>
            {t.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export function EditorScene({ active }: { active: ActiveTicketSnapshot }) {
  const focus = active.segments[0];

  let main: React.ReactNode;
  if (!focus) main = null;
  else if (focus.type === 'selection')
    main = FILE_COLOR[focus.options[0]?.label] ? (
      <FileTree seg={focus} />
    ) : (
      <SelectMenu seg={focus} />
    );
  else if (focus.type === 'nav') main = <CodeArea active={active} focus={focus} />;
  else if (focus.type === 'wait') main = <PrPanel focus={focus} />;
  else if (focus.type === 'press')
    main = /push|merge/i.test(focus.tokens[0]?.label ?? '') ? (
      <GitTerminal focus={focus} />
    ) : /corrigir/i.test(focus.tokens[0]?.label ?? '') ? (
      <CodeArea active={active} focus={focus} />
    ) : (
      <GenericPress seg={focus} />
    );

  return (
    <div className="flex min-h-72">
      {/* activity bar */}
      <div className="flex w-10 flex-col items-center gap-4 border-r border-line bg-surface-2 py-3 text-ink-dim">
        <span>📄</span>
        <span>🔍</span>
        <span className="text-teal">⑂</span>
        <span>🐞</span>
      </div>
      {/* explorer estreito */}
      <div className="hidden w-40 shrink-0 flex-col border-r border-line bg-surface/60 p-2 font-mono text-xs text-ink-dim sm:flex">
        <p className="pb-1 uppercase tracking-wider">projeto</p>
        <p className="text-ink">▸ src</p>
        <p className="pl-3">▸ auth</p>
        <p className="pl-6 text-ink">login.ts</p>
        <p className="pl-3">style.css</p>
      </div>
      {main}
    </div>
  );
}
