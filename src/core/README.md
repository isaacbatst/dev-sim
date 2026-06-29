# `core/` — Lógica de jogo em TS puro

**Regra de ouro:** nada aqui importa React. Esta camada roda em `requestAnimationFrame`,
desacoplada do ciclo de render da UI (ver Seção 10.3 do `DESIGN_CONSULTORIA.md`).

A UI lê o estado do jogo via store (`src/store/`); o `core` nunca lê a UI.

## Mapa de port (Godot → TS)

| Godot                       | Aqui                                           |
| --------------------------- | ---------------------------------------------- |
| Services (`RefCounted`)     | consolidados na classe `Game` (`game.ts`)      |
| EventBus (autoload, sinais) | snapshot + `SoundEvent` → store (`src/store/`) |
| Ticket→Task→Step→Segment    | mesma hierarquia (`domain/`)                   |
| Loop do Godot (`_process`)  | `loop.ts` (RAF, desacoplado do React)          |

## Estrutura

- `domain/` — modelos da hierarquia Ticket→Task→Step→Segment (`types.ts`), o estado
  de runtime (`instance.ts`: `*Instance`, cursor, progresso, CR rejeitado) e a
  identidade dos apps (`apps.ts`).
- `game.ts` — o motor: classe `Game` (tick, input, spawn, avanço, entrega). Concentra
  o que no Godot eram 6 services. Sem XState — o fluxo de input é tratado direto.
- `loop.ts` — game loop em RAF; publica snapshot e escoa os `SoundEvent`.
- `snapshot.ts` — view model lido pela UI (`Snapshot`) + o tipo `SoundEvent`.

> Sem barra de satisfação / condição de derrota por enquanto: o expediente sempre
> termina às 17:00 (`won`). Erro de escolha não drena vida — ele faz o Code Review
> ser **rejeitado** e a tarefa voltar para o passo errado (ver `rejectIfFlawed`).

> Ao implementar os segmentos, **auditar Hold/Wait** (tempo morto) e priorizar
> "suco por tecla" e legibilidade — Seção 4 do `DESIGN_CONSULTORIA.md`. Não portar cego.
