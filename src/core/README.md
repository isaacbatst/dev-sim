# `core/` — Lógica de jogo em TS puro

**Regra de ouro:** nada aqui importa React. Esta camada roda em `requestAnimationFrame`,
desacoplada do ciclo de render da UI (ver Seção 10.3 do `DESIGN_CONSULTORIA.md`).

A UI lê o estado do jogo via store (`src/store/`); o `core` nunca lê a UI.

## Mapa de port (Godot → TS)

| Godot                       | Aqui                                     |
| --------------------------- | ---------------------------------------- |
| Services (`RefCounted`)     | classes/módulos TS puros (`services/`)   |
| EventBus (autoload, sinais) | emitter/store (`src/store/`)             |
| Ticket→Task→Step→Segment    | mesma hierarquia (`domain/`), via XState |
| Loop do Godot (`_process`)  | `loop.ts` (RAF, desacoplado do React)    |

## Subpastas previstas

- `domain/` — modelos da hierarquia Ticket→Task→Step→Segment e tipos de segmento.
- `services/` — port dos 6 services: boss, clock, difficulty, focus, state, task.
- `machines/` — máquinas XState (fluxo de input e estados da partida).
- `loop.ts` — game loop em RAF.

> Ao implementar os segmentos, **auditar Hold/Wait** (tempo morto) e priorizar
> "suco por tecla" e legibilidade — Seção 4 do `DESIGN_CONSULTORIA.md`. Não portar cego.
