import { NextRequest } from "next/server";
import { ok, fail, getClientIP } from "@/lib/api-helpers";
import { issueCaptcha } from "@/lib/captcha";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** GET /api/captcha — terbitkan challenge math-captcha untuk form publik. */
export function GET(req: NextRequest) {
  const ip = getClientIP(req);
  const rl = rateLimit(ip, "captcha", RATE_LIMITS.captcha.max, RATE_LIMITS.captcha.windowMs);
  if (!rl.ok) {
    return fail("Terlalu banyak permintaan. Tunggu sebentar lalu muat ulang halaman.", 429);
  }
  return ok({ captcha: issueCaptcha() });
}
