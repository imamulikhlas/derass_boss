import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import {
  allowedProviderIds,
  createLicense,
  deleteLicense,
  extendLicense,
  toggleLicense,
} from "./licenses/actions";

export const dynamic = "force-dynamic";

interface LicenseRow {
  hwid: string;
  is_active: boolean;
  expires_at: string | null;
  note: string | null;
  owner_email: string | null;
  created_by: string | null;
  hit_count: number;
  last_seen_at: string | null;
  last_ip: string | null;
  provider_id: string;
  pb_providers: { code: string; name: string } | null;
}

function fmt(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

export default async function LicensesPage() {
  const session = await getSession();
  if (!session) redirect("/x/login");

  const supabase = getSupabaseAdmin();

  let query = supabase
    .from("pb_licenses")
    .select("*, pb_providers(code, name)")
    .order("created_at", { ascending: false });

  if (session.role === "reseller") {
    const allowed = await allowedProviderIds(session.role, session.uid);
    if (allowed === "all") return;
    query = query.in("provider_id", allowed.length ? allowed : ["00000000-0000-0000-0000-000000000000"]);
  } else if (session.role === "user") {
    query = query.eq("owner_email", session.email.toLowerCase());
  }

  const { data: licenses } = await query;
  const rows = (licenses ?? []) as unknown as LicenseRow[];

  // Provider untuk dropdown create (user role tidak punya akses create)
  let providers: { id: string; code: string; name: string }[] = [];
  if (session.role !== "user") {
    const { data } = await supabase.from("pb_providers").select("id, code, name").order("code");
    providers = data ?? [];
    if (session.role === "reseller") {
      const allowed = await allowedProviderIds(session.role, session.uid);
      if (allowed !== "all") providers = providers.filter((p) => allowed.includes(p.id));
    }
  }

  const inputCls =
    "rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm outline-none focus:border-red-600";

  return (
    <div className="space-y-8">
      {session.role !== "user" && (
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="font-bold mb-4">Daftarkan Lisensi Baru</h2>
          <form action={createLicense} className="grid grid-cols-1 sm:grid-cols-6 gap-3 items-end">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs text-zinc-400">HWID (x1)</label>
              <input name="hwid" required placeholder="md5 hex" className={`${inputCls} w-full`} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-400">Provider</label>
              <select name="provider_id" required className={`${inputCls} w-full`}>
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-400">Durasi (hari)</label>
              <input name="days" type="number" min={1} defaultValue={30} className={`${inputCls} w-full`} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-400">Owner email (opsional)</label>
              <input name="owner_email" type="email" placeholder="user@mail.com" className={`${inputCls} w-full`} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-400">Catatan</label>
              <input name="note" placeholder="opsional" className={`${inputCls} w-full`} />
            </div>
            <button
              type="submit"
              className="sm:col-span-6 rounded-lg bg-red-600 hover:bg-red-500 px-4 py-2 font-bold text-sm tracking-wide cursor-pointer"
            >
              + SIMPAN LISENSI
            </button>
          </form>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-bold">Daftar Lisensi ({rows.length})</h2>
        <div className="overflow-x-auto border border-zinc-800 rounded-2xl">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900 text-zinc-400 text-left">
              <tr>
                <th className="px-4 py-3">HWID</th>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Expired</th>
                <th className="px-4 py-3">Hits</th>
                <th className="px-4 py-3">Terakhir</th>
                <th className="px-4 py-3">Owner</th>
                {session.role !== "user" && <th className="px-4 py-3">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono">
              {rows.map((r) => {
                const isExpired = r.expires_at && new Date(r.expires_at).getTime() < Date.now();
                const active = r.is_active && !isExpired;
                return (
                  <tr key={r.hwid} className="hover:bg-zinc-900/60">
                    <td className="px-4 py-3 max-w-52 truncate" title={r.hwid}>{r.hwid}</td>
                    <td className="px-4 py-3">{r.pb_providers?.code ?? "-"}</td>
                    <td className="px-4 py-3">
                      <span className={active ? "text-green-400" : "text-red-400"}>
                        {active ? "ACTIVE" : r.is_active ? "EXPIRED" : "SUSPENDED"}
                      </span>
                    </td>
                    <td className="px-4 py-3">{fmt(r.expires_at)}</td>
                    <td className="px-4 py-3">{r.hit_count}</td>
                    <td className="px-4 py-3 max-w-40 truncate" title={r.last_ip ?? ""}>
                      {fmt(r.last_seen_at)}
                    </td>
                    <td className="px-4 py-3">{r.owner_email ?? "-"}</td>
                    {session.role !== "user" && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <form action={toggleLicense}>
                            <input type="hidden" name="hwid" value={r.hwid} />
                            <button className="text-zinc-400 hover:text-yellow-400 cursor-pointer" type="submit">
                              {r.is_active ? "Suspend" : "Activate"}
                            </button>
                          </form>
                          <form action={extendLicense} className="flex items-center gap-1">
                            <input type="hidden" name="hwid" value={r.hwid} />
                            <input name="days" type="number" min={1} defaultValue={30} className="w-16 bg-zinc-800 border border-zinc-700 rounded px-1.5 py-1 text-xs" />
                            <button className="text-zinc-400 hover:text-green-400 cursor-pointer" type="submit">Extend</button>
                          </form>
                          <form action={deleteLicense}>
                            <input type="hidden" name="hwid" value={r.hwid} />
                            <button className="text-zinc-400 hover:text-red-400 cursor-pointer" type="submit">Hapus</button>
                          </form>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-zinc-500 font-sans">
                    Belum ada lisensi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
