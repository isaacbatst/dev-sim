/** Primitivas compartilhadas entre as cenas dos apps. */

export type KeyState = 'idle' | 'current' | 'done' | 'wrong';

export function KeyCap({
  children,
  state = 'idle',
  small = false,
}: {
  children: React.ReactNode;
  state?: KeyState;
  small?: boolean;
}) {
  const mod =
    state === 'current'
      ? 'keycap--current'
      : state === 'done'
        ? 'keycap--done'
        : state === 'wrong'
          ? 'keycap--wrong'
          : '';
  return <kbd className={`keycap ${mod} ${small ? '!h-6 !min-w-6 !text-xs' : ''}`}>{children}</kbd>;
}

export function Meter({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-black/40">
      <div
        className="h-full rounded-full transition-[width] duration-100"
        style={{ width: `${Math.round(value * 100)}%`, background: color }}
      />
    </div>
  );
}

export const ARROW_GLYPH: Record<string, string> = {
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
};

/** Glyph para uma tecla bruta (ex.: 'arrowleft' → '←'); fallback = a própria tecla. */
export const KEY_GLYPH: Record<string, string> = {
  arrowup: '↑',
  arrowdown: '↓',
  arrowleft: '←',
  arrowright: '→',
};
