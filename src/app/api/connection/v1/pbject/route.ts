import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

// Protokol client CBs.dll (host nova-prem.com):
//   Request : GET /api/connection/v1/pbject?x1=<md5_hex(HWID)>
//   Response: base64("ZPT YYYY-MM-DD HH:MM <tag>")  -> sukses
//             base64("EXP <reason>")                -> ditolak
// Parser client: base64 decode -> split whitespace (istringstream >>)
//   - wajib ada token exact "ZPT"
//   - field kedua harus panjang >= 11 karakter (datetime 16 char memenuhi)
//   - total body < 1024 byte, murni base64 satu baris

const ENDPOINT_PROVIDER = "nova-v1";

function b64(raw: string): string {
  return Buffer.from(raw, "utf-8").toString("base64");
}

function textResponse(body: string): NextResponse {
  return new NextResponse(body, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}

// Format datetime UTC "YYYY-MM-DD HH:MM" (16 char, konsisten dgn client)
function formatExpiry(expiresAt: string): string {
  const d = new Date(expiresAt);
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ` +
    `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`
  );
}

type LicenseRow = {
  is_active: boolean;
  expires_at: string | null;
  hit_count: number;
  pb_providers: { code: string } | null;
};

async function handleValidation(x1: string | null, ip: string | null): Promise<NextResponse> {
  const reject = (reason: string) => textResponse(b64(`EXP ${reason}`));

  if (!x1) return reject("param-x1-kosong");

  let license: LicenseRow | null = null;
  let dbError = false;

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("pb_licenses")
      .select("is_active, expires_at, hit_count, pb_providers(code)")
      .eq("hwid", x1.toLowerCase())
      .maybeSingle();

    if (error) {
      console.error("[PBJECT] supabase error:", error.message);
      dbError = true;
    } else {
      license = data as LicenseRow | null;
    }
  } catch (e) {
    console.error("[PBJECT] exception:", e);
    dbError = true;
  }

  if (dbError) return reject("server-error");

  if (!license) return reject("hwid-tidak-terdaftar");

  const expired =
    !license.is_active ||
    license.pb_providers?.code !== ENDPOINT_PROVIDER ||
    (license.expires_at && new Date(license.expires_at).getTime() < Date.now());

  // Update statistik akses (gagal tidak boleh blokir validasi)
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
    // ignore
  }

  if (expired) {
    console.log("[PBJECT] rejected:", JSON.stringify(license));
    return reject("lisensi-kadaluarsa");
  }

  // Sukses: "ZPT <datetime16> <tag>" — datetime 16 char memenuhi syarat >= 11 char
  const expiry = formatExpiry(license.expires_at ?? "2099-12-31T23:59:00Z");
  return textResponse(b64(`ZPT ${expiry} nova-premium-active`));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? null;
  return handleValidation(searchParams.get("x1"), ip);
}
