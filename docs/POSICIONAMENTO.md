# Posicionamento — Dev Task Chef

> **Data:** 2026-06-30
> **Status:** Direção de **marketing/narrativa**, não spec de gameplay. Define _como o
> jogo é contado_ (pitch, inimigo, tom, share, canais) e _quando_ cada motor de
> distribuição liga. Complementa `DESIGN_CONSULTORIA.md` (estratégia/monetização §9) e
> `DIRECAO_GAMEPLAY.md` (motor de retenção). **Não cria roadmap de dev** — re-prioriza o
> que já existe nesses docs.

---

## 0. O que este doc é (e o que não é)

- **É:** posicionamento — o ângulo emocional, o pitch, a voz, o formato de share e a
  sequência de canais. Trabalho de marketing, em sua maioria sem código.
- **Não é:** decisão de mecânica. Mecânica vive no `GDD.md` e em `DIRECAO_GAMEPLAY.md`.
- **Regra de ouro herdada (`DESIGN_CONSULTORIA.md` §9.2):** tudo é downstream de
  audiência. Posicionamento existe pra gerar plateia; monetização vem depois.

---

## 1. O ângulo central: "antes da IA" **[EM REVISÃO]**

> **Revisão (2026-07):** o anti-IA virou muleta e enviesou o humor. Decisão já tomada:
> o **tom/humor** do jogo é **dev amplo** (§4), com anti-IA como um tema entre muitos.
> **Em aberto:** se o *posicionamento de marketing* (o ângulo de entrada abaixo) continua
> sendo "antes da IA" ou passa a algo mais amplo (nostalgia/vida de dev). Decidir antes do
> lançamento — não deixar o marketing forçar o anti-IA de volta na escrita do jogo.

O gancho emocional do jogo é a **nostalgia do trabalho de dev pré-IA** — quando se
programava na mão, lia-se o code review inteiro, sofria-se na reunião sem o ChatGPT
resumir. O jogo é uma **cápsula do tempo** de uma era que (em 2026) já virou
"antigamente", mesmo tendo passado anteontem.

**Por que funciona como marketing:**

1. **Nostalgia** — 2020–2022 já é "saudade" pro dev; o ciclo cultural acelerou.
2. **Identidade de tribo** — "eu sou dev de verdade, eu sofri isso na mão".
3. **Comentário sobre o presente** — toda piada sobre IA é a conversa quente de 2026; o
   jogo entra numa discussão que o dev já está tendo, em vez de competir por atenção do
   zero.

> **Não confundir com `DIRECAO_GAMEPLAY.md` §3.** Lá, "com IA o build é barato" é
> **filosofia de construção** (time-to-learn é o gargalo, não custo de código). Aqui,
> "antes da IA" é **tema/posicionamento** (o que o jogo _diz ser_). Mesmo momento
> cultural, dois usos distintos — um justifica como construímos, o outro como vendemos.

### 1.1 O inimigo narrativo (de graça)

Posicionamento cola quando tem um inimigo. O nosso: **a IA que faz tudo por você**. No
Dev Task Chef **não tem IA — você faz o trabalho, na mão.** Isso dá veneno novo ao
flavor text (`GDD.md` 0.3) sem reescrever mecânica:

- _"O Copilot caiu — você vai ter que pensar."_
- _"Sem ChatGPT hoje; boa sorte com esse regex."_
- _"Reunião pra decidir qual IA vai assumir o seu trabalho."_
- _"Code review de verdade: você lê os 47 comentários."_

### 1.2 Pitch de uma linha

> **"Reviva um dia de dev de antes da IA. Sem Copilot, sem ChatGPT — só você, a fila de
> tickets e um code review que vai te rejeitar."**

---

## 2. Posicionamento serve o motor de AGORA: prender, não crescer **[ALINHAMENTO]**

`DIRECAO_GAMEPLAY.md` §1–2 decidiu **retenção (campanha) como motor de agora**;
aquisição viral é a **porta de entrada**, não o motor. O posicionamento respeita isso:

- O jogo é uma **campanha aberta** = _reviver a carreira de dev pré-IA_. O ângulo "antes
  da IA" e a metáfora de carreira se reforçam: você está revivendo **a era**, dia após
  dia.
- **Agora:** posicionamento existe pra (a) fazer alguém entender e querer entrar em 1
  segundo e (b) dar identidade ao que se compartilha. Não pra maximizar K-factor ainda.
- **Depois (endgame, sequência §10 item 5):** quando o daily-de-calendário + seed +
  share comparável ligarem, o mesmo ângulo vira o motor de aquisição viral.

---

## 3. O share como IDENTIDADE (Strava), não grid de Wordle **[ALINHAMENTO]**

Enquanto o motor é prender, o share é de **identidade**, não comparação exata
(`DIRECAO_GAMEPLAY.md` §1, §6). O que se posta diz _quem você é_, não _que nota tirou num
puzzle comum_:

- **Título/prestígio:** "Sobrevivi ao Dia 12 como Senior, sem IA." (Junior→Senior, §6.)
- **Registro de carreira:** o arco da campanha como histórico ("23 dias na ativa").
- **Desk/setup customizado** (`DIRECAO_GAMEPLAY.md` §6): identidade pura, vira print.
- **Beat de assinatura do dia** (`DIRECAO_GAMEPLAY.md` §4) como a piada que acompanha o
  print — é o que carrega o humor e o ângulo anti-IA.

> O grid comparável estilo Wordle (🟩🟨⬛ do mesmo dia pra todos) é **endgame**, quando o
> daily-de-calendário entrar. Não desenhar o share de agora em cima dele.

---

## 4. Voz e tom **[DIREÇÃO]**

- **Humor de reconhecimento, não amargura** (`GDD.md` §7): rir da dor, não sofrer com
  ela. A linha entre "engraçado" e "parece overtime" é onde o jogo vive ou morre
  (`DIRECAO_GAMEPLAY.md` §0).
- **Humor dev amplo (não só anti-IA):** rir das dores universais do ofício — legado que
  ninguém entende, deadline em cima, PO mudando o escopo pela 3ª vez, deploy na sexta,
  prod caindo às 9h03, on-call, o PR de 800 linhas do estagiário, o review interminável.
  Anti-IA/nostalgia é **um tema entre muitos**, não o eixo — não enviesar tudo pra ele.
- **Específico vence genérico:** "PO mudou o escopo pela 3ª vez" > "dia difícil". Todo
  flavor text é uma unidade de marketing potencial (ver §6).

---

## 5. Sequência de canais **[DIREÇÃO]**

Da semente barata ao detonador. **Não pular etapa** — não lançar pro vácuo.

1. **Plantar a semente (já, pré-lançamento):** "build in public" no X/Twitter e
   LinkedIn, postando os flavor texts anti-IA mais engraçados, um por vez. Cada piada é
   um teste grátis de viralidade e junta plateia pro dia 1.
2. **Artefato de share afiado (pré-lançamento):** a tela de fim de dia (resultado + título
   + identidade) precisa dar vontade de postar. É a peça #1 de distribuição
   (`DIRECAO_GAMEPLAY.md` §8, fim-de-expediente; `DESIGN_CONSULTORIA.md` §5 item 4).
3. **Detonador (lançamento):** post no **Hacker News (Show HN)** e **r/ProgrammerHumor**
   com o ângulo "antes da IA", numa terça de manhã. Público dev concentrado, custo zero
   — alinhado ao tracking de referrer (`DESIGN_CONSULTORIA.md` §9.7).
4. **Loop de conteúdo contínuo:** flavor text como UGC ("mande seu pior ticket real, os
   melhores entram no jogo") + micro-influenciadores dev (mandar o link, deixar o humor
   trabalhar) + seeds temáticas (Dia do Programador, "deploy na sexta").

### 5.1 O que NÃO fazer (proteger o ativo — `DESIGN_CONSULTORIA.md` §9.5)

- Sem ads pagos pra dev cedo (adblock + custo de reputação > retorno).
- Sem paywall/login no caminho do share (fricção mata distribuição).
- Sem pedir cadastro antes de o loop provar valor (streak vive em localStorage).

---

## 6. O que isto re-prioriza no roadmap (sem criar tarefa nova)

O posicionamento não inventa trabalho de dev — confirma o que já está nos docs como
**load-bearing** pra distribuição. As peças que sobem de prioridade por causa dele:

| Peça | Onde já está | Por que o posicionamento a eleva |
| --- | --- | --- |
| Tela de fim / resultado de identidade | `DIRECAO_GAMEPLAY.md` §8, §10.1 | É o artefato de share (§3, §5.2) |
| Flavor text (humor dev amplo) | `GDD.md` 0.3 | Carrega o tom do jogo e é unidade de marketing (§6) |
| Analytics (share/referrer/D1) | `DESIGN_CONSULTORIA.md` §9.7 | Mede se o posicionamento converte |
| Título/registro de carreira | `DIRECAO_GAMEPLAY.md` §6 | É o que se compartilha agora (§3) |

> **Única diretriz genuinamente nova:** o **tom de humor dev amplo** no flavor text e na
> copy (§4) — anti-IA é só um dos temas, não o eixo. Não é feature — é direção de escrita.

---

## 7. Em aberto

- **Nome/título do produto** ainda assume "Dev Task Chef" (herdado do PoC). O ângulo
  "antes da IA" pode pedir um nome que carregue o tema — decidir antes do lançamento
  público.
- **Onde o ângulo anti-IA aparece no produto** além do flavor text (tela de abertura?
  manchete da campanha?) — alinhar com `DIRECAO_GAMEPLAY.md` §4 (personalidade do dia).
- **Momento de ligar a aquisição viral** (canal §5 item 3+) vs. amadurecer a retenção
  primeiro — decidir com os dados de D1 (`DIRECAO_GAMEPLAY.md` §10).
