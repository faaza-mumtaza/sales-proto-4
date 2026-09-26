"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X, Tag } from "lucide-react";
import { SiteLayout } from "@/components/site/site-layout";
import { ArticleCard } from "@/components/site/article-card";
import { ArticleSkeleton, ErrorState, EmptyState } from "@/components/site/states";
import { Reveal } from "@/components/site/reveal";
import { usePageMeta, useHashRoute } from "@/lib/router";
import { apiGet } from "@/lib/api";
import { TIPE_ARTIKEL, type Artikel } from "@/lib/site-utils";

export function ArtikelView() {
  const route = useHashRoute();
  const initialTipe = route.query.get("tipe") ?? "all";
  const [tipe, setTipe] = useState<string>(
    TIPE_ARTIKEL.some((t) => t.id === initialTipe) ? initialTipe : "all",
  );
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  usePageMeta("Artikel & Berita — Suzuki BSB Semarang");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["artikel", "public"],
    queryFn: () => apiGet<{ articles: Artikel[] }>("/api/articles"),
  });

  // Daftar tag populer dari seluruh artikel (maks 12, diurutkan frekuensi)
  const topTags = useMemo(() => {
    const freq = new Map<string, number>();
    for (const a of data?.articles ?? []) {
      for (const t of a.tags) freq.set(t, (freq.get(t) ?? 0) + 1);
    }
    return [...freq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([t]) => t);
  }, [data]);

  const filtered = useMemo(() => {
    let list = data?.articles ?? [];
    if (tipe !== "all") list = list.filter((a) => a.tipe === tipe);
    if (tag) list = list.filter((a) => a.tags.includes(tag));
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (a) =>
          a.judul.toLowerCase().includes(q) ||
          (a.ringkasan ?? "").toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [data, tipe, tag, query]);

  const hasActiveFilter = tipe !== "all" || tag !== null || query.trim() !== "";

  function resetFilters() {
    setTipe("all");
    setTag(null);
    setQuery("");
  }

  return (
    <SiteLayout>
      <section className="bg-suzuki-navy py-16 text-white relative overflow-hidden">
        <div className="decoration absolute -top-20 -right-20 w-72 h-72 rounded-full bg-suzuki-red/10 blur-3xl" />
        <div className="container mx-auto px-4 text-center relative">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 flex items-center justify-center gap-4">
            <span className="inline-block w-10 h-1.5 rounded-full bg-suzuki-red" aria-hidden />
            Artikel &amp; Berita
            <span className="inline-block w-10 h-1.5 rounded-full bg-suzuki-red" aria-hidden />
          </h1>
          <p className="text-white/70 max-w-2xl mx-auto">
            Informasi promo terbaru, berita otomotif, dan kegiatan Suzuki BSB Semarang.
          </p>

          {/* Pencarian */}
          <div className="relative w-full max-w-md mx-auto mt-8">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
              aria-hidden
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari artikel… (mis. promo, test drive)"
              aria-label="Cari artikel"
              className="w-full pl-11 pr-10 py-3 rounded-full border border-white/20 bg-white/95 text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-suzuki-red/60 shadow-lg"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Hapus kata kunci pencarian"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-suzuki-red transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-center mb-6 flex-wrap gap-2" role="tablist" aria-label="Filter tipe artikel">
            {TIPE_ARTIKEL.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tipe === t.id}
                onClick={() => setTipe(t.id)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  tipe === t.id
                    ? "bg-suzuki-red text-white shadow-md shadow-suzuki-red/30"
                    : "bg-muted text-muted-foreground hover:text-suzuki-navy hover:bg-border/60"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Filter tag */}
          {topTags.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground mr-1">
                <Tag className="w-3 h-3" aria-hidden /> Tag:
              </span>
              {topTags.map((t) => (
                <button
                  key={t}
                  onClick={() => setTag(tag === t ? null : t)}
                  aria-pressed={tag === t}
                  className={`px-3 py-1 rounded-full text-xs transition-all ${
                    tag === t
                      ? "bg-suzuki-navy text-white font-medium"
                      : "bg-muted text-muted-foreground hover:text-suzuki-navy"
                  }`}
                >
                  #{t}
                </button>
              ))}
            </div>
          )}

          {/* Ringkasan hasil + reset */}
          {!isLoading && (
            <div className="flex items-center justify-center gap-3 mb-8 text-sm text-muted-foreground">
              <span aria-live="polite">
                Menampilkan <strong className="text-foreground">{filtered.length}</strong> dari{" "}
                {data?.articles.length ?? 0} artikel
              </span>
              {hasActiveFilter && (
                <button
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1 text-xs text-suzuki-red hover:underline"
                >
                  <X className="w-3 h-3" aria-hidden /> Reset filter
                </button>
              )}
            </div>
          )}

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <ArticleSkeleton key={i} />
              ))}
            </div>
          ) : isError ? (
            <ErrorState message="Gagal memuat artikel." onRetry={() => void refetch()} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon="search"
              message={
                hasActiveFilter
                  ? `Tidak ada artikel yang cocok dengan filter saat ini.`
                  : "Belum ada artikel di kategori ini."
              }
              hint={hasActiveFilter ? "Coba ubah kata kunci atau reset filter." : undefined}
            />
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.map((a, i) => (
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
