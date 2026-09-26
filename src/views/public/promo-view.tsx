"use client";

import { useQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/site-layout";
import { ArticleCard } from "@/components/site/article-card";
import { Reveal } from "@/components/site/reveal";
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
      <section className="bg-suzuki-red py-16 text-white relative overflow-hidden">
        <div className="decoration absolute -top-16 -left-16 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
        <div className="decoration absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-suzuki-navy/20 blur-3xl" />
        <div className="container mx-auto px-4 text-center relative">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 flex items-center justify-center gap-4">
            <span className="inline-block w-10 h-1.5 rounded-full bg-white/70" aria-hidden />
            Promo Terbaru
            <span className="inline-block w-10 h-1.5 rounded-full bg-white/70" aria-hidden />
          </h1>
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
              {promos.map((a, i) => (
                <Reveal key={a.id} delay={Math.min(i, 5) * 80}>
                  <ArticleCard article={a} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
