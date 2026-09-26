import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-helpers";
import { serializeMobil } from "@/lib/serializers";

export const dynamic = "force-dynamic";

/** GET /api/cars/[slug] — detail mobil (hanya yang tampil / published). */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    if (!slug || slug.length > 200) return fail("Mobil tidak ditemukan.", 404);
    const car = await db.mobil.findFirst({
      where: { slug, is_published: true },
    });
    if (!car) return fail("Mobil tidak ditemukan.", 404);
    return ok({ car: serializeMobil(car) });
  } catch (e) {
    console.error("[api/cars/[slug]] GET error:", e);
    return fail("Gagal memuat data mobil.", 500);
  }
}
