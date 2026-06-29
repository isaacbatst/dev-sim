# Dev Task Chef - Game Design Document

## 1. Visão Geral

**Título:** Dev Task Chef
**Gênero:** Simulador de Ritmo / Gerenciamento de Tempo
**Plataforma:** Web (Next.js + TS) — _daily game_ grátis e compartilhável. (Migrado do
PoC em Godot; ver `DESIGN_CONSULTORIA.md` §10.)
**Tema:** Dia a dia caótico de um desenvolvedor de software
**Tom:** Humor ácido sobre a vida corporativa de dev

> **Nota de direção (mudança em andamento).** A implementação web migrou o eixo de
> _"sobreviver ao dreno sob pressão"_ para _"fazer o trabalho corretamente"_. Foram
> **removidos** a barra de satisfação, o chefe e o medidor de foco; foi **adicionado**
> o ciclo de Code Review com retrabalho. Em consequência, **a fonte de stakes está em
> aberto** (ver §1 Win/Lose e §3.3). As seções abaixo já refletem o estado atual; o
> que segue como decisão pendente está marcado como tal.

### Pitch

Você é um desenvolvedor tocando as demandas de um expediente. Tickets chegam sem
parar, cada um abre o "app" real do trabalho (editor, navegador, Slack — reunião e
e-mail acontecem dentro do navegador), e fazer a coisa certa importa: errar a escolha
derruba o seu Code Review e te manda
refazer. Toque a fila, faça bom trabalho e feche o dia até as 17h.

### Core Loop

```
Tickets chegam → Selecionar ticket → Executar passos (press/hold/nav/select/file/wait)
→ Push → Code Review (wait) → rejeitado? refazer : Merge → Entregar → Repetir
```

### Win/Lose

- **Vitória:** Chegar às 17:00 (3 minutos em tempo real). _Hoje é o único desfecho._
- **Derrota:** **Decisão pendente.** A satisfação do chefe (condição de derrota do PoC)
  foi removida. A fonte de stakes pretendida é **deadline por ticket** (§0.2), ainda
  não implementada — enquanto isso, não há condição de derrota.

---

## 2. Estado Atual (porte web — pós-migração)

O core loop foi portado do Godot para TS puro (em `requestAnimationFrame`, desacoplado
do React) e ganhou a UI diegética "devOS" e o feedback sonoro. As mecânicas centrais de
input funcionam; o que falta é a **casca de jogo** em volta (stakes, estrutura de dia,
identidade, razão para voltar). Ainda **não é algo que alguém jogaria por vontade
própria**.

### O que já está provado/portado

- A hierarquia Ticket → Task → Step → Segment funciona e é extensível
- 6 tipos de input (press, hold, nav, selection, **file**, wait) criam variedade
- Multi-task tickets adicionam complexidade estratégica
- UI diegética: cada tarefa abre o app real (editor, navegador, Slack); reunião e
  e-mail são páginas do navegador ("navegador como hub")
- Ciclo de Code Review: errar a escolha rejeita o CR e exige retrabalho (§3.3)
- Feedback sonoro sintetizado (Web Audio, zero assets) por ação
- O feedback visual (animações CSS, toasts, cores) comunica o estado do jogo

### O que falta para ser um jogo de verdade

- **Sem stakes** — satisfação/derrota removidas e deadlines não implementados: o dia
  termina sempre em vitória, sem pressão (ver §1 Win/Lose, §3.3)
- **Sem estrutura de dia** — sem fases, dificuldade plana, toda partida igual
- **Sem deadlines nos tickets** — fila é lista, não espaço de decisão; prioridade é só visual
- **Sem identidade** — flavor text por ticket ainda ausente (há prosa de comanda e
  comentário de CR, mas não o pool de frases temáticas)
- **Sem tela de fim informativa** — só mostra entregas, sem score/estrelas/comparação
- **Sem onboarding** — jogador novo não entende nada
- **Sem pause** — não dá pra parar

### Implementado (porte web)

| Feature                                   | Status       | Notas                                           |
| ----------------------------------------- | ------------ | ----------------------------------------------- |
| Hierarquia Ticket > Task > Step > Segment | Completo     | 4 camadas funcionais                            |
| Fila de tickets (5 slots)                 | Completo     | Spawn automático, seleção 1-5                   |
| 6 tipos de segmento                       | Completo     | Press, Hold, Nav, Selection, **File**, Wait     |
| 9 tarefas / 13 tickets template           | Completo     | 9 single-task + 4 multi-task                    |
| Multi-task tickets                        | Completo     | Encadeia subtarefas sequenciais                 |
| UI diegética "devOS"                      | Completo     | Apps reais (editor/browser/slack/mail/meet)     |
| Code Review + retrabalho                  | Completo     | Escolha errada rejeita o CR e refaz (§3.3)      |
| Subjogo de "abrir o app certo"            | Completo     | Abrir o errado exige fechar (X) antes de seguir |
| Som (SFX sintetizado)                     | Completo     | Web Audio, zero assets, por ação                |
| Relógio (09:00→17:00)                     | Completo     | 3 min real = 8h game                            |
| Prioridade (visual)                       | Completo     | Badges URGENTE/ALTA/NORMAL/BAIXA                |
| Feedback visual                           | Completo     | Shake, flash, floating text via CSS             |
| **Satisfação do chefe**                   | **Removido** | Era o "HP"/derrota do PoC; ver nota de direção  |
| **Sistema de foco**                       | **Removido** | Medidor de concentração saiu; decisão pendente  |
| **Progressão de dificuldade**             | **Removido** | Spawn constante (8s); fases (§0.1) substituem   |
| Prioridade (mecânica)                     | Ausente      | Sem sorting/deadlines/efeito mecânico           |
| Tela de fim                               | Mínima       | Só entregas; sem score/estrelas/comparação      |
| Onboarding / Pause / Música               | Ausente      | —                                               |

### Números Atuais

- **Duração da partida:** 3 minutos (09:00→17:00)
- **Spawn interval:** 8.0s **constante** (sem escala de dificuldade)
- **Stakes (dreno/derrota/foco):** removidos — ver nota de direção e §3.3/§3.4
- **Erros:** contabilizados por ticket; escolhas erradas disparam retrabalho de CR,
  mas o número de erros não alimenta mais score nem derrota

---

## 3. Mecânicas Detalhadas

### 3.1 Tickets e Tarefas

**Ticket (Demanda):** Unidade de trabalho principal. Contém 1+ tarefas.

- Possui prioridade: Urgente (0), Alta (1), Normal (2), Baixa (3)
- Single-task: wraps de uma tarefa existente
- Multi-task: cadeia de tarefas (ex: Study → Fix Typo → Test Feature)

**Task (Tarefa):** Subtarefa dentro de um ticket. Contém passos ordenados.

**Step (Passo):** Unidade atômica de ação. Contém segmentos do mesmo tipo.

**Segment:** Input individual dentro de um passo.

### 3.2 Tipos de Segmento

| Tipo           | Mecânica                                           | Exemplo                      |
| -------------- | -------------------------------------------------- | ---------------------------- |
| **Press**      | Pressionar tecla(s) indicada(s)                    | `C` para abrir o VSCode      |
| **Hold**       | Segurar tecla por X segundos                       | falar na reunião por 3s      |
| **Navigation** | Pressionar seta N vezes + confirmar                | `▼` 8x para achar a linha    |
| **Selection**  | Escolher opção correta dentre várias               | Selecionar a cor/fonte certa |
| **File**       | Busca rápida (Ctrl+P): digitar/navegar + confirmar | Abrir o arquivo certo        |
| **Wait**       | Timer passivo (progride no próprio slot)           | Esperar code review (5-10s)  |

> O `wait` progride no próprio slot enquanto o jogador trabalha em outro ticket
> (sem o re-enfileiramento do PoC — ver AUDITORIA em `src/core/domain/types.ts`).
> No fim do `wait` (o code review) é que se decide entre **rejeitar** (houve escolha
> errada) ou **mergear** (§3.3).

### 3.3 Code Review e Retrabalho (substitui a Satisfação do Chefe)

> **Removido:** a barra de satisfação do chefe (o "HP" do PoC: dreno passivo por
> prioridade, recompensa por entrega, derrota a 0%) saiu na migração web. No lugar, a
> consequência de errar passou a ser **retrabalho**, não dano.

Como funciona o ciclo atual:

- Tarefas de código terminam com **Push → Code Review (`wait` de 5–10s) → Merge**.
- Se alguma **escolha** foi confirmada errada (`nav`/`file`/`selection`), ao fim do
  code review o **CR é rejeitado**: a tarefa volta para o primeiro passo errado, o
  reviewer deixa um **comentário** explicando o que está fora do ticket, e o jogador
  refaz a escolha + push + review + merge.
- Abrir o **app errado** é um subjogo à parte: é preciso fechá-lo (`X`) antes de
  retomar.
- Erros são contados por ticket, mas hoje **não alimentam score nem derrota** — o
  custo do erro é o tempo do retrabalho.

> **Decisão pendente — stakes.** Sem dreno e sem deadline, o retrabalho não "dói"
> (o dia acaba em vitória de qualquer forma). A fonte de pressão pretendida é o
> **deadline por ticket** (§0.2): aí o tempo perdido em retrabalho passa a custar.

### 3.4 Sistema de Foco — _removido (decisão pendente)_

O medidor de concentração do PoC (+5%/s trabalhando, −50% ao trocar de ticket, bônus
de entrega 1.0x→1.5x) **não foi portado** para a versão web. Hoje trocar de contexto
não tem custo mecânico — só troca a aba/app em foco.

> A tensão de "trocar de contexto destrói sua concentração" (parte do pitch) está
> **sem suporte mecânico**. Decidir: reintroduzir o foco numa forma compatível com a
> direção nova, ou aposentá-lo de vez e ajustar o pitch.

### 3.5 Dificuldade Progressiva — _removida (a substituir pelas fases do dia, §0.1)_

> A escala de 7 níveis do PoC (abaixo) **não está mais ativa**: hoje o spawn é
> constante (8s) e o pool é sempre completo. A intenção é substituí-la pela
> **estrutura de fases do dia** (§0.1), com spawn/pool próprios por fase — não pela
> contagem de entregas. A tabela fica como referência histórica do PoC.

| Nível | Após entregas | Spawn | Drain | Pool de tickets                         |
| ----- | ------------- | ----- | ----- | --------------------------------------- |
| 0     | 0             | 8.0s  | 0.5/s | fix_login_bug, study, email             |
| 1     | 5             | 7.5s  | 0.6/s | + new_ui_feature, meeting               |
| 2     | 10            | 7.0s  | 0.7/s | + refactor_module, slack                |
| 3     | 16            | 6.5s  | 0.8/s | + deploy_hotfix, test_feature, document |
| 4     | 22            | 6.0s  | 0.9/s | + fix_typo, ui_color                    |
| 5     | 30            | 5.5s  | 1.0/s | + ui_font                               |
| 6     | 40            | 5.0s  | 1.2/s | Todos disponíveis                       |

---

## 4. Interface do Usuário

### 4.1 Tela de Jogo (UI diegética "devOS")

> A versão web abandonou o HUD genérico do PoC (com barra de satisfação e barra de
> foco, ambas removidas). A tela inteira é a **área de trabalho de um dev**: menu bar
> com relógio do expediente + entregas, inbox como **issue tracker** (estilo Linear),
> e a janela do app que a tarefa atual exige (editor, navegador, Slack — reunião e
> e-mail são páginas do navegador),
> com a "Comanda" (plano em prosa) e a hint de input no rodapé. Detalhe da estrutura
> de componentes em `src/components/README.md`.

```
┌─────────────────────────────────────────────────────┐
│  devOS              09:15            DONE: 3         │  ← Menu bar (relógio + entregas)
├────────┬────────────────────────────────────────────┤
│ INBOX  │  ╭─ VSCode ───────────────────── ● ● ● ─╮  │
│ (issue │  │  Comanda: corrija o typo na linha 8    │  │
│ tracker│  │  de login.ts; push, aguarde o CR…      │  │
│ 1 ▓▓▓  │  │                                        │  │
│ 2 ▓▓▓  │  │   [▼ 8x]  →  Enter (confirmar)         │  │
│ 3 ▓▓▓  │  ╰────────────────────────────────────────╯  │
│ 4 ░░░  │   Ctrl+P abrir arquivo · Tab trocar de app  │  ← ActionBar (hint)
│ 5 ░░░  │                                            │
└────────┴────────────────────────────────────────────┘
```

### 4.2 Feedback Visual

- **Entrega:** texto "+1 ✓" flutuante e som de entrega (sem chefe/score)
- **Code Review rejeitado:** comentário do reviewer + a tarefa volta marcada como refazer
- **App errado aberto:** janela do app errado some ao fechar com `X`
- **Fila cheia / ticket urgente:** slot destacado por prioridade (badge estilo Linear)
- **Step completo / pronto pra entrega:** progressão na comanda + som de passo/ready

> Sem feedback de satisfação/foco (removidos). Animações via CSS/Tailwind
> (`prefers-reduced-motion` respeitado); SFX por síntese (Web Audio).

---

## 5. Conteúdo Atual

> **Fonte da verdade:** os passos exatos de cada tarefa vivem em
> `src/data/tasks.ts` (e os segmentos em `src/data/segments.ts`). Este conteúdo está
> em iteração ativa; a tabela abaixo é um retrato, não o contrato. Note que **as
> tarefas de código agora terminam em Push → Code Review → Merge** (§3.3).

| Tarefa       | Passos | Descrição temática                                              |
| ------------ | ------ | --------------------------------------------------------------- |
| study        | 3      | Chrome → abrir a fonte → ler a página                           |
| meeting      | 3      | Chrome → entrar na reunião → falar (hold)                       |
| test_feature | 3      | Chrome → abrir staging → rodar testes (hold)                    |
| slack        | 3      | Slack → navegar até o canal → responder                         |
| email        | 3      | Chrome → abrir o webmail → arquivar                             |
| document     | 5      | VSCode → documentar → Push → Code Review → Merge                |
| fix_typo     | 7      | VSCode → abrir arquivo → navegar → corrigir → Push → CR → Merge |
| ui_color     | 8      | VSCode → CSS → elemento → propriedade → cor → Push → CR → Merge |
| ui_font      | 8      | VSCode → CSS → elemento → tamanho → estilo → Push → CR → Merge  |

### 5.2 Tickets Multi-Task

| Ticket          | Prioridade | Tarefas encadeadas              |
| --------------- | ---------- | ------------------------------- |
| fix_login_bug   | Alta       | Study → Fix Typo                |
| new_ui_feature  | Normal     | Study → UI Color                |
| refactor_module | Normal     | Study → Fix Typo → Test Feature |
| deploy_hotfix   | Urgente    | Slack → Fix Typo                |

---

## 6. Roadmap — Do PoC ao Produto

> **Filosofia:** A mecânica central funciona. O próximo passo não é polir o brinquedo — é construir o jogo. Isso significa definir a estrutura completa da experiência (um dia de trabalho com ritmo, decisões e identidade) antes de investir em onboarding, som ou meta-game. Só dá pra ensinar um jogo que já existe, e só dá pra expandir um jogo que já é divertido sozinho.

### Milestone 0: O Jogo Real (v0.2)

**Objetivo:** Uma sessão completa com arco narrativo, decisões estratégicas e identidade. O jogador sente que viveu um dia de trabalho, não que sobreviveu a um timer.

**Critério de sucesso:** Jogar uma partida completa e sentir que cada fase do dia foi diferente, que suas escolhas na fila importaram, e que os tickets contaram uma história.

#### 0.1 — Estrutura do Dia (a espinha dorsal do jogo)

O dia de trabalho é o que define a experiência. Sem isso, dificuldade crescente é só um número subindo. Com isso, é uma narrativa: "sobrevivi à manhã, almocei, mas a tarde me destruiu."

- [ ] **Fases do dia com ritmo próprio:**
  - **Manhã (09:00–12:00):** Ritmo moderado, aquecimento. Tickets simples, spawn espaçado. O jogador encontra o flow.
  - **Almoço (12:00–13:00):** Pausa mecânica. Recupera foco/satisfação parcialmente. Momento de respiro.
  - **Tarde (13:00–16:00):** Ritmo intenso. Tickets multi-task, spawn mais frequente, prioridades altas.
  - **Sprint Final (16:00–17:00):** Tudo ao máximo. Sprint de sobrevivência, spawn acelerado, urgências.
- [ ] **Daily stand-up (09:00):** Evento especial no início — preview dos tipos de ticket do dia.
- [ ] **Transições entre fases:** Feedback visual/textual claro ("Hora do almoço!", "Boa tarde... prepare-se").
- [ ] **Parâmetros por fase:** Cada fase define seus próprios spawn interval, drain rate, e pool de tickets (substituindo a progressão puramente por nível de entregas).

#### 0.2 — Deadlines por Ticket (a fila como espaço de decisão)

Sem deadline, a fila é uma lista. Com deadline, é um campo de decisão: "qual apago incêndio? qual deixo queimar?"

> **Agora é a fonte primária de stakes.** Com a satisfação removida (§3.3), o deadline
> deixa de ser "mais uma pressão" e passa a ser **a** pressão. As menções a
> "penalidade de satisfação" e a recompensa em pontos (`+15`/`+10`) abaixo são do
> modelo antigo e precisam de uma nova moeda — definir junto com a decisão de stakes
> (uma nota/score do dia? expirar = falha do dia?).

- [ ] **Timer visível por ticket:** Countdown no slot da fila, proporcional à prioridade.
  - Urgente: 30s, Alta: 45s, Normal: 60s, Baixa: 90s
- [ ] **Expiração:** Ticket que expira = penalidade de satisfação proporcional à prioridade.
- [ ] **Recompensa proporcional:**
  - Urgente entregue a tempo = +15 (vs +10 base)
  - Baixa prioridade = +6
  - Entrega após deadline = metade da recompensa
- [ ] **Escalation:** Tickets na fila há muito tempo sobem de prioridade.
  - Visual claro: borda muda de cor, badge atualiza.

#### 0.3 — Flavor Text e Identidade (o humor É o jogo)

Sem identidade, o jogo é genérico — poderia ser sobre qualquer tema. Flavor text é baixo custo e transforma "ticket #4 prioridade alta" em "O CEO viu o site no celular e está em pânico".

- [ ] **Flavor text por ticket:** Cada ticket template tem 3-5 frases de contexto que aparecem aleatoriamente.
  - "O cliente ligou gritando que o botão é azul e deveria ser verde"
  - "Reunião de alinhamento sobre a reunião de ontem"
  - "PR aberto há 3 dias, 47 comentários, nenhum approval"
  - "O estagiário fez push na main"
  - "PO mudou o escopo pela terceira vez hoje"
- [ ] **Nomes descritivos nos tickets:** Em vez de "Fix Login Bug", mostrar "Corrigir bug que ninguém consegue reproduzir".
- [ ] **Toast de contexto em eventos:** Mensagens temáticas quando tickets urgentes aparecem, fila lota, etc.

#### 0.4 — Tela de Fim Informativa (o "quase ganhei" que faz repetir)

Quando o jogador perde, precisa ver _por que_ perdeu e _quanto faltou_. Isso transforma "perdi" em "quase ganhei, vou tentar de novo".

- [ ] **Game over informativo:**
  - Quanto tempo faltava ("Faltavam 28 segundos pro fim do expediente!")
  - Tickets entregues vs expirados
  - Maior streak sem erros
  - Fase do dia em que perdeu ("Você não sobreviveu à tarde")
- [ ] **Vitória informativa:**
  - Resumo do dia: tickets por fase, erros totais, pico de foco
  - Avaliação simples (1-3 estrelas baseado em performance)
  - Comparação com melhor run

---

### Milestone 1: Jogabilidade (v0.3)

**Objetivo:** O jogo é acessível e tem game feel. Qualquer pessoa consegue pegar e jogar.

#### 1.1 — Onboarding

- [ ] **Tutorial integrado no primeiro dia:**
  - Primeiro ticket guiado: "Pressione 1 para selecionar", seta apontando pro slot
  - Segundo ticket introduz entrega: "Pressione Enter para entregar"
  - Terceiro ticket introduz tipos de input (hold, nav, selection)
  - Drain desativado durante tutorial, ativa gradualmente
  - Ensinar fazendo, revelar mecânicas aos poucos
- [ ] **Hints contextuais durante gameplay:**
  - Primeira vez que fila lota: "Cuidado! Inbox cheia"
  - Primeira vez que troca de ticket: "Trocar de contexto reduz seu foco"
  - Primeira wait: "Esperando code review... trabalhe em outra demanda"
  - Primeiro ticket expirando: "Corra! Essa demanda vai expirar"

#### 1.2 — Som

- [ ] **SFX essenciais:**
  - Tecla correta (click satisfatório)
  - Tecla errada (buzz curto)
  - Step completo (ding progressivo)
  - Entrega (cash register / swoosh)
  - Ticket novo na fila (notificação sutil)
  - Ticket expirando (alarme urgente)
  - Satisfação baixa (heartbeat / alarme suave)
  - Game over (descending tone)
  - Vitória (fanfarra curta)
  - Transição de fase do dia (sino/chime)
- [ ] **Música de fundo:**
  - Loop lo-fi/chiptune que acompanha a fase do dia
  - Manhã: chill, produtivo
  - Tarde: ritmo sobe, tensão
  - Sprint final: urgência máxima
  - Transições suaves entre fases

#### 1.3 — Funcionalidades básicas

- [ ] **Pause (ESC):** Overlay com "PAUSADO", opções de continuar/reiniciar/sair
- [ ] **Persistência de high score:** Salvar em disco, mostrar na tela de fim
- [ ] **Controle de volume:** Pelo menos mute toggle

#### 1.4 — Balanceamento

- [ ] **Curva do primeiro dia suave:**
  - Manhã sempre começa com tickets single-task curtos
  - Spawn espaçado nos primeiros 30s
  - Deadlines generosos no início
- [ ] **Feedback mais claro de "o que fazer agora":**
  - Estado vazio (sem ticket selecionado) ter call-to-action forte
  - Ticket completo piscar "ENTER" mais agressivamente
  - Ticket expirando ter urgência visual crescente

---

### Milestone 2: Interrupções e Caos (v0.4)

**Objetivo:** Simular a realidade caótica que todo dev conhece.

- [ ] **Interrupções do chefe:**
  - Pop-up modal que pausa o ticket atual
  - Mini-tasks rápidos: "Responda o cliente" (3 teclas), "Atualize o status" (2 teclas)
  - Foco cai -30% ao ser interrompido
  - Frequência aumenta na tarde e sprint final
- [ ] **Eventos aleatórios:**
  - "Deploy quebrou!" — ticket urgente forçado na fila
  - "CI/CD travou" — waits demoram 2x por 30s
  - "Slack bombardeio" — notificações visuais como distração
- [ ] **Ticket bloqueado:** Precisa entregar ticket A antes de começar B
  - Indicação visual de dependência

---

### Milestone 3: Progressão e Meta-game (v0.5)

**Objetivo:** Razão para jogar mais de uma vez. Só faz sentido depois que um dia é divertido sozinho.

- [ ] **Múltiplos dias:** Progressão entre dias (5 dias = semana), cada dia mais difícil
- [ ] **Upgrades entre dias:**
  - "Café premium": Focus drena menos (-40% vs -50%)
  - "Fone noise-cancelling": Interrupções -30% penalidade → -20%
  - "Monitor ultrawide": +1 slot na fila
  - "Mechanical keyboard": Hold 20% mais rápido
  - "Standing desk": Drain 10% menor
- [ ] **Avaliação end-of-day:** Estrelas 1-3, resumo, comparação
- [ ] **Leaderboard local:** Top 10 scores
- [ ] **Modos de jogo:**
  - Endless: Sem relógio, sobreviva o máximo
  - Sprint: 1 minuto, máximo de entregas

---

### Milestone 4: Identidade e Polish Final (v0.6)

**Objetivo:** O jogo tem personalidade e acabamento.

- [ ] **Arte do chefe:** Expressões animadas (idle, feliz, irritado, furioso)
- [ ] **Tema visual coeso:** Paleta refinada, tipografia, ícones
- [ ] **Animações premium:** Tickets caem com peso, entregas voam, partículas
- [ ] **Mais conteúdo:**
  - 5+ novos tickets multi-task para variedade
  - Variação de dificuldade por ticket mais granular
- [ ] **Achievements:**
  - "Zero bugs", "Speed demon", "Zen master", "Firefighter"
- [ ] **Estatísticas por run:** Gráfico de satisfação ao longo do tempo

---

## 7. Referências de Design

### Jogos de Referência

- **Overcooked:** Caos cooperativo, gerenciamento de tempo, receitas = tickets
- **Papers, Please:** Pressão de tempo + checklist + consequências
- **Cook, Serve, Delicious:** Sequências de input, clientes impacientes
- **WarioWare:** Micro-jogos rápidos com inputs variados
- **Typing of the Dead:** Pressão + digitação como mecânica central

### Humor e Tom

- A frustração de verdade de ser dev é a diversão do jogo
- Situações reconhecíveis: code review que demora, reunião desnecessária
- Chefe como força cósmica inevitável, não um vilão pessoal
- Tom leve, não amargo — rir da dor, não sofrer com ela

---

## 8. Especificações Técnicas

### Arquitetura (pós-migração — ver `DESIGN_CONSULTORIA.md` §10)

- **Stack:** Next.js + TypeScript + Tailwind (web).
- **Core desacoplado:** lógica de jogo em TS puro (classe `Game`) rodando em
  `requestAnimationFrame`; React só renderiza. Os 6 services do Godot foram
  consolidados em `Game`.
- **Bridge core ↔ UI:** store **Zustand** (`src/store/`) — substitui o EventBus. O
  core publica `Snapshot` + uma fila de `SoundEvent`.
- **Áudio:** síntese via Web Audio (`src/store/sound.ts`), zero assets.
- **UI:** componentes React diegéticos (`src/components/desktop/`); animação em
  CSS/Tailwind por ora (GSAP/Framer só se precisar de timeline).
- **Data:** templates TS (`src/data/`, port dos `.tres`) → instances de runtime
  (`src/core/domain/instance.ts`).

> Mapa de camadas e regras em `AGENTS.md` e nos `README.md` de cada pasta de `src/`.

### Princípios da casca daily (ainda não implementados)

- Seed do dia (mesmo desafio pra todos), streak e share como **estrutura**, não
  add-on tardio (`DESIGN_CONSULTORIA.md` §3).
- Analytics desde o primeiro release (§9.7).

### Performance

- Web grátis viral: bundle leve e first-load rápido importam (§10.1).
- Sem network/multiplayer no escopo atual.

---

## 9. Resumo de Prioridades

| #     | Milestone              | Entrega                                                 | Impacto     | Esforço  |
| ----- | ---------------------- | ------------------------------------------------------- | ----------- | -------- |
| **0** | **O Jogo Real**        | **Sessão completa com estrutura, decisão e identidade** | **Crítico** | **Alto** |
| 1     | Jogabilidade           | Onboarding, som, pause, balanceamento                   | Alto        | Alto     |
| 2     | Interrupções e Caos    | Humor e realismo, eventos aleatórios                    | Alto        | Alto     |
| 3     | Progressão e Meta-game | Múltiplos dias, upgrades, replayability                 | Alto        | Alto     |
| 4     | Identidade e Polish    | Arte, animações, achievements, conteúdo                 | Médio       | Médio    |

**Prioridade absoluta:** Milestone 0. A mecânica central existe — agora é construir o jogo em volta dela. Estrutura do dia, deadlines nos tickets e identidade via humor definem o que o jogo _é_. Sem isso, não há o que ensinar (onboarding), o que acompanhar (som) nem o que expandir (meta-game).
