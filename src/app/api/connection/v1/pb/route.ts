import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

const EXPECTED_X1 = "838868fe2b333b57e7282c698b3bf2fc";

// Respons validasi sesuai protokol klien:
// base64( md5_hex("ZPT") ; field1 ; field2 )
// Klien: buang spasi/\r/\n -> base64 decode -> split ';' ->
// field[0] harus sama dengan md5_hex("ZPT") agar flag sukses di-set.
function buildSuccessResponse(): string {
  const zptMd5 = createHash("md5").update("ZPT").digest("hex"); // lowercase 32 char
  return Buffer.from(`${zptMd5};1;OK`, "utf-8").toString("base64");
}

function handleValidation(x1: string | null): NextResponse {
  if (x1 === EXPECTED_X1) {
    return new NextResponse(buildSuccessResponse(), {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

  return new NextResponse("Connection Failure... Server down / Cheat disuspend / Anda belum terdaftar / Durasi habis", {
    status: 403,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  return handleValidation(searchParams.get("x1"));
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  return handleValidation(searchParams.get("x1"));
}
