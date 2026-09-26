import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, parseJsonBody, zodErrorMessage } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";
import { pesanStatusSchema, pesanBulkStatusSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

/** GET /api/admin/messages — semua pesan masuk (terbaru dulu). */
export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  try {
    const messages = await db.pesan.findMany({ orderBy: { created_at: "desc" } });
    return ok({
      messages: messages.map((p) => ({
        id: p.id,
        nama_lengkap: p.nama_lengkap,
        no_telepon: p.no_telepon,
        email: p.email,
        subjek: p.subjek,
        pesan: p.pesan,
        status: p.status,
        ip_address: p.ip_address,
        created_at: p.created_at.toISOString(),
      })),
    });
  } catch (e) {
    console.error("[api/admin/messages] GET error:", e);
    return fail("Gagal memuat pesan.", 500);
  }
}

/** PATCH /api/admin/messages — ubah status pesan (tunggal {id,status} atau massal {ids,status}). */
export async function PATCH(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const body = await parseJsonBody(req);
  if (!body) return fail("Format data tidak valid.", 400);

  // Mode massal: { ids: [...], status }
  if (Array.isArray(body.ids)) {
    const parsed = pesanBulkStatusSchema.safeParse(body);
    if (!parsed.success) return fail(zodErrorMessage(parsed.error), 422);
    try {
      const res = await db.pesan.updateMany({
        where: { id: { in: parsed.data.ids } },
        data: { status: parsed.data.status },
      });
      return ok({ updated: res.count });
    } catch (e) {
      console.error("[api/admin/messages] PATCH bulk error:", e);
      return fail("Gagal memperbarui status pesan secara massal.", 500);
    }
  }

  const parsed = pesanStatusSchema.safeParse(body);
  if (!parsed.success) return fail(zodErrorMessage(parsed.error), 422);

  try {
    const existing = await db.pesan.findUnique({ where: { id: parsed.data.id } });
    if (!existing) return fail("Pesan tidak ditemukan.", 404);
    const updated = await db.pesan.update({
      where: { id: parsed.data.id },
      data: { status: parsed.data.status },
    });
    return ok({ message: { id: updated.id, status: updated.status } });
  } catch (e) {
    console.error("[api/admin/messages] PATCH error:", e);
    return fail("Gagal memperbarui status pesan.", 500);
  }
}

/**
 * DELETE /api/admin/messages — hapus pesan.
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
      const res = await db.pesan.deleteMany({ where: { id: { in: ids } } });
      return ok({ deleted: res.count });
    } catch (e) {
      console.error("[api/admin/messages] DELETE bulk error:", e);
      return fail("Gagal menghapus pesan secara massal.", 500);
    }
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return fail("Parameter id wajib.", 422);

  try {
    const existing = await db.pesan.findUnique({ where: { id } });
    if (!existing) return fail("Pesan tidak ditemukan.", 404);
    await db.pesan.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) {
    console.error("[api/admin/messages] DELETE error:", e);
    return fail("Gagal menghapus pesan.", 500);
  }
}
