/**
 * Aterra a tela do jogo num monitor sobre uma mesa, num ambiente com luz,
 * profundidade e sombras. Versão simples e quase estática (base para futura
 * customização / janela com sol pelo horário).
 *
 * Camadas (fundo → frente): parede + brilho da tela → mesa → monitor (com
 * sombra projetada e contato) → teclado em primeiro plano → vinheta do ambiente.
 */
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
        className="absolute inset-x-0 top-0 h-[68%]"
        style={{ background: 'linear-gradient(180deg, #161922 0%, #0d0f16 70%, #0a0c12 100%)' }}
      />
      {/* luz da tela espalhada na parede (o monitor ilumina o ambiente) */}
      <div
        aria-hidden
        className="absolute left-1/2 top-[12%] h-[60%] w-[80%] -translate-x-1/2 blur-3xl"
        style={{
          background: `radial-gradient(50% 50% at 50% 50%, color-mix(in srgb, ${ambient} 55%, transparent), transparent 72%)`,
          transition: 'background 1.5s ease',
        }}
      />

      {/* MESA */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[34%]"
        style={{
          background: 'linear-gradient(180deg, #3a2c1f 0%, #2a1f15 30%, #18110b 100%)',
        }}
      />
      {/* veios sutis + emenda parede/mesa iluminada */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-[34%] h-px"
        style={{
          background: `linear-gradient(90deg, transparent, color-mix(in srgb, ${ambient} 50%, #6b533a), transparent)`,
        }}
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[34%] opacity-[0.05]"
        style={{
          backgroundImage: 'repeating-linear-gradient(90deg, #000 0 2px, transparent 2px 26px)',
        }}
      />
      {/* luz da tela poçando na mesa, logo à frente do monitor */}
      <div
        aria-hidden
        className="absolute bottom-[12%] left-1/2 h-[24%] w-[60%] -translate-x-1/2 blur-2xl"
        style={{
          background: `radial-gradient(50% 50% at 50% 30%, color-mix(in srgb, ${ambient} 30%, transparent), transparent 70%)`,
          transition: 'background 1.5s ease',
        }}
      />

      {/* MONITOR (base assenta na emenda ~66%) */}
      <div className="absolute inset-x-0 bottom-[30%] top-0 flex items-end justify-center">
        <div className="relative flex flex-col items-center">
          {/* moldura */}
          <div
            className="relative rounded-[20px] p-3"
            style={{
              background: 'linear-gradient(155deg, #3a3e49 0%, #1c1f27 45%, #0e1014 100%)',
              boxShadow: [
                '0 1px 0 rgba(255,255,255,0.10) inset', // brilho borda superior
                '0 40px 70px -24px rgba(0,0,0,0.85)', // sombra projetada na parede/mesa
                '0 10px 24px rgba(0,0,0,0.55)',
                `0 0 90px -10px color-mix(in srgb, ${ambient} 45%, transparent)`, // emissão da tela
              ].join(','),
            }}
          >
            {/* webcam */}
            <div className="absolute left-1/2 top-[5px] size-1.5 -translate-x-1/2 rounded-full bg-black ring-1 ring-white/15">
              <div className="absolute inset-[3px] rounded-full bg-sky-300/30" />
            </div>
            {/* tela */}
            <div
              className="relative overflow-hidden rounded-[10px] ring-1 ring-black/70"
              style={{ width: 'min(980px, 90vw)', height: 'min(62vh, 600px)' }}
            >
              {children}
              {/* reflexo diagonal sutil no vidro */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'linear-gradient(118deg, rgba(255,255,255,0.06) 0%, transparent 18%, transparent 82%, rgba(255,255,255,0.025) 100%)',
                }}
              />
            </div>
            {/* LED + marca */}
            <div className="absolute bottom-[5px] right-3 size-1 rounded-full bg-emerald-400 shadow-[0_0_6px_1px] shadow-emerald-400/70" />
            <span className="absolute bottom-[3px] left-1/2 -translate-x-1/2 text-[9px] font-bold tracking-[0.35em] text-white/20">
              devOS
            </span>
          </div>

          {/* pescoço do suporte */}
          <div
            className="h-7 w-16"
            style={{
              background: 'linear-gradient(180deg, #30343f, #15171d)',
              clipPath: 'polygon(42% 0, 58% 0, 70% 100%, 30% 100%)',
            }}
          />
          {/* base do suporte */}
          <div
            className="h-2 w-40 rounded-[3px]"
            style={{ background: 'linear-gradient(180deg, #2b2e38, #0f1116)' }}
          />
          {/* sombra de contato na mesa */}
          <div
            aria-hidden
            className="absolute -bottom-3 left-1/2 h-5 w-56 -translate-x-1/2 rounded-[50%] blur-md"
            style={{ background: 'rgba(0,0,0,0.6)' }}
          />
        </div>
      </div>

      {/* TECLADO em primeiro plano (deitado na mesa) */}
      <div
        aria-hidden
        className="absolute bottom-[6%] left-1/2 -translate-x-1/2"
        style={{ perspective: '700px' }}
      >
        <div
          className="h-24 w-[min(520px,60vw)] rounded-xl"
          style={{
            transform: 'rotateX(58deg)',
            transformOrigin: 'center bottom',
            background: 'linear-gradient(180deg, #181a22, #0c0e14)',
            boxShadow: '0 30px 36px -12px rgba(0,0,0,0.75), 0 1px 0 rgba(255,255,255,0.04) inset',
            backgroundImage:
              'repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0 4%, transparent 4% 6%), repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0 22%, transparent 22% 30%)',
          }}
        >
          <div className="absolute bottom-3 left-1/2 h-3 w-2/5 -translate-x-1/2 rounded-sm bg-white/[0.03]" />
        </div>
      </div>

      {/* vinheta do ambiente */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: 'inset 0 0 200px 60px rgba(0,0,0,0.55)' }}
      />
    </div>
  );
}
