# `components/` — UI React (shell)

Só apresentação e captura de input. **Nenhuma regra de jogo aqui** — a lógica
vive em `src/core/`. Componentes leem estado via store (`src/store/`) e despacham
intenções de input.

Equivalente ao `ui/` do Godot (screens, components, effects, theme).

## UI diegética: "devOS"

A tela inteira é a área de trabalho de um dev; cada tarefa abre o "app" real
correspondente. Apps standalone: editor, browser, Slack (reunião e e-mail são páginas
do navegador — "navegador como hub"). Estrutura em `desktop/`:

- `Desktop.tsx` — orquestra (menu bar, wallpaper, inbox, janela ativa, overlays).
- `Workstation.tsx` — aterra a tela num monitor sobre a mesa (ambiente/luz/sombra).
- `MenuBar.tsx` — identidade + relógio do expediente + entregas.
- `InboxPanel.tsx` — a fila de demandas como issue tracker (estilo Linear).
- `AppWindow.tsx` — janela com chrome (traffic lights) temada por app + "Comanda" (plano).
- `ActionBar.tsx` — rodapé com a hint única de input ("o que apertar agora").
- `Dock.tsx` — dock estilo SO (ancora a metáfora de área de trabalho).
- `SoundToggle.tsx` — liga/desliga o feedback sonoro (`store/sound.ts`).
- `apps.tsx` — identidade de cada app (ícone, accent, dock).
- `issueIcons.tsx` — ícones de prioridade/status (estilo Linear).
- `primitives.tsx` — primitivas compartilhadas das cenas (ex.: `KeyState`, keycaps).
- `scenes/` — cena de contexto por app: editor, browser, slack (ativas). `MeetScene`/
  `MailScene` são legado (nenhuma task abre meet/mail; viraram sites do navegador).

`GameScreen.tsx` (em `src/components/`) é a casca fina: store + teclado + juice por
diff de snapshot.

> Animação ("suco") feita em **CSS/Tailwind** por ora (keypop, shake, windowin,
> floatup, stamp, edgepulse em `globals.css`). GSAP/Framer entram só se precisar
> de timeline de verdade. `prefers-reduced-motion` respeitado.
