// Utilitas + tipe data yang dipakai bersama oleh frontend publik & admin.
// Isomorphic (aman di client & server), tanpa import server-only.

export function formatPrice(price: number | null | undefined): string {
  if (price == null) return "Hubungi sales";
  return `Rp. ${price.toLocaleString("id-ID")}`;
}

/** Versi ringkas untuk kartu: "Rp. 422,9 Juta". */
export function formatPriceShort(price: number | null | undefined): string {
  if (price == null) return "Hubungi sales";
  const juta = price / 1_000_000;
  return `Rp. ${juta.toLocaleString("id-ID", { maximumFractionDigits: 1 })} Juta`;
}

/** Harga tampilan untuk kartu/detail mobil: angka `harga_mulai` SELALU menang
 *  bila ada (anti label basi), `harga_label` hanya fallback custom (mis.
 *  "Hubungi Sales") saat angka kosong. */
export function carHarga(car: {
  harga_mulai: number | null;
  harga_label: string | null;
}): string {
  return car.harga_mulai != null
    ? formatPrice(car.harga_mulai)
    : (car.harga_label ?? "Hubungi sales");
}

export function formatDateID(d: string | Date | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDateTimeID(d: string | Date | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Waktu relatif bahasa Indonesia: "baru saja", "5 menit lalu", "2 jam lalu", … */
export function formatRelativeID(d: string | Date | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "baru saja";
  if (diffMin < 60) return `${diffMin} menit lalu`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} jam lalu`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay} hari lalu`;
  const diffWeek = Math.floor(diffDay / 7);
  if (diffWeek < 5) return `${diffWeek} minggu lalu`;
  return formatDateID(date);
}

export const WHATSAPP_NUMBER = "6285647079807";
export const INSTAGRAM_URL = "https://www.instagram.com/naufalll_miin";

export const KATEGORI = [
  { id: "all", label: "Semua" },
  { id: "passenger", label: "Passenger Car" },
  { id: "commercial", label: "Commercial Car" },
] as const;

export const TIPE_ARTIKEL = [
  { id: "all", label: "Semua" },
  { id: "PROMO", label: "Promo" },
  { id: "BERITA", label: "Berita" },
  { id: "KEGIATAN", label: "Kegiatan" },
] as const;

export type ArtikelTipe = "PROMO" | "BERITA" | "KEGIATAN";
export type PesanStatus = "BARU" | "DIBACA" | "DIBALAS" | "SELESAI";
export type TestDriveStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "DONE";
export type ArtikelStatus = "DRAFT" | "TERJADWAL" | "PUBLISHED";

export interface SpecItem {
  label: string;
  value: string;
}

export interface WarnaItem {
  nama: string;
  hex: string;
  gambar: string | null;
}

export interface Mobil {
  id: string;
  nama: string;
  slug: string;
  kategori: string;
  kategori_label: string;
  harga_mulai: number | null;
  harga_label: string | null;
  seater: number | null;
  fuel: string | null;
  transmission: string | null;
  deskripsi: string | null;
  spesifikasi: SpecItem[];
  gambar_utama: string | null;
  galeri_gambar: string[];
  warna: WarnaItem[];
  is_new: boolean;
  is_published: boolean;
  urutan: number;
  /** Jumlah permintaan test drive nyata (dari DB) — dipakai sorting
   *  "Paling Diminati" & badge paling dicari. Opsional: 0 bila tidak ada. */
  jumlah_minat?: number;
  created_at: string;
  updated_at: string;
}

export interface Artikel {
  id: string;
  judul: string;
  slug: string;
  ringkasan: string | null;
  konten: string;
  cover_image: string | null;
  tipe: string;
  tags: string[];
  status: string;
  published_at: string | null;
  scheduled_at: string | null;
  views: number;
  created_at: string;
  updated_at: string;
}

export interface Pesan {
  id: string;
  nama_lengkap: string;
  no_telepon: string;
  email: string | null;
  subjek: string | null;
  pesan: string;
  status: string;
  ip_address?: string | null;
  created_at: string;
}

export interface TestDrive {
  id: string;
  nama_lengkap: string;
  no_telepon: string;
  email: string;
  mobil_pilihan: string;
  mobil_slug: string | null;
  tanggal_diinginkan: string;
  waktu_diinginkan: string;
  catatan: string | null;
  status: string;
  created_at: string;
}

export interface BookingServis {
  id: string;
  nama_lengkap: string;
  no_telepon: string;
  email: string | null;
  mobil_pilihan: string;
  mobil_slug: string | null;
  jenis_servis: string;
  tanggal_diinginkan: string;
  waktu_diinginkan: string;
  keluhan: string | null;
  status: string;
  created_at: string;
}

export interface Faq {
  id: string;
  kategori: string;
  pertanyaan: string;
  jawaban: string;
}

export type NewsletterStatus = "AKTIF" | "BERHENTI";

export interface NewsletterSubscriber {
  id: string;
  email: string;
  status: string;
  ip_address?: string | null;
  created_at: string;
}

/** Label ramah untuk kategori FAQ. */
export const FAQ_KATEGORI_LABEL: Record<string, string> = {
  umum: "Umum",
  pembelian: "Pembelian & Kredit",
  purnajual: "Servis & Purnajual",
};

export const CAR_FALLBACK_IMAGE =
  "https://cms.suzukihyperlocal.com/images/defaults/suzukilogo-pp-removebg-preview.png";

export const WAKTU_SLOTS = [
  "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00",
];

/** Slot waktu workshop servis (istirahat 12:00 dilewati). */
export const SERVIS_WAKTU_SLOTS = [
  "08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00",
];

/** Jenis layanan servis bengkel — kode sesuai validasi server. */
export const SERVIS_JENIS: Array<{ id: string; label: string; hint: string }> = [
  { id: "servis-berkala", label: "Servis Berkala", hint: "Perawatan rutin sesuai km mobil Anda" },
  { id: "ganti-oli", label: "Ganti Oli & Filter", hint: "Oli mesin + filter sesuai tipe Suzuki" },
  { id: "tune-up", label: "Tune-Up Mesin", hint: "Pengecekan & penyetelan performa mesin" },
  { id: "servis-berat", label: "Servis Berat", hint: "Perbaikan menyeluruh / general repair" },
  { id: "cek-kaki-kaki", label: "Cek Kaki-Kaki & Rem", hint: "Suspensi, ban, dan sistem rem" },
  { id: "lainnya", label: "Lainnya", hint: "Jelaskan keluhan Anda di kolom catatan" },
];

export const SERVIS_JENIS_LABEL: Record<string, string> = Object.fromEntries(
  SERVIS_JENIS.map((j) => [j.id, j.label]),
);

/** URL WhatsApp dengan pesan default. */
export function waLink(text: string, phone: string = WHATSAPP_NUMBER): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

/** Normalisasi nomor HP Indonesia ke format 62 untuk link wa.me. */
export function phoneToWaNumber(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, "");
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return "62" + digits.slice(1);
  return digits;
}
