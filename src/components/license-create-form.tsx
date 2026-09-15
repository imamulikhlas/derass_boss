"use client";

import { useState } from "react";
import { createLicense } from "@/app/x/panel/licenses/actions";

export interface ProviderOpt {
  id: string;
  code: string;
}
export interface PackageOpt {
  id: string;
  provider_id: string;
  name: string;
  duration_days: number;
  price: number;
}

const inputCls =
  "rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm outline-none focus:border-red-600";

export default function LicenseCreateForm({
  providers,
  packages,
}: {
  providers: ProviderOpt[];
  packages: PackageOpt[];
}) {
  const [providerId, setProviderId] = useState(providers[0]?.id ?? "");
  const filtered = packages.filter((p) => p.provider_id === providerId);

  return (
    <form action={createLicense} className="grid grid-cols-1 sm:grid-cols-6 gap-3 items-end">
      <div className="sm:col-span-2 space-y-1">
        <label className="text-xs text-zinc-400">HWID</label>
        <input name="hwid" required placeholder="HWID" className={`${inputCls} w-full`} />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-zinc-400">Provider</label>
        <select
          name="provider_id"
          className={`${inputCls} w-full`}
          value={providerId}
          onChange={(e) => setProviderId(e.target.value)}
        >
          {providers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-xs text-zinc-400">Paket</label>
        <select name="package_id" required className={`${inputCls} w-full`} key={providerId}>
          {filtered.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.duration_days} hari) - Rp{p.price.toLocaleString("id-ID")}
            </option>
          ))}
        </select>
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
  );
}
