import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase";

export type Role = "superadmin" | "reseller" | "user";

export interface Session {
  uid: string;
  email: string;
  role: Role;
  exp: number;
}

const COOKIE_NAME = "pb_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 jam

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET belum diisi di .env.local");
  return secret;
}

function sign(data: string): string {
  return createHmac("sha256", getSecret()).update(data).digest("base64url");
}

export function encodeSession(session: Session): string {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function decodeSession(token: string | undefined): Session | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;

  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString()) as Session;
    if (!session.uid || !session.role || session.exp < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  return decodeSession(store.get(COOKIE_NAME)?.value);
}

export async function setSessionCookie(session: Omit<Session, "exp">) {
  const store = await cookies();
  store.set(COOKIE_NAME, encodeSession({ ...session, exp: Date.now() + SESSION_TTL_MS }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/**
 * Login via Supabase Auth (server-side, service role).
 * Bootstrap: jika tabel pb_users masih kosong, user pertama yang berhasil
 * login otomatis menjadi superadmin.
 */
export async function loginWithPassword(
  email: string,
  password: string
): Promise<{ ok: true; role: Role } | { ok: false; error: string }> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.user) return { ok: false, error: "Email atau password salah" };

  const { data: row } = await supabase
    .from("pb_users")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  let role = row?.role as Role | undefined;

  if (!role) {
    // Bootstrap superadmin pertama jika tabel masih kosong
    const { count } = await supabase
      .from("pb_users")
      .select("id", { count: "exact", head: true });

    if ((count ?? 0) === 0) {
      role = "superadmin";
    } else {
      role = "user";
    }

    await supabase.from("pb_users").upsert({
      id: data.user.id,
      email: data.user.email ?? email,
      role,
    });
  }

  await setSessionCookie({
    uid: data.user.id,
    email: data.user.email ?? email,
    role,
  });

  return { ok: true, role };
}
