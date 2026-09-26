import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, getClientIP, parseJsonBody, zodErrorMessage } from "@/lib/api-helpers";
import { testimoniSchema } from "@/lib/validations";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { isHoneypotTripped } from "@/lib/captcha";

export const dynamic = "force-dynamic";

/**
 * GET /api/testimonials — daftar testimoni berstatus APPROVED (publik).
 * Query: ?take= (default 12, maks 24).
 */
export async function GET(req: NextRequest) {
  try {
    const takeRaw = Number(req.nextUrl.searchParams.get("take") ?? 12);
    const take = Number.isFinite(takeRaw) ? Math.min(Math.max(Math.trunc(takeRaw), 1), 24) : 12;

    const rows = await db.testimoni.findMany({
      where: { status: "APPROVED" },
      orderBy: { created_at: "desc" },
      take,
      select: {
        id: true,
        nama: true,
        rating: true,
        pesan: true,
        created_at: true,
      },
    });

    return ok({
      testimonials: rows.map((t) => ({
        id: t.id,
        nama: t.nama,
        rating: t.rating,
        pesan: t.pesan,
        created_at: t.created_at.toISOString(),
      })),
    });
  } catch (e) {
    console.error("[api/testimonials] GET error:", e);
    return fail("Gagal memuat testimoni.", 500);
  }
}

/**
 * POST /api/testimonials — kirim testimoni baru (status PENDING, dimoderasi admin).
 * Proteksi: rate-limit per IP, honeypot, validasi zod.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIP(req);

  const rl = rateLimit(ip, "testimoni", RATE_LIMITS.testimoni.max, RATE_LIMITS.testimoni.windowMs);
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

  const parsed = testimoniSchema.safeParse(body);
  if (!parsed.success) {
    return fail(zodErrorMessage(parsed.error), 422);
  }
  const data = parsed.data;

  try {
    await db.testimoni.create({
      data: {
        nama: data.nama,
        rating: data.rating,
        pesan: data.pesan,
        status: "PENDING",
        ip_address: ip,
      },
    });
    return ok({ received: true });
  } catch (e) {
    console.error("[api/testimonials] POST error:", e);
    return fail("Gagal mengirim testimoni. Silakan coba lagi.", 500);
  }
}
