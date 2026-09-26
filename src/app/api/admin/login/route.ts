import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fail, getClientIP, parseJsonBody, zodErrorMessage } from "@/lib/api-helpers";
import { loginSchema } from "@/lib/validations";
import { verifyPassword } from "@/lib/password";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/login — login admin tunggal.
 * Rate-limited per IP; response selalu generic (anti user-enumeration).
 */
export async function POST(req: NextRequest) {
  const ip = getClientIP(req);
  const rl = rateLimit(ip, "login", RATE_LIMITS.login.max, RATE_LIMITS.login.windowMs);
  if (!rl.ok) {
    return fail(
      `Terlalu banyak percobaan login. Coba lagi dalam ${Math.ceil(rl.retryAfterSeconds / 60)} menit.`,
      429,
    );
  }

  const body = await parseJsonBody(req);
  if (!body) return fail("Format data tidak valid.", 400);

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return fail(zodErrorMessage(parsed.error), 422);

  try {
    const admin = await db.admin.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
    const valid = admin
      ? await verifyPassword(parsed.data.password, admin.passwordHash)
      : false;

    if (!admin || !valid) {
      return fail("Email atau password salah.", 401);
    }

    const { token, maxAge } = createSessionToken({
      id: admin.id,
      email: admin.email,
      name: admin.name,
    });

    const res = NextResponse.json({
      ok: true,
      admin: { email: admin.email, name: admin.name },
    });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge,
    });
    return res;
  } catch (e) {
    console.error("[api/admin/login] POST error:", e);
    return fail("Login gagal. Silakan coba lagi.", 500);
  }
}
