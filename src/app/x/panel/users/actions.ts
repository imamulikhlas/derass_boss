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

export async function createUser(formData: FormData) {
  const current = await assertSuperadmin();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "user");
  const providerIds = formData.getAll("provider_ids").map(String);

  if (!email || password.length < 6) return;
  if (!["superadmin", "reseller", "user"].includes(role)) return;

  const supabase = getSupabaseAdmin();

  // Buat user di Supabase Auth
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) return;

  await supabase.from("pb_users").upsert({
    id: data.user.id,
    email,
    role,
  });

  // Assign provider untuk reseller
  if (role === "reseller" && providerIds.length > 0) {
    await supabase
      .from("pb_reseller_providers")
      .upsert(
        providerIds.map((pid) => ({ reseller_id: data.user!.id, provider_id: pid })),
        { onConflict: "reseller_id,provider_id" }
      );
  }

  void current;
  revalidatePath("/x/panel/users");
}

export async function setUserRole(formData: FormData) {
  await assertSuperadmin();
  const uid = String(formData.get("uid") ?? "");
  const role = String(formData.get("role") ?? "");
  if (!uid || !["superadmin", "reseller", "user"].includes(role)) return;

  const supabase = getSupabaseAdmin();
  await supabase.from("pb_users").update({ role }).eq("id", uid);
  revalidatePath("/x/panel/users");
}

export async function assignProviders(formData: FormData) {
  await assertSuperadmin();
  const uid = String(formData.get("uid") ?? "");
  const providerIds = formData.getAll("provider_ids").map(String);
  if (!uid) return;

  const supabase = getSupabaseAdmin();
  // Replace semua assignment
  await supabase.from("pb_reseller_providers").delete().eq("reseller_id", uid);
  if (providerIds.length > 0) {
    await supabase
      .from("pb_reseller_providers")
      .insert(providerIds.map((pid) => ({ reseller_id: uid, provider_id: pid })));
  }
  revalidatePath("/x/panel/users");
}
