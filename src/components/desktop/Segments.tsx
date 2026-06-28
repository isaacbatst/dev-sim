import type { SegmentView } from '@/core/snapshot';

const ARROW_GLYPH: Record<string, string> = { up: '↑', down: '↓', left: '←', right: '→' };

type KeyState = 'idle' | 'current' | 'done' | 'wrong';

function Keycap({ children, state }: { children: React.ReactNode; state: KeyState }) {
  const mod =
    state === 'current'
      ? 'keycap--current'
      : state === 'done'
        ? 'keycap--done'
        : state === 'wrong'
          ? 'keycap--wrong'
          : '';
  return <kbd className={`keycap ${mod}`}>{children}</kbd>;
}

function Meter({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-2 w-56 overflow-hidden rounded-full bg-surface-2">
      <div
        className="h-full rounded-full transition-[width] duration-100"
        style={{ width: `${value * 100}%`, background: color }}
      />
    </div>
  );
}

function Segment({ seg }: { seg: SegmentView }) {
  switch (seg.type) {
    case 'press':
      return (
        <div className="flex flex-wrap items-center gap-4">
          {seg.tokens.map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <Keycap state={t.done ? 'done' : t.current ? 'current' : 'idle'}>{t.key}</Keycap>
              <span className={`text-sm ${t.done ? 'text-ink-dim line-through' : 'text-ink'}`}>
                {t.label}
              </span>
            </div>
          ))}
        </div>
      );
    case 'hold':
      return (
        <div className="flex items-center gap-4">
          <Keycap state={seg.holding ? 'current' : 'idle'}>{seg.key}</Keycap>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm text-ink">
              Segure — {seg.label} <span className="text-ink-dim">({seg.targetSec}s)</span>
            </span>
            <Meter value={seg.progress} color="var(--amber)" />
          </div>
        </div>
      );
    case 'nav':
      return (
        <div className="flex items-center gap-4">
          <Keycap state="current">{ARROW_GLYPH[seg.direction] ?? seg.symbol}</Keycap>
          <span className="font-mono text-lg text-ink">
            {seg.symbol} <span className="text-amber">{seg.count}</span>
            <span className="text-ink-dim">/{seg.target}</span>
          </span>
        </div>
      );
    case 'selection':
      return (
        <div className="flex flex-col gap-3">
          <span className="text-sm text-ink-dim">
            Selecione <span className="font-semibold text-amber">{seg.prompt}</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {seg.options.map((o) => (
              <div key={o.key} className="flex items-center gap-2">
                <Keycap state={seg.chosenKey === o.key ? (seg.wrong ? 'wrong' : 'done') : 'idle'}>
                  {o.key}
                </Keycap>
                <span className="text-sm text-ink-dim">{o.label}</span>
              </div>
            ))}
          </div>
        </div>
      );
    case 'wait':
      return (
        <div className="flex items-center gap-4">
          <span className="text-2xl">⏳</span>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm text-ink">
              Aguardando code review… <span className="text-teal">{Math.ceil(seg.remaining)}s</span>
            </span>
            <span className="text-xs text-ink-dim">trabalhe em outra demanda enquanto isso</span>
            <Meter value={seg.progress} color="var(--teal)" />
          </div>
        </div>
      );
  }
}

export function Segments({ segments }: { segments: SegmentView[] }) {
  return (
    <div className="flex flex-col gap-6">
      {segments.map((seg, i) => (
        <Segment key={i} seg={seg} />
      ))}
    </div>
  );
}
