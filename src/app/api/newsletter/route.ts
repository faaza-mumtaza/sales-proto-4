import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, getClientIP, parseJsonBody, zodErrorMessage } from "@/lib/api-helpers";
import { newsletterSchema } from "@/lib/validations";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { isHoneypotTripped } from "@/lib/captcha";

export const dynamic = "force-dynamic";

/**
 * POST /api/newsletter — form langganan newsletter publik (footer).
 * Proteksi: rate-limit per IP + honeypot + validasi zod (tanpa CAPTCHA —
 * risiko spam rendah karena email divalidasi & unik, idempoten).
 * Idempoten: email yang sudah terdaftar AKTIF tidak error (sopan), email
 * yang pernah BERHENTI otomatis diaktifkan kembali.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIP(req);

  const rl = rateLimit(ip, "newsletter", RATE_LIMITS.newsletter.max, RATE_LIMITS.newsletter.windowMs);
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

  const parsed = newsletterSchema.safeParse(body);
  if (!parsed.success) {
    return fail(zodErrorMessage(parsed.error), 422);
  }
  const { email } = parsed.data;

  try {
    const existing = await db.subscriberNewsletter.findUnique({ where: { email } });

    if (existing) {
      if (existing.status === "AKTIF") {
        // Sudah langganan — jangan error (idempoten), cukup kabari sopan
        return ok({ received: true, already: true });
      }
      // Pernah berhenti → aktifkan kembali
      await db.subscriberNewsletter.update({
        where: { email },
        data: { status: "AKTIF" },
      });
      return ok({ received: true, reactivated: true });
    }

    await db.subscriberNewsletter.create({
      data: { email, ip_address: ip },
    });
    return ok({ received: true, created: true }, { status: 201 });
  } catch (e) {
    console.error("[api/newsletter] POST error:", e);
    return fail("Gagal menyimpan langganan. Silakan coba lagi.", 500);
  }
}
