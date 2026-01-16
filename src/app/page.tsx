import Chat from "@/components/Chat";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-950">
      <main className="w-full max-w-2xl">
        <h1 className="text-2xl font-semibold text-center mb-8 text-zinc-900 dark:text-zinc-100">
          Claude Chat
        </h1>
        <Chat />
      </main>
    </div>
  );
}
