# Posicionamento — Dev Task Chef

> **Data:** 2026-06-30
> **Status:** Direção de **marketing/narrativa**, não spec de gameplay. Define _como o
> jogo é contado_ (pitch, tom, share, canais) e _quando_ cada motor de distribuição liga.
> Complementa `DESIGN_CONSULTORIA.md` (estratégia/monetização §9) e `DIRECAO_GAMEPLAY.md`
> (motor de retenção). **Não cria roadmap de dev** — re-prioriza o que já existe.

---

## 0. O que este doc é (e o que não é)

- **É:** posicionamento — o ângulo emocional, o pitch, a voz, o formato de share e a
  sequência de canais. Trabalho de marketing, em sua maioria sem código.
- **Não é:** decisão de mecânica. Mecânica vive no `GDD.md` e em `DIRECAO_GAMEPLAY.md`.
- **Regra de ouro herdada (`DESIGN_CONSULTORIA.md` §9.2):** tudo é downstream de
  audiência. Posicionamento existe pra gerar plateia; monetização vem depois.

---

## 1. O ângulo central: o caos reconhecível do dia de dev **[DIREÇÃO]**

O gancho é o **humor dev amplo** — a vida corporativa de quem programa, em toda a sua dor
reconhecível: legado que ninguém entende, deadline impossível, PO mudando o escopo,
reunião sobre a reunião, deploy na sexta, o estagiário que fez push na main, o code review
que demora. O jogador **revive um dia de trabalho** e ri de reconhecimento: "é
_exatamente_ assim".

**Por que funciona como marketing:**

1. **Universal na tribo** — todo dev viveu isso; o reconhecimento é instantâneo.
2. **Identidade** — "sou dev, sofri isso" é algo que se quer mostrar (ver §3, share).
3. **Espaço de piada infinito** — a vida de dev gera flavor text sem fim, sem depender de
   um único gancho que satura.

> **Não enviesar pra um tema só.** O tom é humor dev _geral_, não anti-IA, não anti-PO,
> não anti-qualquer-coisa. Cada eixo (legado, gestão, deploy, on-call, IA…) é **um** beat
> entre muitos. Isso mantém o humor fresco e não envelhece junto com uma única piada.

### 1.1 "Antes da IA" — um beat pontual, não a espinha **[DIREÇÃO]**

A nostalgia do trabalho pré-IA (programar na mão, ler o CR inteiro) é **um tempero
recorrente**, não o core. Encaixa naturalmente como:

- **Um arquétipo de dia** no baralho (`DIRECAO_GAMEPLAY.md` §4), ao lado de "Incident
  Day", "Sexta sem Deploy" etc. — ex.: _"O Copilot caiu — hoje é na mão"_.
- **Flavor text ocasional:** _"Sem ChatGPT hoje; boa sorte com esse regex"_, _"Reunião pra
  decidir qual IA vai assumir seu trabalho"_.

Vantagem tática: é a piada **quente de 2026**, ótima pra um post de lançamento pontual
(§5). Risco se virar core: **satura e envelhece** — por isso fica como um beat entre os
demais, não como a identidade do jogo.

### 1.2 Pitch de uma linha

> **"Reviva um dia de dev: a fila de tickets, a reunião inútil, o deploy na sexta e o code
> review que vai te rejeitar. Você dá conta?"**

---

## 2. Posicionamento serve o motor de AGORA: prender, não crescer **[ALINHAMENTO]**

`DIRECAO_GAMEPLAY.md` §1–2 decidiu **retenção (campanha) como motor de agora**; aquisição
viral é a **porta de entrada**, não o motor. O posicionamento respeita isso:

- O jogo é uma **campanha aberta** = _reviver a carreira de dev_, dia após dia.
- **Agora:** posicionamento existe pra (a) fazer alguém entender e querer entrar em 1
  segundo e (b) dar identidade ao que se compartilha. Não pra maximizar K-factor ainda.
- **Depois (endgame, sequência §10 item 5):** quando o daily-de-calendário + seed + share
  comparável ligarem, o mesmo humor vira o motor de aquisição viral.

---

## 3. O share como IDENTIDADE (Strava), não grid de Wordle **[ALINHAMENTO]**

Enquanto o motor é prender, o share é de **identidade**, não comparação exata
(`DIRECAO_GAMEPLAY.md` §1, §6). O que se posta diz _quem você é_:

- **Título/prestígio:** "Sobrevivi ao Dia 12 como Senior." (Junior→Senior, §6.)
- **Registro de carreira:** o arco da campanha como histórico ("23 dias na ativa").
- **Desk/setup customizado** (`DIRECAO_GAMEPLAY.md` §6): identidade pura, vira print.
- **Beat de assinatura do dia** (`DIRECAO_GAMEPLAY.md` §4) como a piada que acompanha o
  print — é o que carrega o humor.

> O grid comparável estilo Wordle (🟩🟨⬛ do mesmo dia pra todos) é **endgame**, quando o
> daily-de-calendário entrar. Não desenhar o share de agora em cima dele.

---

## 4. Voz e tom **[DIREÇÃO]**

- **Humor de reconhecimento, não amargura** (`GDD.md` §7): rir da dor, não sofrer com ela.
  A linha entre "engraçado" e "parece overtime" é onde o jogo vive ou morre
  (`DIRECAO_GAMEPLAY.md` §0).
- **Amplo, não enviesado** (§1): nenhum tema único domina; a graça é a variedade da dor.
- **Específico vence genérico:** "PO mudou o escopo pela 3ª vez" > "dia difícil". Todo
  flavor text é uma unidade de marketing potencial (ver §6).

---

## 5. Sequência de canais **[DIREÇÃO]**

Da semente barata ao detonador. **Não pular etapa** — não lançar pro vácuo.

1. **Plantar a semente (já, pré-lançamento):** "build in public" no X/Twitter e LinkedIn,
   postando os flavor texts mais engraçados, um por vez (variando os temas). Cada piada é
   um teste grátis de viralidade e junta plateia pro dia 1.
2. **Artefato de share afiado (pré-lançamento):** a tela de fim de dia (resultado + título
   + identidade) precisa dar vontade de postar. É a peça #1 de distribuição
   (`DIRECAO_GAMEPLAY.md` §8, fim-de-expediente; `DESIGN_CONSULTORIA.md` §5 item 4).
3. **Detonador (lançamento):** post no **Hacker News (Show HN)** e **r/ProgrammerHumor**
   numa terça de manhã. Aqui **um gancho pontual** (ex.: o ângulo "antes da IA", §1.1) pode
   ser a manchete do post — é onde uma piada quente rende. Público dev concentrado, custo
   zero — alinhado ao tracking de referrer (`DESIGN_CONSULTORIA.md` §9.7).
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
**load-bearing** pra distribuição. As peças que sobem de prioridade:

| Peça | Onde já está | Por que o posicionamento a eleva |
| --- | --- | --- |
| Tela de fim / resultado de identidade | `DIRECAO_GAMEPLAY.md` §8, §10.1 | É o artefato de share (§3, §5.2) |
| Flavor text (humor amplo) | `GDD.md` 0.3 | Carrega o ângulo central (§1) e é unidade de marketing (§6) |
| Analytics (share/referrer/D1) | `DESIGN_CONSULTORIA.md` §9.7 | Mede se o posicionamento converte |
| Título/registro de carreira | `DIRECAO_GAMEPLAY.md` §6 | É o que se compartilha agora (§3) |

> Nenhuma feature nova. A direção de escrita é: **humor dev amplo**, com temas (incl. IA)
> como beats rotativos, nunca um único eixo dominando.

---

## 7. Em aberto

- **Nome/título do produto** ainda assume "Dev Task Chef" (herdado do PoC). Como o humor é
  amplo (não anti-IA), o nome deve carregar o **tema geral do dia de dev**, não um gancho
  único — decidir antes do lançamento público.
- **Quais arquétipos de dia** entram no baralho inicial (o "antes da IA" é um candidato
  entre vários) — alinhar com `DIRECAO_GAMEPLAY.md` §4.
- **Momento de ligar a aquisição viral** (canal §5 item 3+) vs. amadurecer a retenção
  primeiro — decidir com os dados de D1 (`DIRECAO_GAMEPLAY.md` §10).
