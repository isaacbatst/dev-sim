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
};

export default nextConfig;
