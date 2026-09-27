import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, parseJsonBody, zodErrorMessage } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";
import { bookingServisStatusSchema, bookingBulkStatusSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

/** GET /api/admin/service-bookings — semua booking servis (terbaru dulu). */
export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  try {
    const bookings = await db.bookingServis.findMany({
      orderBy: [{ tanggal_diinginkan: "desc" }, { created_at: "desc" }],
      include: { mobil: { select: { nama: true, slug: true } } },
    });
    return ok({
      bookings: bookings.map((b) => ({
        id: b.id,
        nama_lengkap: b.nama_lengkap,
        no_telepon: b.no_telepon,
        email: b.email,
        mobil_pilihan: b.mobil_pilihan,
        mobil_slug: b.mobil?.slug ?? null,
        jenis_servis: b.jenis_servis,
        tanggal_diinginkan: b.tanggal_diinginkan.toISOString(),
        waktu_diinginkan: b.waktu_diinginkan,
        keluhan: b.keluhan,
        status: b.status,
        created_at: b.created_at.toISOString(),
      })),
    });
  } catch (e) {
    console.error("[api/admin/service-bookings] GET error:", e);
    return fail("Gagal memuat booking servis.", 500);
  }
}

/** PATCH /api/admin/service-bookings — ubah status booking servis (tunggal {id,status} atau massal {ids,status}). */
export async function PATCH(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const body = await parseJsonBody(req);
  if (!body) return fail("Format data tidak valid.", 400);

  // Mode massal: { ids: [...], status }
  if (Array.isArray(body.ids)) {
    const parsed = bookingBulkStatusSchema.safeParse(body);
    if (!parsed.success) return fail(zodErrorMessage(parsed.error), 422);
    try {
      const res = await db.bookingServis.updateMany({
        where: { id: { in: parsed.data.ids } },
        data: { status: parsed.data.status },
      });
      return ok({ updated: res.count });
    } catch (e) {
      console.error("[api/admin/service-bookings] PATCH bulk error:", e);
      return fail("Gagal memperbarui status booking servis secara massal.", 500);
    }
  }

  const parsed = bookingServisStatusSchema.safeParse(body);
  if (!parsed.success) return fail(zodErrorMessage(parsed.error), 422);

  try {
    const existing = await db.bookingServis.findUnique({ where: { id: parsed.data.id } });
    if (!existing) return fail("Booking servis tidak ditemukan.", 404);
    const updated = await db.bookingServis.update({
      where: { id: parsed.data.id },
      data: { status: parsed.data.status },
    });
    return ok({ booking: { id: updated.id, status: updated.status } });
  } catch (e) {
    console.error("[api/admin/service-bookings] PATCH error:", e);
    return fail("Gagal memperbarui status booking servis.", 500);
  }
}

/**
 * DELETE /api/admin/service-bookings — hapus booking servis.
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
      const res = await db.bookingServis.deleteMany({ where: { id: { in: ids } } });
      return ok({ deleted: res.count });
    } catch (e) {
      console.error("[api/admin/service-bookings] DELETE bulk error:", e);
      return fail("Gagal menghapus booking servis secara massal.", 500);
    }
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return fail("Parameter id wajib.", 422);

  try {
    const existing = await db.bookingServis.findUnique({ where: { id } });
    if (!existing) return fail("Booking servis tidak ditemukan.", 404);
    await db.bookingServis.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) {
    console.error("[api/admin/service-bookings] DELETE error:", e);
    return fail("Gagal menghapus booking servis.", 500);
  }
}
