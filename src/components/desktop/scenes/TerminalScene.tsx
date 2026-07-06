import type { ActiveTicketSnapshot, SegmentView } from '@/core/snapshot';

type MashView = Extract<SegmentView, { type: 'mash' }>;

/** O comando que o mash "digita" (rst api / rst web / up). */
function cmdOf(keys: string[]): string {
  if (keys[0] === 'r' && keys.length === 4) return `rst ${keys[3] === 'a' ? 'api' : 'web'}`;
  if (keys[0] === 'u') return 'up';
  return keys.join('');
}

/** Letras já digitadas do comando ATUAL (ciclo em andamento). */
function typedOf(seg: MashView): string {
  const perGroup = seg.groups > 0 ? seg.target / seg.groups : seg.target;
  const inGroup = seg.count - Math.min(seg.activeGroup, seg.groups - 1) * perGroup;
  // O espaço do "rst api" não é tecla — insere na exibição depois da 3ª letra.
  const raw = seg.keys.slice(0, Math.max(0, Math.min(inGroup, seg.keys.length))).join('');
  return seg.keys.length === 4
    ? `${raw.slice(0, 3)}${raw.length > 3 ? ' ' + raw.slice(3) : ''}`
    : raw;
}

const PROMPT = 'dev@devos:~/projeto$';

/** Linha de prompt com o comando (parcial ou completo) e caret. */
function PromptLine({ text, caret }: { text: string; caret: boolean }) {
  return (
    <p className="m-0 leading-6">
      <span className="text-zinc-500">{PROMPT} </span>
      <span className="text-emerald-300">{text}</span>
      {caret && (
        <span className="animate-edgepulse ml-px inline-block h-[1.05em] w-[0.5em] translate-y-[0.15em] bg-emerald-300/80" />
      )}
    </p>
  );
}

/**
 * Terminal (app novo — ramo Ops): comandos como combos decoráveis. O mash digita
 * as letras do comando; grupos do "up" = réplicas (uma execução por grupo).
 * Terminal é SEMPRE escuro (como o painel git do editor) → cores fixas.
 */
export function TerminalScene({ active }: { active: ActiveTicketSnapshot }) {
  const focus = active.segments[0];
  const mash = focus?.type === 'mash' ? focus : null;
  const cmd = mash ? cmdOf(mash.keys) : '';
  const isUp = mash ? mash.keys[0] === 'u' : false;
  const doneGroups = mash ? Math.min(mash.activeGroup, mash.groups) : 0;
  const done = mash ? mash.count >= mash.target : false;

  return (
    <div className="flex h-[24rem] w-full flex-col overflow-hidden bg-[#0c0e14] p-3 font-code text-sm text-zinc-300">
      {/* histórico da sessão: um restart já executado (se estamos no up), etc. */}
      {mash && isUp && (
        <>
          {Array.from({ length: doneGroups }, (_, i) => (
            <div key={i}>
              <PromptLine text="up" caret={false} />
              <p className="m-0 leading-6 text-zinc-500">
                réplica {i + 1}/{mash.groups} no ar <span className="text-emerald-400">✓</span>
              </p>
            </div>
          ))}
        </>
      )}

      {/* comando atual sendo digitado (o combo) */}
      {mash && !done && <PromptLine text={typedOf(mash)} caret />}

      {mash && !done && (
        <p className="m-0 mt-auto border-t border-white/10 pt-2 text-[11px] text-zinc-500">
          digite{' '}
          <span className="text-amber-300">{cmd.replace(/ /g, ' · ').split('').join(' ')}</span>
          {isUp && (
            <span>
              {' '}
              — réplica {Math.min(doneGroups + 1, mash.groups)}/{mash.groups}
            </span>
          )}
        </p>
      )}

      {/* sem mash ativo (abrindo / pronto): sessão em repouso */}
      {(!mash || done) && (
        <>
          <PromptLine text="" caret />
          {active.ready && (
            <p className="m-0 leading-6 text-zinc-500">
              tudo no ar <span className="text-emerald-400">✓</span> — Enter entrega
            </p>
          )}
        </>
      )}
    </div>
  );
}
