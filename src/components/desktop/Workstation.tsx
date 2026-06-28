/**
 * Aterra a tela do jogo num monitor sobre uma mesa. Versão simples e quase
 * estática (base para futura customização / janela com sol pelo horário).
 * O brilho ambiente atrás do monitor muda sutilmente com o relógio do jogo.
 */
function ambientFor(clock: string): string {
  const hour = Number(clock.slice(0, 2)) || 9;
  if (hour < 11) return '#3b5b8c'; // manhã, luz fria
  if (hour < 14) return '#5a5f7a'; // meio do dia, neutro
  if (hour < 16) return '#8a6a3b'; // tarde, âmbar
  return '#9a4a39'; // fim do dia, alaranjado
}

export function Workstation({ clock, children }: { clock: string; children: React.ReactNode }) {
  const ambient = ambientFor(clock);
  return (
    <div className="relative flex h-dvh w-full items-center justify-center overflow-hidden bg-[#0a0b10]">
      {/* parede + brilho de horário (atrás do monitor) */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `radial-gradient(60% 45% at 50% 38%, color-mix(in srgb, ${ambient} 38%, transparent), transparent 70%), linear-gradient(180deg, #0c0d14, #07080c)`,
          transition: 'background 1.2s ease',
        }}
      />
      {/* mesa */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[16%]"
        style={{
          background: 'linear-gradient(180deg, #211a14, #16110d)',
          boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.04)',
        }}
      />

      {/* conjunto monitor + suporte */}
      <div className="relative z-10 flex flex-col items-center" style={{ marginBottom: '4%' }}>
        {/* moldura (bezel) */}
        <div className="relative rounded-[18px] border border-white/5 bg-[#0b0c11] p-2.5 shadow-2xl shadow-black/70">
          {/* webcam */}
          <div className="absolute left-1/2 top-1 size-1.5 -translate-x-1/2 rounded-full bg-white/20" />
          {/* tela */}
          <div
            className="relative overflow-hidden rounded-[10px] border border-black/60"
            style={{ width: 'min(1100px, 94vw)', height: 'min(76vh, 720px)' }}
          >
            {children}
            {/* leve reflexo de tela */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'linear-gradient(115deg, rgba(255,255,255,0.05), transparent 22%, transparent 80%, rgba(255,255,255,0.02))',
              }}
            />
          </div>
          {/* LED de energia */}
          <div className="absolute bottom-1 right-2 size-1 rounded-full bg-pass/70 shadow-[0_0_6px] shadow-pass/60" />
          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-bold tracking-[0.3em] text-white/15">
            devOS
          </span>
        </div>
        {/* suporte */}
        <div
          className="h-6 w-24 bg-gradient-to-b from-[#1a1c24] to-[#101218]"
          style={{ clipPath: 'polygon(38% 0, 62% 0, 72% 100%, 28% 100%)' }}
        />
        <div className="h-1.5 w-44 rounded-b-md rounded-t-sm bg-[#15171f] shadow-lg shadow-black/50" />
      </div>
    </div>
  );
}
