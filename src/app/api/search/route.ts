import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, getClientIP } from "@/lib/api-helpers";
import { rateLimit } from "@/lib/rate-limit";
import { publishDueArtikels, safeParseArray } from "@/lib/serializers";

export const dynamic = "force-dynamic";

/**
 * GET /api/search?q=<kata kunci> — pencarian global publik.
 * Mencari mobil (nama + kategori label) dan artikel (judul + ringkasan + tag),
 * hanya entitas yang tampil publik. Ringan: field minim + limit hasil.
 */
export async function GET(req: NextRequest) {
  try {
    // Rate limit ringan (GET dari command palette, cukup longgar)
    const ip = getClientIP(req);
    const rl = rateLimit(ip, "search", 60, 60_000);
    if (!rl.ok) {
      return fail("Terlalu banyak pencarian. Coba lagi sebentar lagi.", 429, {
        retryAfter: rl.retryAfterSeconds,
      });
    }

    const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 100);
    if (q.length < 2) {
      // terlalu pendek: kembalikan kosong (frontend menampilkan tautan cepat)
      return ok({ cars: [], articles: [] });
    }

    const cars = await db.mobil.findMany({
      where: {
        is_published: true,
        OR: [
          { nama: { contains: q } },
          { kategori_label: { contains: q } },
          { fuel: { contains: q } },
          { transmission: { contains: q } },
        ],
      },
      select: {
        nama: true,
        slug: true,
        kategori_label: true,
        harga_label: true,
        harga_mulai: true,
        gambar_utama: true,
      },
      orderBy: [{ urutan: "asc" }],
      take: 5,
    });

    await publishDueArtikels();

    const articlesRaw = await db.artikel.findMany({
      where: { status: "PUBLISHED" },
      select: {
        judul: true,
        slug: true,
        ringkasan: true,
        tipe: true,
        tags: true,
        published_at: true,
      },
      orderBy: [{ published_at: "desc" }],
      take: 200,
    });

    const qLower = q.toLowerCase();
    const articles = articlesRaw
      .filter((a) => {
        if (a.judul.toLowerCase().includes(qLower)) return true;
        if (a.ringkasan?.toLowerCase().includes(qLower)) return true;
        const tags = safeParseArray(a.tags);
        return tags.some((t) => String(t).toLowerCase().includes(qLower));
      })
      .slice(0, 5)
      .map(({ judul, slug, ringkasan, tipe }) => ({ judul, slug, ringkasan, tipe }));

    return ok({ cars, articles });
  } catch (e) {
    console.error("[api/search] GET error:", e);
    return fail("Gagal melakukan pencarian.", 500);
  }
}
