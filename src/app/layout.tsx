import type { Metadata } from 'next';
import { JetBrains_Mono, Geist } from 'next/font/google';
import './globals.css';

const mono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
});

// Voz "UI/humana": Geist (engineered, feito p/ produto dev) no lugar de Space
// Grotesk (default de LLM). Mantém o nome --font-grotesk por compatibilidade.
const ui = Geist({
  variable: '--font-grotesk',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Dev Task Chef',
  description: 'Sobreviva ao expediente. Um daily game para devs.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${mono.variable} ${ui.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
