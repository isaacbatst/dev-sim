'use client';

import type { Snapshot } from '@/core/snapshot';
import { useGameStore } from '@/store/gameStore';

/**
 * Overlay de DEBUG da fadiga (`?debug=1`): estado, chances ativas, contadores,
 * slots esquecidos e o log de lapsos. Botões pra injetar fadiga / restaurar.
 * Ferramenta de dev — não é UI de jogo (a fadiga é diegética, sem medidor).
 */

// Espelho das constantes do core (src/core/game.ts) — só pra exibir.
const INFO = {
  tiredAt: 150,
  exhaustedAt: 210,
  blinkP: { tired: '2.5%/min', exhausted: '6.3%/min' },
  yawnPExh: '2.2%/min',
  forgetPExh: '4%/min (1 por vez, cooldown 20min)',
  stuckP: { tired: '5%/tecla', exhausted: '12%/tecla (cooldown 15min)' },
};

function fmtMin(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.floor(min % 60);
  return `${h}h${String(m).padStart(2, '0')}`;
}

const STAGE_COLOR: Record<string, string> = {
  fresh: '#5fd07a',
  tired: '#f5a623',
  exhausted: '#ff5c57',
};

export function FatigueDebug({ snapshot, resting }: { snapshot: Snapshot; resting: boolean }) {
  const debugFatigue = useGameStore((s) => s.debugFatigue);
  const restoreFatigue = useGameStore((s) => s.restoreFatigue);
  const f = snapshot.fatigue;
  const forgotten = snapshot.slots.filter((s) => s?.forgotten);

  return (
    <div
      className="pointer-events-auto fixed right-2 top-2 z-50 w-72 rounded-lg p-3 font-mono text-[10px] leading-relaxed"
      style={{ background: 'rgba(5,7,12,0.88)', color: '#aab', border: '1px solid #2b3140' }}
    >
      <div className="mb-1 flex items-center justify-between">
        <span className="font-bold text-white/80">FADIGA (debug)</span>
        <span style={{ color: STAGE_COLOR[f.stage] }} className="font-bold uppercase">
          {f.stage}
        </span>
      </div>
      <div>
        trabalhado: <b className="text-white/80">{fmtMin(f.min)}</b> · limiar {fmtMin(INFO.tiredAt)}{' '}
        / {fmtMin(INFO.exhaustedAt)}
        {resting && <b style={{ color: '#4ec9b0' }}> · EM PAUSA</b>}
      </div>
      {/* barra (só no debug — no jogo é diegético) */}
      <div className="my-1 h-1 overflow-hidden rounded bg-white/10">
        <div
          className="h-full"
          style={{
            width: `${Math.min(100, (f.min / 280) * 100)}%`,
            background: STAGE_COLOR[f.stage],
          }}
        />
      </div>
      <div className="text-white/50">
        chances agora:{' '}
        {f.stage === 'fresh' ? (
          'nenhuma'
        ) : (
          <>
            piscada {INFO.blinkP[f.stage]} · emperrar {INFO.stuckP[f.stage]}
            {f.stage === 'exhausted' && (
              <>
                {' '}
                · bocejo {INFO.yawnPExh} · esquecer {INFO.forgetPExh}
              </>
            )}
          </>
        )}
      </div>
      <div className="mt-1">
        piscadas <b className="text-white/80">{f.blinkN}</b> · bocejos{' '}
        <b className="text-white/80">{f.yawnN}</b> · emperradas{' '}
        <b className="text-white/80">{f.stuckN}</b>
        {forgotten.length > 0 && (
          <span style={{ color: '#ff5c57' }}>
            {' '}
            · esquecido: {forgotten.map((s) => `DEV-${s!.id}`).join(', ')}
          </span>
        )}
      </div>
      {f.log.length > 0 && (
        <div className="mt-1.5 border-t border-white/10 pt-1 text-white/45">
          {f.log
            .slice(-6)
            .reverse()
            .map((l, i) => (
              <div key={i}>{l}</div>
            ))}
        </div>
      )}
      <div className="mt-2 flex gap-1.5">
        <button
          onClick={() => debugFatigue(60)}
          className="rounded bg-white/10 px-2 py-0.5 hover:bg-white/20"
        >
          +1h
        </button>
        <button
          onClick={() => debugFatigue(155 - f.min)}
          className="rounded bg-white/10 px-2 py-0.5 hover:bg-white/20"
        >
          →cansado
        </button>
        <button
          onClick={() => debugFatigue(215 - f.min)}
          className="rounded bg-white/10 px-2 py-0.5 hover:bg-white/20"
        >
          →exausto
        </button>
        <button
          onClick={() => restoreFatigue()}
          className="rounded bg-white/10 px-2 py-0.5 hover:bg-white/20"
        >
          zerar
        </button>
      </div>
    </div>
  );
}
