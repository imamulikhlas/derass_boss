import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase";

// Respons validasi sesuai protokol klien:
// base64( md5_hex("ZPT") ; field1 ; field2 )
// Klien: buang spasi/\r/\n -> base64 decode -> split ';' ->
// field[0] harus sama dengan md5_hex("ZPT") agar flag sukses di-set.
function buildSuccessResponse(): string {
  const zptMd5 = createHash("md5").update("ZPT").digest("hex"); // lowercase 32 char
  return Buffer.from(`${zptMd5};1;OK`, "utf-8").toString("base64");
}

function failureResponse(status: number): NextResponse {
  return new NextResponse(
    "Anda belum terdaftar / Durasi habis",
    {
      status,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    }
  );
}

async function handleValidation(x1: string | null, ip: string | null): Promise<NextResponse> {
  if (!x1) return failureResponse(403);

  // Provider yang dilayani endpoint ini
  const ENDPOINT_PROVIDER = "nova-v1";

  let license: {
    is_active: boolean;
    expires_at: string | null;
    hit_count: number;
    pb_providers: { code: string } | null;
  } | null = null;
  let dbError = false;

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("pb_licenses")
      .select("is_active, expires_at, hit_count, pb_providers(code)")
      .eq("hwid", x1.toLowerCase())
      .maybeSingle();

    if (error) {
      dbError = true;
    } else {
      license = data as {
        is_active: boolean;
        expires_at: string | null;
        hit_count: number;
        pb_providers: { code: string } | null;
      } | null;
    }
  } catch (e) {
    console.error("[PB-VALIDATE] exception:", e);
    dbError = true;
  }

  // DB error -> tolak (aman)
  if (dbError) {
    return failureResponse(403);
  }

  // HWID tidak terdaftar -> langsung tolak
  if (!license) return failureResponse(403);

  // Lisensi hanya valid jika is_active true DAN provider cocok DAN belum expired
  const expired =
    !license.is_active ||
    license.pb_providers?.code !== ENDPOINT_PROVIDER ||
    (license.expires_at && new Date(license.expires_at).getTime() < Date.now());

  // Update statistik akses
  try {
    const supabase = getSupabaseAdmin();
    await supabase
      .from("pb_licenses")
      .update({
        last_seen_at: new Date().toISOString(),
        last_ip: ip,
        hit_count: (license.hit_count ?? 0) + 1,
      })
      .eq("hwid", x1.toLowerCase());
  } catch {
    // statistik gagal tidak boleh memblokir validasi
  }

  if (expired) {
    console.log("[PB-VALIDATE] rejected:", JSON.stringify(license));
    return failureResponse(403);
  }

  return new NextResponse(buildSuccessResponse(), {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? null;
  return handleValidation(searchParams.get("x1"), ip);
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? null;
  return handleValidation(searchParams.get("x1"), ip);
}
