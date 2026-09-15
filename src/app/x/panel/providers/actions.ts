"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

async function assertSuperadmin() {
  const session = await getSession();
  if (!session || session.role !== "superadmin") redirect("/x/login");
  return session;
}

export async function createProvider(formData: FormData) {
  await assertSuperadmin();
  const code = String(formData.get("code") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  if (!code || !name) return;

  const supabase = getSupabaseAdmin();
  await supabase.from("pb_providers").upsert({ code, name }, { onConflict: "code" });
  revalidatePath("/x/panel/providers");
}

export async function deleteProvider(formData: FormData) {
  await assertSuperadmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = getSupabaseAdmin();

  // Tolak hapus jika masih ada lisensi yang memakai provider ini
  const { count } = await supabase
    .from("pb_licenses")
    .select("hwid", { count: "exact", head: true })
    .eq("provider_id", id);
  if ((count ?? 0) > 0) return;

  await supabase.from("pb_providers").delete().eq("id", id);
  revalidatePath("/x/panel/providers");
}
