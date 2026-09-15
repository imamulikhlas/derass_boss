import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import LicenseCreateForm from "@/components/license-create-form";
import {
  allowedProviderIds,
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

  // Provider + paket untuk form create (user role tidak punya akses create)
  let providers: { id: string; code: string }[] = [];
  let packages: { id: string; provider_id: string; name: string; duration_days: number; price: number }[] = [];
  if (session.role !== "user") {
    const { data } = await supabase.from("pb_providers").select("id, code").order("code");
    providers = data ?? [];
    if (session.role === "reseller") {
      const allowed = await allowedProviderIds(session.role, session.uid);
      if (allowed !== "all") providers = providers.filter((p) => allowed.includes(p.id));
    }
    const providerIds = providers.map((p) => p.id);
    if (providerIds.length > 0) {
      const { data: pkgs } = await supabase
        .from("pb_provider_packages")
        .select("id, provider_id, name, duration_days, price")
        .in("provider_id", providerIds)
        .eq("is_active", true);
      packages = pkgs ?? [];
    }
  }

  return (
    <div className="space-y-8">
      {session.role !== "user" && (
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="font-bold mb-4">Daftarkan Lisensi Baru</h2>
          <LicenseCreateForm providers={providers} packages={packages} />
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
                            <select
                              name="package_id"
                              className="bg-zinc-800 border border-zinc-700 rounded px-1.5 py-1 text-xs"
                            >
                              {packages
                                .filter((p) => p.provider_id === r.provider_id)
                                .map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name}
                                  </option>
                                ))}
                            </select>
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
