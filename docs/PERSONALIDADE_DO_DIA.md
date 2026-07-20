# Personalidade do Dia — o baralho de dias

> **Status:** direção concreta (concretiza `DIRECAO_GAMEPLAY.md` §4). É o **level
> design** da campanha: mesmo pool de tarefas, "prato do dia" diferente. Complementa
> `POSICIONAMENTO.md` (voz/tom) e a memória `onboarding-difficulty-ramp`.
>
> **Tom:** humor dev amplo (legado, deadline, PO mudando escopo, deploy na sexta, prod
> caindo, on-call, review, o estagiário…). NÃO enviesar pra anti-IA — é só um tema entre
> muitos, se aparecer.

---

## 1. O que um "dia" controla

**Testável já (sem modificador):**

- `nome / manchete` — o rótulo do dia.
- `standup` — a fala de abertura = o **reveal** (o que carrega o humor dev do dia).
- `assinatura` — a linha do fim-de-dia (o artefato de **share**, POSICIONAMENTO §3).
- `viés de mix` — que fatia do pool predomina (pesos por ticket).
- `intensidade` — multiplicadores sobre o **steady-state** (spawn + deadline + volume).
- `skew de prioridade` — enviesa urgente/alta/normal/baixa.

**Depois (precisa de modificador — a "pimenta", DIRECAO §4/§7):** regras que mudam a
mecânica (CR mais rígido, tudo pra um horário). Não bloqueia testar a hipótese.

> A dificuldade de um dia é **relativa ao steady-state**, não um valor global. Os
> **valores reais vivem em `src/data/dayRamp.ts`** (fonte da verdade — o número "base spawn
> 24s / deadlines 50/70/100/135" que este doc citava estava DEFASADO vs código). Regime pleno
> hoje: dia 220s, spawn 10–25s, deadlines 40/56/80/108. O **dia 1 entra abaixo e a campanha rampa**.
>
> **Rampa implementada (2026-07-20, `dayRamp.ts` + `EXPEDIENTE §1`):** rampa de 2 dias, via
> `DayProfile` por dia (semente mínima da "personalidade do dia").
>
> | | Dia 1 (Primeiro Commit) | Dia 2 | Dia 3+ (steady) |
> |---|---|---|---|
> | Relógio | 09→**13:00** (meio-período, ~110s) | 09→17 (220s) | 09→17 (220s) |
> | Spawn | 20–45s | 13–31s | 10–25s |
> | Deadline | ×1,5 | ×1,2 | ×1 |
> | Fadiga | **off** | on | on |
>
> O **meio-período** é rampa **diegética** (menos horas = menos tickets, não nerf escondido) e
> deixa a **1ª sessão caber 2 dias** sem detonar a fadiga. Prioridade não entra na rampa: os
> urgentes já não aparecem no dia 1 (pool inicial gated). ⚠ Valores de PARTIDA — afinar com a
> Amplitude (ponto de abandono do dia 1). Verificado no navegador: dia 1 fecha 13:00 e fica
> FRESH; dia 3 vai a 17:00 e cansa.

---

## 2. O baralho (ordem ~ rampa da campanha)

| # | Dia | Caráter | Viés de mix | Intensidade | Assinatura |
|---|---|---|---|---|---|
| 1 | **Primeiro Commit** 🟢 *(onboarding)* | ensina o loop | `fix_typo`, `email`, `slack`, `study` (só single simples) | volume ↓↓, deadline ↑↑, sem urgente | "sobreviveu ao primeiro dia" |
| 2 | **Segunda do Backlog** 🟡 | a fila acorda | amplo/cotidiano, `normal`; entra `new_ui_feature` | volume ↑, deadline médio | a fila lotando às 11h |
| 3 | **Incident Day** 🔴 | urgentes de correção | `fix_bug`/`fix_login_bug`/`deploy_hotfix`, `urgente`/`alta` | deadline ↓, spawn médio | o alerta das 9h03 |
| 4 | **Maratona de Reunião** 🔵 | dia falado, pouco código | `meeting` + `slack` | pressão ↓, muitos itens curtos | a reunião que podia ser um email |
| 5 | **Refactor Day** 🟣 | zen, tarefas longas | `refactor`/`refactor_module`/`document` | volume ↓, deadline ↑ | tocar no código de 2019 |
| 6 | **Estagiário Quebrou a Main** 🔴 | cascata de fixes | `fix_typo`/`fix_bug` em rajada, `urgente` | spawn dispara num intervalo, depois acalma | o push fatídico |

### Standups (o reveal — humor dev amplo)

- **Primeiro Commit:** "Primeiro dia. Café na mão, o backlog ainda te dá trégua — lê o ticket com calma."
- **Segunda do Backlog:** "A semana começou e o backlog não perdoa."
- **Incident Day:** "O alerta tocou às 9h03. Prod caiu. Respira e vai."
- **Maratona de Reunião:** "Reunião sobre a reunião sobre o alinhamento."
- **Refactor Day:** "Hoje você toca em código de 2019. Respira."
- **Estagiário Quebrou a Main:** "Alguém deu force push na main. Adivinha quem limpa."

### Adiados (precisam de modificador)

- **Code Freeze** — CR mais rígido → mais rejeições.
- **Sexta sem Deploy** — calmo + 1 hotfix "proibido" num horário (evento cronometrado).
- **Demo em 1h** — tudo converge pra um horário (proto-deadline global).

---

## 3. Esboço de dados (testável já)

```ts
interface DayType {
  id: string;
  nome: string;
  standup: string;     // abertura (reveal)
  assinatura: string;  // fim-de-dia (share)
  mixWeights: Partial<Record<TicketId, number>>; // peso relativo no pool (default 1; 0 = fora)
  spawnMul: number;    // × SPAWN_INTERVAL base (24s). >1 = mais lento
  deadlineMul: number; // × DEADLINE_BY_PRIORITY base. >1 = mais folgado
  prioritySkew?: Partial<Record<Priority, number>>; // opcional
}
```

- `day` (localStorage) → índice no baralho. **Dia 1 fixo = onboarding**; ordem curada
  na rampa; depois do baralho, embaralha/cicla (mais tarde, o daily-de-calendário fixa
  o dia pra todos — endgame, DIRECAO §10 item 5).
- `Game` recebe o `DayType`: usa `mixWeights` no `spawnTicket`, `spawnMul`/`deadlineMul`
  sobre os valores base, `prioritySkew` no sorteio de prioridade.
- UI: `standup` na abertura do dia; `assinatura` na tela de fim-de-dia (junto do título/nota).

---

## 4. Em aberto — variedade de TIPOS de tarefa (lacuna de conteúdo)

Hoje o trabalho de **feature** é só de **UI** (`ui_update`/`new_ui_feature` — cor/fonte via
scrub/selection). Faltam outros domínios de feature, que dariam variedade real ao mix (e
mais texturas táteis distintas):

- **Modelagem de dados** — spec → estrutura de tabelas/modelo (ideia levantada antes;
  possível novo gesto: montar campos/relations).
- **Backend / endpoint de API** — implementar rota, contrato.
- **Escrever teste** — diferente de `test_feature` (que é "testar em staging"): criar o teste.
- **Config / infra** — variável de ambiente, flag, pipeline.

> Isso é **conteúdo** (roadmap item 3, "novos arquétipos"), não bloqueia a personalidade do
> dia — mas o viés de mix fica mais rico quando houver mais eixos além de UI. Cada novo tipo
> idealmente traz um gesto tátil próprio (evitar clonar `ui_update`).
