"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X, Tag, ChevronDown, Flame, Eye } from "lucide-react";
import { SiteLayout } from "@/components/site/site-layout";
import { ArticleCard } from "@/components/site/article-card";
import { ArticleSkeleton, ErrorState, EmptyState } from "@/components/site/states";
import { Reveal } from "@/components/site/reveal";
import { usePageMeta, useHashRoute, Link } from "@/lib/router";
import { apiGet } from "@/lib/api";
import { TIPE_ARTIKEL, type Artikel } from "@/lib/site-utils";

/** Jumlah artikel per "halaman" saat memuat bertahap. */
const PAGE_SIZE = 6;

export function ArtikelView() {
  const route = useHashRoute();
  const initialTipe = route.query.get("tipe") ?? "all";
  const [tipe, setTipe] = useState<string>(
    TIPE_ARTIKEL.some((t) => t.id === initialTipe) ? initialTipe : "all",
  );
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
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

  const visible = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  const hasActiveFilter = tipe !== "all" || tag !== null || query.trim() !== "";

  // Artikel terpopuler (berdasarkan views) — hanya saat tanpa filter aktif
  const popular = useMemo(() => {
    if (hasActiveFilter) return [];
    return [...(data?.articles ?? [])]
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);
  }, [data, hasActiveFilter]);

  function resetFilters() {
    setTipe("all");
    setTag(null);
    setQuery("");
    setVisibleCount(PAGE_SIZE);
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

          {/* Artikel terpopuler — strip peringkat berdasarkan jumlah pembaca */}
          {!isLoading && !isError && popular.length >= 3 && (
            <Reveal variant="fade">
              <div className="mb-10 rounded-2xl border border-border bg-card p-5 sm:p-6">
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-suzuki-navy mb-4">
                  <Flame className="w-4 h-4 text-suzuki-red" aria-hidden />
                  Artikel Terpopuler
                  <span className="ml-auto text-[11px] font-medium normal-case tracking-normal text-muted-foreground">
                    paling banyak dibaca
                  </span>
                </h2>
                <ol className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {popular.map((a, i) => (
                    <li key={a.id}>
                      <Link
                        to={`/artikel/${a.slug}`}
                        className="group flex flex-col gap-2 rounded-xl p-3 border border-transparent hover:border-border hover:bg-background hover:shadow-sm transition-all h-full"
                      >
                        <span
                          aria-hidden
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black shrink-0 ${
                            i === 0
                              ? "bg-suzuki-red text-white"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {i + 1}
                        </span>
                        <span className="text-xs font-semibold text-suzuki-navy leading-snug line-clamp-3 group-hover:text-suzuki-red transition-colors">
                          {a.judul}
                        </span>
                        <span className="mt-auto inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Eye className="w-3 h-3" aria-hidden />
                          {a.views.toLocaleString("id-ID")}x
                          <span className="text-border" aria-hidden>|</span>
                          {a.tipe}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>
            </Reveal>
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
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {visible.map((a, i) => (
                  <Reveal key={a.id} delay={Math.min(i % PAGE_SIZE, 5) * 80}>
                    <ArticleCard article={a} />
                  </Reveal>
                ))}
              </div>
              {hasMore && (
                <div className="flex flex-col items-center gap-2 mt-10">
                  <button
                    onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                    className="inline-flex items-center gap-2 px-8 py-3 border border-suzuki-navy/30 text-suzuki-navy hover:bg-suzuki-navy hover:text-white hover:border-suzuki-navy rounded-full text-sm font-semibold transition-all hover:shadow-lg hover:shadow-suzuki-navy/20 hover:-translate-y-0.5 active:scale-95"
                  >
                    Muat Lebih Banyak
                    <ChevronDown className="w-4 h-4" aria-hidden />
                  </button>
                  <p className="text-xs text-muted-foreground" aria-live="polite">
                    Menampilkan {visible.length} dari {filtered.length} artikel
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
