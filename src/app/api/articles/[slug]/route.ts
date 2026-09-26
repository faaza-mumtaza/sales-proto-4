import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-helpers";
import { publishDueArtikels, serializeArtikel } from "@/lib/serializers";

export const dynamic = "force-dynamic";

/** GET /api/articles/[slug] — detail artikel publik + tambah views. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    await publishDueArtikels();
    const { slug } = await params;
    if (!slug || slug.length > 300) return fail("Artikel tidak ditemukan.", 404);

    const article = await db.artikel.findFirst({
      where: { slug, status: "PUBLISHED" },
    });
    if (!article) return fail("Artikel tidak ditemukan.", 404);

    // increment views (fire-and-forget)
    void db.artikel
      .update({ where: { id: article.id }, data: { views: { increment: 1 } } })
      .catch(() => undefined);

    // artikel terkait (tipe sama, bukan diri sendiri)
    const related = await db.artikel.findMany({
      where: { status: "PUBLISHED", tipe: article.tipe, id: { not: article.id } },
      orderBy: { published_at: "desc" },
      take: 3,
      select: {
        id: true, judul: true, slug: true, ringkasan: true, cover_image: true,
        tipe: true, tags: true, status: true, published_at: true, scheduled_at: true,
        views: true, created_at: true, updated_at: true,
      },
    });

    return ok({
      article: serializeArtikel(article),
      related: related.map(serializeArtikel),
    });
  } catch (e) {
    console.error("[api/articles/[slug]] GET error:", e);
    return fail("Gagal memuat artikel.", 500);
  }
}
