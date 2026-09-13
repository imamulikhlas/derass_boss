import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

type RouteProps = {
  params: Promise<{
    filename: string;
  }>;
};

export async function GET(request: NextRequest, props: RouteProps) {
  const { filename } = await props.params;
  const fileName = path.basename(filename || "curut.cbm");

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
