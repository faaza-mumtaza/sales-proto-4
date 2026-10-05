/**
 * Task 22 — perbaiki data mobil di Supabase (idempoten, aman diulang):
 *  1. `harga_label` basi (mis. "Mulai Rp. 258 Juta" padahal harga sudah diubah)
 *     → diturunkan ulang dari `harga_mulai` terbaru.
 *  2. `gambar_utama` NULL → diisi foto statis `/car-imgs/...` (sumber:
 *     download/car-imgs, sudah disalin ke public/car-imgs). Foto yang sudah
 *     diupload admin TIDAK ditimpa.
 *
 * Jalankan: unset DATABASE_URL && bun scripts/fix-car-data.ts
 */
import { db } from "@/lib/db";

/** Peta slug → foto statis (dicocokkan dengan RegExp, urutan penting). */
const PHOTO_BY_SLUG: Array<[RegExp, string]> = [
  [/ertiga-hybrid|all-new-ertiga/i, "/car-imgs/all-new-ertiga-hybrid.webp"],
  [/ertiga/i, "/car-imgs/all-new-ertiga.webp"],
  [/fronx/i, "/car-imgs/fronx-hybrid.png"],
  [/xl7/i, "/car-imgs/new-xl7-hybrid.png"],
  [/jimny/i, "/car-imgs/jimny.webp"],
  [/carry/i, "/car-imgs/new-carry-pick-up.webp"],
  [/grand-vitara/i, "/car-imgs/grand-vitara.png"],
  [/vitara/i, "/car-imgs/grand-vitara.png"],
  [/presso/i, "/car-imgs/s-presso.webp"],
  [/baleno/i, "/car-imgs/suzuki-baleno.jpg"],
  [/apv/i, "/car-imgs/apv-arena.webp"],
];

const cars = await db.mobil.findMany({ orderBy: { urutan: "asc" } });
let changed = 0;

for (const c of cars) {
  // 1. Label selalu = turunan harga terbaru (tanpa kata "Mulai" — cukup
  //    sekali di UI sebagai caption kecil).
  const newLabel =
    c.harga_mulai != null
      ? `Rp. ${c.harga_mulai.toLocaleString("id-ID")}`
      : c.harga_label;

  // 2. Foto hanya mengisi yang kosong.
  const foto = PHOTO_BY_SLUG.find(([re]) => re.test(c.slug))?.[1] ?? null;
  const newFoto = c.gambar_utama ?? foto;

  if (newLabel !== c.harga_label || newFoto !== c.gambar_utama) {
    await db.mobil.update({
      where: { id: c.id },
      data: { harga_label: newLabel, gambar_utama: newFoto },
    });
    changed++;
    console.log(`✓ ${c.nama}`);
    console.log(`   label : ${JSON.stringify(c.harga_label)} → ${JSON.stringify(newLabel)}`);
    console.log(`   foto  : ${JSON.stringify(c.gambar_utama)} → ${JSON.stringify(newFoto)}`);
  } else {
    console.log(`· ${c.nama}: sudah benar`);
  }
}

console.log(`\nSelesai — ${changed} mobil diperbarui, ${cars.length - changed} sudah benar.`);
process.exit(0);
