import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { loginAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (session) redirect("/x/panel");

  const { error } = await searchParams;

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100 p-6">
      <form
        action={loginAction}
        className="w-full max-w-sm space-y-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-xl"
      >
        <h1 className="text-xl font-bold tracking-wide">Panel Login</h1>
        <p className="text-xs text-zinc-500 font-mono">restricted area</p>

        {error && (
          <div className="rounded-lg bg-red-950/60 border border-red-900 px-3 py-2 text-sm text-red-300">
            {error === "invalid" ? "Email atau password salah." : "Lengkapi email dan password."}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-sm text-zinc-400" htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="username"
            className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm outline-none focus:border-red-600"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-zinc-400" htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm outline-none focus:border-red-600"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-red-600 hover:bg-red-500 px-4 py-2.5 font-bold text-sm tracking-wide transition-colors cursor-pointer"
        >
          MASUK
        </button>
      </form>
    </main>
  );
}
