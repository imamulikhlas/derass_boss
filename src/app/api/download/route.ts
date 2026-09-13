import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const requestedFile = searchParams.get("file") || "curut.cbm";
  const fileName = path.basename(requestedFile);

  const candidatePaths = [
    path.join(process.cwd(), "public", fileName),
    path.join(process.cwd(), "public", "files", fileName),
    path.join(process.cwd(), fileName),
  ];

  const filePath = candidatePaths.find((p) => fs.existsSync(p));

  if (!filePath) {
    return NextResponse.json(
      { error: `File '${fileName}' tidak ditemukan di server.` },
      { status: 404 }
    );
  }

  try {
    const fileBuffer = fs.readFileSync(filePath);
    const stat = fs.statSync(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": stat.size.toString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal membaca file dari server." },
      { status: 500 }
    );
  }
}
