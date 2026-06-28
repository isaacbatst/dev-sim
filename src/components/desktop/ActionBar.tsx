import type { ActiveTicketSnapshot, SegmentView } from '@/core/snapshot';
import { APPS } from './apps';
import { KeyCap, Meter, ARROW_GLYPH } from './primitives';

/**
 * Lugar ÚNICO e consistente da hint de input, no rodapé de toda janela.
 * As cenas cuidam do ambiente/destaque; aqui mora sempre "o que apertar agora".
 */
function Cue({ seg }: { seg: SegmentView }) {
  switch (seg.type) {
    case 'press':
      return (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {seg.tokens.map((t, i) => (
            <span key={i} className="flex items-center gap-2">
              <KeyCap state={t.done ? 'done' : t.current ? 'current' : 'idle'}>{t.key}</KeyCap>
              <span className={`text-sm ${t.done ? 'text-ink-dim line-through' : 'text-ink'}`}>
                {t.label}
              </span>
            </span>
          ))}
        </div>
      );
    case 'hold':
      return (
        <div className="flex items-center gap-3">
          <KeyCap state={seg.holding ? 'current' : 'idle'}>{seg.key}</KeyCap>
          <span className="text-sm text-ink">
            segure — {seg.label} <span className="text-ink-dim">({seg.targetSec}s)</span>
          </span>
          <span className="w-32">
            <Meter value={seg.progress} color="var(--amber)" />
          </span>
        </div>
      );
    case 'nav':
      return (
        <div className="flex items-center gap-3">
          <KeyCap state="current">{ARROW_GLYPH[seg.direction] ?? seg.symbol}</KeyCap>
          <span className="text-sm text-ink">
            {seg.symbol} <span className="font-mono text-amber">{seg.count}</span>
            <span className="font-mono text-ink-dim">/{seg.target}</span>
          </span>
        </div>
      );
    case 'selection':
      return (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="text-sm text-ink-dim">
            selecione <span className="font-semibold text-amber">{seg.prompt}</span>
          </span>
          {seg.options.map((o) => (
            <span key={o.key} className="flex items-center gap-1.5">
              <KeyCap
                state={
                  seg.chosenKey === o.key
                    ? seg.wrong
                      ? 'wrong'
                      : 'done'
                    : o.label === seg.prompt
                      ? 'current'
                      : 'idle'
                }
              >
                {o.key}
              </KeyCap>
              <span className="text-xs text-ink-dim">{o.label}</span>
            </span>
          ))}
        </div>
      );
    case 'wait':
      return (
        <div className="flex items-center gap-3">
          <span className="text-lg">⏳</span>
          <span className="text-sm text-ink">
            aguardando review · <span className="text-teal">{Math.ceil(seg.remaining)}s</span>
          </span>
          <span className="w-32">
            <Meter value={seg.progress} color="var(--teal)" />
          </span>
        </div>
      );
  }
}

export function ActionBar({ active }: { active: ActiveTicketSnapshot }) {
  const accent = APPS[active.app].accent;
  return (
    <div
      className="flex min-h-14 items-center gap-3 border-t border-line bg-bg/70 px-4 py-2.5"
      style={{ boxShadow: `inset 3px 0 0 ${accent}` }}
    >
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-widest text-ink-dim">
        ação
      </span>
      <div className="flex-1">
        {active.ready ? (
          <span className="flex items-center gap-2 text-pass">
            <KeyCap state="current">⏎</KeyCap> entregar a demanda
          </span>
        ) : (
          active.segments.map((seg, i) => <Cue key={i} seg={seg} />)
        )}
      </div>
    </div>
  );
}
