import { NextRequest, NextResponse } from "next/server";

const EXPECTED_X1 = "838868fe2b333b57e7282c698b3bf2fc";
const SUCCESS_RESPONSE = "NWQ5MTNjZWM4ZmU3MDgyNmRlZmMyMzYxZjg5ODcyZGE";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const x1 = searchParams.get("x1");

  // Hanya periksa x1 sesuai instruksi
  if (x1 === EXPECTED_X1) {
    return new NextResponse(SUCCESS_RESPONSE, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  return new NextResponse("Forbidden or Invalid Parameter", {
    status: 403,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const x1 = searchParams.get("x1");

  if (x1 === EXPECTED_X1) {
    return new NextResponse(SUCCESS_RESPONSE, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  return new NextResponse("Forbidden or Invalid Parameter", {
    status: 403,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
