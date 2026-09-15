"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSession, type Role } from "@/lib/auth";

/** Provider yang boleh dikelola oleh session saat ini */
export async function allowedProviderIds(role: Role, uid: string): Promise<string[] | "all"> {
  if (role === "superadmin") return "all";
  if (role !== "reseller") return [];
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("pb_reseller_providers")
    .select("provider_id")
    .eq("reseller_id", uid);
  return (data ?? []).map((r) => r.provider_id);
}

export async function createLicense(formData: FormData) {
  const session = await getSession();
  if (!session || session.role === "user") return;

  const supabase = getSupabaseAdmin();
  const hwid = String(formData.get("hwid") ?? "").trim().toLowerCase();
  const packageId = String(formData.get("package_id") ?? "");
  const note = String(formData.get("note") ?? "").trim() || null;
  const ownerEmail = String(formData.get("owner_email") ?? "").trim().toLowerCase() || null;

  if (!hwid || !packageId) return;

  // Ambil paket -> provider & durasi mengikuti paket
  const { data: pkg } = await supabase
    .from("pb_provider_packages")
    .select("id, provider_id, duration_days, is_active")
    .eq("id", packageId)
    .maybeSingle();
  if (!pkg || !pkg.is_active) return;

  // Reseller hanya boleh buat lisensi untuk provider yang ditugaskan
  if (session.role === "reseller") {
    const allowed = await allowedProviderIds(session.role, session.uid);
    if (allowed !== "all" && !allowed.includes(pkg.provider_id)) return;

    // dan tidak boleh menimpa lisensi yang dibuat orang lain
    const { data: existing } = await supabase
      .from("pb_licenses")
      .select("created_by")
      .eq("hwid", hwid)
      .maybeSingle();
    if (existing && existing.created_by !== session.email) return;
  }

  const expiresAt = new Date(
    Date.now() + pkg.duration_days * 24 * 60 * 60 * 1000
  ).toISOString();

  await supabase.from("pb_licenses").upsert(
    {
      hwid,
      provider_id: pkg.provider_id,
      is_active: true,
      expires_at: expiresAt,
      note,
      owner_email: ownerEmail,
      created_by: session.email,
    },
    { onConflict: "hwid" }
  );

  revalidatePath("/x/panel");
}

async function assertCanManage(hwid: string): Promise<boolean> {
  const session = await getSession();
  if (!session || session.role === "user") return false;
  if (session.role === "superadmin") return true;

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("pb_licenses")
    .select("provider_id, created_by")
    .eq("hwid", hwid)
    .maybeSingle();
  if (!data) return false;

  // Reseller hanya boleh mengelola lisensi yang dia buat sendiri
  if (data.created_by !== session.email) return false;

  const allowed = await allowedProviderIds(session.role, session.uid);
  return allowed !== "all" && allowed.includes(data.provider_id);
}

export async function toggleLicense(formData: FormData) {
  const hwid = String(formData.get("hwid") ?? "");
  if (!(await assertCanManage(hwid))) return;

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("pb_licenses")
    .select("is_active")
    .eq("hwid", hwid)
    .maybeSingle();
  if (!data) return;

  await supabase.from("pb_licenses").update({ is_active: !data.is_active }).eq("hwid", hwid);
  revalidatePath("/x/panel");
}

export async function extendLicense(formData: FormData) {
  const hwid = String(formData.get("hwid") ?? "");
  const packageId = String(formData.get("package_id") ?? "");
  if (!packageId) return;
  if (!(await assertCanManage(hwid))) return;

  const supabase = getSupabaseAdmin();

  // Durasi mengikuti paket dari provider lisensi tersebut
  const { data: lic } = await supabase
    .from("pb_licenses")
    .select("expires_at, provider_id")
    .eq("hwid", hwid)
    .maybeSingle();
  if (!lic) return;

  const { data: pkg } = await supabase
    .from("pb_provider_packages")
    .select("provider_id, duration_days, is_active")
    .eq("id", packageId)
    .maybeSingle();
  if (!pkg || !pkg.is_active || pkg.provider_id !== lic.provider_id) return;

  const base = lic.expires_at ? new Date(lic.expires_at).getTime() : Date.now();
  const from = Math.max(base, Date.now());
  await supabase
    .from("pb_licenses")
    .update({
      expires_at: new Date(
        from + pkg.duration_days * 24 * 60 * 60 * 1000
      ).toISOString(),
    })
    .eq("hwid", hwid);
  revalidatePath("/x/panel");
}

export async function deleteLicense(formData: FormData) {
  const hwid = String(formData.get("hwid") ?? "");
  if (!(await assertCanManage(hwid))) return;

  const supabase = getSupabaseAdmin();
  await supabase.from("pb_licenses").delete().eq("hwid", hwid);
  revalidatePath("/x/panel");
}
