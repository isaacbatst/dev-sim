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

> **Baralho concreto + esboço de dados:** `PERSONALIDADE_DO_DIA.md`.

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

## 5. O core tátil — "suco por tecla" (CSD) **[core base VALIDADO]**

O loop momento-a-momento **tem que ser divertido sozinho** (jogo de skill, não idle) — e
**o core base já está validado** (joga bem). Logo `scrub`/`mash` abaixo são
**profundidade/variedade** (e ajudam a repetição a não cansar), **não** gating de
validação. É o motor dentro da campanha. Input **mimético** (imitar a ação real) é a
alavanca de profundidade nº1.

- **`scrub` (NOVO):** segurar ⬅️➡️ pra discar um valor com preview ao vivo (`ui_color`,
  `ui_font`). Substitui escolhas "frias".
- **`mash` (NOVO):** repetição/alternância rítmica com feedback que escala. O mais
  reutilizável (digitar, deletar, **conflito de merge ⬅️➡️**).
- **combo:** `press` aceitando modificador+tecla (Ctrl+C/Ctrl+V "do Stack Overflow").

**Top 3 enhancements:** conflito de merge (`mash`, a assinatura), scrub de CSS,
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

## 7. Perks como *mutators* (horizontais, ÚNICOS) **[ADIADO]**

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

**Por que está adiado:** dependem de **interstitials** (§8) maduros e do sistema de
**deadline/nota** (§9) afinado — constroem sobre essas peças, não validam nada sozinhos.

### 7.1 Árvore de perks por arquétipo (a "camada posterior consciente") **[IDEAÇÃO SUPERADA — ver `PROGRESSAO.md` + `EXPEDIENTE.md`]**

> **⚠ SUPERADO (2026-07-11).** Este bloco (commit 3dec1da) foi escrito sobre o
> `DIRECAO_GAMEPLAY` congelado e **contradiz decisões posteriores**: (1) a "árvore" oficial
> é a **de tasks** (`PROGRESSAO §3`), não de perks; (2) `PROGRESSAO §6` reafirma **perks NÃO
> empilham** (um por run), o que mata a premissa de "um caminho/braço por run"; (3) o árbitro
> proposto (matchup perk×dia) dependia do baralho de dias, reposicionado em `EXPEDIENTE §5`.
> A conversa seguiu por **fadiga-carry + limite-por-dia** (`EXPEDIENTE.md`), não por classes
> de perk. Mantido só como registro histórico da ideação — **não é direção vigente.**
>
> _(texto original de ideação a seguir, preservado)_
>
> Exercício de ideação (2026-07). Se um dia os mutators virarem árvore/classes, esta é a
> forma que mantém tudo horizontal. **Nenhum item abaixo está decidido nem balanceado.**

**O pino:** descer na árvore = ficar mais **extremo**, nunca mais forte. Cada nó é uma
**troca** (nunca só soma); empilhar nós de um braço sobe o pico E afunda o vale **juntos**.
Geometria: **constelação radial** — centro = Generalista (flexível, brilha em nada, pick
legítimo); cada braço = um arquétipo; ir pra fora = compromisso com um matchup de dia (§4).

**Travas de horizontalidade:**

1. Profundidade = extremidade (zero nós que só somam).
2. **Um braço por run** (reconcilia com o "perk único" do §7 → vira "um caminho por run").
3. Downsides de um braço compõem **na mesma direção** (o vale só aprofunda — não existe
   combo sem downside).
4. Comparação **por categoria** (placar próprio por arquétipo, §7).
5. Capstone = compromisso máximo (o nó mais lopsided), não prêmio de grind.

**Método:** a árvore se **descobre bottom-up** — shipar mutators avulsos primeiro (§7) e
agrupar os que dividem o mesmo matchup de dia. O átomo é o mutator; a árvore é o mapa.

**Cardápio de papel (8 arquétipos × 4 perks; último = capstone):**

| Arquétipo | Perk | Dá | Tira |
|---|---|---|---|
| 🔥 **Bombeiro** | On-call | urgentes valem mais na nota | urgentes pipocam o tempo todo |
| | Modo herói | incidentes resolvem num gesto | tasks normais rendem menos |
| | Adrenalina | quanto mais urgente a fila, mais rápido você fica | fila calma = você desacelera |
| | *"Eu vivo pra isso"* | pico de urgência = nota enorme | dia inteiro calmo = teto baixo garantido |
| 🏛️ **Arquiteto** | Fone de ouvido | mergulha no ticket ativo | perde alerta de urgente chegando |
| | Rubber duck | plano destacado → menos rejeição de CR | beat obrigatório de "explicar" (mais lento) |
| | Trabalho de madrugada | silêncio total: zero reunião/ping | cansaço: janela de timing dos inputs encurta |
| | *"Zona"* | task longa rende nota crescente | qualquer troca de contexto zera o bônus |
| 🗣️ **Comunicador** | Calendário lotado | reuniões se auto-resolvem | blocos de trabalho fragmentados |
| | O Inconveniente | pinga o reviewer → CR mais rápido | te interrompe + queima goodwill (CRs futuros rígidos) |
| | Networking | reunião/slack dão nota extra | código rende menos |
| | *"Pessoa de pessoas"* | meeting/slack viram motor de nota | dia sem reunião = teto baixo |
| 🤠 **Cowboy** | Stack Overflow aberto | copy-paste resolve passos num gesto | chance de colar errado → CR rejeita |
| | Funciona na minha máquina | pula o CR (push→merge) | erro vai pra prod: cascata de hotfix |
| | Café duplo | pula interstitials, fluxo comprimido | sem respiro, tropeço vira bola de neve |
| | *"Deploy sexta 17h59"* | velocidade multiplica a nota | um erro grave despenca tudo |
| 📋 **Burocrata** | Pair programming | CR quase nunca rejeita | tudo mais devagar (narra cada passo) |
| | Síndrome do impostor | confere 2x: CR não rejeita | todo confirm pede dupla-confirmação |
| | Checklist | passos do plano sempre visíveis/ordenados | custo de ação por ticket novo (organizar) |
| | *"Conforme o rito"* | precisão quase perfeita | velocidade glacial: morre em time-attack |
| ⏰ **Procrastinador** | Tenho médico às 17h | dia mais curto → mais nota por densidade | mesma carga em menos tempo |
| | 10 abas abertas | mais waits/tickets em paralelo | trocar de contexto custa mais (erro ao alternar) |
| | Surto final | rende muito com ticket quase expirando | ticket folgado = você enrola |
| | *"Adrenalina do deadline"* | fila no vermelho = surto sobre-humano | começo de dia calmo é desperdiçado |
| 🧓 **Senior Cansado** | Já vi isso antes | tipo de task repetido fica mais rápido a cada vez | tipo de task novo te atrasa |
| | Atalho decorado | combos (Ctrl+C/V, Ctrl+P) saem mais rápido | erra mais se o layout do dia muda |
| | Menos zelo | pula etapas "óbvias" → velocidade | mais chance de rejeição em task delicada |
| | *"Piloto automático"* | dia rotineiro flui sozinho | novidade (arquétipo de dia novo) pune forte |
| 🎲 **Estagiário** | Sorte de principiante | buffs aleatórios por ticket | debuffs aleatórios por ticket |
| | Quebra a main | velocidade alta, energia caótica | erro ocasional vira cascata |
| | Pergunta no canal | um "socorro" por dia resolve um passo travado | gasta tempo + interrompe |
| | *"Aprende apanhando"* | cada erro hoje vira bônus no próximo igual | precisa errar antes de ficar bom |

**Teste anti-vertical (aplicar a cada perk):** upside e downside têm que cair em **eixos
diferentes que o DIA arbitra** — se um perk vence em todo dia com downside que nunca morde,
virou poder vertical e quebra a comparação por categoria.

**Costuras (híbridos, ideia solta):** raso em dois braços vizinhos = sub-arquétipo com nome
("Hotfix Hero" = Bombeiro×Cowboy, "Tech Lead" = Arquiteto×Comunicador). Identidade sem
mecânica nova. Respec grátis por run (lê o standup, escolhe o braço); o que persiste é
histórico por arquétipo + braços destravados (§6).

---

## 8. Interstitials — ritmo do dia **[parcial no MVP; resto ADIADO]**

Set fechado de beats **agendados**: **standup** (09:00 — abre o dia + **é o reveal da
personalidade**), **café** (palate cleanser tátil), **almoço** (halftime: stats da
manhã), **reunião inútil** (gag de identidade), **fim de expediente** (resultado/share).
**O standup-reveal e o fim-de-dia já entram no MVP** (§10); o resto é posterior.
**Fronteira:** agendados dentro; interrupções aleatórias (ping, "deploy quebrou") fora
(camada de stakes). Regra: tátil **ou** pontuação rápida — nunca pausa passiva.

---

## 9. Stakes: a nota do dia é a moeda única **[DECIDIDO — entra no MVP]**

Hoje o jogo não tem consequência no meio do dia (dá pra ficar com o backlog cheio sem
fazer nada). Um dia sem consequência **não testa retenção** — então stakes entram já na
primeira slice. Em vez de reabrir satisfação/HP/derrota, **tudo alimenta uma só
nota/grade do dia**:

- **velocidade** (time-attack: limpar o backlog) → idle = nota ruim
- **precisão** (CR rejeitado) → erro custa
- **expiração** (deadline por ticket) → deixar apodrecer custa

Assim o **deadline entra cedo e barato**: a punição é um tombo na **nota**, não um
game-over. Ele faz a **prioridade significar algo** (urgente = timer curto) e traz a
**triagem** ("qual deixo queimar"). Você sempre **termina** o dia — com nota melhor ou pior.

> Resolve a decisão antes em aberto: **a moeda de stakes que sumiu com a satisfação é a
> nota do dia.**

**Anti-"parece trabalho":** timers generosos no começo + nota-não-morte. A grade, não o
game-over, mantém a pressão sem virar overtime.

> **Adendo 2026-07-11 (ver `EXPEDIENTE.md`):** a nota **fecha às 17h** (junto com o bônus de
> mesa limpa). Depois disso vem a **hora extra** — que NÃO paga nota, só **evita perda**
> (quitar a dívida dos pendentes). "Overtime" deixa de ser risco porque ficar nunca dá
> crédito; o melhor resultado de um serão é **empatar**. Sair no horário com a mesa limpa é a
> jogada vencedora.

---

## 10. Sequência / prioridade

> **Core base já validado** (joga bem). O risco que gateia não é mais "o core é
> divertido?" — é **"as pessoas voltam?"**. Por isso `mash`/`scrub` descem para
> enhancement, e os **stakes do dia (§9) sobem para dentro do MVP** (sem consequência no
> dia, não dá pra medir retenção).

1. **Campanha mínima aprendível (slice vertical):** personalidade do dia (tema + viés de
   mix + standup-reveal) + **dia finito com deadlines → nota única** (§9) + fim de dia
   (resultado/nota + título leve) + progresso (localStorage). → **valida "mais um dia".**
2. **Enhancements táteis:** `mash` (conflito de merge, a assinatura) → `scrub` (CSS) →
   combo do SO. Profundidade sobre o core validado.
3. **Cosméticos (`$`→desk) + desbloqueio de conteúdo** (novos arquétipos).
4. **Interstitials completos + perks/mutators** (constroem sobre 1–3).
5. **Daily de calendário + share + carreira-como-registro + seed** — endgame/distribuição.

**Analytics desde o 1º release** (`DESIGN_CONSULTORIA.md` §9.7): `daily_start`,
`daily_complete`, `return_d1`, e progressão na campanha.

---

## 11. Decisões em aberto

- ~~**Foco:**~~ **RESOLVIDO** — não voltou o "foco" do PoC; a tensão virou **fadiga**
  (`FOCO_FADIGA.md`, diegética, sem medidor) + o **custo de troca de contexto** já vive no
  foco-de-app (`design-direction`). O pitch se ajusta a isso.
- **Rank:** Elo × piso suave × temporadas — com dados.
- **Perk:** escolhido por run vs. equipado fixo (muda se o matchup é decisão diária).
- **Balanceamento dos perks** (esp. #3/#5) e dos **timers de deadline** — só com playtest.
- ~~**Código:** `MeetScene`/`MailScene` órfãs~~ **têm propósito agora** — são a "ação" de
  fechaduras da mesa=biografia (`PROGRESSAO §2.1`): Call = teclado, Mail = café. Não deletar.

> **Resolvido nesta rodada (2026-06):** a forma dos stakes/derrota → **nota do dia como moeda
> única** (velocidade + precisão + expiração, sem game-over). Ver §9.
>
> **Resolvido em 2026-07-11 (ver `EXPEDIENTE.md`):** fim de dia / hora extra (nota fecha 17h,
> serão evita-perda), fadiga-carry subtrativa, **limite-por-dia** (mata o "gate diário"), e a
> **carreira abastece o daily** (a novidade de carreira é finita — CSD; o limite estica, a
> recombinação pega o dia 40). E a **mesa=biografia** substitui a loja (`PROGRESSAO §2/§2.1`).
