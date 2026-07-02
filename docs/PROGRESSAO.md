# Progressão — o caminho da carreira (H-B)

> **Status:** direção. Concretiza `DIRECAO_GAMEPLAY.md` §6 (progressão), §7 (perks) e §9
> (nota), e complementa `PERSONALIDADE_DO_DIA.md`. **Regra de vida (§6): identidade /
> variedade / história — NUNCA poder vertical.** Toda decisão aqui passa por esse crivo.

---

## 0. A hipótese que isto testa (H-B)

Duas hipóteses de retenção:

- **H-A (novidade):** as pessoas voltam porque **cada dia é diferente** → o **baralho de
  dias** (`PERSONALIDADE_DO_DIA.md`). **Reserva** — puxar só se H-B não segurar.
- **H-B (progressão):** as pessoas voltam porque **a carreira / o setup / o histórico
  crescem**. É o que este doc desenha e o que vamos testar primeiro.

Hoje a progressão é **rasa** (rank por *day-count* = só aparecer; nota **efêmera**, morre no
fim do dia). Isso não segura ninguém. Este doc a torna real.

---

## 1. A espinha: POSIÇÕES ganhas por nota

- As **posições de carreira** (Estagiário → Júnior → Pleno → Sênior → Tech Lead → …) **são**
  a progressão — diegéticas, identidade, já é a linha de share (`POSICIONAMENTO.md` §3).
- A **nota** (moeda única, §9) é o **combustível**: acumula → **promove** ao cruzar o limiar.
  Bom dia promove mais rápido; dia ruim adiciona pouco. **Não punitivo** — posição não cai.
- **Barra dentro da posição** (a nota enche) = **movimento visível todo dia**; a **promoção**
  é o **marco** comemorável. "faltam X pra Pleno".
- **Estender a escada além de Tech Lead** (Staff → Principal → … CTO?) pra dar longevidade —
  senão cap em poucas promoções e acaba.

Substitui o `careerTitle` atual (por day-count) por **posição ganha por nota acumulada**.

---

## 2. Dois canais de recompensa (separados por NATUREZA)

| Canal | O que dá | Como se obtém | Por quê |
|---|---|---|---|
| **Comprar (`$`)** | cosmético / identidade — mesa/setup (planta, teclado, monitor…) | gasta `$` (derivado da nota) no que **quer** | faz sentido *escolher e possuir*; agência + share |
| **Destravar (promoção)** | **perks** (§7) + **tasks** (conteúdo/complexidade) | **liberado ao subir de posição** | não se *compra* um jeito de jogar nem um tipo de trabalho — eles **abrem** conforme você cresce |

- **Perks** (§7 — *mutators* double-edged): unlock = **entra no arsenal**; você **ativa um por
  run**. Mais unlocks = mais **variedade** de jeitos de jogar (horizontal), **nunca acúmulo de
  poder**. Ex.: "trabalhar de madrugada" (a hora extra/fadiga como perk).
- **Tasks:** novos **tipos/mecânicas** abrem por rank.

---

## 3. Task-unlock = o currículo de dificuldade (a sacada)

Destravar **tasks** por promoção é o que **acompanha o nível do jogador** — mantém no *flow*
(nem entediante, nem esmagador). Consequência elegante:

> **O onboarding deixa de ser um caso especial.** É só o **"rank 0"**: dia 1 = poucas tasks
> simples + números gentis; sobe de posição → mais tipos/mecânicas entram no pool. Uma
> **curva contínua de unlock**, não um interruptor onboarding/regular.

O que a gente ia construir separado (onboarding) **já nasce dentro da progressão**.

---

## 4. Streak + registro/arco

- **Streak** — dias reais consecutivos (o hook de hábito; não quebrar a corrente).
- **Registro/arco** no fim-de-dia: posição, "X dias na ativa", melhor dia, barra pro próximo
  rank. É o artefato de **share** (`POSICIONAMENTO.md` §3), não só a nota do dia.

---

## 5. O dia 1 (o payoff que fisga)

Load-bearing pra retenção:

1. **Ver o caminho** — a escada + prévia do que os próximos degraus desbloqueiam (teaser, não
   despejar a árvore inteira).
2. **Empoderar** — fechar o dia 1 com **onboarding → Estagiário** + a **primeira escolha**
   (comprar um cosmético e/ou pegar um primeiro unlock). O "peguei algo, quero o próximo".
3. Primeira escolha **simples** (2–3 opções) — sem paralisia.

Os três adjetivos-guia: o caminho **nítido** (escada+prévias), **prazeroso de percorrer**
(barra diária + marcos + ver a mesa crescer), **prêmios que valem a pena** (desejáveis e
compartilháveis — desejo/identidade, não poder).

---

## 6. §6 — a linha de vida (revalidar em cada nó)

- **Perks:** horizontais, double-edged, **um por run**, não empilham.
- **Tasks:** conteúdo/variedade, não vantagem.
- **Cosméticos:** **zero** efeito no jogo — pura identidade.
- Nada nunca deixa o jogador **mais forte de forma vertical**. Se um unlock der "mais rápido/
  fácil sem contrapartida", está errado.

---

## 7. Flags (o que vigiar)

1. **Balancear a curva** — task mais difícil abrindo tem que casar com a skill (flow), não
   punir; promoção-por-nota + task mais difícil precisa se equilibrar. Só afina jogando.
2. **Frescor vem de mecânica nova, não de número maior** — priorizar variedade **mecânica**
   nos unlocks (uma task nova), não "a mesma task mais rápida".
3. **Pool inicial pequeno** — rank baixo = poucas tasks → risco de repetir cedo; os unlocks
   frequentes compensam.
4. **Pacing dos prêmios** — dia 1 generoso, mas os prêmios têm que **continuar vindo** num
   ritmo bom (não front-load e secar).

---

## 8. O que persiste (localStorage — esboço)

`campaignDay`, `posição`, `carreiraTotal` (nota acumulada → promoção), `$` (carteira p/
cosméticos), `streak` + `lastPlayedDate`, `nós comprados`, `perks no arsenal`, `tasks
destravadas`.

---

## 9. Em aberto

- **A escada completa** (nomes/quantos degraus) + **quanto de nota por promoção**.
- **`$` vs nota (§9):** a nota é moeda única. Ela alimenta a promoção **e** vira `$` de gastar?
  (ex.: a nota do dia soma na `carreiraTotal` — que nunca cai — **e** credita `$` numa
  carteira que você deplete comprando). Definir para não ferir "moeda única".
- **Como o task-unlock casa com o spawn/pool** (a personalidade do dia usa pesos de mix — o
  pool disponível passa a ser função do rank).
- **Gate diário** (1 turno por dia real + hora extra/fadiga) — sistema à parte, decidir depois.
- **Perks (§7)** dependem de interstitials (§8) + nota (§9) maduros — quando entram de fato.
- **H-A (baralho de dias)** fica de reserva; se H-B não segurar, é o próximo lever.
