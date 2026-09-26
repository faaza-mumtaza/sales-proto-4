import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, getClientIP, getUserAgent, parseJsonBody, zodErrorMessage } from "@/lib/api-helpers";
import { pesanSchema } from "@/lib/validations";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { verifyAntiBot, isHoneypotTripped } from "@/lib/captcha";

export const dynamic = "force-dynamic";

/**
 * POST /api/contact — form kontak publik.
 * Proteksi: rate-limit per IP, honeypot, CAPTCHA (math/Turnstile), validasi zod.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIP(req);

  const rl = rateLimit(ip, "contact", RATE_LIMITS.contact.max, RATE_LIMITS.contact.windowMs);
  if (!rl.ok) {
    return fail(
      `Terlalu banyak permintaan. Coba lagi dalam ${Math.ceil(rl.retryAfterSeconds / 60)} menit.`,
      429,
    );
  }

  const body = await parseJsonBody(req);
  if (!body) return fail("Format data tidak valid.", 400);

  // Honeypot: bot mengisi field tersembunyi → pura-pura sukses tanpa menyimpan
  if (isHoneypotTripped(body.website)) {
    return ok({ received: true });
  }

  const parsed = pesanSchema.safeParse(body);
  if (!parsed.success) {
    return fail(zodErrorMessage(parsed.error), 422);
  }
  const data = parsed.data;

  const antiBot = await verifyAntiBot({
    captchaId: data.captchaId,
    captchaAnswer: data.captchaAnswer,
    turnstileToken: data.turnstileToken,
    remoteIp: ip,
  });
  if (!antiBot.ok) return fail(antiBot.reason ?? "Verifikasi gagal.", 400);

  try {
    await db.pesan.create({
      data: {
        nama_lengkap: data.nama_lengkap,
        no_telepon: data.no_telepon,
        email: data.email ?? null,
        subjek: data.subjek ?? null,
        pesan: data.pesan,
        ip_address: ip,
        user_agent: getUserAgent(req),
      },
    });
    return ok({ received: true });
  } catch (e) {
    console.error("[api/contact] POST error:", e);
    return fail("Gagal mengirim pesan. Silakan coba lagi.", 500);
  }
}
