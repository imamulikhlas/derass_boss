import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

type RouteProps = {
  params: Promise<{
    path: string[];
  }>;
};

function searchRecursively(dir: string, baseName: string): { fullPath: string; downloadName: string } | null {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  // 1. Cek file di level folder ini terlebih dahulu
  for (const entry of entries) {
    if (entry.isFile()) {
      const parsed = path.parse(entry.name);
      if (entry.name === baseName || parsed.name === baseName) {
        return {
          fullPath: path.join(dir, entry.name),
          downloadName: entry.name,
        };
      }
    }
  }

  // 2. Jika tidak ada, cek ke subfolder (rekursif)
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const subResult = searchRecursively(path.join(dir, entry.name), baseName);
      if (subResult) return subResult;
    }
  }

  return null;
}

function resolveFromPublic(pathSegments: string[]): { fullPath: string; downloadName: string } | null {
  const publicDir = path.join(process.cwd(), "public");

  // Amankan path dari traversal
  const relativePath = path.normalize(path.join(...pathSegments)).replace(/^(\.\.(\/|\\|$))+/, "");
  const targetPath = path.join(publicDir, relativePath);

  if (!targetPath.startsWith(publicDir)) {
    return null;
  }

  // 1. Cek apakah langsung cocok dengan path yang diberikan (misal /d/pb/curut1.cbm)
  if (fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
    return { fullPath: targetPath, downloadName: path.basename(targetPath) };
  }

  // 2. Cek apakah ada di folder yang sama tanpa ekstensi (misal /d/pb/curut1)
  const parentDir = path.dirname(targetPath);
  const baseName = path.basename(targetPath);

  if (fs.existsSync(parentDir) && fs.statSync(parentDir).isDirectory()) {
    const files = fs.readdirSync(parentDir);
    const match = files.find((f) => {
      const parsed = path.parse(f);
      return f === baseName || parsed.name === baseName;
    });

    if (match) {
      const foundPath = path.join(parentDir, match);
      if (fs.statSync(foundPath).isFile()) {
        return { fullPath: foundPath, downloadName: match };
      }
    }
  }

  // 3. Jika hanya sebut nama file langsung (misal /d/curut1 atau /d/curut1.cbm), cari di seluruh public termasuk subfoldernya (seperti public/pb/)
  if (fs.existsSync(publicDir)) {
    const found = searchRecursively(publicDir, baseName);
    if (found) {
      return found;
    }
  }

  return null;
}

export async function GET(request: NextRequest, props: RouteProps) {
  const { path: pathSegments } = await props.params;

  if (!pathSegments || pathSegments.length === 0) {
    return NextResponse.json(
      { error: "Nama file atau path tidak diberikan." },
      { status: 400 }
    );
  }

  const resolved = resolveFromPublic(pathSegments);

  if (!resolved) {
    return NextResponse.json(
      { error: `File '${pathSegments.join("/")}' tidak ditemukan di server.` },
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
  } catch {
    return NextResponse.json(
      { error: "Gagal membaca file dari server." },
      { status: 500 }
    );
  }
}
