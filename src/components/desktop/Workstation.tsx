/**
 * Aterra a tela do jogo num monitor sobre uma mesa, num ambiente com luz,
 * profundidade e sombras. Versão simples e quase estática (base para futura
 * customização / janela com sol pelo horário).
 *
 * Composição (fundo → frente): parede + luz da tela → mesa → monitor (sombra
 * projetada + contato) → periféricos (teclado/mouse/caneca) → vinheta.
 * Tudo ancorado na "emenda" parede/mesa (~62%) para proporção coerente.
 */
const HORIZON = 90; // % da altura: emenda parede/mesa. Monitor domina; mesa é faixa fina.

function ambientFor(clock: string): string {
  const hour = Number(clock.slice(0, 2)) || 9;
  if (hour < 11) return '#4a76c4'; // manhã, luz fria
  if (hour < 14) return '#6b6f96'; // meio do dia, neutro
  if (hour < 16) return '#b9853f'; // tarde, âmbar
  return '#c25733'; // fim do dia, alaranjado
}

export function Workstation({ clock, children }: { clock: string; children: React.ReactNode }) {
  const ambient = ambientFor(clock);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#06070b]">
      {/* PAREDE */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0"
        style={{
          height: `${HORIZON}%`,
          background: 'linear-gradient(180deg, #171a24 0%, #0e1017 75%, #0b0d13 100%)',
        }}
      />
      {/* luz da tela espalhada na parede */}
      <div
        aria-hidden
        className="absolute left-1/2 top-[8%] h-[58%] w-[78%] -translate-x-1/2 blur-3xl"
        style={{
          background: `radial-gradient(50% 50% at 50% 50%, color-mix(in srgb, ${ambient} 55%, transparent), transparent 72%)`,
          transition: 'background 1.5s ease',
        }}
      />

      {/* MESA */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0"
        style={{
          height: `${100 - HORIZON}%`,
          background: 'linear-gradient(180deg, #3a2c1f 0%, #2a1f15 28%, #160f0a 100%)',
        }}
      />
      {/* emenda iluminada parede/mesa */}
      <div
        aria-hidden
        className="absolute inset-x-0 h-px"
        style={{
          bottom: `${100 - HORIZON}%`,
          background: `linear-gradient(90deg, transparent, color-mix(in srgb, ${ambient} 55%, #7a5e40), transparent)`,
        }}
      />
      {/* veios da mesa */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 opacity-[0.05]"
        style={{
          height: `${100 - HORIZON}%`,
          backgroundImage: 'repeating-linear-gradient(90deg, #000 0 2px, transparent 2px 28px)',
        }}
      />
      {/* luz da tela poçando na mesa */}
      <div
        aria-hidden
        className="absolute left-1/2 h-[26%] w-[58%] -translate-x-1/2 blur-2xl"
        style={{
          bottom: `${Math.max(2, 100 - HORIZON - 12)}%`,
          background: `radial-gradient(50% 50% at 50% 30%, color-mix(in srgb, ${ambient} 28%, transparent), transparent 70%)`,
          transition: 'background 1.5s ease',
        }}
      />

      {/* MONITOR — base assenta exatamente na emenda */}
      <div
        className="absolute inset-x-0 top-0 flex items-end justify-center"
        style={{ height: `${HORIZON}%` }}
      >
        <div className="relative flex flex-col items-center">
          {/* moldura (queixo inferior maior, como monitor real) */}
          <div
            className="relative rounded-[20px] px-3 pb-6 pt-3"
            style={{
              background: 'linear-gradient(155deg, #3c4049 0%, #1d2028 45%, #0e1014 100%)',
              boxShadow: [
                '0 1px 0 rgba(255,255,255,0.10) inset',
                '0 44px 70px -24px rgba(0,0,0,0.85)',
                '0 12px 26px rgba(0,0,0,0.55)',
                `0 0 100px -10px color-mix(in srgb, ${ambient} 45%, transparent)`,
              ].join(','),
            }}
          >
            <div className="absolute left-1/2 top-[5px] size-1.5 -translate-x-1/2 rounded-full bg-black ring-1 ring-white/15">
              <div className="absolute inset-[3px] rounded-full bg-sky-300/30" />
            </div>
            <div
              className="relative overflow-hidden rounded-[10px] ring-1 ring-black/70"
              style={{ width: 'min(1100px, 93vw)', height: 'min(74vh, 740px)' }}
            >
              {children}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'linear-gradient(118deg, rgba(255,255,255,0.06) 0%, transparent 18%, transparent 82%, rgba(255,255,255,0.025) 100%)',
                }}
              />
            </div>
            <div className="absolute bottom-2 right-3 size-1 rounded-full bg-emerald-400 shadow-[0_0_6px_1px] shadow-emerald-400/70" />
            <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[9px] font-bold tracking-[0.35em] text-white/25">
              devOS
            </span>
          </div>

          {/* suporte */}
          <div
            className="h-7 w-16"
            style={{
              background: 'linear-gradient(180deg, #30343f, #15171d)',
              clipPath: 'polygon(42% 0, 58% 0, 70% 100%, 30% 100%)',
            }}
          />
          <div
            className="h-2 w-40 rounded-[3px]"
            style={{ background: 'linear-gradient(180deg, #2b2e38, #0f1116)' }}
          />
          <div
            aria-hidden
            className="absolute -bottom-3 left-1/2 h-5 w-64 -translate-x-1/2 rounded-[50%] blur-md"
            style={{ background: 'rgba(0,0,0,0.6)' }}
          />
        </div>
      </div>

      {/* (Os periféricos/cosméticos vivem na camada de MESA compartilhada com a
          pausa — ver DeskItems em Break.tsx; ficam à frente, na cena maior.) */}

      {/* vinheta do ambiente */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: 'inset 0 0 220px 70px rgba(0,0,0,0.55)' }}
      />
    </div>
  );
}
