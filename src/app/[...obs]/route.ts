import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * OBSERVER: menangkap semua request path tak dikenal (client derass.my.id).
 * Format yang diharapkan client: /<PREFIX_24><HWID>&x2=<TOKEN_20>
 * Prefix & format HWID belum terkonfirmasi -> dicatat dulu ke pb_request_logs.
 */
export async function GET(request: NextRequest) {
  const { pathname, searchParams } = new URL(request.url);
  const fullPath = pathname + (request.nextUrl.search ?? "");
  const ua = request.headers.get("user-agent") ?? "";
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";

  // Coba pisahkan x2 dari path
  const x2 = searchParams.get("x2") ?? "";
  let basePath = pathname;
  let tailQuery = "";
  const x2InPath = pathname.indexOf("&x2=");
  if (x2InPath !== -1) {
    basePath = pathname.slice(0, x2InPath);
    tailQuery = pathname.slice(x2InPath);
  }

  console.log(
    `[OBSERVER] path="${fullPath}" basePath="${basePath}" x2="${x2}" tail="${tailQuery}" ip=${ip} ua="${ua}"`
  );

  // Catat ke DB (abaikan error supaya client selalu dapat response)
  try {
    const supabase = getSupabaseAdmin();
    await supabase.from("pb_request_logs").insert({
      path: fullPath,
      query: request.nextUrl.search ?? "",
      user_agent: ua,
      ip,
    });
  } catch (e) {
    console.error("[OBSERVER] gagal log ke DB:", e);
  }

  // Response awal sengaja trivial (PING) — variasikan bertahap untuk
  // memetakan format parser client ("Expired Time: ...").
  return new NextResponse("PING", {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}
