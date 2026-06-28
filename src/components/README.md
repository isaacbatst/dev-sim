# `components/` — UI React (shell)

Só apresentação e captura de input. **Nenhuma regra de jogo aqui** — a lógica
vive em `src/core/`. Componentes leem estado via store (`src/store/`) e despacham
intenções de input.

Equivalente ao `ui/` do Godot (screens, components, effects, theme).

## UI diegética: "devOS"

A tela inteira é a área de trabalho de um dev; cada tarefa abre o "app" real
correspondente (editor, browser, Slack, mail, reunião). Estrutura em `desktop/`:

- `Desktop.tsx` — orquestra (menu bar, wallpaper, inbox, janela ativa, overlays).
- `MenuBar.tsx` — identidade + humor do chefe + relógio + entregas.
- `InboxPanel.tsx` — as 5 demandas da fila.
- `AppWindow.tsx` — janela com chrome (traffic lights) temada por app.
- `apps.tsx` — aparência de cada app (ícone, accent, cena de contexto).
- `Segments.tsx` — keycaps e renderização dos 5 tipos de segmento.
- `mood.ts` — **assinatura**: satisfação → carinha + vinheta + tremor (clima do desktop).

`GameScreen.tsx` é a casca fina: store + teclado + juice por diff de snapshot.

> Animação ("suco") feita em **CSS/Tailwind** por ora (keypop, shake, windowin,
> floatup, stamp, edgepulse em `globals.css`). GSAP/Framer entram só se precisar
> de timeline de verdade. `prefers-reduced-motion` respeitado.
