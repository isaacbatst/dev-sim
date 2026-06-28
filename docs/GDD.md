# Dev Task Chef - Game Design Document

## 1. Visão Geral

**Título:** Dev Task Chef
**Gênero:** Simulador de Ritmo / Gerenciamento de Tempo
**Plataforma:** Desktop (Godot 4.6)
**Tema:** Dia a dia caótico de um desenvolvedor de software
**Tom:** Humor ácido sobre a vida corporativa de dev

### Pitch

Você é um desenvolvedor tentando sobreviver ao expediente. Tickets chegam sem parar, o chefe perde a paciência a cada segundo, e trocar de contexto destrói sua concentração. Gerencie demandas, mantenha o foco e entregue tudo antes das 17h — ou seja demitido.

### Core Loop

```
Tickets chegam → Selecionar ticket → Executar passos (press/hold/nav/select/wait) → Entregar → Satisfação sobe → Repetir
```

### Win/Lose

- **Vitória:** Sobreviver até as 17:00 (3 minutos em tempo real)
- **Derrota:** Satisfação do chefe chega a 0%

---

## 2. Estado Atual (v0.1 - Proof of Concept)

O PoC valida que as mecânicas centrais funcionam tecnicamente. O core loop roda, os 6 tipos de input respondem, a dificuldade escala e o jogo tem condição de vitória/derrota. Mas **não é algo que alguém jogaria por vontade própria** — falta som, contexto, onboarding e razão para voltar.

### O que o PoC provou

- A hierarquia Ticket → Task → Step → Segment funciona e é extensível
- 6 tipos de input (press, hold, nav, selection, wait) criam variedade
- Multi-task tickets adicionam complexidade estratégica
- O sistema de foco cria tensão real na decisão de trocar contexto
- A pressão do drain + fila lotando gera urgência palpável
- O feedback visual (animações, toasts, cores) comunica bem o estado do jogo

### O que falta para ser um jogo de verdade

- **Sem estrutura de dia** — pressão linear crescente, toda partida igual, sem arco narrativo
- **Sem deadlines nos tickets** — fila é lista, não espaço de decisão; prioridade é só visual
- **Sem identidade** — tickets genéricos, sem humor, sem "isso acontece comigo todo dia"
- **Sem feedback de derrota** — jogador perde e não sabe por que nem quanto faltou
- **Mudo** — sem SFX nem música, o game feel não existe
- **Sem onboarding** — jogador novo não entende nada
- **Sem pause** — não dá pra parar

### Implementado no PoC

| Feature                                   | Status   | Notas                                       |
| ----------------------------------------- | -------- | ------------------------------------------- |
| Hierarquia Ticket > Task > Step > Segment | Completo | 4 camadas funcionais                        |
| Fila de tickets (5 slots)                 | Completo | Spawn automático, seleção 1-5               |
| 6 tipos de segmento                       | Completo | Press, Hold, Nav, Selection, Wait           |
| 9 tarefas template                        | Completo | study, meeting, slack, email, etc.          |
| 13 tickets template                       | Completo | 9 single-task + 4 multi-task                |
| Multi-task tickets                        | Completo | Encadeia subtarefas sequenciais             |
| Satisfação do chefe                       | Completo | Drain contínuo + recompensa por entrega     |
| Progressão de dificuldade                 | Completo | 7 níveis, spawn/drain escalam               |
| Relógio (09:00→17:00)                     | Completo | 3 min real = 8h game                        |
| Sistema de foco                           | Completo | +5%/s trabalhando, -50% ao trocar           |
| Prioridade (visual)                       | Completo | Badges URGENTE/ALTA/NORMAL/BAIXA            |
| Prioridade (mecânica)                     | Parcial  | Multiplica drain, mas sem sorting/deadlines |
| Feedback visual                           | Completo | Shake, flash, floating text, toasts         |
| Debug overlay                             | Completo | F12, params ajustáveis                      |
| Tela de abertura                          | Completo | Título + ENTER                              |
| Tela de game over                         | Completo | Score, best score, restart                  |

### Números Atuais

- **Duração da partida:** 3 minutos
- **Satisfação inicial:** 100%
- **Drain base (nível 0):** 0.5/s → (nível 6): 1.2/s
- **Recompensa por entrega:** +10 base - (erros × 3) × foco_multiplier
- **Foco:** 0→100%, bônus 1.0x→1.5x
- **Spawn interval:** 8.0s (nível 0) → 5.0s (nível 6)
- **Grace period:** 12 segundos sem drain

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

| Tipo           | Mecânica                              | Exemplo                     |
| -------------- | ------------------------------------- | --------------------------- |
| **Press**      | Pressionar tecla(s) indicada(s)       | `W` para abrir browser      |
| **Hold**       | Segurar tecla por X segundos          | `F` para falar em reunião   |
| **Navigation** | Pressionar seta N vezes               | `▼` 8x para encontrar linha |
| **Selection**  | Escolher opção correta dentre várias  | Selecionar arquivo correto  |
| **Wait**       | Timer passivo (ticket volta pra fila) | Esperar code review (5-10s) |

### 3.3 Satisfação do Chefe

A barra de satisfação é o "HP" do jogo.

- **Drain passivo:** `drain_rate × priority_multiplier` por segundo
  - Urgente: ×2.0, Alta: ×1.5, Normal: ×1.0, Baixa: ×0.7
- **Recompensa por entrega:** `(10 - erros × 3) × focus_bonus`
- **Grace period:** Primeiros 12s sem drain
- **Feedback visual por faixas:**
  - <30%: Barra pulsa
  - <20%: Chefe treme
  - <15%: Tela pisca vermelho

### 3.4 Sistema de Foco

O foco premia consistência e penaliza troca de contexto.

- **Ganho:** +5%/s enquanto trabalha num ticket
- **Perda:** -50% ao trocar para ticket diferente
- **Bônus na entrega:** Multiplicador 1.0x (0%) → 1.5x (100%)

### 3.5 Dificuldade Progressiva

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

### 4.1 Tela de Jogo (Playing Screen)

```
┌─────────────────────────────────────────────────────┐
│  :)  ████████████████░░░░  90%     09:15   DONE: 3  │  ← Top Bar
│  ═══════════════════════════════════                 │  ← Focus Bar
├────────┬────────────────────────────────────────────┤
│ INBOX  │                                            │
│        │   [Fix Login Bug]  URGENTE  ★★             │
│ 1 ░░░  │   "Corrigir bug de autenticação"           │
│ 2 ░░░  │                                            │
│ 3 ░░░  │   [W]  [▼8x]  [►fix◄]  [E]  ⏳            │
│ 4 ░░░  │         ^^^^                               │
│ 5 ░░░  │       (atual)                              │
│        │                                            │
├────────┴────────────────────────────────────────────┤
│  1-5 Selecionar demanda    Enter Entregar demanda   │  ← Hints
└─────────────────────────────────────────────────────┘
```

### 4.2 Feedback Visual

- **Entrega sem erros:** "+10 ✓" verde flutuante, chefe sorridente
- **Entrega com erros:** "+X (Y erros)" amarelo/vermelho, toast de erros
- **Foco alto:** Barra dourada pulsante, "+Xfoco!" flutuante
- **Fila cheia:** Sidebar pulsa em vermelho
- **Ticket urgente:** Slot pulsa em vermelho
- **Step completo:** "Passo completo!" bounce
- **Subtask completa:** "Tarefa 1/2 completa!" flash teal

---

## 5. Conteúdo Atual

### 5.1 Tarefas

| Tarefa       | Passos | Descrição temática                                                 |
| ------------ | ------ | ------------------------------------------------------------------ |
| study        | 2      | Abrir browser → Ler Stack Overflow/Tutorial                        |
| meeting      | 2      | Abrir browser → Entrar na reunião                                  |
| test_feature | 2      | Abrir staging → Testar feature                                     |
| slack        | 3      | Browser → Slack → Responder mensagem                               |
| email        | 3      | Browser → Email → Arquivar                                         |
| document     | 2      | Browser → Escrever documentação                                    |
| fix_typo     | 7      | VSCode → Arquivo → Navegar → Corrigir → Push → Code Review → Merge |
| ui_color     | 4      | VSCode → Arquivo → Navegar → Selecionar cor                        |
| ui_font      | 5      | VSCode → CSS → Navegar → Font style → Propriedade                  |

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

### Arquitetura

- **Engine:** Godot 4.6, GDScript
- **Pattern:** Service-Oriented + Event-Driven
- **Services:** TaskService, BossService, DifficultyService, StateService, ClockService, FocusService
- **EventBus:** Autoload singleton, 47 sinais
- **UI:** UIAnimator (static), UIColors (palette centralizada)
- **Data:** Templates (.tres) → Instances (runtime)

### Performance

- Alvo: 60 FPS constante
- Sem network/multiplayer no escopo atual
- Leve em recursos (2D, sem física complexa)

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
