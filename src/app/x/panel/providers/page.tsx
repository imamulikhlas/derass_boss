import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { createProvider, deleteProvider } from "./actions";

export const dynamic = "force-dynamic";

export default async function ProvidersPage() {
  const session = await getSession();
  if (!session) redirect("/x/login");
  if (session.role !== "superadmin") redirect("/x/panel");

  const supabase = getSupabaseAdmin();

  const { data: providers } = await supabase
    .from("pb_providers")
    .select("id, code, name, created_at")
    .order("code");

  const { count: licenseCount } = await supabase
    .from("pb_licenses")
    .select("hwid", { count: "exact", head: true });

  const inputCls =
    "rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm outline-none focus:border-red-600";

  return (
    <div className="space-y-8">
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h2 className="font-bold mb-4">Tambah Provider</h2>
        <form action={createProvider} className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1">
            <label className="text-xs text-zinc-400">Kode</label>
            <input name="code" required placeholder="nova-v1" className={inputCls} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-zinc-400">Nama</label>
            <input name="name" required placeholder="Nova Premium v1" className={inputCls} />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-red-600 hover:bg-red-500 px-4 py-2 font-bold text-sm tracking-wide cursor-pointer"
          >
            + SIMPAN
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="font-bold">Daftar Provider ({providers?.length ?? 0})</h2>
        <div className="overflow-x-auto border border-zinc-800 rounded-2xl">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900 text-zinc-400 text-left">
              <tr>
                <th className="px-4 py-3">Kode</th>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">Dibuat</th>
                <th className="px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono">
              {(providers ?? []).map((p) => (
                <tr key={p.id} className="hover:bg-zinc-900/60">
                  <td className="px-4 py-3">{p.code}</td>
                  <td className="px-4 py-3 font-sans">{p.name}</td>
                  <td className="px-4 py-3">
                    {new Date(p.created_at).toLocaleDateString("id-ID")}
                  </td>
                  <td className="px-4 py-3">
                    <form action={deleteProvider}>
                      <input type="hidden" name="id" value={p.id} />
                      <button type="submit" className="text-zinc-400 hover:text-red-400 cursor-pointer">
                        Hapus
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-zinc-500">
          Total lisensi terdaftar: {licenseCount ?? 0} (semua provider)
        </p>
      </section>
    </div>
  );
}
