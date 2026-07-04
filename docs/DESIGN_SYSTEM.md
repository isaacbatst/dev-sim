# Dev Task Chef — devOS Design System

> Guia vivo da identidade visual. Quem decide "que cor, que tamanho, que sombra"
> consulta aqui **antes** de inventar. Se algo não está no guia, ou você segue a
> regra mais próxima, ou propõe uma adição (e registra no Changelog).
>
> **Como ler isto sem ser designer:** cada seção tem a regra + o _porquê_ em
> português claro + o token/classe pra copiar. Onde digo "use X, não Y", é
> literal.

---

## Princípio que rege tudo

O jogo é a **tela de um dev às 2 da manhã**. A interface se divide em duas
camadas que NUNCA devem parecer iguais:

1. **A casca do SO (chrome)** — menu bar, backlog, dock. É o "móvel": discreto,
   recuado, sempre lá. Não compete por atenção.
2. **O programa em foco (a janela)** — onde a ação acontece. É o "palco":
   elevado, iluminado, claramente o protagonista.

Quase todo problema de "parece amador / parece AI" vem de tratar essas duas
camadas com o mesmo peso visual. **Hierarquia de profundidade é o toque
profissional principal deste produto.** (Ver _Layout Rules_.)

---

## Aparências (claro / escuro)

São **duas aparências** trocáveis em runtime (controle "Aparência" na menu bar:
Claro / Escuro / Sistema; `data-theme` no `<html>`; tudo via tokens, o app
re-skina sozinho). Exploramos uma 3ª ("Overclock", arcade neon) e descartamos —
ficamos com o par dark/light, que cobre melhor o uso real.

| Aparência (`data-theme`) | Conceito                  | Paleta                              | Fontes (UI / mono)         |
| ------------------------ | ------------------------- | ----------------------------------- | -------------------------- |
| **Escuro** (`graveyard`) | terminal phosphor, 2am    | índigo near-black + **âmbar**; teal | Geist / JetBrains Mono     |
| **Claro** (`daybreak`)   | paper IDE, estúdio diurno | papel quente + **tinta** + vermelho | Schibsted / JetBrains Mono |

> As seções abaixo descrevem o **Escuro** (padrão). Regras de _Spacing_, _Shape_,
> _Layout_ e _Do Not Use_ valem para os dois; só paleta/fontes mudam por tema.

**Bordas por tema (lição do exercício macOS/Windows):** painel não leva _stroke_
em volta. No **escuro**, `--edge: transparent` — janela/backlog se separam por
**sombra + fill + realce de 1px no topo** (jeito macOS; um traço 1px no escuro
sempre vira "card de AI"). No **claro**, `--edge` é um fio de papel sutil. O
`--line` (keycaps + divisórias internas) é outro token e continua visível.

## Typography

Duas vozes, papéis fixos. Não misture.

| Voz                  | Fonte          | Quem fala                                                                                                        |
| -------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Máquina** (`mono`) | JetBrains Mono | Tudo que o "computador" renderiza: código, terminal, relógio, IDs (`DEV-12`), URLs, keycaps, números/contadores. |
| **Humana** (`ui`)    | Geist          | Tudo que a interface "diz" ao usuário: títulos, prosa do ticket, labels, botões, nomes de app.                   |

**Regra de ouro:** se é dado cru/diegético → mono. Se é UI falando com você →
grotesk. Quando estiver na dúvida, é grotesk.

### Escala (use só estes degraus)

| Token     | px / peso                             | Uso                                                         |
| --------- | ------------------------------------- | ----------------------------------------------------------- |
| `eyebrow` | 10px, 700, UPPERCASE, tracking 0.16em | Rótulos de seção ("O QUE FAZER", "EM FOCO AGORA")           |
| `meta`    | 11px mono / 12px ui                   | IDs, timestamps, legendas, "vazio"                          |
| `body`    | 13px                                  | Prosa do ticket, linhas de lista                            |
| `label`   | 14px, 500–600                         | Nome de tarefa, item de menu                                |
| `title`   | 16–18px, 600 grotesk                  | Título da janela / do ticket                                |
| `comanda` | 28px, 700 grotesk, leading 1.1        | Título da **comanda** (a ordem em foco, estilo CSD)         |
| `hero`    | 24px+, 700 mono                       | Relógio grande, "17:00 — fim do expediente", wordmark devOS |

> **Nota sobre `comanda` vs `hero`:** ambos são "grandes", mas a voz decide a
> fonte, não o tamanho. `hero` é **mono** porque é máquina (relógio, wordmark).
> `comanda` é **grotesk** porque é conteúdo humano (o nome do ticket). Escala
> modular ~1.33 (perfeita quarta): eyebrow 10–12 → body 13–16 → comanda 28.

- Números que mudam (relógio, contadores, `cursor / alvo`) → **sempre**
  `tabular-nums` (mono já ajuda). Evita o texto "tremer".
- Máximo de **2 pesos por componente**. Hierarquia se faz com tamanho + cor
  (`ink` vs `ink-dim`), não empilhando 4 pesos.

---

## Color Palette

Paleta "turno da madrugada": índigo profundo + âmbar de fósforo. Já existe em
`globals.css`. Mantém-se — só **adicionamos profundidade** (ver `--shell` e
elevação).

### Tokens base (existentes)

| Token         | Hex       | Significado                                        |
| ------------- | --------- | -------------------------------------------------- |
| `--bg`        | `#14161f` | Fundo da área de trabalho (atrás de tudo)          |
| `--surface`   | `#1e2230` | Superfície de painéis e janelas                    |
| `--surface-2` | `#2a2f42` | Cartões aninhados, keycaps, dentro da janela       |
| `--line`      | `#353b52` | Bordas e divisórias (1px)                          |
| `--ink`       | `#e7e4dd` | Texto principal (off-white, **nunca** `#fff` puro) |
| `--ink-dim`   | `#8b90a6` | Texto secundário, legendas, ícones inativos        |
| `--amber`     | `#f5a623` | **A cor-assinatura.** Foco / ação atual / primário |
| `--teal`      | `#4ec9b0` | Acento de "código" (VS Code, merge)                |
| `--pass`      | `#5fd07a` | Sucesso, concluído, "done"                         |
| `--fail`      | `#ff5c57` | Erro e destrutivo — **só isso**                    |

### Tokens a adicionar (profundidade)

```css
:root {
  --shell: #0e1016; /* mais escuro que --bg: a "mesa" onde a casca assenta  */
  /* Sombras nomeadas por elevação (copie como utilitárias)                  */
  --elev-1: 0 1px 2px rgba(0, 0, 0, 0.35); /* casca: backlog, dock, menubar  */
  --elev-2:
    0 24px 60px -18px rgba(0, 0, 0, 0.7), 0 4px 12px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.06); /* janela em foco (flutua)       */
  --elev-3: 0 30px 70px -10px rgba(0, 0, 0, 0.8); /* overlays: Quick Open     */
}
```

### Regras de cor (as que mais importam)

- **Âmbar é estrela, não figurante.** No máximo **um** elemento âmbar "cheio"
  por tela — o que pede ação agora (keycap atual, ticket em foco, item ativo).
  Se duas coisas estão âmbar, o olho não sabe pra onde ir.
- **Vermelho (`fail`) só significa erro/perigo.** Já corrigimos isso: "abrir
  programa errado" deixou de ser vermelho (não é erro, é só "nada a fazer").
- **Acentos têm dono:** teal = editor/merge; amarelo-âmbar = foco/primário;
  verde = sucesso. Não use teal pra "sucesso" nem verde pra "ação".
- Texto sobre superfície clara (cenas do browser/editor) usa a paleta `zinc-*`
  do Tailwind (são telas "de verdade", fundo branco) — é a única exceção à
  paleta escura, e é proposital (você está olhando um site/app real).

---

## Spacing & Shape

### Espaçamento — grade de 4px

Use só múltiplos de 4 (Tailwind: `1`=4px, `2`=8, `3`=12, `4`=16, `5`=20, `6`=24).
Padrões:

- Padding interno de cartão/linha: `px-3 py-2` (12/8).
- Respiro de seção dentro da janela: `gap-4` / `p-6`.
- Distância entre ícone e texto: `gap-2` (8).

### Raio (border-radius) — escala fixa

| Nome   | px  | Onde                                                         |
| ------ | --- | ------------------------------------------------------------ |
| `xs`   | 4   | chips minúsculos, swatches de cor                            |
| `sm`   | 6   | linhas de lista, botões pequenos, ícones de app no dock-ish  |
| `md`   | 8   | keycaps, cartões aninhados, conteúdo de janela               |
| `lg`   | 12  | **a janela** e os **painéis** (backlog) — o contorno externo |
| `full` | 999 | bolinhas de status, avatares, pílulas/labels                 |

Regra: **contêiner externo = `lg` (12px); coisas dentro dele = `md` (8px) ou
menos.** Raio diminui conforme você aninha. Nunca o inverso.

### Sombra = elevação (não decoração)

Sombra comunica "o que está flutuando". Use os tokens `--elev-*`:

- Casca (backlog/menubar/dock): `--elev-1` (quase nada). Ela está _colada_ na mesa.
- Janela em foco: `--elev-2` (sombra grande + brilho de 1px no topo). Ela _flutua_.
- Overlays (Quick Open): `--elev-3`.

Não saia espalhando `shadow-xl` em tudo — se tudo tem sombra, nada flutua.

---

## Component Conventions

| Componente           | Camada | Receita                                                                                                                                                      |
| -------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Janela de app**    | elev-2 | `rounded-lg` + `border-line` + `--elev-2`. Title bar com traffic lights + ícone + título + chip de prioridade. É o protagonista.                             |
| **Painel (backlog)** | elev-1 | `rounded-lg` + `border-line` + `--elev-1` + fundo levemente translúcido (`bg-surface/70`). Recuado, faz parte do SO.                                         |
| **Cartão aninhado**  | —      | `bg-surface-2` + `rounded-md` + `border-line`. Dentro de janela/painel.                                                                                      |
| **Keycap**           | —      | `.keycap` (mono, borda inferior 3px = tecla física). Estados: `--current` (âmbar), `--done` (verde, afunda 2px), `--wrong` (vermelho). É a assinatura tátil. |
| **Ícone de status**  | —      | Glifos circulares desenhados (estilo Linear), não emoji. `open / active / review(3/4) / merge / ready / empty`.                                              |
| **Action bar**       | —      | Rodapé da janela. Lugar **único** do "o que apertar agora". Barra de 3px à esquerda na cor do app (accent). Sem o rótulo "ação".                             |
| **Chip / label**     | —      | `rounded-full`, `border` + `bg` da mesma família a ~12% alpha. Prioridade, estados, contadores.                                                              |
| **Comentário de CR** | —      | Cartão com avatar de iniciais (não emoji), nome `@tech-lead`, selo de estado, e a mensagem entre aspas.                                                      |
| **Comanda**          | —      | A "ordem" em foco (estilo CSD), fora da janela. Papel **invertido** (`--comanda-*`: claro no escuro, escuro no claro → figura-fundo) com **grão** (multiply/screen) + gradiente + realce no topo. Estrutura: eyebrow (`DEV-id · prioridade`, mono) → título (`comanda` 28/700 grotesk) → passo atual (16px, ▸ âmbar). É o único elemento de alto contraste. |

Convenções transversais:

- **Ícones:** emoji só no contexto diegético (dock, conteúdo de sites/apps).
  Para status/UI da casca, glifos desenhados (SVG). Emoji em chrome envelhece mal
  e some em fontes sem color-emoji.
- **Foco de teclado:** `:focus-visible` com outline âmbar 2px (já global). Não
  remover.
- **Movimento ("juice"):** curto e funcional — `keypop`, `shake` (erro),
  `windowin`, `floatup` (entrega). Sempre respeitando `prefers-reduced-motion`.
  Não adicione animação ambiente "porque sim" (isso é cara de AI).

---

## Layout Rules

A diferenciação que você pediu (backlog × programa principal) é **regra de
layout**, não enfeite:

1. **Três camadas de profundidade, sempre nesta ordem de peso:**
   - `elev-0` Wallpaper/mesa (recuado, fundo).
   - `elev-1` Casca: menu bar (topo), **backlog** (esquerda, largura fixa ~288px),
     dock (flutuando embaixo). Discretos, translúcidos, sombra mínima.
   - `elev-2` **Janela do app em foco** (centro). Elevada, sombra forte, brilho de
     topo. É pra onde o olho vai primeiro.
2. **Backlog ≠ janela.** Eles compartilham a paleta, mas se separam por:
   _elevação_ (1 vs 2), _opacidade_ (backlog levemente translúcido), e _foco_
   (a janela ganha um anel sutil na cor do app quando ativa). Se você cobrir os
   rótulos e ainda assim souber qual é o "programa", a hierarquia está certa.
3. **A janela respira no palco:** centralizada, `max-w` definido (~44rem),
   nunca colada nas bordas — o vazio em volta é o que a faz "flutuar".
4. **Tudo vive dentro do monitor** (Workstation): o monitor domina (~90% da
   altura), a mesa é uma faixa fina embaixo. A moldura é o "mundo".
5. **Action bar fixa no rodapé da janela.** O usuário sempre olha pro mesmo
   lugar pra saber o que apertar.

---

## Do Not Use

Lista do que faz a interface parecer genérica / gerada por AI — **evite**.
Os 3 primeiros são os "tells" mais citados na análise de UIs vibe-coded (ver
_Referências_); já foram removidos do produto.

- ❌ **Borda/listra colorida na lateral** (stripe de 3–4px à esquerda em
  card/blockquote/janela). É descrito como "tão confiável quanto o em-dash é
  pra texto de AI". **Não diferencie por cor de borda.** Hierarquia vem de
  _valor + elevação + material_ (ver Layout). Se precisar marcar algo, use borda
  **superior** neutra, sublinhado full-width ou espaço em branco — nunca a listra
  colorida na lateral.
- ❌ **Glows / box-shadows coloridos.** "Anel" colorido em volta de janela,
  keycap ou ícone = ruído sem função. Sombra é **neutra (preta)** e serve só pra
  elevação. Brilho colorido só no diegético (a luz da tela na parede do quarto).
- ❌ **Glassmorphism (backdrop-blur) em cards/painéis.** Teve seu momento em 2022
  e virou default de LLM. Diferencie com **fundo sólido + valor + borda**, não
  com blur. (Exceção tolerada: chrome fininho do SO — menu bar/dock — onde a
  translucidez é fiel ao sistema operacional real.)
- ❌ **Grade técnica/blueprint no wallpaper** (linhas a cada 32–34px). Trocada
  por gradiente índigo + **grão (noise) a ~5%** — textura orgânica mata o
  "gradiente chapado gerado".
- ❌ **Brilho radial único como toda a profundidade.** Glow sozinho = chapado.
- ❌ **Painel e janela com a mesma elevação.** Mata a hierarquia (era a causa do
  "backlog e programa parecem a mesma coisa").
- ❌ **Mais de um acento saturado por tela.** Âmbar é um só por vista.
- ❌ **Preto puro (`#000`) e branco puro (`#fff`) em texto.** Use `--bg` e `--ink`.
- ❌ **Emoji como ícone de UI da casca.** Só no diegético.
- ❌ **Clichês de "AI design":** creme + serifa de alto contraste; preto + verde
  ácido; **lavanda/roxo "VibeCode"**; bento grid de cards idênticos; hero
  centralizado com badge acima do H1. Não somos nada disso.
- ❌ **Cantos quadrados (radius 0)** em cartões/janelas. Nossa linguagem é macia.

> **Fonte (decidido).** Trocamos Space Grotesk (default de LLM) por **Geist** na
> voz UI — engineered, feita pra produto dev, casa com JetBrains Mono (voz
> máquina). Var continua `--font-grotesk` por compat. Se um dia quiser ainda
> mais ponto de vista: Söhne, Untitled Sans, Haas Grotesk (comerciais).

---

## Personality & Reference

**Personalidade:** o turno da madrugada de um dev. Foco silencioso, café frio,
o teclado mecânico fazendo "tec-tec", o monitor sendo a única luz do quarto.
Competente e tátil, com humor seco — não fofo, não corporativo.

**A assinatura** (o que torna isto reconhecível em 1 segundo):

- O **keycap âmbar** "atual" — a tecla que brilha esperando ser apertada.
- A **luz ambiente que esquenta conforme o expediente passa** (manhã fria →
  fim de tarde âmbar). É o nosso "relógio emocional".
- Tudo é **diegético**: cada tarefa abre um app de verdade (VS Code, Chrome,
  Slack), o backlog é o issue tracker, o CR tem comentário de reviewer.

**Referências (e o que pegamos de cada):**

- **Linear** — clareza do backlog/issues, ícones de status circulares.
- **Raycast** — keycaps, paleta de comando (Quick Open / Ctrl+P).
- **macOS** — chrome de janela (traffic lights), dock flutuante.
- **VS Code / terminal** — a diegese, o teal de código.
- **Cook, Serve, Delicious** — o "suco por tecla", ritmo, satisfação tátil.
- **Fósforo de CRT** — o calor do âmbar/índigo… **sem** scanline skeuomórfica.

Sobre o que **evitar** (a lista _Do Not Use_) usamos análises de UIs "vibe-coded":

- "AI Design Slop: 16 patterns" — developersdigest.tech/blog/ai-design-slop-and-how-to-spot-it
- "Why Your AI-Generated UI Looks Like Everyone Else's" — medium.com/@Rythmuxdesigner

Teste de cheiro antes de commitar uma tela: _"isso parece a tela de um dev de
verdade às 2am, ou parece um template de dashboard?"_ Se for a segunda, volte
pra hierarquia e pro grão.

---

## Changelog

- **2026-07-04:** **Comanda** (a ordem em foco, estilo CSD) formalizada como
  componente. Papel invertido (`--comanda-bg/ink/dim` por tema — claro no escuro,
  escuro no claro → figura-fundo) com grão (multiply no claro / screen no escuro;
  overlay era no-op no cinza-médio da turbulência), gradiente e realce no topo.
  Novo degrau de escala `comanda` (28px/700 grotesk) — grande como `hero` mas
  grotesk porque é conteúdo humano (nome do ticket), não máquina. Escala modular
  ~1.33 pra proporção (eyebrow→body→comanda).
- **2026-06-28:** **Claro/Escuro como aparências** (Escuro=Graveyard,
  Claro=Daybreak); Overclock descartado. Controle "Aparência" na menu bar
  (Claro/Escuro/Sistema), persistido + script anti-flash. **Bordas dos painéis no
  escuro removidas** (`--edge: transparent`): separação por sombra+fill+realce no
  topo (jeito macOS). Token `--edge` (contorno de painel) separado de `--line`
  (keycaps/divisórias). Terminal do editor com cores fixas (legível nos 2 temas).
  Glifo `⏎` → texto "Enter". Explorer do VSCode em **árvore de pastas** (Enter
  expande/colapsa; Ctrl+P busca aninhado).
- **2026-06-28:** **3 identidades em avaliação** (Graveyard / Daybreak /
  Overclock) implementadas como temas via `data-theme` + tokens; seletor de dev
  ao vivo (`ThemeSwitcher`). Tokens `--window-bg` e `--wall` por tema; wallpaper,
  dock e janela passaram a ler tokens. Fontes carregadas: Geist, Schibsted, Space
  Grotesk, JetBrains Mono, IBM Plex Mono.
- **2026-06-28:** Fonte de UI: **Space Grotesk → Geist** (saindo do default de
  LLM). JetBrains Mono mantida na voz máquina.
- **2026-06-28:** **Passada anti-AI** (baseada em análise de UIs vibe-coded).
  Removidos os "tells": borda colorida na janela → diferenciação por _material_
  (gradiente neutro: topo mais claro) + elevação + valor; listra colorida da
  action bar → só borda superior neutra; glow do keycap atual e glow do dock →
  removidos; glassmorphism do backlog (blur) → painel sólido recuado; borda-
  esquerda colorida do "comentário anterior" do CR → cartão neutro.
- **2026-06-28:** v1 do design system. Regra de **3 camadas de elevação**
  (casca elev-1 × janela elev-2) como diferenciação backlog↔programa. Tokens
  `--shell` e `--elev-1/2/3`.
- **2026-06-28:** Wallpaper — **remover a grade técnica**; gradiente índigo +
  grão (noise ~5%). (Anti-AI.)
- **2026-06-28:** `fail`/vermelho restrito a erro real; "abrir programa errado"
  passou a visual neutro (cinza), não vermelho.
- **2026-06-28:** Emoji removido de ícones de chrome (avatar do CR usa iniciais
  "TL"); emoji só em contexto diegético.
