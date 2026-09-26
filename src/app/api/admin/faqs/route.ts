import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, parseJsonBody, zodErrorMessage } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";
import { faqUpsertSchema, faqToggleSchema, idSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

const KATEGORI = ["umum", "pembelian", "purnajual"] as const;

/**
 * GET /api/admin/faqs — seluruh FAQ (termasuk draft) + counts untuk admin.
 */
export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  try {
    const [rows, publishedCount, hiddenCount] = await Promise.all([
      db.faq.findMany({ orderBy: [{ urutan: "asc" }, { created_at: "asc" }], take: 200 }),
      db.faq.count({ where: { is_published: true } }),
      db.faq.count({ where: { is_published: false } }),
    ]);

    return ok({
      faqs: rows.map((f) => ({
        id: f.id,
        kategori: f.kategori,
        pertanyaan: f.pertanyaan,
        jawaban: f.jawaban,
        urutan: f.urutan,
        is_published: f.is_published,
        created_at: f.created_at.toISOString(),
        updated_at: f.updated_at.toISOString(),
      })),
      counts: { published: publishedCount, hidden: hiddenCount },
    });
  } catch (e) {
    console.error("[api/admin/faqs] GET error:", e);
    return fail("Gagal memuat FAQ.", 500);
  }
}

/** POST /api/admin/faqs — tambah FAQ baru. */
export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const body = await parseJsonBody(req);
  if (!body) return fail("Format data tidak valid.", 400);

  const parsed = faqUpsertSchema.safeParse(body);
  if (!parsed.success) return fail(zodErrorMessage(parsed.error), 422);
  const data = parsed.data;

  try {
    const created = await db.faq.create({
      data: {
        kategori: data.kategori,
        pertanyaan: data.pertanyaan,
        jawaban: data.jawaban,
        urutan: data.urutan,
        is_published: data.is_published,
      },
    });
    return ok({ id: created.id });
  } catch (e) {
    console.error("[api/admin/faqs] POST error:", e);
    return fail("Gagal menyimpan FAQ.", 500);
  }
}

/** PUT /api/admin/faqs — perbarui FAQ (id wajib). */
export async function PUT(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const body = await parseJsonBody(req);
  if (!body) return fail("Format data tidak valid.", 400);

  const parsed = faqUpsertSchema.safeParse(body);
  if (!parsed.success) return fail(zodErrorMessage(parsed.error), 422);
  const data = parsed.data;
  if (!data.id) return fail("ID FAQ wajib untuk pembaruan.", 422);

  try {
    const updated = await db.faq.update({
      where: { id: data.id },
      data: {
        kategori: data.kategori,
        pertanyaan: data.pertanyaan,
        jawaban: data.jawaban,
        urutan: data.urutan,
        is_published: data.is_published,
      },
    });
    return ok({ id: updated.id });
  } catch (e) {
    const code = (e as { code?: string })?.code;
    if (code === "P2025") return fail("FAQ tidak ditemukan.", 404);
    console.error("[api/admin/faqs] PUT error:", e);
    return fail("Gagal memperbarui FAQ.", 500);
  }
}

/** PATCH /api/admin/faqs — toggle tampil/sembunyi cepat. */
export async function PATCH(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const body = await parseJsonBody(req);
  if (!body) return fail("Format data tidak valid.", 400);

  const parsed = faqToggleSchema.safeParse(body);
  if (!parsed.success) return fail(zodErrorMessage(parsed.error), 422);

  try {
    const updated = await db.faq.update({
      where: { id: parsed.data.id },
      data: { is_published: parsed.data.is_published },
    });
    return ok({ id: updated.id, is_published: updated.is_published });
  } catch (e) {
    const code = (e as { code?: string })?.code;
    if (code === "P2025") return fail("FAQ tidak ditemukan.", 404);
    console.error("[api/admin/faqs] PATCH error:", e);
    return fail("Gagal mengubah status FAQ.", 500);
  }
}

/** DELETE /api/admin/faqs?id=... */
export async function DELETE(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const parsed = idSchema.safeParse({ id: req.nextUrl.searchParams.get("id") ?? "" });
  if (!parsed.success) return fail(zodErrorMessage(parsed.error), 422);

  try {
    await db.faq.delete({ where: { id: parsed.data.id } });
    return ok({ deleted: true });
  } catch (e) {
    const code = (e as { code?: string })?.code;
    if (code === "P2025") return fail("FAQ tidak ditemukan.", 404);
    console.error("[api/admin/faqs] DELETE error:", e);
    return fail("Gagal menghapus FAQ.", 500);
  }
}
