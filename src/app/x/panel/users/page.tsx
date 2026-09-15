import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { assignProviders, createUser, setUserRole } from "./actions";

export const dynamic = "force-dynamic";

interface UserRow {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

export default async function UsersPage() {
  const session = await getSession();
  if (!session) redirect("/x/login");
  if (session.role !== "superadmin") redirect("/x/panel");

  const supabase = getSupabaseAdmin();

  const { data: users } = await supabase
    .from("pb_users")
    .select("id, email, role, created_at")
    .order("created_at", { ascending: true });
  const { data: providers } = await supabase
    .from("pb_providers")
    .select("id, code")
    .order("code");
  const { data: assignments } = await supabase
    .from("pb_reseller_providers")
    .select("reseller_id, provider_id");

  const assignedByUser = new Map<string, string[]>();
  for (const a of assignments ?? []) {
    assignedByUser.set(a.reseller_id, [...(assignedByUser.get(a.reseller_id) ?? []), a.provider_id]);
  }

  const inputCls =
    "rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm outline-none focus:border-red-600";

  return (
    <div className="space-y-8">
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h2 className="font-bold mb-4">Buat User Baru</h2>
        <form action={createUser} className="space-y-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <label className="text-xs text-zinc-400">Email</label>
              <input name="email" type="email" required className={inputCls} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-400">Password (min 6)</label>
              <input name="password" type="text" required minLength={6} className={inputCls} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-400">Role</label>
              <select name="role" defaultValue="reseller" className={inputCls}>
                <option value="reseller">reseller</option>
                <option value="user">user</option>
                <option value="superadmin">superadmin</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-zinc-400">Provider untuk reseller (opsional)</label>
            <div className="flex flex-wrap gap-4">
              {(providers ?? []).map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm font-mono">
                  <input type="checkbox" name="provider_ids" value={p.id} />
                  {p.code}
                </label>
              ))}
            </div>
          </div>
          <button
            type="submit"
            className="rounded-lg bg-red-600 hover:bg-red-500 px-4 py-2 font-bold text-sm tracking-wide cursor-pointer"
          >
            + BUAT USER
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="font-bold">Daftar User ({users?.length ?? 0})</h2>
        <div className="space-y-3">
          {(users ?? []).map((u: UserRow) => (
            <div key={u.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-mono text-sm">{u.email}</div>
                  <div className="text-xs text-zinc-500">
                    {u.role === "superadmin" ? "🛡 " : u.role === "reseller" ? "💼 " : "👤 "}
                    {u.role}
                  </div>
                </div>
                <form action={setUserRole} className="flex items-center gap-2">
                  <input type="hidden" name="uid" value={u.id} />
                  <select name="role" defaultValue={u.role} className={`${inputCls} text-xs`}>
                    <option value="superadmin">superadmin</option>
                    <option value="reseller">reseller</option>
                    <option value="user">user</option>
                  </select>
                  <button type="submit" className="text-xs text-zinc-400 hover:text-white cursor-pointer">
                    Ubah Role
                  </button>
                </form>
              </div>

              {u.role === "reseller" && (
                <form action={assignProviders} className="flex flex-wrap items-center gap-4 border-t border-zinc-800 pt-3">
                  <input type="hidden" name="uid" value={u.id} />
                  <span className="text-xs text-zinc-400">Provider:</span>
                  {(providers ?? []).map((p) => (
                    <label key={p.id} className="flex items-center gap-1.5 text-sm font-mono">
                      <input
                        type="checkbox"
                        name="provider_ids"
                        value={p.id}
                        defaultChecked={assignedByUser.get(u.id)?.includes(p.id) ?? false}
                      />
                      {p.code}
                    </label>
                  ))}
                  <button type="submit" className="text-xs text-zinc-400 hover:text-white cursor-pointer">
                    Simpan Assignment
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
