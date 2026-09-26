import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, getClientIP, parseJsonBody, zodErrorMessage } from "@/lib/api-helpers";
import { requireAdmin, getSession } from "@/lib/auth";
import { verifyPassword, hashPassword } from "@/lib/password";
import { changePasswordSchema } from "@/lib/validations";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/change-password — ganti password admin yang sedang login.
 * Verifikasi password lama, lalu simpan hash baru. Rate-limited anti brute-force.
 */
export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const session = getSession(req);
  if (!session) return fail("Sesi tidak valid. Silakan login ulang.", 401);

  const ip = getClientIP(req);
  const rl = rateLimit(ip, "changePassword", RATE_LIMITS.changePassword.max, RATE_LIMITS.changePassword.windowMs);
  if (!rl.ok) {
    return fail(
      `Terlalu banyak percobaan. Coba lagi dalam ${Math.ceil(rl.retryAfterSeconds / 60)} menit.`,
      429,
    );
  }

  const body = await parseJsonBody(req);
  if (!body) return fail("Format data tidak valid.", 400);

  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) return fail(zodErrorMessage(parsed.error), 422);
  const { password_lama, password_baru } = parsed.data;

  try {
    const admin = await db.admin.findUnique({ where: { id: session.sub } });
    if (!admin) return fail("Akun admin tidak ditemukan.", 404);

    const valid = await verifyPassword(password_lama, admin.passwordHash);
    if (!valid) return fail("Password lama salah.", 401);

    const newHash = await hashPassword(password_baru);
    await db.admin.update({
      where: { id: admin.id },
      data: { passwordHash: newHash },
    });

    return ok({ changed: true });
  } catch (e) {
    console.error("[api/admin/change-password] POST error:", e);
    return fail("Gagal mengganti password. Silakan coba lagi.", 500);
  }
}
