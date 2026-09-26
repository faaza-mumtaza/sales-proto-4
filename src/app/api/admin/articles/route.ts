import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, parseJsonBody, zodErrorMessage } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";
import { artikelUpsertSchema, artikelBulkStatusSchema, type ArtikelUpsertInput } from "@/lib/validations";
import { sanitizeArticleHtml } from "@/lib/sanitize";
import { serializeArtikel } from "@/lib/serializers";

export const dynamic = "force-dynamic";

/** GET /api/admin/articles — semua artikel (draft/terjadwal/published). */
export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  try {
    const articles = await db.artikel.findMany({
      orderBy: [
        { status: "asc" }, // DRAFT < PUBLISHED < TERJADWAL — urutan abjad saja
        { updated_at: "desc" },
      ],
    });
    return ok({ articles: articles.map(serializeArtikel) });
  } catch (e) {
    console.error("[api/admin/articles] GET error:", e);
    return fail("Gagal memuat artikel.", 500);
  }
}

function buildArticleData(d: ArtikelUpsertInput) {
  return {
    judul: d.judul,
    slug: d.slug,
    ringkasan: d.ringkasan,
    // Sanitasi server-side SEMUA konten HTML sebelum disimpan
    konten: sanitizeArticleHtml(d.konten),
    cover_image: d.cover_image,
    tipe: d.tipe,
    tags: JSON.stringify(d.tags),
    status: d.status,
    scheduled_at: d.status === "TERJADWAL" ? new Date(d.scheduled_at!) : null,
    published_at: d.status === "PUBLISHED" ? new Date() : null,
  };
}

/** POST /api/admin/articles — buat artikel baru. */
export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const body = await parseJsonBody(req);
  if (!body) return fail("Format data tidak valid.", 400);
  const parsed = artikelUpsertSchema.safeParse(body);
  if (!parsed.success) return fail(zodErrorMessage(parsed.error), 422);
  const d = parsed.data;

  try {
    const dupe = await db.artikel.findUnique({ where: { slug: d.slug }, select: { id: true } });
    if (dupe) return fail(`Slug "${d.slug}" sudah dipakai artikel lain.`, 409);

    const article = await db.artikel.create({ data: buildArticleData(d) });
    return ok({ article: serializeArtikel(article) }, { status: 201 });
  } catch (e) {
    console.error("[api/admin/articles] POST error:", e);
    return fail("Gagal menyimpan artikel.", 500);
  }
}

/** PUT /api/admin/articles — update artikel (id di body). */
export async function PUT(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const body = await parseJsonBody(req);
  if (!body) return fail("Format data tidak valid.", 400);
  const parsed = artikelUpsertSchema.safeParse(body);
  if (!parsed.success) return fail(zodErrorMessage(parsed.error), 422);
  const d = parsed.data;
  if (!d.id) return fail("ID artikel wajib dikirim untuk update.", 422);

  try {
    const existing = await db.artikel.findUnique({ where: { id: d.id } });
    if (!existing) return fail("Artikel tidak ditemukan.", 404);

    const dupe = await db.artikel.findFirst({
      where: { slug: d.slug, id: { not: d.id } },
      select: { id: true },
    });
    if (dupe) return fail(`Slug "${d.slug}" sudah dipakai artikel lain.`, 409);

    const data = buildArticleData(d);
    // Jika sudah pernah publish lalu dikembalikan ke draft, hapus published_at.
    // Jika tetap PUBLISHED saat edit, pertahankan tanggal publish pertama.
    if (d.status === "PUBLISHED" && existing.status === "PUBLISHED" && existing.published_at) {
      data.published_at = existing.published_at;
    }

    const article = await db.artikel.update({ where: { id: d.id }, data });
    return ok({ article: serializeArtikel(article) });
  } catch (e) {
    console.error("[api/admin/articles] PUT error:", e);
    return fail("Gagal memperbarui artikel.", 500);
  }
}

/**
 * PATCH /api/admin/articles — ubah status banyak artikel sekaligus (aksi massal).
 * Body: { ids: [...], status } — status hanya DRAFT | PUBLISHED (TERJADWAL
 * butuh scheduled_at per artikel sehingga tidak tersedia untuk aksi massal).
 * Cermin perilaku PATCH/PUT tunggal: published_at diisi saat pertama kali
 * dipublikasikan (dipertahankan bila sudah ada), dibersihkan saat jadi draft.
 */
export async function PATCH(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const body = await parseJsonBody(req);
  if (!body) return fail("Format data tidak valid.", 400);

  const parsed = artikelBulkStatusSchema.safeParse(body);
  if (!parsed.success) return fail(zodErrorMessage(parsed.error), 422);

  try {
    if (parsed.data.status === "PUBLISHED") {
      // Terbitkan: published_at hanya diisi untuk artikel yang belum pernah
      // tayang (tanggal tayang pertama dipertahankan untuk sisanya).
      const res = await db.artikel.updateMany({
        where: { id: { in: parsed.data.ids } },
        data: { status: "PUBLISHED", scheduled_at: null },
      });
      if (res.count > 0) {
        await db.artikel.updateMany({
          where: { id: { in: parsed.data.ids }, published_at: null },
          data: { published_at: new Date() },
        });
      }
      return ok({ updated: res.count });
    }

    // Kembalikan ke draft: bersihkan tanggal tayang & jadwal (cermin
    // perilaku form editor pada mode tunggal).
    const res = await db.artikel.updateMany({
      where: { id: { in: parsed.data.ids } },
      data: { status: "DRAFT", published_at: null, scheduled_at: null },
    });
    return ok({ updated: res.count });
  } catch (e) {
    console.error("[api/admin/articles] PATCH bulk error:", e);
    return fail("Gagal memperbarui status artikel secara massal.", 500);
  }
}

/**
 * DELETE /api/admin/articles — hapus artikel.
 * Tunggal: ?id=... — Massal: ?ids=id1,id2,... (maks 100).
 */
export async function DELETE(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  // Mode massal: ?ids=a,b,c
  const idsParam = req.nextUrl.searchParams.get("ids");
  if (idsParam) {
    const ids = idsParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 100);
    if (ids.length === 0) return fail("Parameter ids tidak valid.", 422);
    try {
      const res = await db.artikel.deleteMany({ where: { id: { in: ids } } });
      return ok({ deleted: res.count });
    } catch (e) {
      console.error("[api/admin/articles] DELETE bulk error:", e);
      return fail("Gagal menghapus artikel secara massal.", 500);
    }
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return fail("Parameter id wajib.", 422);

  try {
    const existing = await db.artikel.findUnique({ where: { id } });
    if (!existing) return fail("Artikel tidak ditemukan.", 404);
    await db.artikel.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) {
    console.error("[api/admin/articles] DELETE error:", e);
    return fail("Gagal menghapus artikel.", 500);
  }
}
