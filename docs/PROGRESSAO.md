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

## 2. Três canais de recompensa (separados por NATUREZA e por PACE)

**Decisão (2026-07-05):** tasks NÃO destravam por promoção — variedade mecânica é
combustível de CURTO prazo (precisa vir rápido, senão o jogo enjoa na semana 1),
enquanto cargo é prestígio de LONGO prazo (Tech Lead em 5 dias barateia a
identidade). **Dois paces diferentes = dois trilhos.**

| Canal | O que dá | Como se obtém | Pace |
|---|---|---|---|
| **Comprar (`$`)** | cosmético / identidade — mesa/setup (planta, teclado, café…) | gasta `$` (da nota) no que **quer** | livre |
| **Árvore de tasks** | novos TIPOS de demanda (mecânicas) | **escolhe 1 por dia** no boletim, entre os nós elegíveis da árvore (§3) | RÁPIDO — sandbox completo em ~1,5 semana |
| **Promoção (cargo)** | **perks** (§7) + prestígio/título | nota acumulada, limiares LONGOS | LENTO — o arco da campanha |

- **Perks** (§7 — *mutators* double-edged): unlock = **entra no arsenal**; ativa **um por
  turno**. Podem ser raros/lentos sem frustrar, porque a variedade vem da árvore.
- **Limiares de cargo esticados** (placeholder, afinar jogando): Júnior 400 (dia 1–2, o
  gostinho), Pleno 1.500 (~1 semana), Sênior 4.000 (~2 semanas), Tech Lead 8.000 (~1 mês),
  Staff 14.000, Principal 22.000.

---

## 3. A árvore de tasks — escolha diária (a sacada revisada)

O boletim de fim de dia oferece **"nova demanda desbloqueada — escolha uma"**: 2–3 cards
(nós elegíveis pela árvore de pré-requisitos), cada um com nome + uma linha + o gesto.
Escolheu → entra no pool de amanhã.

**Por quê assim:**
1. **Ritual de retorno garantido** — todo boletim tem um presente; "amanhã escolho um
   brinquedo novo" é gancho de D1 melhor que marcos que caem no meio do dia.
2. **Agência = identidade** — "destravei o review antes do refactor" (a escolha empodera;
   gera conversa entre jogadores).
3. **§6 intacto** — tasks são conteúdo horizontal; ordem livre não desequilibra.
4. **A árvore já era necessária**: multis dependem das tasks componentes (pré-requisitos
   naturais).

> **O onboarding continua não sendo caso especial:** dia 1 = o conjunto inicial (6 tipos
> simples); a árvore é a curva contínua de unlock.

**Conjunto inicial (dia 1):** `meeting`, `email`, `slack`, `study`, `test_feature`,
`document` — o estagiário vive de reunião/e-mail/estudo; ganhar acesso ao código é a
primeira ESCOLHA (não promoção).

**A árvore (proposta em trabalho — equilibrar):** ver §3.1. Persistência: `unlockedTasks`
no localStorage.

### 3.1 A árvore (FECHADA 2026-07-06) — 4 ramos, 4 identidades

```
A · Consertador      B · Construtor          C · Arquiteto            D · Ops
fix_typo             ui_update               review_pr                bump_dep*
   │                    │                       │                        │
   ├─ fix_bug           ├─ new_ui_feature       ├─ refactor              └─ rotate_keys*
   │    └─ fix_login_bug└─ modulo_novo*         │    └─ refactor_module       └─ infra_manutencao*
   └─ deploy_hotfix ⚡       └─ servico_novo*    └─ spike*                          (Terminal)
```

(* = arquétipo NOVO. Tamanhos 4/4/4/3, profundidade 3 em TODOS os ramos —
`modulo_novo` pendura direto no `ui_update` pra criação não pagar o pedágio do
multi visual; `bump_dep` e `rotate_keys` são tasks SEPARADAS, não variantes.)

- **Não é talent tree de compromisso**: a cada dia escolhe QUALQUER nó elegível
  (raízes livres + filhos do que possui). Desequilíbrio de tamanho de ramo importa
  pouco; o que importa: raízes igualmente tentadoras (gestos distintos), mecânica
  nova por profundidade, multis escalonados (dia 2–3), corrente máx. de 3 picks.
- 1ª escolha = "que tipo de dev você é?" (consertador/construtor/arquiteto/ops).

### 3.2 Princípio das mecânicas novas: ASSINATURA FIXA (combo decorável)

Direção (2026-07-06): mais tasks decoráveis como COMBO, menos seleção/leitura.
- **A sequência é sempre a mesma por tipo** — decorável (dia 1 lê a action bar;
  dia 10 executa de cabeça). Aleatoriedade só no cosmético e nos slots abaixo.
- **Variação mínima sem quebrar o feel**: 1–2 teclas do combo com 2 opções,
  ditadas pelo ticket (ex.: fonte da pesquisa S/D; alvo do comando A/W).
- **Repetição com quantidade** (CSD: frango = 7 batidas; sorvete BB vs BCC): o
  pedido dita contagens, você executa de memória (réplicas no terminal etc.).
- **SEM novos Ctrl+algo** (o Ctrl+C/V do fix_bug fica como está).
- Tasks antigas de seleção/leitura permanecem — o mix combo × leitura é saudável.

**Assinaturas dos 6 arquétipos:**
| Task | Assinatura | Tempero |
|---|---|---|
| 📦 Bump de dependência (raiz D) | `V→J(package.json)→B(bump)→I(install + log do npm)`. Sem CR — o "renovate manual" | fixa |
| 🔑 Rotacionar keys | `V→E(.env)→G(gerar)→K(aplicar)→Enter`. Sem CR (segredo não vai pra PR) | fixa |
| 🧪 Spike | `C→[S ou D]→L→V→mash curto→Enter` — sem CR/merge (joga fora) | slot de variação (fonte) |
| 🖥️ Infra | Terminal (app novo): comandos mnemônicos `R·S·T·[A ou W]·Enter`, `U·P·Enter`×réplicas | alvo variável + contagem |
| 📦 Módulo novo | `V→N(novo)→mash(escrever)→S(salvar)→P(push)→CR→merge` | fixa (a receita de criação) |
| 🚀 Serviço novo | encadeia módulo + terminal (`U·P·Enter`×réplicas) — a receita longa | capstone |

Implementação futura: segmento único `recipe` = sequência de `{tecla, contagem}`
com slots variáveis — alimenta os 5 (e futuros). A comanda mostra o PEDIDO; a
action bar apaga as teclas conforme executa (a comanda do CSD).

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
