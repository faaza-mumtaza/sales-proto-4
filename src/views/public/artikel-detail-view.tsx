"use client";

import { useQuery } from "@tanstack/react-query";
import { Calendar, Tag, MessageCircle, Link2, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/site-layout";
import { ArticleCard } from "@/components/site/article-card";
import { Breadcrumb } from "@/components/site/breadcrumb";
import { Reveal } from "@/components/site/reveal";
import { ArticleSkeleton, ErrorState } from "@/components/site/states";
import { Link, usePageMeta, navigate } from "@/lib/router";
import { apiGet } from "@/lib/api";
import { formatDateID, waLink, type Artikel } from "@/lib/site-utils";
import { JsonLd } from "@/components/site/json-ld";
import { artikelJsonLd, breadcrumbJsonLd } from "@/lib/jsonld";

export function ArtikelDetailView({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
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

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Tautan artikel disalin!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback untuk browser tanpa Clipboard API
      const ta = document.createElement("textarea");
      ta.value = shareUrl;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        toast.success("Tautan artikel disalin!");
        setTimeout(() => setCopied(false), 2000);
      } catch {
        toast.error("Gagal menyalin tautan — salin manual dari address bar.");
      }
      document.body.removeChild(ta);
    }
  }

  return (
    <SiteLayout>
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

      <article className="container mx-auto px-4 py-12 max-w-3xl">
        <span className="inline-block px-3 py-1 bg-suzuki-red text-white text-xs font-semibold rounded-full mb-4">
          {a.tipe}
        </span>
        <h1 className="text-3xl md:text-4xl font-bold text-suzuki-navy mb-4 leading-tight">
          {a.judul}
        </h1>
        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-8 flex-wrap">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="w-4 h-4" aria-hidden />
            {formatDateID(a.published_at ?? a.created_at)}
          </span>
          <span aria-hidden>·</span>
          <span>{a.views.toLocaleString("id-ID")} kali dibaca</span>
        </div>

        {/* Konten sudah disanitasi server-side sebelum disimpan */}
        <div className="prose-artikel" dangerouslySetInnerHTML={{ __html: a.konten }} />

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

        <div className="mt-10 border-t border-border pt-8 flex flex-wrap gap-3">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(a.judul + " - " + shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-all hover:shadow-lg hover:shadow-green-500/25 active:scale-95"
          >
            <MessageCircle className="w-4 h-4" aria-hidden />
            Share via WhatsApp
          </a>
          <button
            onClick={() => void copyLink()}
            aria-live="polite"
            className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border text-sm font-medium transition-all active:scale-95 ${
              copied
                ? "bg-green-50 border-green-300 text-green-700"
                : "bg-card border-border text-foreground hover:border-suzuki-red/40 hover:text-suzuki-red"
            }`}
          >
            {copied ? <Check className="w-4 h-4" aria-hidden /> : <Link2 className="w-4 h-4" aria-hidden />}
            {copied ? "Tersalin!" : "Salin Tautan"}
          </button>
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
      </article>

      {data?.related && data.related.length > 0 && (
        <section className="py-12 bg-suzuki-light border-t border-border" aria-labelledby="judul-terkait">
          <div className="container mx-auto px-4">
            <h2 id="judul-terkait" className="text-2xl font-bold text-suzuki-navy mb-8 text-center flex items-center justify-center gap-4">
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
