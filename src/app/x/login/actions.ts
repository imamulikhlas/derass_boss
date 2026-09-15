"use server";

import { redirect } from "next/navigation";
import { clearSessionCookie, loginWithPassword } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) redirect("/x/login?error=empty");

  const result = await loginWithPassword(email, password);
  if (!result.ok) redirect("/x/login?error=invalid");

  redirect("/x/panel");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/x/login");
}
