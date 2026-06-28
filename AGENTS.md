<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Dev Task Chef

Daily game web (grátis, viral, compartilhável) para devs — port do PoC em Godot
para stack web TS. Referências de design:

- `docs/DESIGN_CONSULTORIA.md` — direção estratégica e decisão de migrar (Seção 10).
- `docs/GDD.md` — game design (hierarquia, mecânicas, roadmap, conteúdo do PoC).
- **Linear** é a fonte da verdade de tarefas.

## Arquitetura (decisão da Seção 10.3)

- **Core do jogo desacoplado do React.** Lógica em TS puro rodando em
  `requestAnimationFrame`; React só renderiza UI. Não rodar game loop no ciclo do React.
- Stack: Next.js + TS + Tailwind. XState (fluxo de input), Zustand/mitt (bridge),
  GSAP ou Framer Motion (animação) — libs de animação/store ainda não fixadas.

## Camadas (ver README em cada pasta)

| Pasta             | Responsabilidade                              |
| ----------------- | --------------------------------------------- |
| `src/core/`       | Lógica de jogo em TS puro (NÃO importa React) |
| `src/data/`       | Templates de conteúdo (port dos `.tres`)      |
| `src/store/`      | Bridge core ↔ React (substitui o EventBus)    |
| `src/components/` | UI React (shell, sem regra de jogo)           |
| `src/app/`        | Rotas Next.js                                 |

## Princípios da migração (não portar cego)

- **Auditar Hold/Wait** (tempo morto) e priorizar "suco por tecla" + legibilidade (Seção 4).
- **Analytics desde o primeiro release** (Seção 9.7).
- **Casca daily** (seed + streak + share) como estrutura, não add-on tardio.
