'use client';

import type { Snapshot } from '@/core/snapshot';
import { useGameStore } from '@/store/gameStore';
import { muffleCutoffHz } from '@/store/sound';
import { screenFx, blurMaxPx } from './fatigueFx';
import { setDeskArt, setPlantTier, useDeskArt, type ArtVariant, type PlantTier } from './deskArt';

/**
 * Overlay de DEBUG da fadiga (`?debug=1`): estado, chances ativas, contadores,
 * slots esquecidos e o log de lapsos. Botões pra injetar fadiga / restaurar.
 * Ferramenta de dev — não é UI de jogo (a fadiga é diegética, sem medidor).
 */

// Limiares (espelho do core) — as CHANCES vêm do snapshot (fatigue.rates).
const INFO = { tiredAt: 150, exhaustedAt: 195 };
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

export function FatigueDebug({
  snapshot,
  resting,
  melodyTitle,
}: {
  snapshot: Snapshot;
  resting: boolean;
  /** A cola atual do tecladinho — revelada aqui pra depurar sem tocar. */
  melodyTitle: string;
}) {
  const debugFatigue = useGameStore((s) => s.debugFatigue);
  const debugLapse = useGameStore((s) => s.debugLapse);
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
            piscada {pct(f.rates.blinkPMin)}/min · desfoque {pct(f.rates.defocusPMin)}/min ·
            emperrar {pct(f.rates.stuckPKey)}/tecla (cd {f.rates.stuckCooldown.toFixed(0)}min)
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
      {/* peso perceptual (D) — os valores REAIS aplicados (fatigueFx/sound) */}
      {f.rates.x > 0 && (
        <div className="text-white/50">
          peso: desfoque até <b className="text-white/80">{blurMaxPx(f.rates.x).toFixed(1)}px</b>{' '}
          (1s+1s reais) · sat{' '}
          <b className="text-white/80">{screenFx(f.rates.x).saturate.toFixed(2)}</b> · lowpass{' '}
          <b className="text-white/80">{(muffleCutoffHz(f.rates.x) / 1000).toFixed(1)}kHz</b>
        </div>
      )}
      <div className="mt-1">
        piscadas <b className="text-white/80">{f.blinkN}</b> · desfoques{' '}
        <b className="text-white/80">{f.defocusN}</b> · bocejos{' '}
        <b className="text-white/80">{f.yawnN}</b> · emperradas{' '}
        <b className="text-white/80">{f.stuckN}</b>
      </div>
      {forgotten.length > 0 && (
        <div style={{ color: '#ff5c57' }}>
          esquecidos:{' '}
          {forgotten.map((s) => `DEV-${s!.id} (volta em ${s!.forgottenRemaining}min)`).join(' · ')}
        </div>
      )}
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
          onClick={() => debugFatigue(200 - f.min)}
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
      {/* dispara os lapsos perceptuais na marra (testar timing/feel) */}
      <div className="mt-1.5 flex gap-1.5">
        <button
          onClick={() => debugLapse('blink')}
          className="rounded bg-white/10 px-2 py-0.5 hover:bg-white/20"
        >
          piscar
        </button>
        <button
          onClick={() => debugLapse('defocus')}
          className="rounded bg-white/10 px-2 py-0.5 hover:bg-white/20"
        >
          desfocar
        </button>
      </div>
      <div className="mt-1.5 border-t border-white/10 pt-1.5 text-white/50">
        cola do tecladinho: <b className="text-white/80">{melodyTitle}</b>
      </div>
      <ArtToggle />
    </div>
  );
}

/** Toggle das versões de arte da mesa (planta/caneca) — avaliação de estilo. */
function ArtToggle() {
  const art = useDeskArt();
  const row = (kind: 'plant' | 'mug', label: string) => (
    <span className="flex items-center gap-1">
      <span className="text-white/50">{label}</span>
      {(['a', 'b', 'c'] as ArtVariant[]).map((v) => (
        <button
          key={v}
          onClick={() => setDeskArt(kind, v)}
          className={`rounded px-1.5 py-0.5 uppercase ${
            art[kind] === v ? 'bg-white/25 text-white' : 'bg-white/10 hover:bg-white/20'
          }`}
        >
          {v}
        </button>
      ))}
    </span>
  );
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-white/10 pt-1.5">
      <span className="text-white/50">arte:</span>
      {row('plant', 'planta')}
      {row('mug', 'caneca')}
      <span className="flex items-center gap-1">
        <span className="text-white/50">tier</span>
        {([1, 2, 3] as PlantTier[]).map((t) => (
          <button
            key={t}
            onClick={() => setPlantTier(t)}
            className={`rounded px-1.5 py-0.5 ${
              art.plantTier === t ? 'bg-white/25 text-white' : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            {t}
          </button>
        ))}
      </span>
    </div>
  );
}
