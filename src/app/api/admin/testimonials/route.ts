import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, parseJsonBody, zodErrorMessage } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";
import { testimoniStatusSchema, testimoniBulkStatusSchema, idSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

const STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;

/**
 * GET /api/admin/testimonials?status=PENDING|APPROVED|REJECTED
 * Daftar testimoni untuk moderasi admin.
 */
export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const statusParam = req.nextUrl.searchParams.get("status") ?? "";
  const status = (STATUSES as readonly string[]).includes(statusParam)
    ? (statusParam as (typeof STATUSES)[number])
    : undefined;

  try {
    const [rows, counts] = await Promise.all([
      db.testimoni.findMany({
        where: status ? { status } : undefined,
        orderBy: { created_at: "desc" },
        take: 200,
      }),
      Promise.all(
        STATUSES.map((s) => db.testimoni.count({ where: { status: s } })),
      ),
    ]);

    return ok({
      testimonials: rows.map((t) => ({
        id: t.id,
        nama: t.nama,
        rating: t.rating,
        pesan: t.pesan,
        status: t.status,
        ip_address: t.ip_address,
        created_at: t.created_at.toISOString(),
      })),
      counts: {
        PENDING: counts[0],
        APPROVED: counts[1],
        REJECTED: counts[2],
      },
    });
  } catch (e) {
    console.error("[api/admin/testimonials] GET error:", e);
    return fail("Gagal memuat testimoni.", 500);
  }
}

/** PATCH /api/admin/testimonials — ubah status (tunggal {id,status} atau massal {ids,status}). */
export async function PATCH(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const body = await parseJsonBody(req);
  if (!body) return fail("Format data tidak valid.", 400);

  // Mode massal: { ids: [...], status }
  if (Array.isArray(body.ids)) {
    const parsed = testimoniBulkStatusSchema.safeParse(body);
    if (!parsed.success) return fail(zodErrorMessage(parsed.error), 422);
    try {
      const res = await db.testimoni.updateMany({
        where: { id: { in: parsed.data.ids } },
        data: { status: parsed.data.status },
      });
      return ok({ updated: res.count });
    } catch (e) {
      console.error("[api/admin/testimonials] PATCH bulk error:", e);
      return fail("Gagal memperbarui status testimoni secara massal.", 500);
    }
  }

  const parsed = testimoniStatusSchema.safeParse(body);
  if (!parsed.success) return fail(zodErrorMessage(parsed.error), 422);

  try {
    const updated = await db.testimoni.update({
      where: { id: parsed.data.id },
      data: { status: parsed.data.status },
    });
    if (!updated) return fail("Testimoni tidak ditemukan.", 404);
    return ok({ id: updated.id, status: updated.status });
  } catch (e) {
    const code = (e as { code?: string })?.code;
    if (code === "P2025") return fail("Testimoni tidak ditemukan.", 404);
    console.error("[api/admin/testimonials] PATCH error:", e);
    return fail("Gagal mengubah status testimoni.", 500);
  }
}

/**
 * DELETE /api/admin/testimonials — hapus testimoni.
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
      const res = await db.testimoni.deleteMany({ where: { id: { in: ids } } });
      return ok({ deleted: res.count });
    } catch (e) {
      console.error("[api/admin/testimonials] DELETE bulk error:", e);
      return fail("Gagal menghapus testimoni secara massal.", 500);
    }
  }

  const parsed = idSchema.safeParse({ id: req.nextUrl.searchParams.get("id") ?? "" });
  if (!parsed.success) return fail(zodErrorMessage(parsed.error), 422);

  try {
    await db.testimoni.delete({ where: { id: parsed.data.id } });
    return ok({ deleted: true });
  } catch (e) {
    const code = (e as { code?: string })?.code;
    if (code === "P2025") return fail("Testimoni tidak ditemukan.", 404);
    console.error("[api/admin/testimonials] DELETE error:", e);
    return fail("Gagal menghapus testimoni.", 500);
  }
}
