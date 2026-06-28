# `data/` — Templates de conteúdo

Port dos arquivos `.tres` do Godot para objetos TS. **Migração concluída** (Fase 2):

- `segments.ts` — **24 segments** (press, hold, nav, selection, wait). Teclas vindas
  do input map do `project.godot`.
- `tasks.ts` — **9 tasks** compostas de segments.
- `tickets.ts` — **13 tickets** (9 single-task wrap + 4 multi-task) + `TICKET_POOL`.

Templates são **estáticos** (definição de conteúdo). O estado de runtime
(`*Instance`, cursor, progresso) vive em `core/domain/instance.ts` — não misturar.

> A progressão de dificuldade por nível (pools por fase do dia) é Fase 2 item 3,
> ainda não migrada. Hoje o spawn usa o pool inteiro.
