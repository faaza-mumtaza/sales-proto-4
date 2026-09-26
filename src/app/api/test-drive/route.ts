import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, getClientIP, parseJsonBody, zodErrorMessage } from "@/lib/api-helpers";
import { testDriveSchema } from "@/lib/validations";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { verifyAntiBot, isHoneypotTripped } from "@/lib/captcha";

export const dynamic = "force-dynamic";

/**
 * POST /api/test-drive — booking test drive publik.
 * Proteksi: rate-limit per IP, honeypot, CAPTCHA, validasi zod,
 * dan mobil_id divalidasi ulang ke database (jangan percaya klien).
 */
export async function POST(req: NextRequest) {
  const ip = getClientIP(req);

  const rl = rateLimit(ip, "test-drive", RATE_LIMITS.testDrive.max, RATE_LIMITS.testDrive.windowMs);
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

  const parsed = testDriveSchema.safeParse(body);
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
    // Validasi mobil_id terhadap database (anti data palsu dari browser)
    let mobil_id: string | null = null;
    if (data.mobil_id) {
      const car = await db.mobil.findFirst({
        where: { id: data.mobil_id, is_published: true },
        select: { id: true, nama: true },
      });
      if (!car) return fail("Mobil yang dipilih tidak tersedia.", 422);
      mobil_id = car.id;
      // Gunakan nama resmi dari DB, bukan dari klien
      data.mobil_pilihan = car.nama;
    }

    await db.testDrive.create({
      data: {
        nama_lengkap: data.nama_lengkap,
        no_telepon: data.no_telepon,
        email: data.email,
        mobil_id,
        mobil_pilihan: data.mobil_pilihan,
        tanggal_diinginkan: new Date(data.tanggal_diinginkan + "T12:00:00"),
        waktu_diinginkan: data.waktu_diinginkan,
        catatan: data.catatan ?? null,
        ip_address: ip,
      },
    });
    return ok({ received: true });
  } catch (e) {
    console.error("[api/test-drive] POST error:", e);
    return fail("Gagal mendaftar test drive. Silakan coba lagi.", 500);
  }
}
