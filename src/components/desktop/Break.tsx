/**
 * PAUSA (Esc): a visão desce do monitor pra MESA — 1ª pessoa, diegético. O
 * expediente NÃO para (o relógio segue correndo, visível): pausar custa tempo,
 * é uma decisão. As atividades (regar/tecladinho/café) vão viver aqui; por ora
 * é a casca — a mesa com o que você possui, e Esc pra voltar.
 */
export function Break({
  clock,
  owned,
  onResume,
}: {
  clock: string;
  owned: string[];
  onResume: () => void;
}) {
  const has = (id: string) => owned.includes(id);

  return (
    <div className="animate-breakin absolute inset-0 z-40 flex flex-col overflow-hidden">
      {/* a mesa em close (você olhou pra baixo) */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, #453423 0%, #2a1f15 55%, #140d08 100%)' }}
      />
      {/* veios da madeira */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: 'repeating-linear-gradient(90deg, #000 0 2px, transparent 2px 34px)',
        }}
      />
      {/* luz do monitor vindo de cima (a tela ficou lá em cima) */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-1/3 blur-3xl"
        style={{
          background: 'radial-gradient(60% 90% at 50% 0%, rgba(90,120,190,0.28), transparent 70%)',
        }}
      />

      {/* relógio: o dia continua correndo — o custo da pausa é visível */}
      <div className="relative mt-14 flex flex-col items-center gap-1">
        <span className="font-mono text-6xl font-bold tabular-nums text-white/85">{clock}</span>
        <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-white/40">
          o expediente continua
        </span>
      </div>

      {/* os itens da SUA mesa (os comprados aparecem) */}
      <div
        className="relative flex flex-1 items-center justify-center"
        style={{ perspective: '900px' }}
      >
        <div
          className="flex items-end gap-14"
          style={{ transform: 'rotateX(28deg)', transformOrigin: 'center 70%' }}
        >
          {/* planta (se comprou) */}
          {has('planta') && (
            <div className="relative h-32 w-24 shrink-0">
              {[-16, -5, 6, 17].map((x, i) => (
                <span
                  key={i}
                  className="absolute bottom-10"
                  style={{
                    left: 44 + x,
                    width: 13,
                    height: 52 + (i % 2) * 20,
                    borderRadius: '50% 50% 50% 50% / 70% 70% 30% 30%',
                    background: `color-mix(in oklab, #4ec07a ${72 - i * 8}%, #1c3a24)`,
                    transform: `rotate(${x * 1.6}deg)`,
                    transformOrigin: 'bottom center',
                  }}
                />
              ))}
              <div
                className="absolute inset-x-3 bottom-0 h-11 rounded-b-[8px] rounded-t-[3px]"
                style={{ background: 'linear-gradient(180deg, #b5622f, #7d3f1c)' }}
              />
            </div>
          )}

          {/* caneca (+ vapor se comprou o café) */}
          <div className="relative mb-2 h-20 w-16 shrink-0">
            {has('cafe') && (
              <div className="absolute -top-9 left-1/2 -translate-x-1/2">
                {[-7, 0, 7].map((x, i) => (
                  <span
                    key={i}
                    className="animate-edgepulse absolute bottom-0 w-1 rounded-full bg-white/25"
                    style={{ left: x, height: 28, animationDelay: `${i * 220}ms` }}
                  />
                ))}
              </div>
            )}
            <div
              className="absolute inset-0 rounded-b-[22px] rounded-t-[8px]"
              style={{ background: 'linear-gradient(180deg, #2c3140, #171a22)' }}
            />
            <div className="absolute right-[-16px] top-4 size-10 rounded-full border-4 border-[#2c3140]" />
            <div className="absolute inset-x-2 top-0 h-3.5 rounded-full bg-[#0c0e14]" />
          </div>

          {/* teclado (glow se comprou o mecânico) */}
          <div
            className="relative h-36 w-[min(560px,52vw)] rounded-2xl"
            style={{
              background: 'linear-gradient(180deg, #191b24, #0c0e14)',
              boxShadow: has('teclado')
                ? '0 40px 50px -16px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.06) inset, 0 -3px 34px -6px rgba(120,160,255,0.5)'
                : '0 40px 50px -16px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.06) inset',
              backgroundImage: has('teclado')
                ? 'repeating-linear-gradient(90deg, rgba(140,120,255,0.22) 0 4.5%, transparent 4.5% 6.5%), repeating-linear-gradient(0deg, rgba(90,200,255,0.18) 0 24%, transparent 24% 32%)'
                : 'repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0 4.5%, transparent 4.5% 6.5%), repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0 24%, transparent 24% 32%)',
            }}
          >
            <div className="absolute bottom-5 left-1/2 h-5 w-2/5 -translate-x-1/2 rounded-md bg-white/[0.04]" />
          </div>

          {/* mouse */}
          <div
            className="mb-3 h-16 w-11 shrink-0 rounded-[45%]"
            style={{
              background: 'linear-gradient(180deg, #1c1f29, #0d0f15)',
              boxShadow: '0 22px 26px -10px rgba(0,0,0,0.75)',
            }}
          >
            <div className="mx-auto mt-2.5 h-6 w-px bg-white/10" />
          </div>
        </div>
      </div>

      {/* voltar */}
      <div className="relative mb-10 flex justify-center">
        <button
          onClick={onResume}
          className="flex items-center gap-2 font-mono text-sm text-white/50 transition-colors hover:text-white/80"
        >
          <kbd className="keycap !h-6 !min-w-9 !text-[11px]">Esc</kbd>
          voltar ao trabalho
        </button>
      </div>

      {/* vinheta */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: 'inset 0 0 220px 70px rgba(0,0,0,0.5)' }}
      />
    </div>
  );
}
