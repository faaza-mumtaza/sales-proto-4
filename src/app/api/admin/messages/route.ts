import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, parseJsonBody, zodErrorMessage } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";
import { pesanStatusSchema } from "@/lib/validations";

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

/** PATCH /api/admin/messages — ubah status pesan. */
export async function PATCH(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const body = await parseJsonBody(req);
  if (!body) return fail("Format data tidak valid.", 400);
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

/** DELETE /api/admin/messages?id=... — hapus pesan. */
export async function DELETE(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

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
