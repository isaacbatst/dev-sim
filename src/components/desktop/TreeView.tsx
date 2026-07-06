import { useMemo, useState } from 'react';
import type { Career } from '@/store/gameStore';
import { positionName } from '@/data/positions';
import { TICKETS } from '@/data/tickets';
import { BRANCHES, TASK_TREE, type BranchId, type TreeNode } from '@/data/taskTree';
import { playSound } from '@/store/sound';

/** Dois desenhos da árvore, alternáveis: VERTICAL (colunas com trilhos, estilo
 *  git-graph) e CIRCULAR (radial — os ramos irradiando da sua posição). */
type Mode = 'vertical' | 'circular';

const MODE_KEY = 'devos-tree-mode';

function loadMode(): Mode {
  if (typeof window === 'undefined') return 'vertical';
  return localStorage.getItem(MODE_KEY) === 'circular' ? 'circular' : 'vertical';
}

interface NodeState {
  node: TreeNode;
  owned: boolean;
  eligible: boolean;
  depth: number;
  parent: TreeNode | null;
  /** Índice entre os irmãos (filhos do mesmo pai) e total de irmãos. */
  sib: number;
  sibCount: number;
}

/** Estrutura derivada da árvore: pai, profundidade, irmãos, estado do jogador. */
function useNodeStates(career: Career, eligible: TreeNode[]): NodeState[] {
  return useMemo(() => {
    const owned = new Set(career.unlockedTasks);
    const eligibleIds = new Set(eligible.map((n) => n.id));
    const byId = new Map(TASK_TREE.map((n) => [n.id, n]));
    const depthOf = (n: TreeNode): number =>
      n.requires.length === 0 ? 0 : 1 + depthOf(byId.get(n.requires[0])!);
    return TASK_TREE.map((node) => {
      const parent = node.requires[0] ? (byId.get(node.requires[0]) ?? null) : null;
      const siblings = TASK_TREE.filter(
        (x) => x.branch === node.branch && (x.requires[0] ?? null) === (node.requires[0] ?? null),
      );
      return {
        node,
        owned: owned.has(node.id),
        eligible: eligibleIds.has(node.id),
        depth: depthOf(node),
        parent,
        sib: siblings.findIndex((x) => x.id === node.id),
        sibCount: siblings.length,
      };
    });
  }, [career.unlockedTasks, eligible]);
}

/** Cores/preenchimento de um nó pelo estado (compartilhado pelos 2 desenhos). */
function nodePaint(s: NodeState): { fill: string; stroke: string; label: string; pulse: boolean } {
  const cor = BRANCHES[s.node.branch].cor;
  if (s.owned) return { fill: cor, stroke: cor, label: 'var(--ink)', pulse: false };
  if (s.eligible)
    return { fill: 'transparent', stroke: 'var(--amber)', label: 'var(--amber)', pulse: true };
  return { fill: 'var(--surface)', stroke: 'var(--line)', label: 'var(--ink-dim)', pulse: false };
}

/**
 * Overlay "a árvore": HUD sobre o boletim. Nó ◇ elegível é CLICÁVEL quando a
 * escolha do dia ainda está aberta (escolhe direto do mapa).
 */
export function TreeView({
  career,
  eligible,
  canPick,
  onPick,
  onClose,
}: {
  career: Career;
  eligible: TreeNode[];
  canPick: boolean;
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<Mode>(loadMode);
  const states = useNodeStates(career, eligible);
  const pick = (s: NodeState) => {
    if (!canPick || !s.eligible) return;
    onPick(s.node.id);
    onClose();
  };
  const switchMode = (m: Mode) => {
    setMode(m);
    localStorage.setItem(MODE_KEY, m);
    playSound('tab');
  };

  return (
    <div
      className="absolute inset-0 z-40 overflow-y-auto bg-black/85 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="mx-auto flex min-h-full w-full max-w-4xl flex-col justify-center px-6 py-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-baseline justify-between">
          <h3 className="font-code text-xl font-bold text-ink">a árvore</h3>
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span className="flex overflow-hidden rounded-md border border-line">
              {(['vertical', 'circular'] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className={`px-2.5 py-1 transition-colors ${
                    mode === m ? 'bg-amber/20 text-amber' : 'text-ink-dim hover:text-ink'
                  }`}
                >
                  {m}
                </button>
              ))}
            </span>
            <button onClick={onClose} className="text-ink-dim transition-colors hover:text-amber">
              voltar ⏎
            </button>
          </div>
        </div>

        {mode === 'vertical' ? (
          <VerticalTree states={states} canPick={canPick} onPick={pick} />
        ) : (
          <CircularTree states={states} career={career} canPick={canPick} onPick={pick} />
        )}

        <p className="mt-6 font-mono text-[10px] text-ink-dim">
          <span className="text-ink">●</span> seu ·{' '}
          <span className="text-amber">◇ escolhível hoje{canPick ? ' (clique)' : ''}</span> · ○
          exige o anterior — uma escolha por dia, tudo alcançável
        </p>
      </div>
    </div>
  );
}

// ── VERTICAL: 4 colunas com trilhos desenhados (git-graph de cada ramo) ─────

const ROW_H = 44;
const RAIL_X = (depth: number) => 11 + depth * 18;

/** Linhas do ramo em ordem DFS (pai seguido dos filhos). */
function dfsRows(states: NodeState[], branch: BranchId): NodeState[] {
  const inBranch = states.filter((s) => s.node.branch === branch);
  const out: NodeState[] = [];
  const walk = (parentId: string | null) => {
    for (const s of inBranch)
      if ((s.node.requires[0] ?? null) === parentId) {
        out.push(s);
        walk(s.node.id);
      }
  };
  walk(null);
  return out;
}

function VerticalTree({
  states,
  canPick,
  onPick,
}: {
  states: NodeState[];
  canPick: boolean;
  onPick: (s: NodeState) => void;
}) {
  const branches = Object.keys(BRANCHES) as BranchId[];
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-7 lg:grid-cols-4">
      {branches.map((bid) => {
        const b = BRANCHES[bid];
        const rows = dfsRows(states, bid);
        const rowIndex = new Map(rows.map((s, i) => [s.node.id, i]));
        const h = rows.length * ROW_H;
        return (
          <div key={bid}>
            <p
              className="mb-2 border-b pb-1 font-mono text-[10px] uppercase tracking-[0.2em]"
              style={{ color: b.cor, borderColor: `${b.cor}44` }}
            >
              {b.nome}
            </p>
            <div className="relative" style={{ height: h }}>
              {/* trilhos + nós (SVG por trás; rótulos por cima) */}
              <svg
                className="absolute inset-0 h-full w-full"
                viewBox={`0 0 200 ${h}`}
                preserveAspectRatio="none"
                aria-hidden
              >
                {rows.map((s) => {
                  if (!s.parent) return null;
                  const py = (rowIndex.get(s.parent.id) ?? 0) * ROW_H + ROW_H / 2;
                  const cy = (rowIndex.get(s.node.id) ?? 0) * ROW_H + ROW_H / 2;
                  const px = RAIL_X(s.depth - 1);
                  const cx = RAIL_X(s.depth);
                  return (
                    <path
                      key={s.node.id}
                      d={`M ${px} ${py + 9} V ${cy - 6} Q ${px} ${cy} ${px + 6} ${cy} H ${cx - 9}`}
                      fill="none"
                      stroke={s.owned ? BRANCHES[s.node.branch].cor : 'var(--line)'}
                      strokeWidth="1.5"
                    />
                  );
                })}
                {rows.map((s) => {
                  const y = (rowIndex.get(s.node.id) ?? 0) * ROW_H + ROW_H / 2;
                  const p = nodePaint(s);
                  return (
                    <circle
                      key={s.node.id}
                      cx={RAIL_X(s.depth)}
                      cy={y}
                      r="8"
                      fill={p.fill}
                      stroke={p.stroke}
                      strokeWidth="2"
                      className={p.pulse ? 'animate-edgepulse' : undefined}
                    />
                  );
                })}
              </svg>
              {rows.map((s) => {
                const p = nodePaint(s);
                const clickable = canPick && s.eligible;
                return (
                  <button
                    key={s.node.id}
                    disabled={!clickable}
                    onClick={() => onPick(s)}
                    title={s.owned || s.eligible ? s.node.gesto : lockHint(s)}
                    className={`absolute text-left font-mono text-[11px] leading-tight ${
                      clickable ? 'cursor-pointer hover:underline' : 'cursor-default'
                    }`}
                    style={{
                      top: (rowIndex.get(s.node.id) ?? 0) * ROW_H + ROW_H / 2 - 8,
                      left: RAIL_X(s.depth) + 16,
                      color: p.label,
                    }}
                  >
                    {TICKETS[s.node.id]?.name ?? s.node.id}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── CIRCULAR: radial — os ramos irradiando da sua posição (o centro é você) ─

/** Ângulo-base de cada ramo (graus; 0 = leste, sentido horário do SVG). */
const BRANCH_ANGLE: Record<BranchId, number> = {
  consertador: -140,
  construtor: -40,
  arquiteto: 40,
  ops: 140,
};

function polar(angleDeg: number, r: number): { x: number; y: number } {
  const a = (angleDeg * Math.PI) / 180;
  return { x: Math.cos(a) * r, y: Math.sin(a) * r };
}

/** Posição de um nó: ângulo herdado do pai (irmãos abrem ±18°), raio por nível. */
function radialPos(s: NodeState, states: NodeState[]): { x: number; y: number; a: number } {
  const angleOf = (st: NodeState): number => {
    if (!st.parent) return BRANCH_ANGLE[st.node.branch];
    const parentState = states.find((x) => x.node.id === st.parent!.id)!;
    const spread = st.sibCount > 1 ? (st.sib === 0 ? -19 : 19) : 0;
    return angleOf(parentState) + spread;
  };
  const a = angleOf(s);
  const r = 84 + s.depth * 62;
  return { ...polar(a, r), a };
}

function lockHint(s: NodeState): string {
  const req = s.node.requires[0];
  return req ? `exige ${TICKETS[req]?.name ?? req}` : '';
}

function CircularTree({
  states,
  career,
  canPick,
  onPick,
}: {
  states: NodeState[];
  career: Career;
  canPick: boolean;
  onPick: (s: NodeState) => void;
}) {
  const pos = new Map(states.map((s) => [s.node.id, radialPos(s, states)]));
  return (
    <svg viewBox="-330 -255 660 510" className="w-full">
      {/* raios: centro → raízes; pai → filho */}
      {states.map((s) => {
        const c = pos.get(s.node.id)!;
        const from = s.parent ? pos.get(s.parent.id)! : { x: 0, y: 0 };
        const start = s.parent ? from : polar(BRANCH_ANGLE[s.node.branch], 40);
        return (
          <line
            key={`l-${s.node.id}`}
            x1={start.x}
            y1={start.y}
            x2={c.x}
            y2={c.y}
            stroke={s.owned ? BRANCHES[s.node.branch].cor : 'var(--line)'}
            strokeWidth="1.5"
          />
        );
      })}
      {/* o centro é VOCÊ: a posição atual, de onde os ramos irradiam */}
      <circle r="40" fill="var(--surface-2)" stroke="var(--line)" strokeWidth="1.5" />
      <text y="-2" textAnchor="middle" className="font-mono" fontSize="10" fill="var(--ink-dim)">
        você
      </text>
      <text y="12" textAnchor="middle" className="font-mono" fontSize="11" fill="var(--ink)">
        {positionName(career.level)}
      </text>
      {/* nome dos ramos, na ponta de cada direção */}
      {(Object.keys(BRANCHES) as BranchId[]).map((bid) => {
        const p = polar(BRANCH_ANGLE[bid], 238);
        return (
          <text
            key={bid}
            x={p.x}
            y={p.y + (p.y > 0 ? 16 : -10)}
            textAnchor="middle"
            className="font-mono uppercase"
            fontSize="10"
            letterSpacing="2"
            fill={BRANCHES[bid].cor}
          >
            {BRANCHES[bid].nome}
          </text>
        );
      })}
      {/* nós + rótulos */}
      {states.map((s) => {
        const c = pos.get(s.node.id)!;
        const p = nodePaint(s);
        const clickable = canPick && s.eligible;
        const right = Math.cos((c.a * Math.PI) / 180) > 0.15;
        const left = Math.cos((c.a * Math.PI) / 180) < -0.15;
        return (
          <g
            key={s.node.id}
            onClick={() => onPick(s)}
            className={clickable ? 'cursor-pointer' : undefined}
          >
            <title>{s.owned || s.eligible ? s.node.gesto : lockHint(s)}</title>
            <circle
              cx={c.x}
              cy={c.y}
              r="10"
              fill={p.fill}
              stroke={p.stroke}
              strokeWidth="2"
              className={p.pulse ? 'animate-edgepulse' : undefined}
            />
            <text
              x={c.x + (right ? 15 : left ? -15 : 0)}
              y={c.y + (right || left ? 4 : c.y > 0 ? 24 : -16)}
              textAnchor={right ? 'start' : left ? 'end' : 'middle'}
              className="font-mono"
              fontSize="10.5"
              fill={p.label}
            >
              {TICKETS[s.node.id]?.name ?? s.node.id}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
