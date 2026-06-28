/**
 * Aterra a tela do jogo num monitor sobre uma mesa, num ambiente com luz,
 * profundidade e sombras. Versão simples e quase estática (base para futura
 * customização / janela com sol pelo horário).
 *
 * Composição (fundo → frente): parede + luz da tela → mesa → monitor (sombra
 * projetada + contato) → periféricos (teclado/mouse/caneca) → vinheta.
 * Tudo ancorado na "emenda" parede/mesa (~62%) para proporção coerente.
 */
const HORIZON = 80; // % da altura: emenda parede/mesa. Monitor domina; mesa é faixa fina.

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
          bottom: `${100 - HORIZON - 12}%`,
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
          {/* moldura */}
          <div
            className="relative rounded-[20px] p-3"
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
              style={{ width: 'min(1100px, 93vw)', height: 'min(68vh, 680px)' }}
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
            <div className="absolute bottom-[5px] right-3 size-1 rounded-full bg-emerald-400 shadow-[0_0_6px_1px] shadow-emerald-400/70" />
            <span className="absolute bottom-[3px] left-1/2 -translate-x-1/2 text-[9px] font-bold tracking-[0.35em] text-white/20">
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

      {/* PERIFÉRICOS na mesa, logo à frente do monitor */}
      <div
        aria-hidden
        className="absolute left-1/2 -translate-x-1/2"
        style={{ bottom: `${100 - HORIZON - 11}%`, perspective: '800px' }}
      >
        <div
          className="flex items-end gap-5"
          style={{ transform: 'rotateX(58deg)', transformOrigin: 'center bottom' }}
        >
          {/* caneca */}
          <div className="relative mb-1 h-7 w-6 shrink-0">
            <div
              className="absolute inset-0 rounded-b-[10px] rounded-t-[4px]"
              style={{ background: 'linear-gradient(180deg, #2c3140, #171a22)' }}
            />
            <div className="absolute right-[-6px] top-1.5 size-4 rounded-full border-2 border-[#2c3140]" />
            <div className="absolute inset-x-1 top-0 h-1.5 rounded-full bg-[#0c0e14]" />
          </div>

          {/* teclado */}
          <div
            className="relative h-20 w-[min(420px,48vw)] rounded-xl"
            style={{
              background: 'linear-gradient(180deg, #191b24, #0c0e14)',
              boxShadow: '0 30px 36px -12px rgba(0,0,0,0.75), 0 1px 0 rgba(255,255,255,0.05) inset',
              backgroundImage:
                'repeating-linear-gradient(90deg, rgba(255,255,255,0.035) 0 4.5%, transparent 4.5% 6.5%), repeating-linear-gradient(0deg, rgba(255,255,255,0.035) 0 24%, transparent 24% 32%)',
            }}
          >
            <div className="absolute bottom-3 left-1/2 h-3 w-2/5 -translate-x-1/2 rounded-sm bg-white/[0.03]" />
          </div>

          {/* mouse */}
          <div
            className="mb-2 h-11 w-7 shrink-0 rounded-[45%]"
            style={{
              background: 'linear-gradient(180deg, #1c1f29, #0d0f15)',
              boxShadow: '0 16px 18px -8px rgba(0,0,0,0.7)',
            }}
          >
            <div className="mx-auto mt-1.5 h-4 w-px bg-white/10" />
          </div>
        </div>
      </div>

      {/* vinheta do ambiente */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: 'inset 0 0 220px 70px rgba(0,0,0,0.55)' }}
      />
    </div>
  );
}
