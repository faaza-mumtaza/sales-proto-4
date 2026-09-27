// Serializer DTO untuk API: parse field JSON string (SQLite) menjadi struktur
// yang enak dikonsumsi frontend. Dipakai di sisi server.

import { db } from "@/lib/db";

export interface SpecItem {
  label: string;
  value: string;
}

export interface WarnaItem {
  nama: string;
  hex: string;
  gambar: string | null;
}

export interface MobilDTO {
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
  /** Jumlah permintaan test drive nyata (opsional, dilengkapi route API). */
  jumlah_minat?: number;
  created_at: string;
  updated_at: string;
}

export function serializeMobil<T extends Record<string, unknown>>(m: T): MobilDTO {
  return {
    ...(m as unknown as MobilDTO),
    spesifikasi: safeParseArray<SpecItem>(m.spesifikasi as string),
    galeri_gambar: safeParseArray<string>(m.galeri_gambar as string),
    warna: safeParseArray<WarnaItem>(m.warna as string),
    created_at: (m.created_at as Date).toISOString(),
    updated_at: (m.updated_at as Date).toISOString(),
  };
}

export interface ArtikelDTO {
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

export function serializeArtikel<T extends Record<string, unknown>>(a: T): ArtikelDTO {
  return {
    ...(a as unknown as ArtikelDTO),
    tags: safeParseArray<string>(a.tags as string),
    published_at: (a.published_at as Date | null)?.toISOString() ?? null,
    scheduled_at: (a.scheduled_at as Date | null)?.toISOString() ?? null,
    created_at: (a.created_at as Date).toISOString(),
    updated_at: (a.updated_at as Date).toISOString(),
  };
}

export function safeParseArray<T = unknown>(
  raw: string | null | undefined,
): T[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

/**
 * Publikasikan artikel TERJADWAL yang waktunya sudah tiba (lazy, dipanggil
 * setiap kali data artikel publik dibaca). Aman untuk dipanggil sering.
 */
export async function publishDueArtikels(): Promise<void> {
  try {
    await db.artikel.updateMany({
      where: {
        status: "TERJADWAL",
        scheduled_at: { lte: new Date() },
      },
      data: { status: "PUBLISHED", published_at: new Date() },
    });
  } catch {
    // jangan gagalkan request utama
  }
}
