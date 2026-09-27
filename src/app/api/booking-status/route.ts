import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, getClientIP } from "@/lib/api-helpers";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** Normalisasi nomor telepon Indonesia → digit tanpa prefix 62/0. */
function normalizePhone(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("62")) d = d.slice(2);
  else if (d.startsWith("0")) d = d.slice(1);
  return d;
}

/** Cocokkan dua nomor (08xxx vs 628xxx vs +628xxx dianggap sama). */
function phonesMatch(a: string, b: string): boolean {
  const na = normalizePhone(a);
  const nb = normalizePhone(b);
  if (na.length < 7 || nb.length < 7) return false;
  const suffix = Math.min(na.length, nb.length);
  return na.slice(-suffix) === nb.slice(-suffix);
}

/** Masking nama untuk privasi: "Budi Santoso" → "Budi S***". */
function maskName(nama: string): string {
  const parts = nama.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]!.slice(0, 1) + "***";
  return `${parts[0]} ${parts[parts.length - 1]!.slice(0, 1)}***`;
}

/**
 * GET /api/booking-status?phone=0812...
 * Lacak status booking test drive & servis berdasarkan nomor telepon
 * (90 hari terakhir, maks 8 entri). Nama disembunyikan sebagian.
 */
export async function GET(req: NextRequest) {
  const ip = getClientIP(req);
  const rl = rateLimit(ip, "bookingStatus", RATE_LIMITS.bookingStatus.max, RATE_LIMITS.bookingStatus.windowMs);
  if (!rl.ok) {
    return fail(
      `Terlalu banyak percobaan. Coba lagi dalam ${rl.retryAfterSeconds} detik.`,
      429,
    );
  }

  const phone = (req.nextUrl.searchParams.get("phone") ?? "").trim();
  if (!/^(\+62|62|0)[0-9]{8,13}$/.test(phone)) {
    return fail("Nomor telepon tidak valid (contoh: 08123456789).", 422);
  }

  try {
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const [testDrives, serviceBookings] = await Promise.all([
      db.testDrive.findMany({
        where: { created_at: { gte: cutoff } },
        orderBy: { created_at: "desc" },
        take: 60,
      }),
      db.bookingServis.findMany({
        where: { created_at: { gte: cutoff } },
        orderBy: { created_at: "desc" },
        take: 60,
      }),
    ]);

    const items = [
      ...testDrives
        .filter((t) => phonesMatch(t.no_telepon, phone))
        .slice(0, 5)
        .map((t) => ({
          jenis: "TEST_DRIVE" as const,
          nama: maskName(t.nama_lengkap),
          detail: t.mobil_pilihan,
          tanggal: t.tanggal_diinginkan.toISOString(),
          waktu: t.waktu_diinginkan,
          status: t.status,
          created_at: t.created_at.toISOString(),
        })),
      ...serviceBookings
        .filter((b) => phonesMatch(b.no_telepon, phone))
        .slice(0, 5)
        .map((b) => ({
          jenis: "SERVIS" as const,
          nama: maskName(b.nama_lengkap),
          detail: b.mobil_pilihan,
          tanggal: b.tanggal_diinginkan.toISOString(),
          waktu: b.waktu_diinginkan,
          status: b.status,
          created_at: b.created_at.toISOString(),
        })),
    ]
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      .slice(0, 8);

    return ok({ bookings: items });
  } catch (e) {
    console.error("[api/booking-status] GET error:", e);
    return fail("Gagal memuat status booking. Coba lagi.", 500);
  }
}
