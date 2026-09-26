import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-helpers";
import { publishDueArtikels, serializeArtikel } from "@/lib/serializers";

export const dynamic = "force-dynamic";

const TIPE_VALID = ["PROMO", "BERITA", "KEGIATAN"];

/**
 * GET /api/articles?tipe=PROMO — daftar artikel yang sudah dipublikasikan
 * (artikel TERJADWAL yang jatuh temponya otomatis dipublikasikan di sini).
 */
export async function GET(req: NextRequest) {
  try {
    await publishDueArtikels();

    const tipe = req.nextUrl.searchParams.get("tipe");
    const where: { status: string; tipe?: string } = { status: "PUBLISHED" };
    if (tipe && TIPE_VALID.includes(tipe)) where.tipe = tipe;

    const articles = await db.artikel.findMany({
      where,
      orderBy: [{ published_at: "desc" }],
      // daftar tidak perlu mengirim konten penuh (hemat payload)
      select: {
        id: true, judul: true, slug: true, ringkasan: true, cover_image: true,
        tipe: true, tags: true, status: true, published_at: true, scheduled_at: true,
        views: true, created_at: true, updated_at: true,
      },
    });
    return ok({ articles: articles.map(serializeArtikel) });
  } catch (e) {
    console.error("[api/articles] GET error:", e);
    return fail("Gagal memuat daftar artikel.", 500);
  }
}
