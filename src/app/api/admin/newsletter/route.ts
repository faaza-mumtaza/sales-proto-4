import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, parseJsonBody, zodErrorMessage } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";
import { newsletterBulkStatusSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

/** GET /api/admin/newsletter — semua subscriber (terbaru dulu) + ringkasan. */
export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  try {
    const [subscribers, total, aktif] = await Promise.all([
      db.subscriberNewsletter.findMany({ orderBy: { created_at: "desc" } }),
      db.subscriberNewsletter.count(),
      db.subscriberNewsletter.count({ where: { status: "AKTIF" } }),
    ]);
    return ok({
      subscribers: subscribers.map((s) => ({
        id: s.id,
        email: s.email,
        status: s.status,
        ip_address: s.ip_address,
        created_at: s.created_at.toISOString(),
      })),
      counts: { total, aktif },
    });
  } catch (e) {
    console.error("[api/admin/newsletter] GET error:", e);
    return fail("Gagal memuat subscriber.", 500);
  }
}

/**
 * PATCH /api/admin/newsletter — ubah status subscriber.
 * Massal: { ids: [...], status } — status AKTIF | BERHENTI.
 * (Tunggal { id, status } juga didukung demi konsistensi UI tabel lain.)
 */
export async function PATCH(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const body = await parseJsonBody(req);
  if (!body) return fail("Format data tidak valid.", 400);

  // Mode massal: { ids: [...], status }
  if (Array.isArray(body.ids)) {
    const parsed = newsletterBulkStatusSchema.safeParse(body);
    if (!parsed.success) return fail(zodErrorMessage(parsed.error), 422);
    try {
      const res = await db.subscriberNewsletter.updateMany({
        where: { id: { in: parsed.data.ids } },
        data: { status: parsed.data.status },
      });
      return ok({ updated: res.count });
    } catch (e) {
      console.error("[api/admin/newsletter] PATCH bulk error:", e);
      return fail("Gagal memperbarui status subscriber secara massal.", 500);
    }
  }

  // Mode tunggal: { id, status }
  const id = typeof body.id === "string" ? body.id : "";
  const status = typeof body.status === "string" ? body.status : "";
  if (!id || !["AKTIF", "BERHENTI"].includes(status)) {
    return fail("Parameter id dan status (AKTIF/BERHENTI) wajib.", 422);
  }

  try {
    const existing = await db.subscriberNewsletter.findUnique({ where: { id } });
    if (!existing) return fail("Subscriber tidak ditemukan.", 404);
    const updated = await db.subscriberNewsletter.update({
      where: { id },
      data: { status },
    });
    return ok({ subscriber: { id: updated.id, status: updated.status } });
  } catch (e) {
    console.error("[api/admin/newsletter] PATCH error:", e);
    return fail("Gagal memperbarui status subscriber.", 500);
  }
}

/**
 * DELETE /api/admin/newsletter — hapus subscriber.
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
      const res = await db.subscriberNewsletter.deleteMany({ where: { id: { in: ids } } });
      return ok({ deleted: res.count });
    } catch (e) {
      console.error("[api/admin/newsletter] DELETE bulk error:", e);
      return fail("Gagal menghapus subscriber secara massal.", 500);
    }
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return fail("Parameter id wajib.", 422);

  try {
    const existing = await db.subscriberNewsletter.findUnique({ where: { id } });
    if (!existing) return fail("Subscriber tidak ditemukan.", 404);
    await db.subscriberNewsletter.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) {
    console.error("[api/admin/newsletter] DELETE error:", e);
    return fail("Gagal menghapus subscriber.", 500);
  }
}
