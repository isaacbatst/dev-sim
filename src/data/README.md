# `data/` — Templates de conteúdo

Port dos arquivos `.tres` do Godot para JSON/objetos TS.

Conteúdo do PoC a migrar:

- **24 segments** (press, hold, nav, selection, wait)
- **9 tasks** (study, meeting, slack, email, document, fix_typo, ui_color, ui_font, test_feature)
- **13 tickets** (9 single-task + 4 multi-task)

Templates são **estáticos** (definição de conteúdo). O estado de runtime
(instâncias) vive no `core/` — não misturar os dois.
