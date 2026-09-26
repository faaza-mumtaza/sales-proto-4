import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-helpers";
import { serializeMobil } from "@/lib/serializers";

export const dynamic = "force-dynamic";

/** GET /api/cars — daftar mobil yang tampil di website publik. */
export async function GET(_req: NextRequest) {
  try {
    const cars = await db.mobil.findMany({
      where: { is_published: true },
      orderBy: [{ urutan: "asc" }, { nama: "asc" }],
    });
    return ok({ cars: cars.map(serializeMobil) });
  } catch (e) {
    console.error("[api/cars] GET error:", e);
    return fail("Gagal memuat daftar mobil.", 500);
  }
}
