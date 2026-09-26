"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/site-layout";
import { ArticleCard } from "@/components/site/article-card";
import { ArticleSkeleton, ErrorState, EmptyState } from "@/components/site/states";
import { usePageMeta, useHashRoute } from "@/lib/router";
import { apiGet } from "@/lib/api";
import { TIPE_ARTIKEL, type Artikel } from "@/lib/site-utils";

export function ArtikelView() {
  const route = useHashRoute();
  const initialTipe = route.query.get("tipe") ?? "all";
  const [tipe, setTipe] = useState<string>(
    TIPE_ARTIKEL.some((t) => t.id === initialTipe) ? initialTipe : "all",
  );
  usePageMeta("Artikel & Berita — Suzuki BSB Semarang");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["artikel", "public"],
    queryFn: () => apiGet<{ articles: Artikel[] }>("/api/articles"),
  });

  const filtered = useMemo(() => {
    const all = data?.articles ?? [];
    return tipe === "all" ? all : all.filter((a) => a.tipe === tipe);
  }, [data, tipe]);

  return (
    <SiteLayout>
      <section className="bg-suzuki-navy py-16 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Artikel & Berita</h1>
          <p className="text-white/70 max-w-2xl mx-auto">
            Informasi promo terbaru, berita otomotif, dan kegiatan Suzuki BSB Semarang.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-center mb-10 flex-wrap gap-2" role="tablist" aria-label="Filter tipe artikel">
            {TIPE_ARTIKEL.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tipe === t.id}
                onClick={() => setTipe(t.id)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  tipe === t.id
                    ? "bg-suzuki-red text-white shadow-sm"
                    : "bg-muted text-muted-foreground hover:text-suzuki-navy"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <ArticleSkeleton key={i} />
              ))}
            </div>
          ) : isError ? (
            <ErrorState message="Gagal memuat artikel." onRetry={() => void refetch()} />
          ) : filtered.length === 0 ? (
            <EmptyState message="Belum ada artikel di kategori ini." />
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.map((a) => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
