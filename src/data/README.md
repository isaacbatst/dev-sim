# `data/` — Templates de conteúdo

Port dos arquivos `.tres` do Godot para objetos TS. **Migração concluída** (Fase 2):

- `segments.ts` — **26 segments** (press, hold, nav, selection, wait, file). Teclas vindas
  do input map do `project.godot`.
- `tasks.ts` — **9 tasks** compostas de segments.
- `tickets.ts` — **13 tickets** (9 single-task wrap + 4 multi-task) + `TICKET_POOL`.
- `melodies.ts` — colas do tecladinho da pausa. Dois sets injetados NO BUILD:
  `melodies.free.ts` (domínio público, **default de release**) e
  `melodies.proprietary.ts` (⚠ copyright — só teste local, via
  `NEXT_PUBLIC_MELODY_SET=proprietary`; o set não usado sai do bundle por DCE).

Templates são **estáticos** (definição de conteúdo). O estado de runtime
(`*Instance`, cursor, progresso) vive em `core/domain/instance.ts` — não misturar.

> A progressão de dificuldade por nível (pools por fase do dia) é Fase 2 item 3,
> ainda não migrada. Hoje o spawn usa o pool inteiro.
