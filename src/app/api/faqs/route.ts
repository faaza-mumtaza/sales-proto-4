import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

/**
 * GET /api/faqs — daftar FAQ publik (hanya yang dipublikasikan, urut urutan).
 * Query opsional: ?kategori=umum|pembelian|purnajual
 */
export async function GET(req: NextRequest) {
  try {
    const kategori = req.nextUrl.searchParams.get("kategori") ?? "";
    const validKategori = ["umum", "pembelian", "purnajual"].includes(kategori)
      ? kategori
      : undefined;

    const rows = await db.faq.findMany({
      where: { is_published: true, ...(validKategori ? { kategori: validKategori } : {}) },
      orderBy: [{ urutan: "asc" }, { created_at: "asc" }],
      take: 60,
      select: {
        id: true,
        kategori: true,
        pertanyaan: true,
        jawaban: true,
      },
    });

    return ok({
      faqs: rows.map((f) => ({
        id: f.id,
        kategori: f.kategori,
        pertanyaan: f.pertanyaan,
        jawaban: f.jawaban,
      })),
    });
  } catch (e) {
    console.error("[api/faqs] GET error:", e);
    return fail("Gagal memuat FAQ.", 500);
  }
}
