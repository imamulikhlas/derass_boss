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
  const providerId = String(formData.get("provider_id") ?? "");
  const days = Math.max(1, parseInt(String(formData.get("days") ?? "30"), 10) || 30);
  const note = String(formData.get("note") ?? "").trim() || null;
  const ownerEmail = String(formData.get("owner_email") ?? "").trim().toLowerCase() || null;

  if (!hwid || !providerId) return;

  // Reseller hanya boleh buat lisensi untuk provider yang ditugaskan
  if (session.role === "reseller") {
    const allowed = await allowedProviderIds(session.role, session.uid);
    if (allowed !== "all" && !allowed.includes(providerId)) return;
  }

  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

  await supabase.from("pb_licenses").upsert(
    {
      hwid,
      provider_id: providerId,
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
    .select("provider_id")
    .eq("hwid", hwid)
    .maybeSingle();
  if (!data) return false;

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
  const days = Math.max(1, parseInt(String(formData.get("days") ?? "30"), 10) || 30);
  if (!(await assertCanManage(hwid))) return;

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("pb_licenses")
    .select("expires_at")
    .eq("hwid", hwid)
    .maybeSingle();
  if (!data) return;

  const base = data.expires_at ? new Date(data.expires_at).getTime() : Date.now();
  const from = Math.max(base, Date.now());
  await supabase
    .from("pb_licenses")
    .update({ expires_at: new Date(from + days * 24 * 60 * 60 * 1000).toISOString() })
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
