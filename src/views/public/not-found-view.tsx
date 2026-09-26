"use client";

import { SiteLayout } from "@/components/site/site-layout";
import { Link, usePageMeta } from "@/lib/router";

export function NotFoundView() {
  usePageMeta("Halaman Tidak Ditemukan — Suzuki BSB Semarang");
  return (
    <SiteLayout>
      <div className="container mx-auto px-4 py-24 text-center">
        <p className="text-6xl font-bold text-suzuki-red mb-4">404</p>
        <h1 className="text-2xl font-bold text-suzuki-navy dark:text-foreground mb-3">Halaman tidak ditemukan</h1>
        <p className="text-muted-foreground mb-8">
          Halaman yang Anda cari tidak tersedia atau sudah dipindahkan.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="px-6 py-3 bg-suzuki-red text-white font-semibold rounded-lg hover:bg-suzuki-red/90 transition-colors"
          >
            Kembali ke Home
          </Link>
          <Link
            to="/mobil"
            className="px-6 py-3 border border-suzuki-navy/30 dark:border-white/20 text-suzuki-navy dark:text-white font-semibold rounded-lg hover:bg-suzuki-navy/5 dark:hover:bg-white/10 transition-colors"
          >
            Lihat Katalog
          </Link>
        </div>
      </div>
    </SiteLayout>
  );
}
