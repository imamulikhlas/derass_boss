import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import {
  createPackage,
  createProvider,
  deletePackage,
  deleteProvider,
  togglePackage,
} from "./actions";

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

  const { data: packages } = await supabase
    .from("pb_provider_packages")
    .select("id, provider_id, name, duration_days, price, is_active")
    .order("duration_days");

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
        <div className="space-y-4">
          {(providers ?? []).map((p) => {
            const pkgs = (packages ?? []).filter((k) => k.provider_id === p.id);
            return (
              <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="font-mono font-bold text-red-400">{p.code}</span>
                    <span className="text-zinc-400 text-sm ml-3">{p.name}</span>
                  </div>
                  <form action={deleteProvider}>
                    <input type="hidden" name="id" value={p.id} />
                    <button type="submit" className="text-xs text-zinc-500 hover:text-red-400 cursor-pointer">
                      Hapus Provider
                    </button>
                  </form>
                </div>

                <table className="w-full text-sm">
                  <thead className="text-zinc-500 text-left text-xs">
                    <tr>
                      <th className="py-2">Paket</th>
                      <th className="py-2">Durasi</th>
                      <th className="py-2">Harga</th>
                      <th className="py-2">Status</th>
                      <th className="py-2">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {pkgs.map((k) => (
                      <tr key={k.id}>
                        <td className="py-2 font-mono">{k.name}</td>
                        <td className="py-2 font-sans">{k.duration_days} hari</td>
                        <td className="py-2 font-sans">Rp{k.price.toLocaleString("id-ID")}</td>
                        <td className="py-2 font-sans">
                          {k.is_active ? (
                            <span className="text-green-400">AKTIF</span>
                          ) : (
                            <span className="text-red-400">NONAKTIF</span>
                          )}
                        </td>
                        <td className="py-2 font-sans space-x-3">
                          <form action={togglePackage} className="inline">
                            <input type="hidden" name="id" value={k.id} />
                            <input type="hidden" name="next" value={String(!k.is_active)} />
                            <button type="submit" className="text-zinc-400 hover:text-yellow-400 cursor-pointer">
                              {k.is_active ? "Nonaktifkan" : "Aktifkan"}
                            </button>
                          </form>
                          <form action={deletePackage} className="inline">
                            <input type="hidden" name="id" value={k.id} />
                            <button type="submit" className="text-zinc-400 hover:text-red-400 cursor-pointer">
                              Hapus
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))}
                    {pkgs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-3 text-zinc-500 font-sans text-xs">
                          Belum ada paket untuk provider ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <form action={createPackage} className="flex flex-wrap gap-2 items-end mt-4">
                  <input type="hidden" name="provider_id" value={p.id} />
                  <input name="name" required placeholder="Nama paket" className={`${inputCls} w-40`} />
                  <input
                    name="duration_days"
                    type="number"
                    min={1}
                    required
                    placeholder="Hari"
                    className={`${inputCls} w-24`}
                  />
                  <input
                    name="price"
                    type="number"
                    min={0}
                    required
                    placeholder="Harga"
                    className={`${inputCls} w-32`}
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-zinc-700 hover:bg-zinc-600 px-3 py-2 text-xs font-bold cursor-pointer"
                  >
                    + Paket
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
