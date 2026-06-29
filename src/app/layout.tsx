import type { Metadata } from 'next';
import { JetBrains_Mono, IBM_Plex_Mono, Geist, Schibsted_Grotesk } from 'next/font/google';
import './globals.css';

// Fontes das duas aparências. Cada tema (globals) mapeia --font-mono e
// --font-grotesk: Escuro/Graveyard = Geist+JetBrains; Claro/Daybreak = Schibsted+Plex.
const jetbrains = JetBrains_Mono({ variable: '--font-jetbrains', subsets: ['latin'] });
const plex = IBM_Plex_Mono({
  variable: '--font-plex',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});
const geist = Geist({ variable: '--font-geist', subsets: ['latin'] });
const schibsted = Schibsted_Grotesk({ variable: '--font-schibsted', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Dev Task Chef',
  description: 'Um daily game para devs.',
};

// Aplica a aparência salva (claro/escuro/sistema) ANTES da pintura — sem flash.
const APPEARANCE_SCRIPT = `(function(){try{var p=localStorage.getItem('devos-appearance')||'system';var d=p==='dark'||(p==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.setAttribute('data-theme',d?'graveyard':'daybreak');}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${jetbrains.variable} ${plex.variable} ${geist.variable} ${schibsted.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <script dangerouslySetInnerHTML={{ __html: APPEARANCE_SCRIPT }} />
        {children}
      </body>
    </html>
  );
}
