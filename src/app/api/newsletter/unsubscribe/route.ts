import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, getClientIP, parseJsonBody, zodErrorMessage } from "@/lib/api-helpers";
import { newsletterUnsubscribeSchema } from "@/lib/validations";
import { verifyNewsletterToken } from "@/lib/newsletter";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * POST /api/newsletter/unsubscribe — hentikan langganan via link email.
 * Wajib menyertakan token HMAC yang cocok dengan email (dibuat server,
 * ditempel admin pada link kampanye) agar orang lain tidak bisa
 * menghentikan langganan orang lain. Idempoten.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIP(req);

  const rl = rateLimit(ip, "newsletterUnsub", RATE_LIMITS.newsletterUnsub.max, RATE_LIMITS.newsletterUnsub.windowMs);
  if (!rl.ok) {
    return fail(
      `Terlalu banyak permintaan. Coba lagi dalam ${Math.ceil(rl.retryAfterSeconds / 60)} menit.`,
      429,
    );
  }

  const body = await parseJsonBody(req);
  if (!body) return fail("Format data tidak valid.", 400);

  const parsed = newsletterUnsubscribeSchema.safeParse(body);
  if (!parsed.success) return fail(zodErrorMessage(parsed.error), 422);
  const { email, token } = parsed.data;

  if (!verifyNewsletterToken(email, token)) {
    return fail("Link berhenti berlangganan tidak valid atau sudah kedaluwarsa.", 403);
  }

  try {
    const existing = await db.subscriberNewsletter.findUnique({ where: { email } });
    if (!existing) {
      // Email tidak terdaftar — tetap jawab sukses (jangan bocorkan keberadaan)
      return ok({ received: true });
    }
    if (existing.status === "BERHENTI") {
      return ok({ received: true, already: true });
    }
    await db.subscriberNewsletter.update({
      where: { email },
      data: { status: "BERHENTI" },
    });
    return ok({ received: true, unsubscribed: true });
  } catch (e) {
    console.error("[api/newsletter/unsubscribe] POST error:", e);
    return fail("Gagal memproses permintaan. Silakan coba lagi.", 500);
  }
}
