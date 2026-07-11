# Docs — índice e hierarquia

> **Por que este arquivo existe:** os docs foram escritos em camadas e cada doc novo
> concretiza o anterior **sem riscar** o que superou. Sem uma hierarquia declarada, é fácil
> ancorar no doc errado (congelado) e produzir contradição de boa-fé. Este índice diz **quem
> manda sobre o quê** e o **status** de cada doc. Em conflito, o mais específico e mais
> recente vence — e os blocos superados carregam um banner `⚠ SUPERADO` apontando pro vigente.

## Ordem de autoridade (do mais estratégico ao mais concreto)

1. **`DIRECAO_GAMEPLAY.md`** — a espinha estratégica (motor de retenção, campanha-primeiro,
   stakes=nota, progressão=identidade-nunca-poder). Vigente, com §7.1 marcado SUPERADO.
2. **`EXPEDIENTE.md`** *(2026-07-11)* — fim de dia, hora extra, **fadiga-carry**,
   **limite-por-dia**, e "a carreira abastece o daily". Concretiza `DIRECAO §9/§10`.
3. **`PROGRESSAO.md`** — carreira/nota, **árvore de tasks**, **mesa=biografia** (§2/§2.1,
   supera a "loja"). Fonte da verdade de progressão e recompensa.
4. **`PERSONALIDADE_DO_DIA.md`** — o baralho de dias (level design; o "daily" de recombinação,
   motor do dia 40 — ver `EXPEDIENTE §5`).
5. **`FOCO_FADIGA.md`** — o motor de fadiga + rituais de pausa. §5 atualizado (rituais
   destravam por fechadura, não `$`; restauração leva ao piso).
6. **`POSICIONAMENTO.md`** — voz/tom/humor (dev amplo) + fim-de-dia como identidade/share.
7. **`DESIGN_SYSTEM.md`** — tokens visuais, UI diegética "devOS".

## Histórico (ler como contexto, NÃO como direção vigente)

- **`GDD.md`** — game design pós-migração. **Vigente nas mecânicas (§1–5)**, mas o **Roadmap
  M2/M3/M4 está superado** (chefe/foco removidos; upgrades verticais banidos por `DIRECAO §6`;
  "múltiplos dias" é a espinha, não meta-game). Banners no próprio doc.
- **`DESIGN_CONSULTORIA.md`** — a consultoria inicial (decisão de migrar Godot→web). §3/§5
  têm a **estratégia invertida** (daily-first → campanha-first). Banner no doc.

## Decisões-chave já cravadas (o crivo)

- **Progressão = identidade / variedade / história — NUNCA poder vertical** (`DIRECAO §6`).
- **Stakes = a nota do dia** (velocidade + precisão + expiração; sem game-over) (`DIRECAO §9`).
- **Campanha-primeiro**; daily-calendário/seed/share = endgame (`DIRECAO §2/§10`).
- **A nota NÃO fecha às 17h** — segue acumulando; às 17h só se checa o **bônus de mesa
  limpa**. Hora extra PAGA (nota continua), mas o "upa mais rápido" é benigno (fadiga rende
  pouco + prêmio é cosmético, §6). O bônus é o contrapeso que faz sair no horário valer
  (`EXPEDIENTE §2`).
- **Fadiga atravessa o dia** (sono subtrativo) → **limite ~1 dia-jogo/dia-real** emerge; mata
  o "gate diário" (`EXPEDIENTE §3/§4`). **Entra em steady-state, não na 1ª slice.**
- **Mesa = biografia**: cosmético é evidência de ato (fechaduras), não compra; `$` morre ou
  vira arranjo (`PROGRESSAO §2/§2.1`).
- **A carreira abastece o daily**: novidade de carreira é finita (CSD); o limite estica, a
  recombinação (baralho de dias) pega o dia 40 (`EXPEDIENTE §5`).

## Próximas linhas (sequência)

1. **Rampa do dia 1 + analytics** (medir "as pessoas voltam?") — pré-condição de tudo.
2. Expediente básico (spawn para 16h, **bônus de mesa limpa às 17h**, botão encerrar; a
   nota NÃO fecha — segue acumulando na hora extra).
3. Fadiga-carry + limite-por-dia — **steady-state, pós-validação**.
4. Mesa=biografia (fechaduras) + desbloqueio de conteúdo.
5. Recombinação profunda (modificadores do baralho) → seed/share/registro (endgame).
