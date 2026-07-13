/**
 * Analytics (DIRECAO_GAMEPLAY §10, EXPEDIENTE §6) — a régua é **D1 retention**.
 *
 * Abstração fina de propósito: o resto do código só conhece `track(evento, props)`.
 * O fornecedor (hoje Amplitude) mora SÓ neste arquivo — trocar = mexer aqui, nada mais.
 *
 * Proxy: os eventos vão pro nosso domínio (`/ampl`, ver `next.config.ts`), que repassa
 * pra Amplitude. Sem isso, adblocker come parte do dado SILENCIOSAMENTE — num jogo web
 * viral isso é uma fatia grande do público (e o pior tipo de perda: invisível).
 *
 * Sem chave (`NEXT_PUBLIC_AMPLITUDE_KEY` ausente) = no-op. Dev roda sem poluir os dados.
 */
import * as amplitude from '@amplitude/analytics-browser';

/** O que a gente pergunta aos dados. Nomes fechados = query previsível. */
export type AnalyticsEvent =
  | 'session_start' // 1x por carregamento — a base de "dias-por-sessão"
  | 'day_start' // o expediente começou a correr (relógio anda)
  | 'day_complete' // chegou ao fim do expediente
  | 'day_abandon' // fechou/saiu no meio — com o ponto de abandono
  | 'pick_ramo' // escolheu um nó da árvore de tasks na daily
  | 'promo' // subiu de posição
  | 'pausa_usada'; // completou um ritual de pausa

const KEY = process.env.NEXT_PUBLIC_AMPLITUDE_KEY;

/**
 * Dev NÃO manda evento. Sem isto, a máquina de quem desenvolve vira um "usuário que
 * volta todo dia" e **contamina a própria métrica que queremos ler** (D1). Pra testar
 * a instrumentação de verdade, rode em modo produção (`npm run build && npm start`)
 * ou force com `NEXT_PUBLIC_ANALYTICS_DEBUG=1`.
 */
const ENABLED =
  Boolean(KEY) &&
  (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === '1');

let ready = false;

/** Init preguiçoso (Amplitude é singleton) — sem provider, sem wrapper no layout. */
function init(): boolean {
  if (ready) return true;
  if (typeof window === 'undefined' || !ENABLED || !KEY) return false;
  amplitude.init(KEY, undefined, {
    serverUrl: '/ampl/2/httpapi', // eventos → proxy (rewrite no next.config)
    autocapture: false, // jogo de teclado: clique/DOM/pageview é ruído
    // Config remota: desligada E apontada pro proxy. Duas coisas, de propósito:
    // o flag de TOPO (`fetchRemoteConfig`) está DEPRECADO — só o de dentro de
    // `remoteConfig` vale (foi por isso que o SDK ignorou o primeiro e seguiu
    // batendo em `sr-client-cfg.amplitude.com`, visto na rede do navegador).
    // O `serverUrl` fica como rede de segurança: se o SDK buscar mesmo assim,
    // vai pelo nosso domínio. Assim NENHUM request sai direto pra Amplitude e o
    // adblocker não tem domínio pra bloquear. (Doc: "Proxy remote config requests".)
    remoteConfig: { fetchRemoteConfig: false, serverUrl: '/ampl-cfg/config' },
  });
  ready = true;
  return true;
}

/**
 * O único jeito de registrar evento no projeto.
 * `device_id` da Amplitude persiste sozinho no localStorage — é o que amarra o
 * retorno (D1/D7) sem exigir conta.
 */
export function track(event: AnalyticsEvent, props?: Record<string, unknown>): void {
  if (!init()) return;
  amplitude.track(event, props);
}
