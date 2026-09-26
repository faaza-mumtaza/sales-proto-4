"use client";

import { useQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/site-layout";
import { ArticleCard } from "@/components/site/article-card";
import { ArticleSkeleton, ErrorState, EmptyState } from "@/components/site/states";
import { usePageMeta } from "@/lib/router";
import { apiGet } from "@/lib/api";
import type { Artikel } from "@/lib/site-utils";

export function PromoView() {
  usePageMeta("Promo Terbaru — Suzuki BSB Semarang");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["artikel", "public", "PROMO"],
    queryFn: () => apiGet<{ articles: Artikel[] }>("/api/articles?tipe=PROMO"),
  });

  const promos = data?.articles ?? [];

  return (
    <SiteLayout>
      <section className="bg-suzuki-red py-16 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Promo Terbaru</h1>
          <p className="text-white/85 max-w-2xl mx-auto">
            Penawaran spesial, bunga ringan, dan paket layanan dari Suzuki BSB Semarang —
            diperbarui langsung oleh tim dealer kami.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <ArticleSkeleton key={i} />
              ))}
            </div>
          ) : isError ? (
            <ErrorState message="Gagal memuat promo." onRetry={() => void refetch()} />
          ) : promos.length === 0 ? (
            <EmptyState message="Belum ada promo saat ini. Nantikan penawaran menarik berikutnya!" />
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {promos.map((a) => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
