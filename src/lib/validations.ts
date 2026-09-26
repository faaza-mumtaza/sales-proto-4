// Skema validasi Zod — dipakai server (API) untuk memvalidasi SEMUA input
// dari browser. Jangan pernah percaya payload mentah dari klien.

import { z } from "zod";

const phone = z
  .string()
  .trim()
  .regex(/^(\+62|62|0)[0-9]{8,13}$/, "Nomor telepon tidak valid (contoh: 08123456789)");

const nullableText = (max: number) =>
  z.preprocess(
    (value) =>
      value == null || (typeof value === "string" && value.trim() === "") ? null : value,
    z.string().trim().max(max).nullable(),
  );

/** Gambar boleh URL absolut (https) atau path relatif hasil upload (/api/files/...). */
const imageRef = z.preprocess(
  (value) =>
    value == null || (typeof value === "string" && value.trim() === "") ? null : value,
  z
    .string()
    .trim()
    .max(2048)
    .refine(
      (v) => /^https?:\/\//i.test(v) || /^\/api\/files\/[a-zA-Z0-9._/-]+$/i.test(v),
      "Referensi gambar tidak valid",
    )
    .nullable(),
);

const captchaFields = {
  captchaId: z.string().max(100).optional(),
  captchaAnswer: z.union([z.string().max(10), z.number()]).optional(),
  turnstileToken: z.string().max(4096).optional(),
  website: z.string().max(0).optional(), // honeypot — harus kosong
};

export const pesanSchema = z.object({
  nama_lengkap: z.string().trim().min(2, "Nama minimal 2 karakter").max(100),
  no_telepon: phone,
  email: z
    .preprocess(
      (v) => (v == null || (typeof v === "string" && v.trim() === "") ? undefined : v),
      z.string().trim().email("Email tidak valid").max(255).optional(),
    )
    .optional(),
  subjek: z
    .preprocess(
      (v) => (v == null || (typeof v === "string" && v.trim() === "") ? undefined : v),
      z.string().trim().max(200).optional(),
    )
    .optional(),
  pesan: z.string().trim().min(10, "Pesan minimal 10 karakter").max(2000),
  ...captchaFields,
});
export type PesanInput = z.infer<typeof pesanSchema>;

export const WAKTU_VALID = [
  "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00",
];

export const testDriveSchema = z.object({
  nama_lengkap: z.string().trim().min(2, "Nama minimal 2 karakter").max(100),
  no_telepon: phone,
  email: z.string().trim().email("Email tidak valid").max(255),
  mobil_id: z
    .preprocess(
      (v) => (typeof v === "string" && v.trim() === "" ? null : v),
      z.string().max(64).nullable(),
    )
    .optional(),
  mobil_pilihan: z.string().trim().min(1, "Pilih mobil terlebih dahulu").max(200),
  tanggal_diinginkan: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid")
    .refine((v) => {
      const d = new Date(v + "T00:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return !Number.isNaN(d.getTime()) && d >= today;
    }, "Tanggal tidak boleh di masa lalu"),
  waktu_diinginkan: z.string().refine((v) => WAKTU_VALID.includes(v), "Pilih slot waktu yang tersedia"),
  catatan: z
    .preprocess(
      (v) => (v == null || (typeof v === "string" && v.trim() === "") ? undefined : v),
      z.string().trim().max(1000).optional(),
    )
    .optional(),
  ...captchaFields,
});
export type TestDriveInput = z.infer<typeof testDriveSchema>;

const slugField = z
  .string()
  .trim()
  .min(2, "Slug minimal 2 karakter")
  .max(200)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug hanya huruf kecil, angka, dan strip");

export const mobilUpsertSchema = z.object({
  id: z.string().max(64).optional(),
  nama: z.string().trim().min(2, "Nama mobil minimal 2 karakter").max(200),
  slug: slugField,
  kategori: z.enum(["passenger", "commercial"]),
  kategori_label: z.string().trim().min(1, "Label kategori wajib diisi").max(100),
  harga_mulai: z
    .preprocess(
      (v) => (v === null || v === undefined || v === "" ? null : Number(v)),
      z.number().int("Harga harus angka bulat").min(0).max(5_000_000_000).nullable(),
    ),
  harga_label: nullableText(100),
  seater: z
    .preprocess(
      (v) => (v === null || v === undefined || v === "" ? null : Number(v)),
      z.number().int().min(1).max(20).nullable(),
    ),
  fuel: nullableText(50),
  transmission: nullableText(50),
  deskripsi: nullableText(5000),
  spesifikasi: z
    .array(z.object({ label: z.string().trim().min(1).max(80), value: z.string().trim().max(200) }))
    .max(40)
    .default([]),
  gambar_utama: imageRef,
  galeri_gambar: z.array(z.string().trim().max(2048)).max(12).default([]),
  is_new: z.boolean().default(false),
  is_published: z.boolean().default(true),
  urutan: z.preprocess((v) => Number(v), z.number().int().min(0).max(9999)),
});
export type MobilUpsertInput = z.infer<typeof mobilUpsertSchema>;

export const artikelUpsertSchema = z
  .object({
    id: z.string().max(64).optional(),
    judul: z.string().trim().min(3, "Judul minimal 3 karakter").max(300),
    slug: slugField,
    ringkasan: nullableText(500),
    konten: z.string().min(1, "Konten tidak boleh kosong").max(100_000),
    cover_image: imageRef,
    tipe: z.enum(["PROMO", "BERITA", "KEGIATAN"]),
    tags: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
    status: z.enum(["DRAFT", "TERJADWAL", "PUBLISHED"]).default("DRAFT"),
    scheduled_at: z.string().datetime({ offset: true }).nullable().optional(),
  })
  .refine(
    (d) => d.status !== "TERJADWAL" || (typeof d.scheduled_at === "string" && d.scheduled_at.length > 0),
    { message: "Jadwal publikasi wajib diisi untuk status TERJADWAL", path: ["scheduled_at"] },
  );
export type ArtikelUpsertInput = z.infer<typeof artikelUpsertSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email("Email tidak valid").max(255),
  password: z.string().min(1, "Password wajib diisi").max(200),
});

export const pesanStatusSchema = z.object({
  id: z.string().max(64),
  status: z.enum(["BARU", "DIBACA", "DIBALAS", "SELESAI"]),
});

export const testDriveStatusSchema = z.object({
  id: z.string().max(64),
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "DONE"]),
});

export const idSchema = z.object({ id: z.string().min(1).max(64) });
