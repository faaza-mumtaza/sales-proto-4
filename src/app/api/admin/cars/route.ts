import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail, parseJsonBody, zodErrorMessage } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/auth";
import { mobilUpsertSchema } from "@/lib/validations";
import { serializeMobil } from "@/lib/serializers";

export const dynamic = "force-dynamic";

/** GET /api/admin/cars — semua mobil (termasuk yang disembunyikan). */
export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  try {
    const cars = await db.mobil.findMany({
      orderBy: [{ urutan: "asc" }, { nama: "asc" }],
    });
    return ok({ cars: cars.map(serializeMobil) });
  } catch (e) {
    console.error("[api/admin/cars] GET error:", e);
    return fail("Gagal memuat katalog.", 500);
  }
}

/** POST /api/admin/cars — tambah mobil baru. */
export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const body = await parseJsonBody(req);
  if (!body) return fail("Format data tidak valid.", 400);
  const parsed = mobilUpsertSchema.safeParse(body);
  if (!parsed.success) return fail(zodErrorMessage(parsed.error), 422);
  const d = parsed.data;

  try {
    const dupe = await db.mobil.findUnique({ where: { slug: d.slug }, select: { id: true } });
    if (dupe) return fail(`Slug "${d.slug}" sudah dipakai mobil lain.`, 409);

    const car = await db.mobil.create({
      data: {
        nama: d.nama,
        slug: d.slug,
        kategori: d.kategori,
        kategori_label: d.kategori_label,
        harga_mulai: d.harga_mulai,
        harga_label:
          d.harga_label ?? (d.harga_mulai ? `Rp. ${d.harga_mulai.toLocaleString("id-ID")}` : null),
        seater: d.seater,
        fuel: d.fuel,
        transmission: d.transmission,
        deskripsi: d.deskripsi,
        spesifikasi: JSON.stringify(d.spesifikasi),
        gambar_utama: d.gambar_utama,
        galeri_gambar: JSON.stringify(d.galeri_gambar),
        warna: JSON.stringify(d.warna ?? []),
        is_new: d.is_new,
        is_published: d.is_published,
        urutan: d.urutan,
      },
    });
    return ok({ car: serializeMobil(car) }, { status: 201 });
  } catch (e) {
    console.error("[api/admin/cars] POST error:", e);
    return fail("Gagal menyimpan mobil.", 500);
  }
}

/** PUT /api/admin/cars — update mobil (id di body). */
export async function PUT(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const body = await parseJsonBody(req);
  if (!body) return fail("Format data tidak valid.", 400);
  const parsed = mobilUpsertSchema.safeParse(body);
  if (!parsed.success) return fail(zodErrorMessage(parsed.error), 422);
  const d = parsed.data;
  if (!d.id) return fail("ID mobil wajib dikirim untuk update.", 422);

  try {
    const existing = await db.mobil.findUnique({ where: { id: d.id } });
    if (!existing) return fail("Mobil tidak ditemukan.", 404);

    const dupe = await db.mobil.findFirst({
      where: { slug: d.slug, id: { not: d.id } },
      select: { id: true },
    });
    if (dupe) return fail(`Slug "${d.slug}" sudah dipakai mobil lain.`, 409);

    const car = await db.mobil.update({
      where: { id: d.id },
      data: {
        nama: d.nama,
        slug: d.slug,
        kategori: d.kategori,
        kategori_label: d.kategori_label,
        harga_mulai: d.harga_mulai,
        harga_label:
          d.harga_label ?? (d.harga_mulai ? `Rp. ${d.harga_mulai.toLocaleString("id-ID")}` : null),
        seater: d.seater,
        fuel: d.fuel,
        transmission: d.transmission,
        deskripsi: d.deskripsi,
        spesifikasi: JSON.stringify(d.spesifikasi),
        gambar_utama: d.gambar_utama,
        galeri_gambar: JSON.stringify(d.galeri_gambar),
        warna: JSON.stringify(d.warna ?? []),
        is_new: d.is_new,
        is_published: d.is_published,
        urutan: d.urutan,
      },
    });
    return ok({ car: serializeMobil(car) });
  } catch (e) {
    console.error("[api/admin/cars] PUT error:", e);
    return fail("Gagal memperbarui mobil.", 500);
  }
}

/** DELETE /api/admin/cars?id=... — hapus mobil. */
export async function DELETE(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return fail("Parameter id wajib.", 422);

  try {
    const existing = await db.mobil.findUnique({ where: { id } });
    if (!existing) return fail("Mobil tidak ditemukan.", 404);
    await db.mobil.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) {
    console.error("[api/admin/cars] DELETE error:", e);
    return fail("Gagal menghapus mobil.", 500);
  }
}
