import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, getClientIP, parseJsonBody, zodErrorMessage } from "@/lib/api-helpers";
import { bookingServisSchema } from "@/lib/validations";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { verifyAntiBot, isHoneypotTripped } from "@/lib/captcha";

export const dynamic = "force-dynamic";

/**
 * POST /api/service-booking — booking servis bengkel publik.
 * Proteksi: rate-limit per IP, honeypot, CAPTCHA, validasi zod,
 * mobil_id divalidasi ulang ke database (jangan percaya klien).
 */
export async function POST(req: NextRequest) {
  const ip = getClientIP(req);

  const rl = rateLimit(ip, "service-booking", RATE_LIMITS.serviceBooking.max, RATE_LIMITS.serviceBooking.windowMs);
  if (!rl.ok) {
    return fail(
      `Terlalu banyak permintaan. Coba lagi dalam ${Math.ceil(rl.retryAfterSeconds / 60)} menit.`,
      429,
    );
  }

  const body = await parseJsonBody(req);
  if (!body) return fail("Format data tidak valid.", 400);

  if (isHoneypotTripped(body.website)) {
    return ok({ received: true });
  }

  const parsed = bookingServisSchema.safeParse(body);
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
    // Bila mobil dipilih dari katalog, validasi id-nya ke database dan
    // pakai nama resmi dari DB (bukan teks dari klien).
    let mobil_id: string | null = null;
    if (data.mobil_id) {
      const car = await db.mobil.findFirst({
        where: { id: data.mobil_id, is_published: true },
        select: { id: true, nama: true },
      });
      if (!car) return fail("Mobil yang dipilih tidak tersedia.", 422);
      mobil_id = car.id;
      data.mobil_pilihan = car.nama;
    }

    await db.bookingServis.create({
      data: {
        nama_lengkap: data.nama_lengkap,
        no_telepon: data.no_telepon,
        email: data.email ?? null,
        mobil_id,
        mobil_pilihan: data.mobil_pilihan,
        jenis_servis: data.jenis_servis,
        tanggal_diinginkan: new Date(data.tanggal_diinginkan + "T12:00:00"),
        waktu_diinginkan: data.waktu_diinginkan,
        keluhan: data.keluhan ?? null,
        ip_address: ip,
      },
    });
    return ok({ received: true });
  } catch (e) {
    console.error("[api/service-booking] POST error:", e);
    return fail("Gagal membuat booking servis. Silakan coba lagi.", 500);
  }
}
