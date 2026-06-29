import { useMemo } from 'react';
import type { ActiveTicketSnapshot, SegmentView } from '@/core/snapshot';
import { PROJECT_FILES } from '@/data/files';
import { fileRows, allFolderPaths, fileBasename } from '@/core/domain/instance';
import { Code } from './highlight';

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

/** Conteúdo POR ARQUIVO (cada um tem o seu). Sem linhas vazias nas primeiras 6
 *  (o typo cai nas linhas 2–6, então evita "linha vazia"). */
const CONTENT: Record<string, string[]> = {
  'index.html': [
    '<!doctype html>',
    '<html lang="pt-br">',
    '  <head>',
    '    <meta charset="utf-8" />',
    '    <meta name="viewport" content="width=device-width" />',
    '    <title>Dashboard</title>',
    '    <link rel="stylesheet" href="styles.css" />',
    '  </head>',
    '  <body>',
    '    <header class="topbar">',
    '      <h1>Painel</h1>',
    '      <nav><a href="about.html">Sobre</a></nav>',
    '    </header>',
    '    <main id="app"></main>',
    '    <footer class="foot">© 2026 devOS</footer>',
    '    <script src="app.js"></script>',
    '  </body>',
    '</html>',
  ],
  'about.html': [
    '<!doctype html>',
    '<html lang="pt-br">',
    '  <head>',
    '    <meta charset="utf-8" />',
    '    <title>Sobre</title>',
    '    <link rel="stylesheet" href="styles.css" />',
    '  </head>',
    '  <body>',
    '    <h1 class="title">Sobre nós</h1>',
    '    <p>Ferramentas para devs.</p>',
    '    <section class="team">',
    '      <p>Time pequeno, foco grande.</p>',
    '      <ul><li>Engenharia</li><li>Design</li></ul>',
    '    </section>',
    '    <a href="index.html">Voltar</a>',
    '  </body>',
    '</html>',
  ],
  'styles.css': [
    ':root {',
    '  --primary: #3b82f6;',
    '  --radius: 8px;',
    '}',
    '.button {',
    '  background: var(--primary);',
    '  color: #ffffff;',
    '  padding: 8px 14px;',
    '  border-radius: var(--radius);',
    '}',
    '.title {',
    '  font-size: 18px;',
    '  font-weight: 600;',
    '}',
    '.input {',
    '  border: 1px solid #cccccc;',
    '  padding: 6px;',
    '}',
    '.card { box-shadow: 0 1px 3px #0000001f; }',
  ],
  'theme.css': [
    ':root {',
    '  --bg: #0e1016;',
    '  --text: #e7e4dd;',
    '  --accent: #c792ea;',
    '}',
    'body {',
    '  background: var(--bg);',
    '  color: var(--text);',
    '  margin: 0;',
    '}',
    '.card {',
    '  border-radius: 8px;',
    '  padding: 16px;',
    '  background: #161922;',
    '}',
    '.muted { color: #7e8597; }',
  ],
  'reset.css': [
    '* {',
    '  margin: 0;',
    '  padding: 0;',
    '  box-sizing: border-box;',
    '}',
    'ul, ol {',
    '  list-style: none;',
    '}',
    'a {',
    '  color: inherit;',
    '  text-decoration: none;',
    '}',
    'button {',
    '  font: inherit;',
    '  cursor: pointer;',
    '}',
  ],
  'app.js': [
    "import { api } from './api'",
    "import { render } from './utils'",
    'export function start() {',
    '  const data = api.load()',
    '  render(data)',
    "  console.log('ok')",
    '  return data',
    '}',
    'export function reload() {',
    '  return start()',
    '}',
    'function track(event) {',
    '  api.save({ event })',
    '}',
    "window.addEventListener('load', start)",
  ],
  'utils.js': [
    'export function render(data) {',
    "  const el = document.querySelector('#app')",
    '  el.textContent = String(data)',
    '  return el',
    '}',
    'export function clamp(n, lo, hi) {',
    '  return Math.max(lo, Math.min(hi, n))',
    '}',
    'export function debounce(fn, ms) {',
    '  let timer',
    '  return (...args) => {',
    '    clearTimeout(timer)',
    '    timer = setTimeout(() => fn(...args), ms)',
    '  }',
    '}',
  ],
  'api.js': [
    "const BASE = '/api/v1'",
    'export const api = {',
    '  load() {',
    "    return fetch(BASE + '/me')",
    '  },',
    '  save(p) {',
    "    return fetch(BASE + '/save', { method: 'POST', body: p })",
    '  },',
    '  remove(id) {',
    "    return fetch(BASE + '/item/' + id, { method: 'DELETE' })",
    '  },',
    '}',
    'export function authHeader(token) {',
    "  return { Authorization: 'Bearer ' + token }",
    '}',
  ],
  'login.ts': [
    "import { signJwt } from './auth'",
    'export function login(user: User) {',
    '  const token = createSession(user)',
    '  if (!token) throw new AuthError()',
    '  return persist(token)',
    '}',
    'function createSession(user: User) {',
    '  return signJwt({ sub: user.id })',
    '}',
    'export function logout(token: string) {',
    '  return revoke(token)',
    '}',
    'function persist(token: string) {',
    "  localStorage.setItem('jwt', token)",
    '  return token',
    '}',
  ],
  'auth.ts': [
    'export function signJwt(payload: Claims) {',
    "  const header = encode({ alg: 'HS256' })",
    '  const body = encode(payload)',
    '  return sign(header, body, SECRET)',
    '}',
    'export function verify(token: string) {',
    '  return decode(token).valid',
    '}',
    'function encode(o: object) {',
    '  return btoa(JSON.stringify(o))',
    '}',
    'function decode(token: string) {',
    '  return JSON.parse(atob(token))',
    '}',
  ],
  'README.md': [
    '# Projeto',
    '## Setup',
    '1. npm install',
    '2. npm run dev',
    '## Deploy',
    'Push para a main dispara o CI.',
    'Veja o guia de contribuição.',
    '## Scripts',
    '- build: compila para produção',
    '- test: roda a suíte',
    '## Licença',
    'MIT.',
  ],
};
const FALLBACK = CONTENT['login.ts'];
function linesFor(file: string): string[] {
  return CONTENT[file] ?? FALLBACK;
}

// ── Conflito de merge dinâmico ──────────────────────────────────────────────
// Geração determinística por ticket (semeada pelo id) — quantidade num range,
// locais aleatórios e distintos, e o lado "feature" DIFERENTE do "HEAD". É
// presentational (não afeta o resultado; resolver é o mash), então mora aqui.
// PRNG determinístico = já pronto pro seed do dia depois.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

interface Conflict {
  line: number;
  head: string;
  feature: string;
}

/** Versão "do outro branch": muda valor/identificador da linha (head ≠ feature). */
function mutateLine(line: string, rng: () => number): string {
  const pick = <T,>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];
  if (/#[0-9a-fA-F]{3,8}\b/.test(line)) {
    return line.replace(
      /#[0-9a-fA-F]{3,8}\b/,
      pick(['#2563eb', '#ef4444', '#22c55e', '#f59e0b', '#0ea5e9', '#9333ea']),
    );
  }
  if (/\d/.test(line)) {
    return line.replace(/\d+/, (m) => String(Math.max(1, Number(m) + pick([-8, -4, -2, 2, 4, 8]))));
  }
  if (/(['"]).*?\1/.test(line)) {
    return line.replace(
      /(['"])(.*?)\1/,
      (_m, q) => `${q}${pick(['draft', 'v2', 'legacy', 'beta'])}${q}`,
    );
  }
  if (/\b[a-z][a-zA-Z0-9]*\(/.test(line)) {
    return line.replace(
      /\b[a-z][a-zA-Z0-9]*\(/,
      `${pick(['handle', 'process', 'resolve', 'apply', 'build'])}(`,
    );
  }
  return `${line} // hotfix`;
}

/** Monta os conflitos do merge: 1–3 em linhas de conteúdo distintas, semeado. */
function buildConflicts(file: string, lines: string[], id: number): Conflict[] {
  const rng = mulberry32((Math.imul(id, 2654435761) ^ hashStr(file)) >>> 0);
  const candidates = lines
    .map((l, i) => ({ l, i }))
    .filter((x) => x.l.trim().length > 4 && !/^[{}()[\]<>/]+$/.test(x.l.trim()));
  if (candidates.length === 0) return [];
  const count = Math.min(candidates.length, 1 + Math.floor(rng() * 3)); // 1..3
  const pool = [...candidates];
  const picked: { l: string; i: number }[] = [];
  for (let k = 0; k < count && pool.length > 0; k++) {
    picked.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  }
  return picked
    .sort((a, b) => a.i - b.i)
    .map((p) => ({ line: p.i, head: p.l, feature: mutateLine(p.l, rng) }));
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
    <div className="hidden w-52 shrink-0 flex-col overflow-auto border-r border-line bg-surface/60 py-2 font-code text-xs sm:flex">
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
      <span className="font-code text-2xl text-ink-dim/70">{open ? '▾' : '▸'}</span>
      <p className="text-xs">
        pasta <span className="font-code text-ink">{name}/</span>
      </p>
      <p className="text-[11px]">Enter {open ? 'colapsa' : 'expande'}</p>
    </div>
  );
}

/** Prévia (somente leitura) do arquivo sob o cursor, na área principal. */
function Preview({ file }: { file: string }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden font-code text-sm">
      <div className="flex shrink-0 items-center gap-2 border-b border-line bg-surface px-3 py-1 text-xs text-ink-dim">
        <span className="size-2.5 rounded-[2px]" style={{ background: extColor(file) }} />
        {file}
        <span className="text-ink-dim/70">— prévia</span>
      </div>
      <pre className="m-0 flex-1 overflow-y-auto p-3 leading-6 opacity-80">
        {linesFor(file).map((line, i) => (
          <div key={i} className="flex gap-3">
            <span className="w-6 select-none text-right text-ink-dim">{i + 1}</span>
            <span>
              <Code line={line} ext={ext(file)} />
            </span>
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
      {/* Overlay como painel: sem borda colorida; separa por sombra (elev-3). */}
      <div className="elev-3 w-full max-w-md overflow-hidden rounded-lg border border-edge bg-surface-2">
        <div className="flex items-center gap-2 border-b border-line px-3 py-2.5 font-code text-sm">
          <span className="text-ink-dim">›</span>
          {/* Caret = barrinha fina de 1px. Vazio → caret no início + placeholder. */}
          <span className="min-w-0 flex-1 truncate text-ink">
            {seg.query ? (
              <>
                {seg.query}
                <span className="animate-edgepulse ml-px inline-block h-[1.05em] w-px translate-y-[0.15em] bg-amber" />
              </>
            ) : (
              <>
                <span className="animate-edgepulse mr-px inline-block h-[1.05em] w-px translate-y-[0.15em] bg-amber" />
                <span className="text-ink-dim">buscar arquivo…</span>
              </>
            )}
          </span>
          <span className="shrink-0 text-[10px] uppercase tracking-wider text-ink-dim">
            Quick Open
          </span>
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
                className={`flex items-center gap-2 px-3 py-1 font-code text-sm ${
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
  fixedLine,
}: {
  focus?: SegmentView;
  file: string;
  targetLine: number;
  fixedLine: number;
}) {
  const nav = focus?.type === 'nav' ? focus : null;
  const cursorWrong = nav?.committed && nav.wrong;
  // Passo "Corrigir" (F): a nav já foi commitada (push/merge são roteados p/ GitView,
  // então aqui um press só pode ser o fix). A linha escolhida fica "confirmada".
  const fixing = focus?.type === 'press';
  const confirmedLine = fixing && fixedLine > 0 ? fixedLine - 1 : -1;
  // O typo já fica sublinhado (warn/erro) desde o início — é a própria pista de
  // onde navegar, em vez de só aparecer depois de marcar a linha.
  const bugLine = targetLine > 0 ? targetLine - 1 : -1;
  const lines = linesFor(file);
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden font-code text-sm">
      <div className="flex shrink-0 border-b border-line bg-surface px-3 py-1 text-xs text-ink-dim">
        <span className="border-b-2 border-amber px-2 py-1 text-ink">{file}</span>
      </div>
      <pre className="m-0 flex-1 overflow-y-auto p-3 leading-6">
        {lines.map((line, i) => {
          const isCursor = nav && i === nav.cursor;
          const isConfirmed = i === confirmedLine;
          const isBug = i === bugLine;
          return (
            <div
              key={i}
              className={`relative flex items-center gap-3 ${
                isCursor
                  ? cursorWrong
                    ? 'bg-fail/20'
                    : 'bg-amber/15'
                  : isConfirmed
                    ? 'bg-amber/10'
                    : ''
              }`}
            >
              {/* Linha confirmada (cursor "fixado" antes de corrigir): rail + caret
                  no gutter — sinaliza "é essa linha que vou editar". */}
              {isConfirmed && (
                <span aria-hidden className="absolute inset-y-0 left-0 w-0.5 bg-amber" />
              )}
              <span className="w-6 select-none text-right text-ink-dim">
                {isConfirmed ? <span className="text-amber">▸</span> : i + 1}
              </span>
              {/* Linha do typo: sublinha só o código, pulando a indentação. */}
              {isBug ? (
                <span>
                  {line.slice(0, line.length - line.trimStart().length)}
                  <span className="underline decoration-amber decoration-wavy decoration-2 underline-offset-2">
                    <Code line={line.trimStart()} ext={ext(file)} />
                  </span>
                </span>
              ) : (
                <span>
                  <Code line={line} ext={ext(file)} />
                </span>
              )}
            </div>
          );
        })}
      </pre>
    </div>
  );
}

/** Um conflito: marcadores reais do git com HEAD × feature DIFERENTES. */
function ConflictBlock({ head, feature, ext: e }: { head: string; feature: string; ext: string }) {
  return (
    <div className="relative bg-fail/[0.07] py-0.5">
      <span aria-hidden className="absolute inset-y-0 left-0 w-0.5 bg-fail/70" />
      <pre className="m-0 px-3 leading-6 text-fail">{'<<<<<<< HEAD'}</pre>
      <pre className="m-0 px-3 leading-6">
        <Code line={head} ext={e} />
      </pre>
      <pre className="m-0 px-3 leading-6 text-ink-dim">{'======='}</pre>
      <pre className="m-0 px-3 leading-6">
        <Code line={feature} ext={e} />
      </pre>
      <pre className="m-0 px-3 leading-6 text-fail">{'>>>>>>> feature'}</pre>
    </div>
  );
}

/** Editor com terminal integrado. Push = diff "alterada"; merge = resolver os
 *  conflitos esfregando ⬅️➡️ (mash) — fecham um a um, de cima pra baixo. */
function GitView({
  focus,
  file,
  targetLine,
  seed,
}: {
  focus: Extract<SegmentView, { type: 'press' | 'mash' }>;
  file: string;
  targetLine: number;
  seed: number;
}) {
  const mash = focus.type === 'mash' ? focus : null;
  const merge = !!mash;
  const progress = mash?.progress ?? 0;
  const lines = linesFor(file);
  // Conflitos do merge: quantidade/locais/conteúdo determinísticos pelo ticket.
  const conflicts = useMemo(
    () => (merge ? buildConflicts(file, lines, seed) : []),
    [merge, file, lines, seed],
  );
  const byLine = new Map(conflicts.map((c, k) => [c.line, k]));
  const resolved = (k: number) => progress >= (k + 1) / conflicts.length;
  // No push (sem conflitos), a linha alterada usa um fallback de conteúdo.
  const fallback = Math.max(
    0,
    lines.findIndex((l) => l.trim().length > 3 && !/^[{}()[\]]+$/.test(l.trim())),
  );
  const changedLine = targetLine > 0 ? targetLine - 1 : fallback;
  const open = conflicts.filter((_, k) => !resolved(k)).length;
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden font-code text-sm">
        <div className="flex shrink-0 border-b border-line bg-surface px-3 py-1 text-xs text-ink-dim">
          <span className="border-b-2 border-amber px-2 py-1 text-ink">{file}</span>
        </div>
        <pre className="m-0 flex-1 overflow-y-auto p-3 leading-6">
          {lines.map((line, i) => {
            // Linha em conflito ainda não resolvida → bloco com marcadores.
            const k = byLine.get(i);
            if (merge && k !== undefined && !resolved(k)) {
              return (
                <ConflictBlock
                  key={i}
                  head={conflicts[k].head}
                  feature={conflicts[k].feature}
                  ext={ext(file)}
                />
              );
            }
            // Push: diff "alterada" na linha alterada. Merge: linha normal
            // (conflitos já resolvidos viram código comum).
            const changed = !merge && i === changedLine;
            return (
              <div
                key={i}
                className={`relative flex items-center gap-3 ${changed ? 'bg-amber/[0.08]' : ''}`}
              >
                {changed && <span className="absolute inset-y-0 left-0 w-0.5 bg-amber/70" />}
                <span className="w-6 select-none text-right text-ink-dim">
                  {changed ? '~' : i + 1}
                </span>
                <span>
                  <Code line={line} ext={ext(file)} />
                </span>
                {changed && <span className="ml-auto pr-2 text-[10px] text-ink-dim">alterada</span>}
              </div>
            );
          })}
        </pre>
      </div>
      {/* Terminal é SEMPRE escuro (qualquer tema) → cores fixas claras, não
          tokens (que no tema claro virariam texto escuro sobre fundo escuro). */}
      <div className="shrink-0 border-t border-white/10 bg-[#0c0e14] p-2.5 font-code text-xs">
        <p className="text-[10px] uppercase tracking-wider text-zinc-500">terminal</p>
        <p className="mt-1 text-zinc-400">desenvolvedor@devOS:~/projeto$</p>
        <p className="text-emerald-400">
          $ {merge ? 'git merge --no-ff feature' : 'git push origin HEAD'}
        </p>
        {merge ? (
          <p className={open === 0 ? 'text-emerald-400' : 'text-amber-400'}>
            {open === 0
              ? 'Conflitos resolvidos. Merge made by recursive.'
              : `CONFLICT (content): ${open} conflito(s) em ${file}`}
          </p>
        ) : (
          <p className="text-zinc-400">Enumerating objects: 12, done.</p>
        )}
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
    <div className="flex flex-1 flex-col font-code text-sm">
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
    <div className="flex-1 p-4 font-code text-sm">
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
  else if (
    focus?.type === 'mash' ||
    (focus?.type === 'press' && /push/i.test(focus.tokens[0]?.label ?? ''))
  )
    main = (
      <GitView
        focus={focus}
        file={active.editorFile}
        targetLine={active.editorFixedLine}
        seed={active.id}
      />
    );
  else
    main = (
      <CodeArea
        focus={focus}
        file={active.editorFile}
        targetLine={active.editorLine}
        fixedLine={active.editorFixedLine}
      />
    );

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
