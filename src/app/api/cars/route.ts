import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-helpers";
import { serializeMobil } from "@/lib/serializers";

export const dynamic = "force-dynamic";

/** GET /api/cars — daftar mobil yang tampil di website publik.
 *  Termasuk `jumlah_minat` (jumlah permintaan test drive per mobil) —
 *  data permintaan nyata dari DB, dipakai untuk sorting "Paling Diminati"
 *  dan badge paling dicari di kartu katalog. */
export async function GET(_req: NextRequest) {
  try {
    const [cars, demand] = await Promise.all([
      db.mobil.findMany({
        where: { is_published: true },
        orderBy: [{ urutan: "asc" }, { nama: "asc" }],
      }),
      db.testDrive.groupBy({
        by: ["mobil_id"],
        where: { mobil_id: { not: null } },
        _count: { _all: true },
      }),
    ]);
    const demandMap = new Map(
      demand.map((d) => [d.mobil_id as string, d._count._all]),
    );
    return ok({
      cars: cars.map((c) => ({
        ...serializeMobil(c),
        jumlah_minat: demandMap.get(c.id) ?? 0,
      })),
    });
  } catch (e) {
    console.error("[api/cars] GET error:", e);
    return fail("Gagal memuat daftar mobil.", 500);
  }
}
