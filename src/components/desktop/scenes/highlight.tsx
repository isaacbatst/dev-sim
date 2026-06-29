/**
 * Syntax highlight LEVE para o conteúdo ESTÁTICO do editor (não é editável, então
 * não precisa cobrir input arbitrário — só os trechos em `CONTENT`). Tokenizer
 * por linguagem via regex; cores vêm de tokens `--syn-*` por tema. Sem libs.
 */
type Tok = { t: string; c: string | null };

/** Roda um regex global na linha emitindo tokens (com os "buracos" como texto). */
function run(line: string, re: RegExp, cls: (m: RegExpExecArray) => string | null): Tok[] {
  const out: Tok[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  re.lastIndex = 0;
  while ((m = re.exec(line))) {
    if (m.index > last) out.push({ t: line.slice(last, m.index), c: null });
    out.push({ t: m[0], c: cls(m) });
    last = m.index + m[0].length;
    if (m[0].length === 0) re.lastIndex++;
  }
  if (last < line.length) out.push({ t: line.slice(last), c: null });
  return out;
}

const JS =
  /(\/\/.*)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`[^`]*`)|\b(import|from|export|default|function|return|const|let|var|if|else|throw|new|class|extends|await|async|true|false|null)\b|\b(\d+)\b|([A-Za-z_$][\w$]*)(?=\s*\()|\b([A-Z][\w$]*)\b/g;

const CSS =
  /(\/\*[\s\S]*?\*\/)|('[^']*'|"[^"]*")|(#[0-9a-fA-F]{3,8})|\b(\d+(?:px|rem|em|%)?)\b|(--[\w-]+)|\b(var|solid|bold|italic|none)\b|([.#:][\w-]+)|\b([a-z-]+)(?=\s*:)/g;

const HTML = /(<\/?[\w!-]+|\/?>)|([\w-]+)(?==)|("[^"]*")/g;

function tokenize(line: string, ext: string): Tok[] {
  if (ext === 'md') {
    if (/^#{1,6}\s/.test(line)) return [{ t: line, c: 'syn-fn' }];
    const m = line.match(/^(\d+\.|[-*])\s/);
    if (m)
      return [
        { t: m[0], c: 'syn-num' },
        { t: line.slice(m[0].length), c: null },
      ];
    return [{ t: line, c: null }];
  }
  if (ext === 'html') {
    return run(line, HTML, (m) => (m[1] ? 'syn-tag' : m[2] ? 'syn-attr' : m[3] ? 'syn-str' : null));
  }
  if (ext === 'css') {
    return run(line, CSS, (m) =>
      m[1]
        ? 'syn-com'
        : m[2]
          ? 'syn-str'
          : m[3]
            ? 'syn-num'
            : m[4]
              ? 'syn-num'
              : m[5]
                ? 'syn-attr'
                : m[6]
                  ? 'syn-attr'
                  : m[7]
                    ? 'syn-fn'
                    : m[8]
                      ? 'syn-tag'
                      : null,
    );
  }
  // js / ts (e fallback)
  return run(line, JS, (m) =>
    m[1]
      ? 'syn-com'
      : m[2]
        ? 'syn-str'
        : m[3]
          ? 'syn-key'
          : m[4]
            ? 'syn-num'
            : m[5]
              ? 'syn-fn'
              : m[6]
                ? 'syn-fn'
                : null,
  );
}

/** Renderiza uma linha de código com highlight (linha vazia vira espaço). */
export function Code({ line, ext }: { line: string; ext: string }) {
  if (!line) return <span> </span>;
  return (
    <>
      {tokenize(line, ext).map((tok, i) =>
        tok.c ? (
          <span key={i} className={tok.c}>
            {tok.t}
          </span>
        ) : (
          <span key={i}>{tok.t}</span>
        ),
      )}
    </>
  );
}
