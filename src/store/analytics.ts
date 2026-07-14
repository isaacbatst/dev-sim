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
 * AMBIENTES: a Amplitude não tem flag de "env" dentro do projeto — o jeito oficial é um
 * PROJETO por ambiente, cada um com sua chave. Logo **a chave É o ambiente**:
 *   `.env.local` → projeto DEV  ·  painel do deploy (Vercel) → projeto PROD
 * Por isso dev PODE enviar à vontade: cai no projeto dev e não encosta no D1 de produção.
 *
 * Sem chave = no-op (com aviso no console — analytics desligada em silêncio é o pior
 * modo de falha: você só descobre semanas depois, sem dado nenhum).
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

let ready = false;
let warned = false;

/** Init preguiçoso (Amplitude é singleton) — sem provider, sem wrapper no layout. */
function init(): boolean {
  if (ready) return true;
  if (typeof window === 'undefined') return false;
  if (!KEY) {
    if (!warned) {
      warned = true;
      // Grita: um deploy sem a env var mede ZERO e não avisa (ver doc do módulo).
      console.warn('[analytics] NEXT_PUBLIC_AMPLITUDE_KEY ausente — nenhum evento será enviado.');
    }
    return false;
  }
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
