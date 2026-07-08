# Foco / Fadiga — o que empurra pra pausa

> **Status:** design fechado (conversa de 2026-07-04), v1 pronta pra construir.
> Complementa as PAUSAS (Break.tsx: mesa, atividades, combo do pescoço) e conversa
> com DIRECAO_GAMEPLAY §8 (ritmo do dia) e §9 (nota/tempo como moeda). Princípios
> das memórias: diegético > medidores; 1ª pessoa; pausas gostosas, nunca imposto.

---

## 1. Princípios (as regras que não se quebram)

1. **Diegético, sem medidor.** Não existe barra "Foco: 40%". O cansaço se manifesta
   como **lapsos** — falhas suas (corpo/mente/olhos), reconhecíveis da vida de dev.
2. **Eventos discretos, não debuff constante.** Lapsos pontuais que escalam em
   FREQUÊNCIA — cada um é uma piada de reconhecimento, não "tudo 20% pior".
3. **Lapso rouba TEMPO, nunca julga.** Só acontece em momentos de execução
   (navegar, abrir, teclar); **nunca** em momento julgado (soltar o gauge,
   escolher opção, despachar veredicto). A fadiga atrasa; não erra por você.
   Se o jogo causa o erro, o jogador sente trapaça — quebra tudo.
4. **Tempo DE JOGO, não real.** Agendamento/limiares em minutos de expediente
   (9:00→17:00 = 480min) → vale pra qualquer duração real de dia (`?day=`).
   Exceção: duração PERCEPTUAL de micro-efeito (piscada ~200ms) fica em tempo
   real. Regra: **agenda em tempo de jogo, percepção em tempo real.**
5. **Restauração por RITUAL, plana.** Restaurar exige um gesto ativo completado
   (pausa nunca é tempo morto de espera), e o efeito é IDÊNTICO para todos os
   rituais — cosmético dá variedade horizontal de ritual, nunca restauração
   melhor (§6: identidade, nunca poder; senão café de 💰80 vira pay-to-win).

## 2. Motor

- Fadiga = **minutos de jogo trabalhados desde a última restauração** (a pausa
  não acumula). Só tempo na v1 — erros NÃO aceleram (previsível de balancear;
  reavaliar depois).

## 3. A curva (horas de expediente) — ESCALADA CONTÍNUA, SEM TETO

"Exausto" é o COMEÇO do problema, não o fim. As curvas escalam com
`x = excesso além do limiar de cansado / 45min` (o divisor é O knob do ritmo
da espiral — 45 e não 60: escalada ~33% mais rápida). Implementação:
`fatigueRates()` em game.ts — fonte da verdade dos números):

| Trabalho contínuo | x | O que acontece |
| --- | --- | --- |
| até ~2h30 | 0 | nada |
| ~2h30 | 0 | **telegraph**: bocejo; hint `- pausa` acende em âmbar |
| 2h30–3h30 | 0–1 | lapsos leves crescendo; dessaturação/blur começam |
| ~3h15 (exausto) | 1 | esquecimento entra; hint da pausa PULSA |
| ~4h00 | 2 | desfoques frequentes (pico ~2.8px), esquecer ~30%/min por ~48min, 2 slots juntos |
| ~4h30+ | 2.5+ | comicamente disfuncional: emperrar ~80%/tecla (base 40%), esquecer ~40%/min por ~57min, até 3 slots esquecidos — ignorar não é viável |

- **Peso perceptual (D):** dessaturação/brilho CONTÍNUOS escalam com x; o
  DESFOQUE é um LAPSO discreto (`defocusN`): a vista sai de foco em **1s REAL**
  até o pico (1.6→3.2px com x) e refoca em 1s — nunca blur permanente. A
  piscada fica mais pesada; o som abafa progressivamente (lowpass 18k→3.5kHz).
- **Descoberta (E):** o hint `- pausa` da MenuBar acende em âmbar no telegraph e
  pulsa quando exausto (âmbar = "a ação de agora" — e a ação é pausar).
- **Esquecimento agressivo (o lapso que ESCALA):** dura 30→90min, cooldown
  encolhe 7→2.5min, e o nº de slots esquecidos AO MESMO TEMPO cresce (1→3).
  A piscada é rara de propósito — o peso vem do blur + esquecimento.
- Ritmo emergente: telegraph ~11h30 (pausa de "almoço"), de novo ~15h (café da
  tarde) → **~2 pausas/dia** saem do horário. Ignorar não mata — mas o custo por
  minuto cresce sem parar até a pausa ser a única decisão sensata.

## 4. Catálogo de lapsos

**V1 (construir):**
- **Bocejo/piscada** (telegraph + lapso forte): tela escurece 150–250ms reais;
  bocejo com áudio + a visão "estica" (linguagem de câmera do pescoço).
- **Tecla emperra** (motor): o keycap afunda e não registra; precisa do 2º toque.
  Só em teclas de execução (press/nav/mash) — NUNCA no soltar de hold/gauge.
- **"Tinha algo pra fazer?"** (cognitivo): um item do BACKLOG some — o slot fica
  vazio como se nunca tivesse nada — e volta sozinho (~10min de jogo). Não dá
  pra selecionar enquanto esquecido. (A comanda NÃO é afetada.)

**Backlog de ideias (depois):** dedo pesado (input ~200ms atrasado — cuidado com
a regra 3), digitei-no-app-errado (foco escorrega pra outra aba), esqueci o
atalho (keycaps viram `?`), perdi a linha (realce some, alvo não muda), blur/
dessaturação progressivos, Slack fantasma (pings de distração), "o PC tá lento"
(micro-freeze… mas o relógio continua).

## 5. Restauração (rituais)

Completar **um** ritual → fresco de novo (reset total). Todos ~4–8s de gesto,
mesmo efeito:

| Ritual | Requer | Gesto |
| --- | --- | --- |
| **Pescoço** | nada (todos têm) | ABERTURA com peso: SEGURAR ← e → ~1s cada (câmera inclina fundo e FICA; medidor enche no keycap; soltar antes recomeça; crack grave por lado) → depois o **giro**: DUAS voltas (8 setas; 1ª âmbar, 2ª verde) fecham com contra-giro automático + mix + alívio; volta à mesa |
| **Regar** | planta (💰) | MODO (R → close-up da SUA planta): 9 células (QWE/ASD/ZXC) × 2 regas — 1ª INFILTRA, 2ª fica molhada; regador desliza/verte; PROMPT CENTRAL no molde do pescoço (2/2 afunda, 1/2 pulsa); 18/18 → volta à mesa |
| **Café** | café (💰) | MODO (C pega a xícara → close-up): mexer em CÍRCULO — DUAS voltas (8 setas, a gramática do pescoço; a colher ORBITA, samples stir-1/2) + 2 goles (C C); PROMPT CENTRAL no molde do pescoço; volta à mesa |
| **Tocar** | teclado (💰) | MODO (T → close-up do tecladinho mecânico): 8 notas em A–K (teclas afundam, ♪ sobe da tecla); PROMPT CENTRAL no molde do pescoço; volta à mesa |

- Feedback de restaurado: o MESMO toque de sucesso (arpejo C5-E5-G5) fecha os
  4 rituais — a pontuação comum — sobre o sabor próprio de cada um (mix do
  pescoço, "ahh" do café, melodia do teclado); anel de alívio + visão limpa na
  hora (blur some, sons crocantes) — sentido, não anunciado.
- Refazer ritual sem estar cansado = só o prazer (nenhum stack/bônus).
- **Descansou TUDO** (fechou todos os rituais que possui na MESMA pausa) →
  volta pro foco do trabalho sozinho (~1s de respiro após o último fecho).
- O relógio segue correndo na pausa: o custo da pausa continua sendo tempo (§9);
  o ritual dá o quê fazer nesse tempo.

## 6. Em aberto

- Números finos (limiar 2h30, frequências, duração do esquecimento) — playtest.
- Erros acelerarem a fadiga (v2?).
- Lapsos extras do catálogo; fadiga × personalidade do dia (dia intenso cansa
  mais rápido?) — cruzar com PERSONALIDADE_DO_DIA.md quando ela entrar.
- "Café que acorda" como efeito mecânico: se um dia existir, é **perk** (§7,
  destravado por promoção, um por turno) — nunca o cosmético.
