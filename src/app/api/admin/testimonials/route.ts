import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, parseJsonBody, zodErrorMessage } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";
import { testimoniStatusSchema, idSchema } from "@/lib/validations";

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

/** PATCH /api/admin/testimonials — ubah status (setujui / tolak / kembalikan ke menunggu). */
export async function PATCH(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const body = await parseJsonBody(req);
  if (!body) return fail("Format data tidak valid.", 400);

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

/** DELETE /api/admin/testimonials?id=... */
export async function DELETE(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

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
