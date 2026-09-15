import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { logoutAction } from "../login/actions";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/x/login");

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <nav className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-5 text-sm">
            <span className="font-bold tracking-wider text-red-500">PB PANEL</span>
            <a href="/x/panel" className="text-zinc-400 hover:text-white">Lisensi</a>
            {session.role === "superadmin" && (
              <>
                <a href="/x/panel/providers" className="text-zinc-400 hover:text-white">Provider</a>
                <a href="/x/panel/users" className="text-zinc-400 hover:text-white">User</a>
              </>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-zinc-500 font-mono text-xs">
              {session.email} [{session.role}]
            </span>
            <form action={logoutAction}>
              <button type="submit" className="text-zinc-400 hover:text-red-400 cursor-pointer">
                Keluar
              </button>
            </form>
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
