# `store/` — Bridge core ↔ React

Substitui o EventBus do Godot. É a única ponte entre a lógica (`src/core/`, que roda
em RAF) e a UI (`src/components/`, que renderiza).

- O `core` escreve snapshots de estado aqui.
- A UI lê (de forma reativa) e despacha intenções de input de volta.

> Lib ainda não fixada (Zustand ou mitt — Seção 10.4). Decidir ao implementar a
> primeira ligação real entre loop e UI.
