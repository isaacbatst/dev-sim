# Direção de Gameplay e Retenção

> Direção **convergida** após uma consultoria estendida (2026-06). Não é spec fechada —
> é direção, decisões e sequência. Cada bloco está marcado como **[DECIDIDO]**,
> **[ABERTO]** ou **[ADIADO]**. Substitui a versão anterior deste doc (que tinha a
> "seed única" como princípio; a gente convergiu pra **campanha-primeiro**). Complementa
> `GDD.md` (mecânicas) e `DESIGN_CONSULTORIA.md` (estratégia/migração).

---

## 0. A régua

Métrica-norte: **D1 retention** (voltar no dia seguinte). Modelo mental: **Hook Model**
(Gatilho → Ação → Recompensa Variável → Investimento). Risco específico do tema: um dev
sim pode **parecer trabalho** — a linha entre "humor de reconhecimento" e "overtime
cansativo" é onde o jogo vive ou morre.

---

## 1. Motor escolhido: PRENDER, não crescer **[DECIDIDO]**

Dois motores de retenção possíveis:

- **Crescer (aquisição):** daily de calendário estilo Wordle — comparação **exata**
  (mesmo puzzle → grid comparável), viral, K-factor alto.
- **Prender (retenção):** investimento/identidade (carreira, progresso, "minha vida de
  dev") — share de **identidade** (Strava), menos viral, mais grudento.

**Decisão: prender.** Consequência: priorizar ganchos de investimento (progressão,
identidade, registro) acima do leaderboard viral. Aquisição não é zero — mas é a porta
de entrada, não o motor.

---

## 2. O modelo: CAMPANHA ABERTA (a carreira é a espinha) **[DECIDIDO]**

Em vez de um daily de calendário (um puzzle por dia real), o jogo é uma **campanha**:
os "dias da carreira" são **níveis de uma main quest**, jogados **em sequência**, no
ritmo do jogador. O átomo de conteúdo é o **dia**, percorrido em ordem.

- **Aberta/infinita** (sem final) — [DECIDIDO]. Logo, a **progressão é o arco** (ver §6).
- **Persistência barata:** só lembrar "em que dia você está" (localStorage), não contas
  + normalização.

**Por que campanha, e não daily de calendário, agora:**
1. **Todo conteúdo é consumido** — numa sequência linear, quem continua passa por cada dia.
2. **Aprende mais rápido** — joga vários "dias" numa sessão → sinal de fun na hora (vs.
   1 dado por usuário por dia real no daily).
3. **Onboarding + rampa de graça** — a campanha controla a ordem (dia 1 ensina, dia 5
   aperta); o daily não controla qual é o primeiro dia de um novato.
4. **Reaproveita a personalidade do dia** (§4) como **level design**.
5. **Comparabilidade assíncrona** — todos jogam o mesmo "Dia 5" (em datas diferentes) →
   "seu tempo no Dia 5" (estilo segmento do Strava).

**O funil (a tese do daily não morre, vira o endgame):**

> **Campanha** (agora: onboarding + validação + retenção "mais um dia") →
> **Daily de calendário + share + carreira-como-registro + seed** (depois: endgame
> perpétuo + distribuição, com a base que a campanha gerou).

---

## 3. Por que isto agora: o eixo é TIME-TO-LEARN, não custo de build **[DECIDIDO]**

Com IA, o que levava uma semana sai em uma hora — então **custo de construção deixou de
ser o critério**. O que a IA **não** comprime:

- O **design** (carreira sobre dias monótonos = grind; isso não se conserta construindo
  mais rápido).
- **Tuning** que precisa de jogadores reais (balanceamento, normalização).
- O **relógio da retenção**: D1/D7 só se medem em dias de calendário, com gente real. IA
  não faz ninguém voltar amanhã mais cedo.

Quando build é barato, o gargalo vira **aprendizado** e **foco**. E **barato de construir
≠ barato de manter ≠ barato de desfazer** (contas/carreiras salvas são caras de reverter).
Por isso: subir a coisa mais simples que já **começa a ensinar** se as pessoas voltam — a
campanha — e deixar a máquina cara (daily/seed/normalização) pra quando houver base.

---

## 4. Personalidade do dia (o motor de curiosidade) **[DECIDIDO como direção]**

O motor de "voltar" do Wordle é **novidade por dia** (um átomo único de um espaço
gigante). Pool pequeno de tasks não replica isso crescendo o pool (treadmill de
conteúdo, inviável). Solução: **o átomo de conteúdo é o DIA**, montado sobre o mesmo pool
— "mesmos ingredientes, prato do dia diferente". Você autora um **baralho de dias**.

**Anatomia de um cenário de dia:**

```
Dia = { nome/manchete · abertura (a fala do standup = o reveal) ·
        viés do mix (que fatia do pool predomina) ·
        modificador (a regra/twist — a pimenta) ·
        beat de assinatura (o evento memorável = o que vira share) }
```

- **Híbrido (modelo Balatro/StS daily):** conjunto **curado** de TEMAS (nome + assinatura
  + viés) + variação **procedural** dentro do tema (tasks/valores/intensidade).
- **O que carrega personalidade** (lembrança/share) = **nome + assinatura + escrita
  autêntica**. **O que carrega variedade de jogo** = o **modificador**. Dá pra testar a
  hipótese só com nome + viés de mix + standup, sem modificador.
- Na campanha, **isto é o level design.**

**Cardápio inicial de arquétipos (mesmo pool, viés diferente):**

| Dia | Caráter | Assinatura |
|---|---|---|
| Segunda do Backlog | volume, normal/baixa, fila lota | "a semana começou" |
| Incident Day | urgentes de fix, waits tensos | "o alerta às 9h03" |
| Maratona de Reunião | meeting/slack dominam | "reunião sobre a reunião" |
| Sexta sem Deploy | calmo + um hotfix proibido | "não se faz deploy na sexta…" |
| Refactor Day | tasks longas de código, zen | "tocar em código de 2019" |
| Estagiário quebrou a Main | cascata de fixes | o push fatídico |
| Demo em 1h | tudo pra um horário (proto-deadline) | "o cliente às 15h" |
| Code Freeze | CR mais rígido → mais rejeições | "só com aprovação" |

---

## 5. O core tátil — "suco por tecla" (CSD) **[direção; parte é o próximo build]**

O loop momento-a-momento **tem que ser divertido sozinho** (jogo de skill, não idle). É o
motor dentro da campanha. Input **mimético** (imitar a ação real) é a alavanca nº1.

- **`scrub` (NOVO):** segurar ⬅️➡️ pra discar um valor com preview ao vivo (`ui_color`,
  `ui_font`). Substitui escolhas "frias".
- **`mash` (NOVO):** repetição/alternância rítmica com feedback que escala. O mais
  reutilizável (digitar, deletar, **conflito de merge ⬅️➡️**).
- **combo:** `press` aceitando modificador+tecla (Ctrl+C/Ctrl+V "do Stack Overflow").

**Top 3 pra provar o core:** conflito de merge (`mash`, a assinatura), scrub de CSS,
copy-paste do SO. **Régua anti-tempo-morto:** todo gesto curto (2–4s) + feedback que
escala + a tela mostra a ação real. (Seção 4 do `DESIGN_CONSULTORIA.md`.)

Mapa nas 9 tarefas: investir nas de **VSCode** + na **cauda de merge**; as de
browser/comunicação ganham **um** beat mimético cada e seguem.

---

## 6. Progressão (a campanha aberta precisa de marcadores) **[direção]**

Sem final, **a progressão é o arco**. Princípio que decide qualquer recompensa:

> **Jogo de skill: progressão deixa você mais estiloso / com mais variedade / com
> histórico maior — NUNCA mecanicamente mais forte.** (NYT/chess: zero poder, só
> prestígio. Poder persistente é de power-fantasy, outro gênero.)

- **`$` → customizar desk/setup [✅]:** o melhor gancho pro público dev; identidade pura,
  vira share, não toca em balance.
- **Título/registro (Junior→Senior) [✅]:** prestígio, **não** portão de poder.
- **⭐ Desbloquear CONTEÚDO ao subir (novos arquétipos de dia) [✅]:** amarra progressão à
  personalidade do dia (drip-feed de variedade), sem power creep. O mais forte.
- **Poder vertical (drena menos / +slot / mais rápido) [❌]:** vira esteira + quebra
  comparabilidade + corrói o jogo de skill.

**Dificuldade na campanha aberta:** rampa nos primeiros N dias → **platô** numa
dificuldade justa; daí pra frente progressão = identidade/cosmético/conteúdo, não
dificuldade. (Evita treadmill infinito.)

**Três eixos (não confundir):** **streak** (hábito) · **rank/título** (skill, é *rating*
que pode cair, não acumulador) · **badges** (variedade). Temporadas p/ o rank: hipótese
[ABERTO], decidir com dados.

---

## 7. Perks como *mutators* (horizontais, ÚNICOS) **[ADIADO — dependem de §8/§9]**

Modos diferentes de jogar **sem overpower**. Não são builds — **perk único por run**
(estilo *heat* do Hades / daily modifier do StS). Você lê o dia no standup e escolhe um.

- **Matchup perk × dia:** nenhum perk é bom em todo dia → escolha situacional. Isso
  **alimenta a personalidade do dia**.
- **Comparação por categoria** (modelo speedrun): cada perk tem seu placar → "qual é o
  melhor" deixa de importar; mais superfície de share.
- **Disciplina:** **um** perk ativo por run. Empilhar = virar build (e herdar o imposto de
  balanceamento). Builds podem ser camada posterior consciente.

**5 perks iniciais (design de papel — equilíbrio só se acerta jogando):**

| Perk | Dá | Tira | Dia ideal / ruim |
|---|---|---|---|
| **Fone de ouvido** | calmaria, mergulha no ticket ativo | perde alerta de urgente chegando | Refactor / Incident |
| **"Eu dou conta"** | relance do próximo input de todos os slots | lê pior detalhes → mais rejeição de CR | Backlog, Reunião / Refactor |
| **"Funciona na minha máquina"** | pula a espera do CR (push→merge) | erro vai pra prod: sem comentário + cascata de hotfix | calmo/confiante / Code Freeze |
| **Caderno de bolso** | alvo/plano destacado no início | beat obrigatório de "ler" antes de agir | complexo/Refactor / Demo |
| **Café duplo** | pula interstitials, fluxo comprimido | sem respiro, tropeço vira bola de neve | Demo/Crunch / maratona longa |

> **#3 e #5 são os mais propensos a vazar pra vertical** (pra quem é bom, "pular CR/breaks"
> = só ganho de tempo). O contra-peso (catástrofe / bola de neve) tem que doer, ou ficam em
> categoria própria de placar.

**Por que está adiado:** dependem de **interstitials** (§8) e **deadlines** (§9), que
ainda não existem.

---

## 8. Interstitials — ritmo do dia **[ADIADO; baratos]**

Set fechado de beats **agendados**: **standup** (09:00 — abre o dia + **é o reveal da
personalidade**), **café** (palate cleanser tátil), **almoço** (halftime: stats da
manhã), **reunião inútil** (gag de identidade), **fim de expediente** (resultado/share).
**Fronteira:** agendados dentro; interrupções aleatórias (ping, "deploy quebrou") fora
(camada de stakes). Regra: tátil **ou** pontuação rápida — nunca pausa passiva.

---

## 9. Deadlines — stakes + sentido da prioridade **[ADIADO]**

Hoje o jogo está **sem stakes** (satisfação/chefe/foco removidos; ver `GDD.md`). Deadline
é a fonte de pressão pretendida e o que **dá sentido aos níveis de prioridade** (sem ele,
prioridade é só cor). Adiciona a camada de triagem ("qual deixo queimar"). A "moeda" de
penalidade/recompensa precisa ser redefinida (a satisfação saiu).

---

## 10. Sequência / prioridade (a ser refinada)

Escada de baixo (intrínseco/barato/cedo) pra cima (extrínseco/caro/tardio):

1. **Core tátil** — `mash` (conflito de merge, a assinatura) → `scrub` (CSS) → combo do SO.
2. **Personalidade do dia (mínima)** — tema + viés de mix + standup-reveal.
3. **Casca de campanha** — sequência de dias + progresso (localStorage) + título leve.
   → **valida:** as pessoas jogam "mais um dia"?
4. **Cosméticos (`$`→desk) + desbloqueio de conteúdo** (novos arquétipos).
5. **Deadlines** (stakes + prioridade) → habilita os modificadores.
6. **Interstitials** completos + **perks/mutators** (constroem sobre 4–5).
7. **Daily de calendário + share + carreira-como-registro + seed** — endgame/distribuição.

**Analytics desde o 1º release** (`DESIGN_CONSULTORIA.md` §9.7): `daily_start`,
`daily_complete`, `return_d1`, e progressão na campanha.

---

## 11. Decisões em aberto

- **Forma dos stakes/derrota** (§9): nota do dia? expirar = falha? (satisfação saiu).
- **Foco:** reintroduzir numa forma compatível ou aposentar e ajustar o pitch.
- **Rank:** Elo × piso suave × temporadas — com dados.
- **Perk:** escolhido por run vs. equipado fixo (muda se o matchup é decisão diária).
- **Balanceamento dos perks** (esp. #3/#5) — só com playtest.
- **Código:** `MeetScene`/`MailScene` órfãs (navegador como hub) — limpar ou virar
  sub-sites.
