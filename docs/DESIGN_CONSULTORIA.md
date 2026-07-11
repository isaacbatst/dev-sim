# Consultoria de Design — Dev Task Chef

> **Data:** 2026-06-27
> **Formato:** Sessão de consultoria de game/product design sobre priorização e definição antes de implementar.
> **Status:** Diagnóstico + direção estratégica. Decisões ainda a confirmar/executar.
> Documento de raciocínio. O `GDD.md` continua sendo a referência de design; o **Linear** é a fonte da verdade de tarefas.

---

## 1. Contexto da sessão

O projeto tem um PoC funcional (core loop roda, 6 tipos de input, dificuldade escala, win/lose existe), mas o próprio GDD admite: _"não é algo que alguém jogaria por vontade própria"_ (GDD linha 27). A dúvida trazida foi: **estou priorizando e definindo as coisas certas antes de implementar?**

### Respostas que ancoraram o diagnóstico

- **Ambição/destino:** Pode ser comercial, mas num modelo criativo tipo **daily game**; ou começar como **página web grátis** pra facilitar adesão, e a parte comercial vir depois de ter base.
- **Playtest:** **Só o autor jogou.** Diagnóstico de "não é divertido" = falta de progressão, variedade e razão pra voltar no dia seguinte.
- **Verbo principal desejado:** A **tensão** (foco vs. troca de contexto) pode ser ótima como estrela, mas **primeiro garantir o básico estilo CSD excelente**.

---

## 2. Diagnóstico principal

### 2.1 O documento bom esconde a pergunta certa

O GDD é maduro e bem organizado — e isso é perigoso, porque parece um projeto resolvido. A frase mais importante do doc inteiro é "não é algo que alguém jogaria por vontade própria", e **o roadmap não a ataca de frente**: ele _assume_ que a falta de diversão vem de falta de estrutura/identidade/som, e parte para construir muito jogo em cima de um núcleo cuja diversão ainda não foi localizada. **Risco nº 1.**

### 2.2 Não confiar no próprio tédio (armadilha de saturação)

O autor é a única pessoa que jogou, e jogou o loop centenas de vezes debugando. Isso é **saturação, não tédio** — coisas diferentes. O desenvolvedor é o pior juiz de "o core é divertido" porque é a única pessoa imune a ele.

→ Consequência: a conclusão "falta meta-progressão" pode estar **resolvendo o problema errado**. O recado real do tédio é "eu não sou mais cobaia válida", não "falta meta-game". **Olhos frescos antes de decidir o que falta.** Isso importa porque meta-progressão (Milestone 3) é caríssima de construir.

### 2.3 Falta definir o "verbo principal"

Há dois jogos brigando dentro do design:

- **Triagem (estratégia):** a graça é _decidir_ qual ticket atacar (fila, deadlines, prioridades). Ref: _Papers Please_, _Mini Motorways_.
- **Execução (destreza):** a graça é _executar_ inputs com fluidez/flow. Ref: _Cook Serve Delicious_, _Typing of the Dead_.

O **Sistema de Foco** materializa a tensão entre os dois: pune trocar de ticket (-50%), enquanto deadlines/prioridades recompensam trocar (apagar incêndio). Isso pode ser um **dilema delicioso** ou uma **contradição frustrante** — e hoje não se sabe qual é.

**Direção escolhida pelo autor:** CSD-excelente como base; a tensão como camada de profundidade/diferencial _depois_.

### 2.4 Os inputs são a maior aposta não-testada

Em CSD/Typing of the Dead o input **é** a expressão de habilidade — rápido, ritmado, com cara de competência. No PoC, "▼ 8x pra achar a linha → aperta E" corre risco de ser **busywork arbitrário**. Se o input não é gostoso _sozinho_, nenhum flavor text ou estrutura de dia salva.

---

## 3. A sacada estratégica: modelo "daily game"

> **⚠ ESTRATÉGIA INVERTIDA (2026-06, ver `DIRECAO_GAMEPLAY.md` §2 e `EXPEDIENTE.md` §5).**
> Este doc é a consultoria inicial e prega **daily-calendário PRIMEIRO** com o Milestone 3
> (campanha/múltiplos dias) "morto ou opcional". A direção **convergiu no oposto**:
> **campanha-primeiro** (os "múltiplos dias" são a espinha, não o M3 descartado), e o
> **daily-calendário + seed + share virou ENDGAME**. Além disso, "daily" no sentido que
> importa agora = o **limite-por-dia** (racionar consumo via fadiga, `EXPEDIENTE §4`), não o
> daily-calendário-social. E o próprio insight "carreira não retém sozinha" (CSD) é honrado
> em `EXPEDIENTE §5` — mas a solução é *a carreira ABASTECER o daily*, não substituí-lo por
> ele. Bloco mantido como registro histórico da decisão de migrar.

O modelo daily resolve a retenção de forma **mais barata e melhor encaixada** que meta-progressão. Daily games não prendem com grind/upgrades, mas com três coisas baratas:

1. **Um desafio fresco por dia, igual pra todos (mesmo seed)** → variedade sem precisar de centenas de tickets.
2. **Resultado compartilhável** (o "🟩🟩⬛" que vira flex social) → aquisição viral; perfeito para "web grátis primeiro".
3. **Streak** → o motivo de voltar amanhã.

O tema encaixa muito bem: _"A terça-feira de hoje"_ — todo mundo enfrenta o mesmo dia de trabalho gerado e compara resultados.

### Impacto no roadmap

- **Milestone 3 inteiro** (múltiplos dias, upgrades, leaderboard, modos) provavelmente **morre ou vira opcional** — a estrutura "daily + streak + share" _é_ a retenção.
- Escopo encolhe e fica mais nítido: troca-se um milestone enorme e arriscado por uma casca fina em volta de um core excelente.

### A disciplina que o modelo exige

O daily **não tem onde se esconder**: 3 minutos, uma vez por dia. Sem grind pra mascarar core fraco. Por isso o modelo **reforça** a intuição "CSD excelente primeiro".

---

## 4. O que "CSD excelente" significa em concreto

Checklist para auditar os inputs atuais:

1. **Teto de velocidade** — um expert consegue ir rápido? O input não pode travar num ritmo fixo.
   - 🚩 **Maior problema suspeito:** **Hold** ("segurar F por X s") e **Wait** ("esperar code review") são **tempo morto** — o oposto de habilidade. Em CSD nunca se segura nem se espera. Auditar sem dó: criam flow ou criam pausa?
2. **Ritmo e memória muscular** — sequências viram automáticas e gostosas de mandar. "▼ 8x" tem cara de tarefa; vira número fixo memorizável ou busywork aleatório?
3. **Suco por tecla** — toda tecla certa com confirmação áudio+visual imediata (nível tátil).
4. **Erro pune pouco e recupera rápido** — tecla errada = buzz curto, segue o jogo.
5. **Legível num relance** — lê-se o que apertar instantaneamente, sem caçar.

A **tensão foco-vs-triagem** é tempero sobre essa base; só entra depois que os 5 itens estão excelentes. Tensão sobre input chato = input chato com dilema.

---

## 5. Pilha de prioridade revisada

| Ordem | O quê                                                                                                    | Por quê                                                                   |
| ----- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **1** | **Auditar e consertar o feel dos inputs** (matar tempo morto de Hold/Wait, suco por tecla, legibilidade) | É o "CSD excelente". Sem isso, nada importa. Daily não perdoa core fraco. |
| **2** | **3 pessoas reais jogando, autor calado, anotando onde desengajam**                                      | Combate a saturação. Olhos frescos antes de decidir o que falta.          |
| **3** | **Deadlines + flavor text** (GDD 0.2 + 0.3)                                                              | Baratos; ativam a tensão-triagem e a identidade.                          |
| **4** | **Casca daily: seed do dia + streak + tela de resultado compartilhável**                                 | A retenção real. Substitui quase todo o Milestone 3.                      |
| **5** | Estrutura do dia, som, onboarding (GDD 0.1, M1)                                                          | Afinação/acabamento sobre um core já validado.                            |
| ~~X~~ | ~~Meta-progressão: upgrades, múltiplos dias, leaderboard, modos (M3)~~                                   | Provavelmente deletar. O daily faz esse trabalho mais barato.             |

### Reordenação do Milestone 0 por RISCO (não por completude narrativa)

O GDD ordena 0.1 (estrutura do dia) primeiro por lógica narrativa. Mas a ordem deveria seguir **risco × custo**:

| Sub-item GDD          | O que realmente é                                       | Risco | Custo  | Quando      |
| --------------------- | ------------------------------------------------------- | ----- | ------ | ----------- |
| 0.2 Deadlines         | Transforma fila em decisão; testa "triagem é divertida" | Alto  | Baixo  | Cedo        |
| 0.3 Flavor/identidade | Testa "o tema faz sorrir"; custo ~zero                  | Médio | Mínimo | Em paralelo |
| 0.1 Estrutura do dia  | Pacing/afinação, não descoberta                         | Baixo | Alto   | Depois      |
| 0.4 Tela de fim       | Retenção; só importa quando já querem repetir           | Baixo | Médio  | Por último  |

---

## 6. Mudança de mentalidade (resumo de uma linha)

A tentação era construir **mais jogo** (progressão, conteúdo, meta) pra resolver o tédio. Dado que é um **daily web grátis**, a resposta certa é construir **menos jogo, mais afiado**: 3 minutos impecáveis + um resultado que dá vontade de postar. Alvo menor, muito mais provável de terminar e lançar.

---

## 7. Definições de produto ainda em aberto

- **Público:** "devs" é tema, não público. Coffee-break web? Nicho de portfólio dev? Definir muda duração de sessão e tom.
- **Critério de sucesso observável** (substituir "jogar e sentir"): playtester novo aperta restart sozinho? ri de algum flavor text? consegue verbalizar uma decisão que tomou na fila? compartilharia o resultado?
- **Sessão de 3 min vs. "arco narrativo de um dia":** há tensão entre arcade score-chaser e simulador narrativo. O modelo daily empurra para o lado arcade/compartilhável — confirmar.

---

## 8. Próximos passos propostos

1. **Auditoria técnica dos 6 tipos de segmento** contra o checklist CSD (seção 4) — apontar quais criam tempo morto e o que fazer com Hold/Wait.
2. **Rascunho da tela de resultado compartilhável** (o "🟩🟩⬛" do jogo) — motor de aquisição, vale desenhar cedo.
3. Confirmar a direção daily-game e refletir no `GDD.md` / criar issues no Linear.

---

## 9. Monetização — como ganhar dinheiro aqui

### 9.1 Tese central: o maior pagador provavelmente não é o jogador

O tema esconde um ativo raro: **o público são desenvolvedores.** Dev tem renda alta, e existe uma indústria inteira (DevTools, cloud, recrutamento, conferências) que paga caro pra alcançar devs — público que ignora propaganda tradicional e usa adblock. Logo, um daily jogado por milhares de devs **não é só um jogo, é um canal de mídia para um público premium e difícil de atingir.**

→ A monetização mais assimétrica aqui **não é microtransação (B2C), é B2B**: empresas pagando pra estar dentro do jogo.

### 9.2 A disciplina: tudo é downstream de audiência

Nenhum modelo funciona sem DAU. Patrocinador paga por olhos; assinatura precisa de base; anúncio precisa de volume. **Regra de ouro: o ativo a construir primeiro é a audiência, não a infra de pagamento.** Monetização vem depois do loop de compartilhamento funcionar.

### 9.3 Avenidas B2B (onde mora o dinheiro grande, dado o público dev)

| Modelo                                     | Como funciona                                                                                                                              | Teto       | Risco ao loop viral      |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------- | ------------------------ |
| **Conteúdo patrocinado nativo**            | DevTool patrocina um dia/ticket. _"Deploy quebrou — investigue no [Sentry]"_. Engraçado e nativo, não banner. **Se disfarça de conteúdo.** | Alto       | Baixo, com bom gosto     |
| **White-label / DevRel tool**              | Versão customizada pra empresa usar em campanha, landing de carreira, lançamento de produto.                                               | Alto       | Nenhum (produto à parte) |
| **Ativação de conferência / recrutamento** | Jogo de estande, lead-gen, employer branding, "qual time de eng sobrevive melhor à segunda?".                                              | Médio-alto | Nenhum                   |

### 9.4 Avenidas B2C (menor por cabeça, escala com volume)

| Modelo                                     | Como funciona                                                                                                                                                  | Teto        | Observação                                                                   |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------- |
| **Versão premium (Steam)**                 | Web daily = funil/demo; versão paga tem campanha, meta-progressão, upgrades, mais conteúdo. O Milestone 3 "morto" no daily **renasce aqui como produto pago.** | Médio-alto  | Modelo Vampire Survivors / Wordle→NYT                                        |
| **Assinatura "Pro"**                       | Arquivo de dailies passados, stats, modos extras, sem anúncios. **Modelo NYT Games** — referência mais forte de daily lucrativo.                               | Médio       | Só com retenção provada                                                      |
| **PWYW / doação** (Ko-fi, GitHub Sponsors) | Cultura dev tolera bem. Baixa fricção/receita, mas honesto e cedo-compatível.                                                                                  | Baixo       | Bom sinal de demanda                                                         |
| **Cosméticos**                             | ~~Skins do chefe~~ (chefe não existe), sons de teclado, temas de mesa. _NB: cosmético hoje é FEITO/biografia, não compra — `PROGRESSAO §2.1`._                  | Baixo-médio | Precisa de conta + DAU; não cedo                                             |
| **Anúncios**                               | Rewarded ("veja anúncio pra retry/dica") menos hostil que display.                                                                                             | Baixo       | ⚠️ **Dev odeia anúncio.** Pode envenenar goodwill/shareability. Evitar cedo. |

### 9.5 O que NÃO fazer (proteger o ativo)

- **Não colocar o daily atrás de paywall** — mata o loop viral, que é a coisa toda.
- **Não meter anúncio agressivo cedo** — com público dev, custo de reputação supera receita.
- **Não construir contas/cosméticos/assinatura antes de ter demanda** — infra cara pra um problema que ainda não existe.

### 9.6 Faseamento

- **Agora (pré-audiência):** monetização **zero**. Única ação de negócio = **instrumentar analytics** (ver 9.7). Os números (a) dizem se há negócio antes de investir mais e (b) **são literalmente o que se vende depois** a um patrocinador.
- **Tendo base (~1k+ DAU dev):** toques leves — PWYW/doação; conversa com _um_ DevTool pra patrocínio piloto; testar "Pro" de arquivo só se a retenção justificar.
- **Com retenção/viralidade provadas:** receita real — deals de conteúdo patrocinado, white-label DevRel, e/ou versão premium na Steam.

### 9.7 Métricas a instrumentar desde o primeiro release (única ação concreta hoje)

São o termômetro de "existe negócio?" **e** o futuro pitch de vendas. Mínimo viável:

**Aquisição & viralidade**

- **Jogadores únicos/dia (DAU)** e novos vs. recorrentes.
- **Taxa de compartilhamento** = % de partidas que geram um share (clicou em compartilhar/copiou resultado).
- **K-factor** = novos jogadores trazidos por jogador (visitas vindas de link compartilhado ÷ jogadores que compartilharam). É o número que diz se cresce sozinho.
- **Origem do tráfego** (referrer): de onde vêm (Twitter/X, Reddit, HN, Discord...).

**Retenção (o coração de um daily)**

- **D1 / D7 retention** — voltou no dia seguinte? na semana?
- **Streak médio e distribuição** — quantos dias seguidos as pessoas jogam.
- **Sessões por jogador por dia** (idealmente ~1 num daily; muito acima pode indicar retry/frustração).

**Engajamento da sessão (proxy de "o core é bom?")**

- **Taxa de conclusão** — % que termina a partida vs. abandona no meio (e **em que momento** abandona — funil por fase/ticket).
- **Resultado da partida** — venceu/perdeu, tickets entregues, erros, pico de foco.
- **Tempo até o primeiro input** e **até o primeiro abandono** (detecta fricção de onboarding).

**Identidade/tom (valida a aposta do humor)**

- **Cliques/leitura de flavor text**, e se partidas com flavor compartilham mais (correlação humor ↔ share).

> Implementação: um evento simples por marco (`session_start`, `first_input`, `ticket_delivered`, `session_end{result, delivered, errors}`, `share_clicked`, `day_returned`). Ferramenta leve e privacy-friendly (ex.: Plausible/PostHog) basta — não precisa de stack pesada. O importante é **ter o funil desde o primeiro release**, porque dado retroativo não existe.

---

## 10. Decisão de stack: migrar de Godot para web

> **Decisão (2026-06-27):** Vamos **migrar de Godot para uma stack web (TS).** Aprender Godot não é objetivo pessoal/de carreira — confirmado pelo autor. O PoC em Godot cumpriu o papel de **protótipo de design** e segue como referência, mas o jogo de verdade nasce na stack web.

### 10.1 Por que migrar

1. **A stack tem que casar com a distribuição, e o modelo é web-nativo.** O export WASM do Godot briga com o que _é_ o produto (daily grátis, baixa fricção, mobile, compartilhável): bundle pesado, first-load lento, mobile web frágil, canvas opaco ao browser (SEO/acessibilidade/texto — e o jogo é cheio de texto). Pra premium Steam isso não importaria; pra web grátis viral, importa muito.
2. **Fluência é o multiplicador, e bem agora.** O risco nº 1 é "o core é divertido?", que exige muita iteração em feel — onde 6 anos de TS/React/Node contra pouca experiência em Godot é diferença enorme de velocidade.
3. **Momento mais barato pra trocar.** O design ainda não está travado (só o autor jogou, diversão não localizada), então há pouco tuning precioso a perder. Cada semana de tuning/conteúdo no Godot encarece a migração.
4. **Toda a casca daily + monetização + analytics é web-nativa** (seed do dia, streak, leaderboard, share, ingestão de eventos) — quintal do autor.

### 10.2 O que NÃO é (anti-sunk-cost)

O Godot não foi desperdício: validou a hierarquia, os tipos de input e provou que o loop roda. Esse é aprendizado de **design**, que vai intacto pro TS. Migrar ≠ recomeçar.

### 10.3 Stack proposta

O jogo é **UI-driven com timing** (painéis, fila, texto, teclas, animações) — não precisa de game engine de verdade.

- **Core do jogo:** TS puro em loop de `requestAnimationFrame`, **desacoplado do render** (lógica não roda no ciclo do React). **XState** pra modelar o fluxo Ticket→Task→Step→Segment e estados de input.
- **UI/shell:** React + **GSAP** ou **Framer Motion** pro suco (equivalente ao `UIAnimator` atual).
- **Suco pesado/partículas (opcional, fase de "palco"):** Pixi.js ou Phaser 3, só se necessário — provavelmente não no começo.
- **Backend:** Node/edge pro seed do dia, streaks, leaderboard e ingestão de analytics.

> React não roda game loop a 60fps no ciclo de render — padrão é **separar**: lógica em TS/RAF, React só pra UI. Timing de keydown no browser é preciso o suficiente (não é twitch shooter).

### 10.4 Mapa de port (a arquitetura atual traduz quase 1:1)

| Godot                                     | Web/TS                                     |
| ----------------------------------------- | ------------------------------------------ |
| EventBus (autoload, sinais)               | Event emitter / store (Zustand ou mitt)    |
| Services (`RefCounted`)                   | Classes/módulos TS puros                   |
| Templates `.tres`                         | JSON / objetos TS                          |
| Instances (runtime state)                 | Objetos de estado / state machine (XState) |
| Ticket→Task→Step→Segment                  | Mesma hierarquia, modelada com XState      |
| `UIAnimator` (bounce/flash/floating text) | GSAP / Framer Motion                       |
| `UIColors` (paleta centralizada)          | Tokens de tema (CSS vars / objeto TS)      |

### 10.5 Aproveitar a migração para corrigir o core

A reescrita é a oportunidade de já entrar com as conclusões deste documento, em vez de portar o PoC fielmente:

- **Auditar/matar tempo morto** dos segmentos Hold e Wait (Seção 4) — não portar cego.
- **Suco por tecla** e legibilidade como requisito desde o início (checklist CSD, Seção 4).
- **Funil de analytics** (Seção 9.7) desde o primeiro release.
- **Casca daily** (seed + streak + share) como estrutura, não como add-on tardio.

> **Pendência de processo:** este projeto usa Godot em todo o `CLAUDE.md` e na arquitetura. Ao iniciar o port, atualizar o `CLAUDE.md` (ou criar um novo no repo web) e revisar o `GDD.md` Seção 8 (Especificações Técnicas). Linear segue como fonte da verdade de tarefas.
