import type { BreakState } from './Break';
import { DeskItems } from './Break';
import { PlantArt, useDeskArt } from './deskArt';

/**
 * O QUARTO — modelo MUNDO + CÂMERA (engine-style, em CSS puro). O mundo é uma
 * cena única pintada por inteiro (parede → mesa), MAIOR que qualquer
 * enquadramento; a câmera (GameScreen) é só um transform sobre ele. Nenhum
 * movimento (zoom da pausa, inclinação do pescoço) revela área sem pintura —
 * por construção, não por remendo.
 *
 * Geometria do mundo (dvh): parede 0..HORIZON, mesa HORIZON..WORLD_H. O monitor
 * assenta na emenda (base em HORIZON); os itens da mesa ficam à frente (mais
 * fundo). Enquadramentos da câmera (ver GameScreen):
 *   trabalho → translateY(-25dvh) scale(1)   — mostra [25,125]: 90dvh de parede
 *              + 10dvh de mesa (emenda a 90% do viewport, monitor em 1:1 nítido)
 *   pausa    → translateY(-7.1dvh) scale(0.71) — o quarto inteiro
 */
export const WORLD_H = 150; // dvh
export const HORIZON = 115; // dvh — emenda parede/mesa

function ambientFor(clock: string): string {
  const hour = Number(clock.slice(0, 2)) || 9;
  if (hour < 11) return '#4a76c4'; // manhã, luz fria
  if (hour < 14) return '#6b6f96'; // meio do dia, neutro
  if (hour < 16) return '#b9853f'; // tarde, âmbar
  return '#c25733'; // fim do dia, alaranjado
}

export function Room({
  clock,
  owned,
  brk,
  children,
}: {
  clock: string;
  owned: string[];
  brk: BreakState;
  children: React.ReactNode;
}) {
  const art = useDeskArt();
  const ambient = ambientFor(clock);

  return (
    <div className="relative w-full" style={{ height: `${WORLD_H}dvh` }}>
      {/* sangria além do mundo — o pitch (rotateX ±14°) e o giro revelam bem
          mais cenário que o roll; teto acima, chão abaixo, generosos */}
      <div
        aria-hidden
        className="absolute inset-x-0"
        style={{
          top: '-34dvh',
          height: '34dvh',
          background: 'linear-gradient(180deg, #030408 0%, #0a0c12 55%, #12141d 100%)',
        }}
      />
      <div
        aria-hidden
        className="absolute inset-x-0"
        style={{
          bottom: '-34dvh',
          height: '34dvh',
          background: 'linear-gradient(180deg, #0a0603 0%, #050302 100%)',
        }}
      />

      {/* PAREDE — contínua do topo do mundo até a emenda (um gradiente só) */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0"
        style={{
          height: `${HORIZON}dvh`,
          background: 'linear-gradient(180deg, #12141d 0%, #171a24 28%, #10121a 80%, #0b0d13 100%)',
        }}
      />
      {/* luz da tela espalhada na parede (atrás do monitor) */}
      <div
        aria-hidden
        className="absolute left-1/2 -translate-x-1/2 blur-3xl"
        style={{
          top: '33dvh',
          height: '58dvh',
          width: '78vw',
          background: `radial-gradient(50% 50% at 50% 50%, color-mix(in srgb, ${ambient} 55%, transparent), transparent 72%)`,
          transition: 'background 1.5s ease',
        }}
      />

      {/* MESA — superfície única da emenda até o fundo do mundo */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0"
        style={{
          top: `${HORIZON}dvh`,
          background: 'linear-gradient(180deg, #3a2c1f 0%, #2a1f15 30%, #1d1409 70%, #120b06 100%)',
        }}
      />
      {/* veios da mesa (a superfície toda) */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 opacity-[0.05]"
        style={{
          top: `${HORIZON}dvh`,
          backgroundImage: 'repeating-linear-gradient(90deg, #000 0 2px, transparent 2px 28px)',
        }}
      />
      {/* emenda iluminada parede/mesa */}
      <div
        aria-hidden
        className="absolute inset-x-0 h-px"
        style={{
          top: `${HORIZON}dvh`,
          background: `linear-gradient(90deg, transparent, color-mix(in srgb, ${ambient} 55%, #7a5e40), transparent)`,
        }}
      />
      {/* luz da tela poçando na mesa */}
      <div
        aria-hidden
        className="absolute left-1/2 -translate-x-1/2 blur-2xl"
        style={{
          top: `${HORIZON - 10}dvh`,
          height: '24dvh',
          width: '58vw',
          background: `radial-gradient(50% 50% at 50% 30%, color-mix(in srgb, ${ambient} 28%, transparent), transparent 70%)`,
          transition: 'background 1.5s ease',
        }}
      />

      {/* MONITOR — assenta exatamente na emenda */}
      <div
        className="absolute left-1/2 flex -translate-x-1/2 flex-col items-center"
        style={{ bottom: `${WORLD_H - HORIZON}dvh` }}
      >
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
            // `isolate`: a tela cria o próprio stacking context — o wallpaper do
            // Desktop (-z-10) fica DENTRO do monitor (sem isso ele escapava pra
            // trás da parede do quarto e sumia; visível no tema claro).
            className="isolate relative overflow-hidden rounded-[10px] ring-1 ring-black/70"
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

      {/* PLANTA — na LATERAL do monitor, em pé na mesa (visível o dia todo,
          na altura do monitor; pulsa ao regar). Depois do monitor no DOM →
          pinta na frente da beirada da moldura. */}
      {owned.includes('planta') && brk.mode !== 'planta' && (
        <div
          className="absolute"
          style={{
            bottom: `${WORLD_H - HORIZON}dvh`,
            left: 'calc(50% - min(560px, 47.5vw) - 84px)',
            transform: 'translateX(-70%)',
          }}
        >
          {/* (sem highlight: no modo planta o vaso do canto some — você está
              com ele em close) */}
          <PlantArt variant={art.plant} tier={art.plantTier} size={1.9} pulseKey={brk.leafN} />
        </div>
      )}

      {/* ITENS DA MESA — à frente do monitor. Mais altos que antes: no
          TRABALHO a caneca/teclado aparecem de verdade na beirada (a mesa é
          sua o dia todo), não só a pontinha. */}
      <div className="absolute inset-x-0" style={{ top: `${HORIZON + 2}dvh`, height: '32dvh' }}>
        <DeskItems owned={owned} brk={brk} />
      </div>
    </div>
  );
}
