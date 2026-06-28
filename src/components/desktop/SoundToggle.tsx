'use client';

import { useState } from 'react';
import { setMuted } from '@/store/sound';

/** Liga/desliga o feedback sonoro do devOS. Estado local — o som é global. */
export function SoundToggle() {
  const [on, setOn] = useState(true);

  return (
    <button
      onClick={() => {
        const next = !on;
        setOn(next);
        setMuted(!next);
      }}
      aria-label={on ? 'Desativar som' : 'Ativar som'}
      aria-pressed={on}
      className="flex size-6 items-center justify-center rounded text-ink-dim transition-colors hover:bg-white/[0.06] hover:text-ink"
      title={on ? 'Som ligado' : 'Som desligado'}
    >
      <svg
        viewBox="0 0 16 16"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      >
        <path
          d="M3 6h2.5L9 3v10L5.5 10H3V6Z"
          fill="currentColor"
          stroke="currentColor"
          strokeLinejoin="round"
        />
        {on ? (
          <>
            <path d="M11 6c.8.7.8 3.3 0 4" strokeLinecap="round" />
            <path d="M12.6 4.5c1.6 1.4 1.6 5.6 0 7" strokeLinecap="round" />
          </>
        ) : (
          <path d="M11.5 6.5 14.5 9.5M14.5 6.5 11.5 9.5" strokeLinecap="round" />
        )}
      </svg>
    </button>
  );
}
