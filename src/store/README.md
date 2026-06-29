# `store/` — Bridge core ↔ React

Substitui o EventBus do Godot. É a única ponte entre a lógica (`src/core/`, que roda
em RAF) e a UI (`src/components/`, que renderiza).

- O `core` escreve snapshots de estado aqui.
- A UI lê (de forma reativa) e despacha intenções de input de volta.

Arquivos:

- `gameStore.ts` — store **Zustand** (decisão fixada). Mantém o `GameLoop`, expõe o
  `snapshot` reativo e os despachos de input.
- `sound.ts` — síntese de áudio (Web Audio, zero assets). O loop entrega os
  `SoundEvent` do motor para `playSound`, que sintetiza cada um; `setMuted` controla
  o `SoundToggle` da UI.
