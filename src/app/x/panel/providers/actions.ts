"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

async function assertSuperadmin() {
  const session = await getSession();
  return session?.role === "superadmin" ? session : null;
}

export async function createProvider(formData: FormData) {
  if (!(await assertSuperadmin())) return;
  const code = String(formData.get("code") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  if (!code || !name) return;

  const supabase = getSupabaseAdmin();
  await supabase.from("pb_providers").insert({ code, name });
  revalidatePath("/x/panel/providers");
}

export async function deleteProvider(formData: FormData) {
  if (!(await assertSuperadmin())) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = getSupabaseAdmin();
  await supabase.from("pb_providers").delete().eq("id", id);
  revalidatePath("/x/panel/providers");
}

export async function createPackage(formData: FormData) {
  if (!(await assertSuperadmin())) return;
  const providerId = String(formData.get("provider_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const days = parseInt(String(formData.get("duration_days") ?? ""), 10);
  const price = parseInt(String(formData.get("price") ?? "0"), 10) || 0;
  if (!providerId || !name || !days || days < 1) return;

  const supabase = getSupabaseAdmin();
  await supabase
    .from("pb_provider_packages")
    .insert({ provider_id: providerId, name, duration_days: days, price });
  revalidatePath("/x/panel/providers");
}

export async function deletePackage(formData: FormData) {
  if (!(await assertSuperadmin())) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = getSupabaseAdmin();
  await supabase.from("pb_provider_packages").delete().eq("id", id);
  revalidatePath("/x/panel/providers");
}

export async function togglePackage(formData: FormData) {
  if (!(await assertSuperadmin())) return;
  const id = String(formData.get("id") ?? "");
  const next = String(formData.get("next") ?? "") === "true";
  if (!id) return;

  const supabase = getSupabaseAdmin();
  await supabase.from("pb_provider_packages").update({ is_active: next }).eq("id", id);
  revalidatePath("/x/panel/providers");
}
