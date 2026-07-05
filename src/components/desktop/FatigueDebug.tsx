'use client';

import type { Snapshot } from '@/core/snapshot';
import { useGameStore } from '@/store/gameStore';

/**
 * Overlay de DEBUG da fadiga (`?debug=1`): estado, chances ativas, contadores,
 * slots esquecidos e o log de lapsos. Botões pra injetar fadiga / restaurar.
 * Ferramenta de dev — não é UI de jogo (a fadiga é diegética, sem medidor).
 */

// Limiares (espelho do core) — as CHANCES vêm do snapshot (fatigue.rates).
const INFO = { tiredAt: 150, exhaustedAt: 210 };
const pct = (p: number) => `${(p * 100).toFixed(1)}%`;

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
        / {fmtMin(INFO.exhaustedAt)} · x=
        <b className="text-white/80">{f.rates.x.toFixed(2)}</b>
        {resting && <b style={{ color: '#4ec9b0' }}> · EM PAUSA</b>}
      </div>
      {/* barra (só no debug — no jogo é diegético; escala aberta, sem teto) */}
      <div className="my-1 h-1 overflow-hidden rounded bg-white/10">
        <div
          className="h-full"
          style={{
            width: `${Math.min(100, (f.min / 420) * 100)}%`,
            background: STAGE_COLOR[f.stage],
          }}
        />
      </div>
      <div className="text-white/50">
        {f.rates.x <= 0 ? (
          'chances agora: nenhuma'
        ) : (
          <>
            piscada {pct(f.rates.blinkPMin)}/min · emperrar {pct(f.rates.stuckPKey)}/tecla (cd{' '}
            {f.rates.stuckCooldown.toFixed(0)}min)
            {f.rates.forgetPMin > 0 && (
              <>
                {' '}
                · bocejo {pct(f.rates.yawnPMin)}/min · esquecer {pct(f.rates.forgetPMin)}/min por{' '}
                {f.rates.forgetDuration.toFixed(0)}min (cd {f.rates.forgetCooldown.toFixed(0)}min,
                até {f.rates.maxForgotten} juntos)
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
