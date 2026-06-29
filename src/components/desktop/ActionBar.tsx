import type { ActiveTicketSnapshot, SegmentView } from '@/core/snapshot';
import { LAUNCH_KEY } from '@/core/domain/apps';
import { APPS, DOCK_APPS } from './apps';
import { KeyCap, Meter, ARROW_GLYPH, KEY_GLYPH } from './primitives';

/**
 * Passo de abrir: mostra TODOS os programas que dá pra abrir (com a tecla de
 * cada um), não só o certo — assim o jogador vê que pode abrir o errado (e que
 * teria de fechar com X). Qual abrir vem do ticket, não daqui.
 */
function OpenPicker() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {DOCK_APPS.map((id) => (
        <span key={id} className="flex items-center gap-1.5">
          <KeyCap state="idle">{LAUNCH_KEY[id]}</KeyCap>
          <span className="text-sm text-ink-dim">{APPS[id].name}</span>
        </span>
      ))}
    </div>
  );
}

/**
 * Lugar ÚNICO e consistente da hint de input, no rodapé de toda janela.
 * As cenas cuidam do ambiente/destaque; aqui mora sempre "o que apertar agora".
 */
function Cue({ seg }: { seg: SegmentView }) {
  switch (seg.type) {
    case 'press': {
      // Passo com alternativas (ex.: escolher o site): mostra TODAS as opções,
      // neutras — qual abrir vem do ticket (igual ao seletor de programas).
      if (seg.distractors.length > 0) {
        const opts = [
          ...seg.tokens.map((t) => ({ key: t.key, label: t.label, done: t.done })),
          ...seg.distractors.map((d) => ({ key: d.key, label: d.label, done: false })),
        ].sort((a, b) => a.key.localeCompare(b.key));
        return (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {opts.map((o) => (
              <span key={o.key} className="flex items-center gap-1.5">
                <KeyCap state={o.done ? 'done' : 'idle'}>{o.key}</KeyCap>
                <span className={`text-sm text-ink-dim ${o.done ? 'line-through' : ''}`}>
                  {o.label.replace(/^Abrir /, '')}
                </span>
              </span>
            ))}
          </div>
        );
      }
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
    }
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
    case 'mash':
      return (
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            {seg.keys.map((k) => (
              <KeyCap key={k} state={k === seg.expectKey ? 'current' : 'idle'}>
                {KEY_GLYPH[k] ?? k}
              </KeyCap>
            ))}
          </span>
          <span className="text-sm text-ink">
            {seg.label}
            {seg.groups > 1 && (
              <span className="ml-1.5 text-ink-dim">
                {Math.min(seg.activeGroup + 1, seg.groups)}/{seg.groups}
              </span>
            )}
          </span>
          {/* Meter é do CONFLITO ATUAL (não do total) — expõe o progresso daquele. */}
          <span className="w-32">
            <Meter value={seg.groupProgress} color="var(--amber)" />
          </span>
        </div>
      );
    case 'nav': {
      const onTarget = seg.cursor === seg.target;
      return (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="flex items-center gap-1.5">
            <KeyCap state="idle">{ARROW_GLYPH[seg.direction] ?? seg.symbol}</KeyCap>
            <KeyCap state="idle">
              {seg.direction === 'up' ? '↓' : seg.direction === 'down' ? '↑' : '↔'}
            </KeyCap>
            <span className="text-sm text-ink-dim">mover</span>
          </span>
          <span className="flex items-center gap-1.5">
            <KeyCap state={onTarget ? 'current' : 'idle'}>Enter</KeyCap>
            <span className="text-sm text-ink-dim">confirmar</span>
          </span>
        </div>
      );
    }
    case 'selection':
      return (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {seg.options.map((o) => (
            <span key={o.key} className="flex items-center gap-1.5">
              <KeyCap state={seg.chosenKey === o.key ? (seg.wrong ? 'wrong' : 'done') : 'idle'}>
                {o.key}
              </KeyCap>
              <span className="text-sm text-ink-dim">{o.label}</span>
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
    case 'file':
      return seg.searching ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {/* A query aparece no overlay do Quick Open; aqui só as ações. */}
          <span className="flex items-center gap-1.5">
            <KeyCap state="current">Enter</KeyCap>
            <span className="text-sm text-ink-dim">abrir</span>
          </span>
          <span className="flex items-center gap-1.5">
            <KeyCap state="idle">Ctrl+P</KeyCap>
            <span className="text-sm text-ink-dim">fechar</span>
          </span>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="flex items-center gap-1.5">
            <KeyCap state="idle">↑</KeyCap>
            <KeyCap state="idle">↓</KeyCap>
            <span className="text-sm text-ink-dim">navegar</span>
          </span>
          <span className="flex items-center gap-1.5">
            <KeyCap state="idle">Enter</KeyCap>
            <span className="text-sm text-ink-dim">abrir / expandir</span>
          </span>
          <span className="flex items-center gap-1.5">
            <KeyCap state="idle">Ctrl+P</KeyCap>
            <span className="text-sm text-ink-dim">buscar</span>
          </span>
        </div>
      );
  }
}

export function ActionBar({ active }: { active: ActiveTicketSnapshot }) {
  const app = APPS[active.app];
  // Ação de trabalho exige o programa aberto E em foco; "abrir" funciona de qualquer aba.
  const needFocus = !active.ready && active.appLaunched && active.focused !== active.app;
  const wrong = active.wrongApp ? APPS[active.wrongApp] : null;
  const opening = !active.ready && !active.appLaunched && !wrong;
  return (
    <div
      className="flex min-h-16 items-center gap-3 border-t border-line bg-surface-2 px-4 py-3"
      // Toolbar elevada (estilo macOS): fill sólido + realce de 1px no topo →
      // ganha peso e separa da janela sem borda colorida/glow.
      style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}
    >
      <div className="flex-1">
        {wrong ? (
          <span className="flex items-center gap-2 text-ink-dim">
            <KeyCap state="current">x</KeyCap> nada a fazer aqui — feche o {wrong.name}
          </span>
        ) : opening ? (
          <OpenPicker />
        ) : active.ready ? (
          <span className="flex items-center gap-2 text-pass">
            <KeyCap state="current">Enter</KeyCap> concluir a demanda
          </span>
        ) : needFocus ? (
          <span className="flex items-center gap-2 text-amber">
            <KeyCap state="current">Tab</KeyCap> foque o {app.name} para continuar
          </span>
        ) : (
          active.segments.map((seg, i) => <Cue key={i} seg={seg} />)
        )}
      </div>
    </div>
  );
}
