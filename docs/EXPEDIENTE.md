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

> **Implementado 2026-07-21 (slice 1).** As tasks **vêm normalmente até o fim** (sem stop às
> 16h) e **não há bônus de mesa limpa** — os dois foram dropados: sem stop, o bônus vira
> loteria (um ticket às 16:58 nega por azar), e sem o bônus ele perde o propósito (ver §2). O
> contrapeso do serão passou a ser o **carry** (§3), não o bônus.

- **09:00–17:00 — expediente.** Tasks chegam normalmente o dia todo. A nota já pune idle
  (velocidade) e expiração (−60): é ela o sinal, sem bônus.
- **17:00 — entra a hora extra** (só em dias com fadiga — o **dia 1 meio-período fecha às
  13:00**, sem serão). O dia **não acaba**: o relógio segue, a luz cai (`ambientFor`), e a
  ação **"encerrar expediente"** aparece (só a partir das 17h). A nota **continua contando**.
- **17:00–23:00 — serão.** Você trabalha **normalmente** — mesma fila (tasks continuam
  chegando), só escuro e cansado. **Sem pool noturno, incidente ou "modo".** É a mundanidade
  do serão: grind por nota extra, e a fadiga te derruba (§2).
- **23:00 — você pega no sono** (hard stop: o dia fecha). _Polish adiado: o telegraph da
  piscada crescendo até o apagão (§4 do `FOCO_FADIGA`) — hoje é corte seco._

---

## 2. A hora extra PAGA — o contrapeso é o CARRY (não o bônus)

> **Evolução do design (2026-07-11 → 07-21):** passou por "nota fecha 17h + dívida" (superado)
> → "continuar trabalhando + bônus de mesa limpa como contrapeso" → **e o bônus caiu**. O
> problema do bônus: sem stop às 16h ele vira loteria, e o contrapeso que ele fazia (fazer
> *sair* ganhar de *grindar*) é feito **melhor pelo carry** — uma **decisão do jogador**
> ("ganho agora, aceito o cansaço amanhã") em vez de um incentivo que o designer coloca.

**A nota continua contando depois das 17h**, e as tasks continuam chegando → o serão é
**grind real por nota extra**. O que impede isso de virar "grind obrigatório" (a morte do
`DIRECAO §0`) é o **carry** (§3): ficar custa amanhã. Então nem todo mundo fica — é aposta,
não obrigação.

**O limite natural do serão é o AFOGAMENTO.** A fadiga derruba teu rendimento (tecla emperra,
slot esquece); a certa altura os tickets expiram (−60) mais rápido do que você limpa, e a
hora marginal vira EV-negativo. Você não precisa de um stop — o corpo te afoga. O ponto de
afogar é **função da tua skill** (bom jogador lucra mais horas; ruim afunda cedo).

**"Upa mais rápido ficando?" Sim — e é aceitável**, por três motivos:
1. A hora marginal roda a ~20–40% da vazão fresca → *sliver* decrescente, não hora cheia.
2. O prêmio é **posição** = prestígio sem poder (`DIRECAO §6`), assíncrono. Pior caso: um
   título ligeiramente mais barato.
3. O **carry** (§3) devolve parte do ganho amanhã (acorda cansado) + a fadiga já é ruim de
   sentir. O grind se autocorrige e o teto do dano é cosmético.

**Sair às 17h é a jogada de quem não quer pagar amanhã. Ficar é a de quem topa.** As duas são
válidas — o jogo não julga, só cobra. E a saída **"encerrar"** deixa isso a um clique.

> **Mortos:** pool noturno, dívida-como-sistema, incidentes agendados, "caminho do vencedor",
> **e o bônus de mesa limpa** (+ o stop às 16h que ele exigia). A decisão "seguir ou parar"
> **emerge do que já existe** (fadiga + nota + expiração + carry) mais um botão.

---

## 3. O carry — a fadiga do serão vaza pra amanhã (SUBTRATIVA)

> **Implementado 2026-07-21** (`dayRamp.ts: carryFromEndFatigue`, `gameStore`, `game.ts`).
> Valores de partida `COTA=150`, `CAP=150` (min-de-jogo). Afinar com dado.

`carry = clamp(fadiga_no_fim_do_dia − COTA, 0, CAP)` → vira a fadiga inicial de amanhã.

**Subtrativo, não percentual** — a distinção que decide se é elegante ou vira o chefe:
percentual deixaria resíduo em *todo* dia (inclusive o limpo) → exaustão universal → pune o
disciplinado. A cota fixa cobre **um dia normal**, então:
- **Dia bem tocado (pausou) → acorda zerado** (fadiga final < cota). Auto-clear.
- **Serão / dia sem pausa → vaza o excesso** acima da cota, na proporção de quão fundo foi.

Ou seja, **o que carrega é o OVERWORK** (serão ou nunca-pausar), não "um dia difícil". Isso
amarra o custo à decisão do jogador e faz a pausa (`FOCO_FADIGA`) importar.

**Trava anti-espiral:** a herança é **capada em "cansado" (150), nunca "exausto"**. Pior caso,
começa amanhã cansado — recuperável num dia disciplinado. Sem o teto: espiral → `DIRECAO §0`.

**Não decai na ausência.** Volta no estado em que **saiu** (o corpo lembra); decair pagaria
pra quebrar o ritmo. O teto já evita o muro: o pior retorno é "1º dia depois das férias".

**Persistência:** `career.carryFatigue` no localStorage (`PROGRESSAO §8`).

---

## 4. O carry NÃO é o limite-por-dia — e isso é de propósito

> **Superado (2026-07-21).** Um esboço anterior desta seção fazia a cota valer **só no sono
> real**, pra binge de mesma-sessão acumular e virar um limite de "~1 dia-de-jogo por
> dia-real". **Não foi isso que entrou.** No último turno de design a gente **decouplou**: a
> cota vale **por dia-de-jogo, inclusive na mesma sessão**.

Consequência do modelo que shipou:
- **Binge de dias bem tocados NÃO é penalizado** — cada dia normal recupera na virada, mesmo
  emendado. O sinal de **dias-por-sessão** (a maratona) fica **intacto** — que é exatamente o
  que a validação precisa (`§6`). Só o **serão** carrega.
- **Não há limite-por-dia** vindo daqui. O "gate diário" (`PROGRESSAO §9`) **segue em aberto**
  — decidir com dado, não morto por este sistema.
- **Dia 1 meio-período:** ainda deixa a 1ª sessão caber 2 dias (curto + fadiga off).

Ou seja: o carry faz **um** trabalho aqui — o contrapeso do serão. O "limitador de maratona"
que uma versão anterior imaginava foi **descartado** de propósito (não suprimir o sinal).

---

## 5. Por que isto importa pra retenção: a carreira ABASTECE o daily

O problema do gênero (Cook Serve Delicious): carreira estruturada + gameplay gostosa =
**brinquedo** que se maratona numa semana e larga. Novidade de carreira é **conteúdo, logo
finita** (o `PROGRESSAO §2` estima a árvore de tasks esgotando em ~1,5 semana). Conteúdo
finito acaba → o mesmo abismo do CSD.

- **"Daily" aqui = um limite-por-dia (racionamento), não o daily-calendário com seed/share.**
  Racionar o consumo converte "maratona e larga" em "consome devagar, volta amanhã": a árvore
  que esgotaria em ~10 dias de maratona vira **muitas semanas** de um pick/dia, e a escassez
  **fabrica o gatilho de retorno** (habilita o streak). **⚠ Este racionamento é lever
  PÓS-VALIDAÇÃO (§6), NÃO o carry do §3/§4** — que de propósito não limita a maratona (pra
  medi-la primeiro). Só se o dado pedir.
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

## 6. Sequência de deploy

**Distinção que mudou (2026-07-21):** o carry tem dois usos possíveis, e só **um** entrou:
- **Contrapeso do serão** (§3) — **NO SLICE 1.** Não suprime a maratona (dias bem tocados
  recuperam na mesma sessão, §4), então mede-se *dias-por-sessão* limpo. Foi por isso que
  ficou seguro embarcar já.
- **Limitador de maratona / racionamento** (a tese de retenção do §5) — **PÓS-VALIDAÇÃO.**
  Esse SIM suprimiria o sinal, então espera o dado: se as pessoas maratonam-e-somem, aí liga.

1. **Slice 1 (medir "as pessoas voltam?") — FEITO:** rampa do dia 1 + **analytics** +
   expediente com hora extra + carry-contrapeso. Tasks vêm normal até 23h, nota não fecha,
   botão encerrar. Medir *dias-por-sessão* e D1.
2. **Pós-validação:** SE o dado mostrar maratona-e-some → ligar o **racionamento** (§5) como
   lever de retenção. Cosméticos (mesa=biografia) + desbloqueio de conteúdo.
3. **Dia 40:** recombinação (baralho de dias). Depois: seed + share + carreira-como-registro
   (endgame/distribuição, `DIRECAO §10`).

**Não se precisa de retenção infinita agora.** O objetivo do slice 1 é ver se o loop prende
o suficiente pra alguém voltar — não resolver o dia 40.

---

## 7. Em aberto

- **Afinar com dado** (`saiu_as`, `carry_gerado` no `day_complete`): `COTA`/`CAP` (hoje 150),
  o quão fundo o serão precisa ir pra doer, se o afogamento chega no tempo certo.
- **Edge conhecido:** pausar às 22:55 e encerrar zera a fadiga final → carry ~0 (fuga barata
  do custo). Vigiar; só mexer se virar exploit real.
- Decaimento por ausência: decidido que **não** decai; revalidar se o retorno-cansado
  frustrar em playtest.
- Recombinação profunda: o baralho de dias como está (`viés de mix + standup`) pode ser
  fino demais pra ser o motor do dia 40 — o **modificador** (`DIRECAO §4`, a "pimenta") é o
  que o torna um puzzle discreto. Cruzar quando chegar lá.
