export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center font-mono">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Dev Task Chef</h1>
      <p className="max-w-md text-sm text-zinc-500 sm:text-base">
        Sobreviva ao expediente. Tickets chegam sem parar, o chefe perde a paciência, e trocar de
        contexto destrói seu foco.
      </p>
      <p className="rounded-md border border-dashed border-zinc-400 px-4 py-2 text-xs text-zinc-500">
        🚧 Base Next.js — scaffold pronto. Lógica de jogo em <code>src/core/</code>.
      </p>
    </main>
  );
}
