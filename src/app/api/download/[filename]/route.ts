import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

type RouteProps = {
  params: Promise<{
    filename: string;
  }>;
};

function resolveFilePath(name: string): { fullPath: string; downloadName: string } | null {
  const base = path.basename(name || "curut.cbm");
  const namesToTry = [
    base,
    base.endsWith(".cbm") ? base : `${base}.cbm`,
    "curut.cbm",
  ];

  const searchDirs = [
    path.join(process.cwd(), "public"),
    path.join(process.cwd(), "public", "files"),
    process.cwd(),
  ];

  for (const n of namesToTry) {
    for (const dir of searchDirs) {
      const p = path.join(dir, n);
      if (fs.existsSync(p) && fs.statSync(p).isFile()) {
        return { fullPath: p, downloadName: n };
      }
    }
  }

  return null;
}

export async function GET(request: NextRequest, props: RouteProps) {
  const { filename } = await props.params;
  const resolved = resolveFilePath(filename);

  if (!resolved) {
    return NextResponse.json(
      { error: `File '${filename}' tidak ditemukan di server.` },
      { status: 404 }
    );
  }

  try {
    const fileBuffer = fs.readFileSync(resolved.fullPath);
    const stat = fs.statSync(resolved.fullPath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${resolved.downloadName}"`,
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
