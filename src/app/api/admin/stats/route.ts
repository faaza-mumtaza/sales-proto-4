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

    const [mobilTotal, mobilAktif, artikelTotal, artikelPublished, pesanBaru, tdPending, servisPending, servisTotal, testimoniPending, testimoniApproved, recentPesan, upcomingTD, pesanRows, tdRows, latestPesan, latestTD, latestServis, latestTestimoni, latestArtikel] =
      await Promise.all([
        db.mobil.count(),
        db.mobil.count({ where: { is_published: true } }),
        db.artikel.count(),
        db.artikel.count({ where: { status: "PUBLISHED" } }),
        db.pesan.count({ where: { status: "BARU" } }),
        db.testDrive.count({ where: { status: "PENDING" } }),
        db.bookingServis.count({ where: { status: "PENDING" } }),
        db.bookingServis.count(),
        db.testimoni.count({ where: { status: "PENDING" } }),
        db.testimoni.count({ where: { status: "APPROVED" } }),
        db.pesan.findMany({ orderBy: { created_at: "desc" }, take: 5 }),
        db.testDrive.findMany({
          where: { status: { in: ["PENDING", "CONFIRMED"] } },
          orderBy: [{ tanggal_diinginkan: "asc" }, { waktu_diinginkan: "asc" }],
          take: 5,
        }),
        db.pesan.findMany({ select: { created_at: true }, orderBy: { created_at: "asc" } }),
        db.testDrive.findMany({ select: { created_at: true }, orderBy: { created_at: "asc" } }),
        // Feed aktivitas terbaru (diambil per entitas lalu digabung & diurutkan)
        db.pesan.findMany({ orderBy: { created_at: "desc" }, take: 6 }),
        db.testDrive.findMany({ orderBy: { created_at: "desc" }, take: 6 }),
        db.bookingServis.findMany({ orderBy: { created_at: "desc" }, take: 6 }),
        db.testimoni.findMany({ orderBy: { created_at: "desc" }, take: 6 }),
        db.artikel.findMany({ orderBy: { created_at: "desc" }, take: 6 }),
      ]);

    // Timeline aktivitas terbaru — gabungan semua entitas, urut waktu desc
    interface ActivityItem {
      id: string;
      type: "PESAN" | "TEST_DRIVE" | "SERVIS" | "TESTIMONI" | "ARTIKEL";
      title: string;
      detail: string;
      status: string;
      created_at: string;
    }
    const activity: ActivityItem[] = [
      ...latestPesan.map((p) => ({
        id: `pesan-${p.id}`,
        type: "PESAN" as const,
        title: p.nama_lengkap,
        detail: p.pesan.length > 110 ? p.pesan.slice(0, 110) + "…" : p.pesan,
        status: p.status,
        created_at: p.created_at.toISOString(),
      })),
      ...latestTD.map((t) => ({
        id: `td-${t.id}`,
        type: "TEST_DRIVE" as const,
        title: t.nama_lengkap,
        detail: `Test drive ${t.mobil_pilihan}`,
        status: t.status,
        created_at: t.created_at.toISOString(),
      })),
      ...latestServis.map((s) => ({
        id: `servis-${s.id}`,
        type: "SERVIS" as const,
        title: s.nama_lengkap,
        detail: `Booking servis ${s.mobil_pilihan}`,
        status: s.status,
        created_at: s.created_at.toISOString(),
      })),
      ...latestTestimoni.map((t) => ({
        id: `testi-${t.id}`,
        type: "TESTIMONI" as const,
        title: t.nama,
        detail: `${"★".repeat(t.rating)}${"☆".repeat(5 - t.rating)} — ${t.pesan.length > 90 ? t.pesan.slice(0, 90) + "…" : t.pesan}`,
        status: t.status,
        created_at: t.created_at.toISOString(),
      })),
      ...latestArtikel.map((a) => ({
        id: `artikel-${a.id}`,
        type: "ARTIKEL" as const,
        title: a.judul.length > 70 ? a.judul.slice(0, 70) + "…" : a.judul,
        detail: `Artikel ${a.tipe.toLowerCase()}`,
        status: a.status,
        created_at: a.created_at.toISOString(),
      })),
    ]
      .sort((x, y) => (x.created_at < y.created_at ? 1 : -1))
      .slice(0, 12);

    // Tren 6 bulan terakhir: jumlah pesan & booking test drive per bulan
    const trend: Array<{ bulan: string; pesan: number; test_drive: number }> = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString("id-ID", { month: "short" });
      const inMonth = (rows: Array<{ created_at: Date }>) =>
        rows.filter((r) => {
          const rd = r.created_at;
          return rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth();
        }).length;
      trend.push({
        bulan: `${label} ${String(d.getFullYear()).slice(2)}`,
        pesan: inMonth(pesanRows),
        test_drive: inMonth(tdRows),
      });
    }

    return ok({
      counts: {
        mobilTotal,
        mobilAktif,
        artikelTotal,
        artikelPublished,
        pesanBaru,
        testDrivePending: tdPending,
        servisPending,
        servisTotal,
        testimoniPending,
        testimoniApproved,
      },
      trend,
      activity,
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
