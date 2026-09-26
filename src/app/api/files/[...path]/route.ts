import { NextRequest, NextResponse } from "next/server";
import { readUploadedFile } from "@/lib/storage";

export const dynamic = "force-dynamic";

/**
 * GET /api/files/[...path] — serve gambar hasil upload dari storage
 * (db/uploads). Anti path-traversal ada di lib/storage.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;
  if (!segments || segments.length === 0) {
    return NextResponse.json({ ok: false, message: "Not found" }, { status: 404 });
  }
  const relPath = segments.join("/");
  const file = await readUploadedFile(relPath);
  if (!file) {
    return NextResponse.json({ ok: false, message: "Not found" }, { status: 404 });
  }
  return new NextResponse(new Uint8Array(file.buffer), {
    status: 200,
    headers: {
      "Content-Type": file.contentType,
      "Content-Length": String(file.buffer.length),
      // Cache statis lama — file upload TIDAK pernah berubah nama
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
