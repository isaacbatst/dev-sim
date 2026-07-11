# Expediente, Hora Extra e o Limite-por-Dia

> **Status:** direção convergida (conversa de 2026-07-10/11). Concretiza como o dia
> **termina** e como a fadiga vira o motor de ritmo/retenção. Estende `FOCO_FADIGA.md`
> (a fadiga é o motor) e conversa com `DIRECAO_GAMEPLAY.md` §9 (nota) e `PROGRESSAO.md`
> (carreira, mesa=biografia). **Não é spec fechada — é direção.**

---

## 0. A tese, numa linha

> **No expediente, o recurso escasso é o tempo. Depois dele, é o corpo. E o que se
> acumula entre os dias não é dinheiro — é fadiga (e biografia, ver `PROGRESSAO.md`).**

---

## 1. O dia em três atos

- **~16:00 — o spawn para.** Ninguém abre ticket na última hora. O quadro só encolhe.
  Isso faz a "mesa limpa às 17h" ser **mérito, não sorte** (senão um ticket nascido às
  16:58 tornaria o bônus impossível por azar) e entrega de graça o **Sprint Final** que o
  `GDD.md` §0.1 queria autorar.
- **17:00 — checa o bônus de mesa limpa.** **A nota NÃO fecha** — segue acumulando quem
  continuar entregando (ver §2). O que acontece às 17h é só o **snapshot do bônus** (mesa
  limpa = bônus) e o mundo sinalizando sem modal: a luz cai (`ambientFor` já é função do
  relógio), os colegas somem. **Nada te impede de continuar.** A ação **"encerrar
  expediente"** fica disponível daqui em diante (menu automático, não um modo especial).
- **17:00–23:00 — hora extra.** Você continua trabalhando **normalmente** — mesma fila,
  mesmos tickets, só escuro e cansado. **Não há pool noturno, incidente especial nem
  "modo".** A hora extra é a mundanidade do serão: mesma coisa, sozinho, seguindo.
- **23:00 — você pega no sono.** Telegrafado pelo lapso que já existe: a **piscada**
  (`FOCO_FADIGA.md` §4) cresce (300ms → 600ms → 1,2s) até uma não reabrir. A última hora é
  uma luta pra ficar acordado — sentida, sem "volte amanhã".

---

## 2. A hora extra PAGA — mas o "upa mais rápido" é benigno

> **Correção 2026-07-11:** um esboço anterior tinha "nota fecha às 17h + dívida + hora extra
> evita-perda". Foi **superado** pelo modelo "simplesmente continuar trabalhando" — a nota
> **NÃO fecha**, ela **segue acumulando**, e o *"upa mais rápido"* que isso gera é aceitável.
> Sem dívida, sem pool noturno, sem "evita-perda".

**A nota continua contando depois das 17h.** Com o spawn parado (~16h), o que resta é o
rabo de tickets: você fica pra **entregá-los** (nota de verdade → "upa mais rápido") ou vai
embora (o que ficar pendente expira a **−60**, o mecanismo normal de deadline). "Encerrar"
está sempre disponível — a noite não tem fim duro; você para quando para, e a fadiga é o custo.

**"Upa mais rápido ficando?" Sim — e é benigno**, por três motivos:
1. A hora marginal roda a ~20–40% da vazão fresca (fadiga emperra/esquece) → soma um
   *sliver* decrescente, não uma hora inteira de nota.
2. O prêmio é **posição**, que `DIRECAO §6` garante ser **prestígio sem poder** — assíncrono,
   cosmético. Pior caso do grind: um título ligeiramente mais barato.
3. A fadiga **pune o grind por dentro** (jogar cansado é ruim de sentir) — sem regra
   desenhada pra isso. O mau jogo se pune sozinho. E o **carry** (§3) devolve parte do ganho
   amanhã (você acorda cansado). O grind se autocorrige e o teto do dano é cosmético.

**A recompensa real por ficar é intrínseca:** o core tátil já é gostoso; você fica porque o
jogo é bom, e paga com amanhã. É o desenho **menos explorável possível** — quem otimiza vai
embora às 17h.

> **Mortos nesta rodada:** pool noturno, dívida-como-sistema-novo, incidentes agendados,
> "caminho do vencedor" especial, e o enquadramento "evita-perda". Eram espetáculo e
> conserto-de-balanço prematuro. A decisão "seguir cansado ou parar" **emerge dos sistemas
> que já existem** (spawn + fadiga + nota + expiração) mais um botão.

**A única peça que carrega o balanço:** o **bônus de mesa limpa às 17h**. Sem ele, ficar pra
entregar o rabo é sempre fracamente melhor (só ganha nota). Com ele, quem fica **abre mão** do
bônus (não dá pra ter a mesa limpa E ainda ter tickets pra entregar). Sair no horário com a
mesa limpa é a jogada vencedora. Calibra o bônus, calibra a tentação — é a balança toda, num
número.

---

## 3. Fadiga que atravessa o dia — SUBTRATIVA

Estende `FOCO_FADIGA.md` §2 (a fadiga hoje é por-dia, em memória).

**O sono recupera uma COTA FIXA, não uma porcentagem.** Essa distinção decide se o sistema
é elegante ou vira o chefe:

- **Percentual (recupera X%) — ERRADO.** Deixaria resíduo em *todo* dia, inclusive o limpo
  → acumula em todo mundo → exaustão universal → pune o disciplinado.
- **Subtrativo (tira um valor fixo) — CERTO.** A cota é dimensionada pra **cobrir com folga
  um dia saudável de 9–17**. Consequências:
  - **Dia limpo → acorda zerado** (a cota cobre tudo). Auto-clear, sem regra de reset.
  - **Hora extra → vaza só o excesso** acima da cota. Você acorda cansado **na proporção de
    quão fundo foi** — como na vida (a quinta noite mal dormida da semana).

**Válvula de escape embutida:** um dia disciplinado termina com fadiga baixa → a cota sobra
→ a dívida **encolhe ou zera**. Você sai do buraco jogando bem um dia.

**Trava anti-espiral (a única regra nova):** a fadiga herdada é **limitada a "cansado",
nunca "exausto"**. Sem o teto: acorda cansado → exaure cedo → vara de novo → espiral → o
jogo vira o `DIRECAO §0`.

**Não decai na ausência.** Sumiu por semanas? Volta no estado em que **saiu** — saiu limpo,
volta zerado; saiu detonado, volta cansado (capado, limpa num dia). O corpo **lembra de como
você saiu**; decair pagaria pra você quebrar o ritmo. O teto já resolve o medo de punir quem
volta: o pior retorno é "primeiro dia depois das férias", não um muro.

**Persistência:** a fadiga passa a viver no localStorage (`PROGRESSAO §8`).

---

## 4. O limite-por-dia = efeito colateral da fadiga-carry

**A cota só dispara no SONO REAL** (virada de dia de calendário). Emendar dias de jogo na
mesma sessão **não** aciona recuperação → a fadiga carrega cheia → o 2º/3º dia seguido fica
intragável rápido. **O corpo é o portão.**

Consequências:
- **~1 dia-de-jogo por dia-real** emerge como ritmo natural — **sem lock, sem modal**. Você
  *pode* emendar, só fica ruim. Preserva o "no ritmo do jogador" (`DIRECAO §2`).
- **Mata o "gate diário"** que `PROGRESSAO §9` deixava pra decidir — virou redundante.
- **Exceção intencional:** o **dia 1 meio-período** (`PERSONALIDADE_DO_DIA` #1) é curto o
  bastante pra a 1ª sessão caber **2 dias de jogo** (o ensino do "mais um dia") sem detonar
  a fadiga. Steady-state = 1/dia; onboarding = 2; teste = ilimitado via dev flags (`?day=`).

> É a mesma peça fazendo vários trabalhos: **custo da hora extra · dívida de sono · gate
> diário suave · limitador de maratona de sessão · estado de quem volta · auto-limite do
> vencedor que quer mais.** Uma mecânica, seis empregos — o pouso da conversa que só
> **removeu** máquina.

---

## 5. Por que isto importa pra retenção: a carreira ABASTECE o daily

O problema do gênero (Cook Serve Delicious): carreira estruturada + gameplay gostosa =
**brinquedo** que se maratona numa semana e larga. Novidade de carreira é **conteúdo, logo
finita** (o `PROGRESSAO §2` estima a árvore de tasks esgotando em ~1,5 semana). Conteúdo
finito acaba → o mesmo abismo do CSD.

- **"Daily" aqui = o limite-por-dia (§4), não o daily-calendário com seed/share.** Racionar
  o consumo converte "maratona e larga" em "consome devagar, volta amanhã": a árvore que
  esgotaria em ~10 dias de maratona vira **muitas semanas** de um pick/dia, e a escassez
  **fabrica o gatilho de retorno** que a maratona destrói (habilita o streak).
- **O limite muda QUANDO o abismo chega, não SE.** Estica CSD-semana → ritual-mês. Quando a
  árvore esgota (agora ~dia 40), o streak fica protegendo um loop estagnado — frágil. **É aí
  e só aí** que a **recombinação** (o baralho de dias, `PERSONALIDADE_DO_DIA`) importa: não
  compete com o limite, **mantém a instância diária desejável** depois que a novidade da
  carreira acaba, pra o streak ter o que proteger.
- **Sequência (pipeline, não ou-ou):** carreira **enche a despensa** (dias 1–10, novidade de
  conteúdo) → limite-por-dia **estica** por muitas semanas de calendário → recombinação
  **cozinha** um prato diferente pra sempre (problema do dia 40). O baralho de dias parece
  fino **agora** porque o pool é fino (6 tasks); a carreira existe pra engordá-lo.

---

## 6. Sequência de deploy (não confundir design com embarque)

O design acima está fechado. Mas a **fadiga-carry (§3/§4) NÃO entra na primeira slice.**
Motivo: na validação você **quer** a maratona — *dias-por-sessão* é o sinal de diversão de
graça (ninguém maratona o que não gosta). Um gate suave ligado cedo demais **suprime o
próprio sinal** que diz se o loop presta.

1. **1ª slice (medir "as pessoas voltam?"):** rampa do dia 1 + **analytics** + o expediente
   básico (spawn para 16h, bônus de mesa limpa às 17h, botão encerrar; a nota NÃO fecha —
   segue acumulando na hora extra). SEM carry.
   Medir *dias-por-sessão* e D1.
2. **Steady-state (quando a analytics confirmar retorno):** liga a fadiga-carry (§3/§4) e o
   limite-por-dia. É feature de retenção, não de validação.
3. **Dia 40:** recombinação (baralho de dias) mantém a instância desejável. Depois: seed +
   share + carreira-como-registro (endgame/distribuição, `DIRECAO §10`).

**Não se precisa de retenção infinita agora.** O limite vira 1 semana em 1 mês+, que é
vitória suficiente pra validar e crescer. Mês→infinito é um problema do dia 40 — que você
*quer* ter (significa que passou do dia 7).

---

## 7. Em aberto

- Números: cota do sono, teto exato da dívida herdada, o bônus de mesa limpa (o knob da
  balança), quando o spawn para (16h?).
- Decaimento por ausência: decidido que **não** decai; revalidar se o retorno-cansado
  frustrar em playtest.
- Recombinação profunda: o baralho de dias como está (`viés de mix + standup`) pode ser
  fino demais pra ser o motor do dia 40 — o **modificador** (`DIRECAO §4`, a "pimenta") é o
  que o torna um puzzle discreto. Cruzar quando chegar lá.
