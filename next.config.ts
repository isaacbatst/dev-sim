import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  env: {
    // Set de melodias do tecladinho (src/data/melodies.ts). Definir AQUI
    // garante o inline no build mesmo sem a var no ambiente — o ternário
    // vira constante e o set não escolhido sai do bundle (DCE). Sem isso
    // (var ausente) o Turbopack deixa um lookup em runtime e os DOIS sets
    // embarcam — inclusive o proprietário. Default: free.
    NEXT_PUBLIC_MELODY_SET: process.env.NEXT_PUBLIC_MELODY_SET ?? 'free',
  },
  // Analytics (src/store/analytics.ts): TODO tráfego da Amplitude sai pelo NOSSO
  // domínio e daqui é repassado. É o que impede o adblocker de comer o dado
  // silenciosamente — sem isso some justamente a fatia mais técnica do público (devs).
  //
  // São DOIS destinos, e ambos importam. O de eventos é o óbvio; o de config não —
  // e foi só olhando a rede no navegador que ele apareceu (o SDK chama
  // `sr-client-cfg.amplitude.com` direto mesmo com `fetchRemoteConfig: false`).
  // Um domínio `*.amplitude.com` na rede basta pro adblocker agir.
  async rewrites() {
    return [
      { source: '/ampl/:path*', destination: 'https://api2.amplitude.com/:path*' },
      { source: '/ampl-cfg/:path*', destination: 'https://sr-client-cfg.amplitude.com/:path*' },
    ];
  },
};

export default nextConfig;
