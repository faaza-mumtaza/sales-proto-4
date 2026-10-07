import { NextRequest } from "next/server";
import { ok, fail, parseJsonBody } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";
import { isAllowedImageType, MAX_UPLOAD_BYTES, saveUploadedImage } from "@/lib/storage";

export const dynamic = "force-dynamic";

const CATEGORIES = ["cars", "articles", "misc"] as const;

/**
 * POST /api/admin/upload — upload gambar (base64 JSON) dari panel admin.
 * Body: { contentBase64, contentType, category? } → { url } (relatif: /api/files/...).
 * Dipakai oleh: image-uploader (cover artikel & katalog), warna-image-input,
 * artikel-editor (gambar di dalam konten).
 */
export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const body = await parseJsonBody(req);
  if (!body) return fail("Format data tidak valid.", 400);

  const contentBase64 = typeof body.contentBase64 === "string" ? body.contentBase64 : "";
  const contentType = typeof body.contentType === "string" ? body.contentType : "";
  const categoryRaw = typeof body.category === "string" ? body.category : "misc";
  const category = (CATEGORIES as readonly string[]).includes(categoryRaw)
    ? (categoryRaw as (typeof CATEGORIES)[number])
    : "misc";

  if (!contentBase64) return fail("Data gambar kosong.", 422);
  if (!isAllowedImageType(contentType)) {
    return fail("Tipe file tidak diizinkan (hanya PNG, JPG, WebP, GIF).", 422);
  }
  // Batasi panjang base64 SEBELUM decode (maks 5MB file + margin encoding).
  if (contentBase64.length > Math.ceil((MAX_UPLOAD_BYTES * 4) / 3) + 1024) {
    return fail("Ukuran file maksimal 5MB.", 422);
  }

  const buffer = Buffer.from(contentBase64, "base64");
  if (buffer.length === 0) return fail("Data gambar tidak valid.", 422);

  try {
    const saved = await saveUploadedImage(buffer, contentType, category);
    return ok({ url: saved.url });
  } catch (e) {
    // Pesan error dari saveUploadedImage sudah aman & user-friendly.
    return fail(e instanceof Error ? e.message : "Upload gagal.", 422);
  }
}
