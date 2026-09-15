import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * MOCK SERVER — protokol client derass.my.id
 * Request : GET /<prefix24><MAC:SERIAL>&x2=<token20>  (port 80, tanpa body)
 * Response: base64("{MARKER} {token}ZPT {field2} {exp_date}\n")
 *
 * Override untuk brute-force testing (via query param, hanya utk debugging):
 *   &_marker=Y        -> ganti MARKER (default "Y")
 *   &_zpt=0           -> hilangkan suffix "ZPT" setelah token
 *   &_field2=1        -> ganti field2 (default "1")
 *   &_exp=2099-12-31  -> ganti tanggal expired (default 2026-12-31)
 *   &_raw=BASE64      -> kirim raw custom apa pun (base64 dari raw body)
 */

const DEFAULT_MARKER = "Y";
const DEFAULT_EXP = "2099-12-31";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const { pathname, searchParams } = url;
  const ua = request.headers.get("user-agent") ?? "";
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  // Path bisa berbentuk /<prefix24><hwid>&x2=<token> (x2 nyangkut di path,
  // client tidak pakai "?" proper). Fallback: x2 sebagai query string biasa.
  let basePath = pathname;
  let token = searchParams.get("x2") ?? "";
  const x2InPath = pathname.indexOf("&x2=");
  if (x2InPath !== -1) {
    basePath = pathname.slice(0, x2InPath);
    const tokenInPath = pathname.slice(x2InPath + 4).split("?")[0];
    if (tokenInPath) token = tokenInPath;
  }

  const stripped = basePath.replace(/^\//, "");
  const prefix24 = stripped.slice(0, 24);
  const hwid = stripped.slice(24);

  console.log(
    `[MOCK] prefix="${prefix24}" hwid="${hwid}" token="${token}" ip=${ip} ua="${ua}"`
  );

  // Log ke DB (abaikan error agar client selalu dapat response)
  try {
    const supabase = getSupabaseAdmin();
    await supabase.from("pb_request_logs").insert({
      path: pathname + (url.search ?? ""),
      query: url.search ?? "",
      user_agent: ua,
      ip,
    });
  } catch (e) {
    console.error("[MOCK] gagal log ke DB:", e);
  }

  // Susun raw body sesuai format protokol
  const rawOverride = searchParams.get("_raw");
  let raw: string;
  if (rawOverride) {
    raw = Buffer.from(rawOverride, "base64").toString("utf8");
  } else {
    const marker = searchParams.get("_marker") ?? DEFAULT_MARKER;
    const zpt = searchParams.get("_zpt") === "0" ? "" : "ZPT";
    const field2 = searchParams.get("_field2") ?? "1";
    const expDate = searchParams.get("_exp") ?? DEFAULT_EXP;
    raw = `${marker} ${token}${zpt} ${field2} ${expDate}\n`;
  }

  const body = Buffer.from(raw, "utf8").toString("base64");
  if (body.length > 1024) {
    console.warn(`[MOCK] body > 1024 byte (${body.length}), dipotong`);
  }

  return new NextResponse(body.slice(0, 1024), {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}
