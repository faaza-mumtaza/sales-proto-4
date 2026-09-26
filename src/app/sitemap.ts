import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Sitemap dinamis — daftar semua mobil (published) & artikel (published).
 * Catatan: di sandbox ini URL memakai hash SPA (#/mobil/slug) karena seluruh
 * aplikasi berjalan di route "/". Saat migrasi ke Next.js multi-page di
 * production, ganti prefix hash dengan path asli.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://suzuki-bsb-semarang.example.com").replace(/\/$/, "");

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/#/mobil`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/#/promo`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/#/artikel`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/#/tentang-kami`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/#/kontak`, changeFrequency: "monthly", priority: 0.7 },
  ];

  try {
    const [cars, articles] = await Promise.all([
      db.mobil.findMany({
        where: { is_published: true },
        select: { slug: true, updated_at: true },
      }),
      db.artikel.findMany({
        where: { status: "PUBLISHED" },
        select: { slug: true, published_at: true, updated_at: true },
      }),
    ]);

    return [
      ...staticPages,
      ...cars.map((c) => ({
        url: `${base}/#/mobil/${c.slug}`,
        lastModified: c.updated_at,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
      ...articles.map((a) => ({
        url: `${base}/#/artikel/${a.slug}`,
        lastModified: a.updated_at,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ];
  } catch {
    return staticPages;
  }
}
