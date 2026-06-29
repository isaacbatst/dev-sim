# Direção de Gameplay e Retenção

> Síntese de uma sessão de consultoria (2026-06-29) sobre **o que faz alguém voltar
> amanhã** e como o core atual deve evoluir. Não é spec fechada — é direção e
> sequência. Decisões ainda abertas estão marcadas como tal. Complementa
> `GDD.md` (mecânicas) e `DESIGN_CONSULTORIA.md` (estratégia/migração).

---

## 0. A régua

A única métrica que orienta as decisões abaixo é **D1 retention** (voltar no dia
seguinte). Norte mental: o **Hook Model** (Gatilho → Ação → Recompensa Variável →
Investimento). Tudo é avaliado por "isso aproxima de um jogador querer voltar amanhã?".

Risco específico do tema: um dev sim pode parecer **trabalho**. A linha entre "humor de
reconhecimento" e "overtime cansativo" é onde o jogo vive ou morre.

---

## 1. Carreira × seed compartilhada (a tensão central)

Conflito aparente: um desafio diário **igual pra todos** (viral, comparável, estilo
Wordle) parece matar a ideia de **construir a própria carreira**. É um falso dilema —
resolve-se separando dois sentidos de "carreira":

- **Carreira-como-CONTEÚDO** (cada um enfrenta desafios diferentes) → **mata** a
  comparabilidade e a viralização. Atacar isto = atacar o modelo de negócio.
- **Carreira-como-REGISTRO** (todos jogam o mesmo dia; seu histórico é seu) →
  **compatível** com a seed única. É o modelo NYT Games / chess.com.

> **Princípio fixado:** conteúdo é **compartilhado** (seed do dia). A carreira é o
> **boletim** de como você joga o deck que todos recebem — não o deck.

**Divergência sem quebrar a seed:** com escolhas reais (ex.: triagem sob deadline),
todos partem do mesmo ponto mas o dia **diverge pela decisão** (modelo roguelike/daily
do Balatro): _mesmo input, processo divergente, output comparável_. A carreira emerge
do **estilo** (bombeiro vs. completista), não do conteúdo.

---

## 2. Dificuldade por DIA, não por carreira

Escalar dificuldade com o nível de carreira é a mesma armadilha disfarçada (quebra a
seed) **e** cria uma **esteira**: o jogador sobe e o chão sobe junto, nunca sente que
melhorou.

> **Princípio fixado:** a dificuldade pertence ao **dia** (compartilhada — fases do
> dia, dias temáticos), não à carreira. A **skill** do jogador sobe contra uma **barra
> fixa**, registrada no rank. Maestria = barra parada + você melhora.

**Acessibilidade sem bifurcar conteúdo:** skill se expressa no **teto, não no piso** —
qualquer um sobrevive ao dia; só o veterano maximiza (modelo Tetris/Wordle: mesmas
peças, score abre um abismo). Comparação pode ser segmentada por liga; o conteúdo
continua único.

---

## 3. Os três eixos de progressão (não confundir)

| Eixo | Pergunta | Premiado por | Risco se misturar |
|---|---|---|---|
| **Streak** | "Eu apareci?" | constância (completar o daily) | virar o rank → "quem joga mais ganha" = grind |
| **Rank / Título** | "Eu sou bom?" | **skill** (performance relativa) | acumular com volume → esteira |
| **Badges / Coleção** | "Que histórias vivi?" | variedade (dias temáticos) | virar barra de XP → checklist |

**Rank é um _rating_, não um acumulador** — reflete o quão bom você É agora, pode
**cair** (Elo/handicap, não "XP da vida"). Travas anti-grind: **uma tentativa pontuada
por dia** (grátis no formato daily), rating por **forma recente** (média móvel), nada a
farmar além do daily.

**Decisão em aberto** (precisa de dados, não decidir agora): rebaixamento do rank —
Elo puro (ansiedade) × piso suave (inflação) × **temporadas** (recomendado como
hipótese: honesto na season + reset remove ansiedade + motivo recorrente de volta).

---

## 4. O estado atual: a virada de design (drift) e o buraco

A implementação web migrou o eixo de **"sobreviver ao dreno sob pressão"** →
**"fazer o trabalho corretamente"**:

- **Removidos:** barra de satisfação, chefe, medidor de foco.
- **Adicionados:** Code Review rejeitado (errar a escolha → refazer) e o subjogo de
  "abrir o app certo".

Coerente com o modelo de maestria — **mas demoliu o andaime antigo antes de erguer o
novo**. Hoje o jogo está **sem stakes**: sem derrota, sem dreno, sem deadline,
dificuldade plana. Um daily sem stakes não gera resultado compartilhável nem "amanhã eu
ganho disso".

**Risco estratégico observado:** o polish (UI devOS, cenas, navegador como hub, som)
está correndo na frente do design. É craft no _brinquedo_; o motor de retenção
(seed/streak/share/score/analytics) segue em zero. A UI diegética é o **fosso** (torna o
jogo *seu* e compartilhável) **e** um **ralo de tempo** (custo linear por cena). É a
**pele**, não o jogo.

---

## 5. Provar o core antes de empilhar mecânica

Disciplina correta (= tese da consultoria: "o daily não tem onde se esconder, sem grind
pra mascarar core fraco"). "Quantas fechou / quão rápido" **já é** um score, e o
**CR rejeitado já cria a tensão velocidade-vs-precisão**.

Para **testar** se o core nu basta, não faltam mecânicas — faltam:

1. **Uma meta / linha de chegada** → reenquadrar a vitória como **time-attack** ("limpe
   o backlog do dia, pontuado por tempo + precisão"). Torna o core existente
   auto-justificável **sem adicionar nada**.
2. **Comparabilidade = a seed** → "competição de quantas fechou" só é competição com o
   **mesmo backlog pra todos**. A seed não é mecânica tardia: é o que permite testar a
   hipótese.

> O que prova o core não é deadline — é **feel (tato) + meta + seed**.

---

## 6. O core se prova no tato ("suco por tecla" — CSD)

Para um daily de 3 min **sem stakes**, o que faz repetir é **sensação momento-a-momento
+ variedade** (Wordle não tem pressão de tempo). Input **mimético** (imitar a ação real)
é a alavanca nº 1 — acima de deadlines.

### Dois tipos de segmento novos cobrem quase tudo

- **`scrub` (NOVO):** segurar ⬅️➡️ pra **discar um valor com preview ao vivo**.
  Justificado por `ui_color` (cor) e `ui_font` (tamanho). Substitui escolhas "frias"
  pelo gesto de afinar.
- **`mash` (NOVO):** **repetição/alternância rítmica** com contador e feedback que
  escala. O "esfregar o prato" genérico. O mais reutilizável.
- **combo** (não é tipo novo): deixar o `press` aceitar **modificador + tecla**
  (Ctrl+C/Ctrl+V etc.).

### Mapa nas 9 tarefas (onde o orçamento tátil rende)

Concentre o investimento nas tarefas de **VSCode** + na **cauda de merge** comum a
todas. As de browser/comunicação são "abrir app + 1 ação" — dê **um** beat mimético em
cada e siga; não tente transformá-las no que não são.

| Tarefa | Upgrade mimético | Tipo |
|---|---|---|
| `fix_typo` | corrigir → **digitar a correção** | `nav` ✓ + **`mash`** |
| `ui_color` | cor → **discar valor com preview** | `selection` ✓ + **`scrub`** |
| `ui_font` | tamanho → **discar px ao vivo** | `selection` ✓ + **`scrub`** |
| `document` | escrever → **digitar a doc** | **`mash`** |
| cauda de merge (todas de código) | conflito → **⬅️➡️ resolver** | `press` ✓ + **`mash`** |
| `study` | **Ctrl+C/Ctrl+V "do Stack Overflow"** | **combo** (enhance `press`) |
| `slack` | responder → digitada curta | `nav` ✓ + `mash` curto |
| `meeting` / `test_feature` | falar / rodar testes | `hold` ✓ (curto) |
| `email` | a mais fraca — manter como a tarefa **mais rápida** | `press` ✓ |

### Top 3 pra provar o core (distinto + autêntico + rítmico, rende screenshot)

1. **Conflito de merge** (`mash` ⬅️➡️) — a assinatura tátil que ninguém mais tem.
2. **Scrub de valor de CSS** — afinar com preview ao vivo.
3. **Copy-paste do Stack Overflow** — o gesto que *é* a piada do dev; viral por
   reconhecimento.

### Régua anti-tempo-morto (Seção 4 do `DESIGN_CONSULTORIA.md`)

Todo gesto, antes de aprovar: **curto** (2–4s) + **feedback que escala** (visual + som
subindo) + **a tela mostra a ação real acontecendo**. Se não passa nos três, é o
Hold/Wait morto que deve ser cortado.

---

## 7. Interstitials — o ritmo do dia

Pausas (café, almoço) **não** servem mais pra "recuperar foco/satisfação" (removidos).
Propósitos válidos hoje: **ritmo**, **identidade** e **arco do dia de graça** (alguns
beats roteirados dão o arco do GDD §0.1 **sem** o sistema de fases).

**Armadilha:** pausa **passiva** (timer contando) é o pior tempo morto. Regra: ou
**tátil** (você faz algo) ou **pontuação rápida** (gag/stat que se dispensa com 1 tecla).

### Set fechado (beats agendados)

| Beat | Quando | Papel | Forma | MVP? |
|---|---|---|---|---|
| **Daily standup** | 09:00 | abre o dia + **gancho diário** ("o de hoje é…") | hold "falar" + preview | ✅ |
| **Café** | 1–2× | palate cleanser tátil; pontua combos | hold servir / mash mexer (~2s) | ✅ |
| **Almoço** | 12:00 | **halftime**: revela stats da manhã | tela rápida de stats | ✅ |
| **Reunião inútil** | 1× à tarde | gag de identidade ("o tempo morto é a piada") | hold "parecer engajado" | ⏳ polish |
| **Fim de expediente** | 17:00 | o close + **resultado do dia** (nota/share) | tela de resultado | ✅ |

**Fronteira (o que fecha a lista):** DENTRO = beats com **horário fixo**. FORA (camada
2, só com stakes) = interrupções **aleatórias/sob demanda**: ping do Slack (mash
dispensar), "deploy quebrou" (urgente forçado), café *opcional* como escolha.

**O que o set entrega:** os três âncora (**standup → almoço → fim**) montam
começo-meio-fim, e carregam o **gancho diário** (standup), a **1ª revelação de score**
(almoço) e o **resultado compartilhável** (fim). É a espinha da casca daily empacotada
como "pausa pro café".

---

## 8. Sequência recomendada

1. **`mash`** (mais reutilizável) → retrofita `document` (digitar) e o **conflito de
   merge** (a assinatura).
2. **`scrub`** → retrofita `ui_color` e `ui_font`.
3. **combo do Stack Overflow** no `study`.
4. **Meta pontuada (time-attack) + seed do dia** → **validar o core**: "esfregar o prato
   dev" é gostoso e repetível?
5. Se validar → **deadlines** (dá sentido aos níveis de **prioridade**; adiciona a
   camada de triagem "qual deixo queimar").
6. → **casca daily completa**: streak + share spoiler-free + gatilho de volta
   (notificação diegética "issue atribuída").
7. → **rank/temporadas** — só **com dados** de jogadores reais.

**Analytics desde o primeiro release** (`DESIGN_CONSULTORIA.md` §9.7): instrumentar
`daily_start`, `daily_complete`, `share_click`, `return_d1` desde o começo.

---

## 9. Decisões em aberto

- **Stakes / derrota:** sem satisfação e sem deadline, o dia sempre termina em vitória.
  Fonte pretendida = deadline (§0.2 do GDD). Definir a "moeda" (nota do dia? expirar =
  falha?).
- **Foco:** o medidor de concentração saiu. Reintroduzir numa forma compatível com o
  modelo de ofício, ou aposentar e ajustar o pitch ("trocar de contexto destrói a
  concentração" hoje não tem suporte mecânico).
- **Rank:** Elo × piso suave × temporadas — decidir com dados.
- **Código:** `MeetScene`/`MailScene` ficaram órfãs (nenhuma task abre meet/mail após
  "navegador como hub") — limpar ou converter em sub-sites do navegador.
