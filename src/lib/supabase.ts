import { createClient } from "@supabase/supabase-js";

// Service role key dipakai di server-side only (bypass RLS).
// Jangan pernah expose ke client.
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Supabase belum dikonfigurasi: isi NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di .env.local");
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}
