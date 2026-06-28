/**
 * Modelos da hierarquia Ticket → Task → Step → Segment.
 *
 * Estes são os TEMPLATES (definição estática de conteúdo). O estado de runtime
 * (cursor de progresso, erros, status na fila) vive em `TicketInstance`.
 *
 * No vertical slice só existe o segmento `press`; os demais tipos entram na Fase 2,
 * já auditando Hold/Wait (tempo morto — DESIGN_CONSULTORIA.md Seção 4).
 */

export type Priority = 'urgente' | 'alta' | 'normal' | 'baixa';

/** Multiplicador de drain por prioridade (GDD 3.3). */
export const PRIORITY_DRAIN: Record<Priority, number> = {
  urgente: 2.0,
  alta: 1.5,
  normal: 1.0,
  baixa: 0.7,
};

export type SegmentType = 'press' | 'hold' | 'nav' | 'selection' | 'wait';

/** Uma tecla a pressionar, com rótulo legível (ex.: { key: 'w', label: 'Abrir navegador' }). */
export interface PressKey {
  key: string;
  label: string;
}

/** Segmento `press`: sequência de teclas a pressionar em ordem. */
export interface PressSegment {
  type: 'press';
  keys: PressKey[];
}

/** União discriminada — os outros tipos de segmento serão adicionados na Fase 2. */
export type Segment = PressSegment;

/** Passo: contém segmentos do mesmo tipo (GDD 3.1). */
export interface StepTemplate {
  segments: Segment[];
}

/** Tarefa: subtarefa dentro de um ticket, com passos ordenados. */
export interface TaskTemplate {
  id: string;
  title: string;
  steps: StepTemplate[];
}

/** Ticket (demanda): unidade de trabalho com 1+ tarefas e uma prioridade. */
export interface TicketTemplate {
  id: string;
  name: string;
  description: string;
  priority: Priority;
  tasks: TaskTemplate[];
}
