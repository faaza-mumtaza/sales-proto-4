"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Tag, MessageCircle, Clock3 } from "lucide-react";
import { SiteLayout } from "@/components/site/site-layout";
import { ArticleCard } from "@/components/site/article-card";
import { Breadcrumb } from "@/components/site/breadcrumb";
import { Reveal } from "@/components/site/reveal";
import { ArticleSkeleton, ErrorState } from "@/components/site/states";
import { ShareButtons } from "@/components/site/share-buttons";
import { ReadingProgress } from "@/components/site/reading-progress";
import { ArticleToc, type TocItem } from "@/components/site/article-toc";
import { Link, usePageMeta, navigate } from "@/lib/router";
import { apiGet } from "@/lib/api";
import { formatDateID, waLink, type Artikel } from "@/lib/site-utils";
import { JsonLd } from "@/components/site/json-ld";
import { artikelJsonLd, breadcrumbJsonLd } from "@/lib/jsonld";

interface TocResult {
  items: TocItem[];
  /** HTML konten dengan id heading tertanam (aman dari re-render React
   *  yang menyeting ulang innerHTML — id tidak pernah hilang). */
  html: string;
}

/** Estimasi waktu baca (menit) dari HTML konten — ±200 kata/menit. */
function readingMinutes(html: string): number {
  const words = html
    .replace(/<[^>]+>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
/** Parsing daftar isi dari HTML konten + menanam id pada tiap heading
 *  (murni, client-side; dipanggil dalam useMemo agar hasil stabil). */
function buildToc(konten: string): TocResult {
  if (!konten || typeof window === "undefined") return { items: [], html: konten };
  try {
    const doc = new DOMParser().parseFromString(konten, "text/html");
    const headings = [...doc.querySelectorAll("h2, h3")];
    const items = headings.map((h, i) => {
      const id = `bagian-${i + 1}`;
      h.id = id;
      return {
        id,
        text: (h.textContent ?? "").trim().slice(0, 90) || `Bagian ${i + 1}`,
        level: h.tagName === "H2" ? (2 as const) : (3 as const),
      };
    });
    return { items, html: doc.body.innerHTML };
  } catch {
    return { items: [], html: konten };
  }
}

export function ArtikelDetailView({ slug }: { slug: string }) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["artikel", "public", slug],
    queryFn: () =>
      apiGet<{ article: Artikel; related: Artikel[] }>(
        `/api/articles/${encodeURIComponent(slug)}`,
      ),
    retry: false,
  });

  const a = data?.article;
  usePageMeta(a ? `${a.judul} — Suzuki BSB Semarang` : "Artikel — Suzuki BSB Semarang");

  // ---- Daftar isi (TOC): parsing h2/h3 dari konten + tanam id heading ke
  // HTML sebelum dirender (aman di client — konten hanya muncul setelah
  // fetch, tidak saat SSR; id tertanam di string sehingga kebal re-render). ----
  const proseRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const konten = a?.konten ?? "";
  const { items: tocItems, html: tocHtml } = useMemo(() => buildToc(konten), [konten]);

  // Heading aktif mengikuti posisi scroll — query elemen SEGAR setiap event
  // (tahan bila React menyeting ulang innerHTML) + rAF agar hemat.
  useEffect(() => {
    if (tocItems.length === 0) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      let current: string | null = null;
      for (const t of tocItems) {
        const el = document.getElementById(t.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= 120) current = t.id;
        else break;
      }
      setActiveId(current ?? tocItems[0]?.id ?? null);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    // Update awal dijadwalkan lewat rAF (bukan sync di body effect)
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [tocItems]);

  const showToc = tocItems.length >= 3;

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <div className="rounded-xl overflow-hidden">
            <ArticleSkeleton />
          </div>
        </div>
      </SiteLayout>
    );
  }

  if (isError || !a) {
    return (
      <SiteLayout>
        <div className="container mx-auto py-8">
          <ErrorState
            message="Artikel tidak ditemukan atau belum dipublikasikan."
            onRetry={() => navigate("/artikel")}
          />
          <div className="text-center -mt-4">
            <Link to="/artikel" className="text-suzuki-red underline text-sm">
              Kembali ke daftar artikel
            </Link>
          </div>
        </div>
      </SiteLayout>
    );
  }

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <SiteLayout>
      {/* Bilah progres membaca — selalu tampil di halaman artikel */}
      <ReadingProgress />

      {/* Data terstruktur schema.org untuk SEO */}
      <JsonLd
        data={[
          artikelJsonLd(a),
          breadcrumbJsonLd([
            { label: "Home", to: "/" },
            { label: "Artikel", to: "/artikel" },
            { label: a.judul.length > 40 ? a.judul.slice(0, 40) + "…" : a.judul },
          ]),
        ]}
      />

      <div className="bg-muted py-4 border-b border-border/60">
        <div className="container mx-auto px-4">
          <Breadcrumb
            items={[
              { label: "Artikel", to: "/artikel" },
              { label: a.tipe === "PROMO" ? "Promo" : a.tipe === "KEGIATAN" ? "Kegiatan" : "Berita", to: a.tipe === "PROMO" ? "/promo" : "/artikel" },
              { label: a.judul.length > 40 ? a.judul.slice(0, 40) + "…" : a.judul },
            ]}
          />
        </div>
      </div>

      {a.cover_image ? (
        <Reveal variant="zoom">
          <div className="w-full aspect-[21/9] max-h-[500px] overflow-hidden bg-muted relative group">
            <img
              src={a.cover_image}
              alt={a.judul}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
              loading="eager"
            />
          </div>
        </Reveal>
      ) : (
        <Reveal variant="zoom">
          <div className="w-full aspect-[21/9] max-h-[500px] overflow-hidden bg-gradient-to-br from-suzuki-navy via-suzuki-navy to-[#2c3e63] pattern-dots flex items-center justify-center">
            <Tag className="w-20 h-20 text-white/20" aria-hidden />
          </div>
        </Reveal>
      )}

      <div className="container mx-auto px-4 py-12 max-w-6xl flex gap-10 items-start">
        {showToc && (
          <aside className="hidden xl:block w-64 shrink-0 self-stretch">
            <div className="sticky top-24">
              <ArticleToc items={tocItems} activeId={activeId} variant="sidebar" />
            </div>
          </aside>
        )}
        <article className="max-w-3xl flex-1 min-w-0 w-full">
        {showToc && (
          <div className="xl:hidden mb-8">
            <ArticleToc items={tocItems} activeId={activeId} variant="inline" />
          </div>
        )}
        <span className="inline-block px-3 py-1 bg-suzuki-red text-white text-xs font-semibold rounded-full mb-4">
          {a.tipe}
        </span>
        <h1 className="text-3xl md:text-4xl font-bold text-suzuki-navy dark:text-foreground mb-4 leading-tight">
          {a.judul}
        </h1>
        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-8 flex-wrap">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="w-4 h-4" aria-hidden />
            {formatDateID(a.published_at ?? a.created_at)}
          </span>
          <span aria-hidden>·</span>
          <span>{a.views.toLocaleString("id-ID")} kali dibaca</span>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1.5" title="Estimasi kecepatan baca 200 kata/menit">
            <Clock3 className="w-4 h-4" aria-hidden />
            {readingMinutes(a.konten)} menit baca
          </span>
        </div>

        {/* Konten sudah disanitasi server-side sebelum disimpan; id heading
            TOC sudah tertanam di HTML (buildToc) sehingga kebal re-render */}
        <div ref={proseRef} className="prose-artikel" dangerouslySetInnerHTML={{ __html: tocHtml }} />

        {a.tags.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2">
            {a.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full"
              >
                <Tag className="w-3 h-3" aria-hidden />
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="mt-10 border-t border-border pt-8 space-y-4">
          <ShareButtons title={a.judul} url={shareUrl} />
          <div className="flex flex-wrap gap-3">
            <a
              href={waLink(`Halo, saya tertarik dengan artikel: ${a.judul}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-suzuki-red hover:bg-suzuki-red/90 text-white text-sm font-medium transition-all hover:shadow-lg hover:shadow-suzuki-red/25 active:scale-95"
            >
              <MessageCircle className="w-4 h-4" aria-hidden />
              Hubungi Sales
            </a>
          </div>
        </div>
        </article>
      </div>

      {data?.related && data.related.length > 0 && (
        <section className="py-12 bg-suzuki-light border-t border-border" aria-labelledby="judul-terkait">
          <div className="container mx-auto px-4">
            <h2 id="judul-terkait" className="text-2xl font-bold text-suzuki-navy dark:text-foreground mb-8 text-center flex items-center justify-center gap-4">
              <span className="inline-block w-8 h-1.5 rounded-full bg-suzuki-red/70" aria-hidden />
              Artikel Terkait
              <span className="inline-block w-8 h-1.5 rounded-full bg-suzuki-red/70" aria-hidden />
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {data.related.map((r, i) => (
                <Reveal key={r.id} delay={i * 80}>
                  <ArticleCard article={r} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </SiteLayout>
  );
}
