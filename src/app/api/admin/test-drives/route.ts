import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, parseJsonBody, zodErrorMessage } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";
import { testDriveStatusSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

/** GET /api/admin/test-drives — semua booking (terbaru dulu). */
export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  try {
    const bookings = await db.testDrive.findMany({
      orderBy: [{ tanggal_diinginkan: "desc" }, { created_at: "desc" }],
      include: { mobil: { select: { nama: true, slug: true } } },
    });
    return ok({
      bookings: bookings.map((t) => ({
        id: t.id,
        nama_lengkap: t.nama_lengkap,
        no_telepon: t.no_telepon,
        email: t.email,
        mobil_pilihan: t.mobil_pilihan,
        mobil_slug: t.mobil?.slug ?? null,
        tanggal_diinginkan: t.tanggal_diinginkan.toISOString(),
        waktu_diinginkan: t.waktu_diinginkan,
        catatan: t.catatan,
        status: t.status,
        created_at: t.created_at.toISOString(),
      })),
    });
  } catch (e) {
    console.error("[api/admin/test-drives] GET error:", e);
    return fail("Gagal memuat booking test drive.", 500);
  }
}

/** PATCH /api/admin/test-drives — ubah status booking. */
export async function PATCH(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const body = await parseJsonBody(req);
  if (!body) return fail("Format data tidak valid.", 400);
  const parsed = testDriveStatusSchema.safeParse(body);
  if (!parsed.success) return fail(zodErrorMessage(parsed.error), 422);

  try {
    const existing = await db.testDrive.findUnique({ where: { id: parsed.data.id } });
    if (!existing) return fail("Booking tidak ditemukan.", 404);
    const updated = await db.testDrive.update({
      where: { id: parsed.data.id },
      data: { status: parsed.data.status },
    });
    return ok({ booking: { id: updated.id, status: updated.status } });
  } catch (e) {
    console.error("[api/admin/test-drives] PATCH error:", e);
    return fail("Gagal memperbarui status booking.", 500);
  }
}

/** DELETE /api/admin/test-drives?id=... — hapus booking. */
export async function DELETE(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return fail("Parameter id wajib.", 422);

  try {
    const existing = await db.testDrive.findUnique({ where: { id } });
    if (!existing) return fail("Booking tidak ditemukan.", 404);
    await db.testDrive.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) {
    console.error("[api/admin/test-drives] DELETE error:", e);
    return fail("Gagal menghapus booking.", 500);
  }
}
