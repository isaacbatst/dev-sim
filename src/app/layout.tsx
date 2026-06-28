import type { Metadata } from 'next';
import { JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import './globals.css';

const mono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
});

const grotesk = Space_Grotesk({
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
    <html lang="pt-BR" className={`${mono.variable} ${grotesk.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
