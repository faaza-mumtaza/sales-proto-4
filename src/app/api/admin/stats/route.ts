import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";
import { publishDueArtikels } from "@/lib/serializers";

export const dynamic = "force-dynamic";

/** GET /api/admin/stats — ringkasan untuk dashboard admin. */
export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  try {
    await publishDueArtikels();

    const [mobilTotal, mobilAktif, artikelTotal, artikelPublished, pesanBaru, tdPending, recentPesan, upcomingTD] =
      await Promise.all([
        db.mobil.count(),
        db.mobil.count({ where: { is_published: true } }),
        db.artikel.count(),
        db.artikel.count({ where: { status: "PUBLISHED" } }),
        db.pesan.count({ where: { status: "BARU" } }),
        db.testDrive.count({ where: { status: "PENDING" } }),
        db.pesan.findMany({ orderBy: { created_at: "desc" }, take: 5 }),
        db.testDrive.findMany({
          where: { status: { in: ["PENDING", "CONFIRMED"] } },
          orderBy: [{ tanggal_diinginkan: "asc" }, { waktu_diinginkan: "asc" }],
          take: 5,
        }),
      ]);

    return ok({
      counts: {
        mobilTotal,
        mobilAktif,
        artikelTotal,
        artikelPublished,
        pesanBaru,
        testDrivePending: tdPending,
      },
      recentPesan: recentPesan.map((p) => ({
        id: p.id,
        nama_lengkap: p.nama_lengkap,
        no_telepon: p.no_telepon,
        subjek: p.subjek,
        pesan: p.pesan.length > 160 ? p.pesan.slice(0, 160) + "…" : p.pesan,
        status: p.status,
        created_at: p.created_at.toISOString(),
      })),
      upcomingTestDrive: upcomingTD.map((t) => ({
        id: t.id,
        nama_lengkap: t.nama_lengkap,
        no_telepon: t.no_telepon,
        mobil_pilihan: t.mobil_pilihan,
        tanggal_diinginkan: t.tanggal_diinginkan.toISOString(),
        waktu_diinginkan: t.waktu_diinginkan,
        status: t.status,
      })),
    });
  } catch (e) {
    console.error("[api/admin/stats] GET error:", e);
    return fail("Gagal memuat statistik.", 500);
  }
}
