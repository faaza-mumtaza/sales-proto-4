"use client";

// Section FAQ publik — accordion dengan filter kategori.
// Data dari /api/faqs (hanya FAQ yang dipublikasikan admin).

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { HelpCircle, Search, X } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SectionHeading } from "@/components/site/section-heading";
import { JsonLd } from "@/components/site/json-ld";
import { faqJsonLd } from "@/lib/jsonld";
import { apiGet } from "@/lib/api";
import { FAQ_KATEGORI_LABEL, waLink, type Faq } from "@/lib/site-utils";

export function FaqSection({ compact = false }: { compact?: boolean }) {
  const [kategori, setKategori] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["faqs", "public"],
    queryFn: () => apiGet<{ faqs: Faq[] }>("/api/faqs"),
  });

  const faqs = data?.faqs ?? [];

  const kategoriTersedia = useMemo(() => {
    const set = new Set(faqs.map((f) => f.kategori));
    return ["all", ...Array.from(set)];
  }, [faqs]);

  const terfilter = useMemo(() => {
    const q = search.trim().toLowerCase();
    return faqs.filter((f) => {
      const cocokKategori = kategori === "all" || f.kategori === kategori;
      const cocokCari =
        q === "" ||
        f.pertanyaan.toLowerCase().includes(q) ||
        f.jawaban.toLowerCase().includes(q);
      return cocokKategori && cocokCari;
    });
  }, [faqs, kategori, search]);

  return (
    <section className={compact ? "" : "bg-suzuki-light/50"} aria-labelledby="judul-faq">
      {/* Data terstruktur schema.org FAQPage untuk rich result SEO */}
      {faqs.length > 0 && <JsonLd data={faqJsonLd(faqs)} />}
      <div className={compact ? "" : "container mx-auto px-4 py-16"}>
        <SectionHeading
          title={
            <span id="judul-faq" className="flex items-center gap-3">
              <HelpCircle className="w-7 h-7 text-suzuki-red" aria-hidden />
              Pertanyaan yang Sering Diajukan
            </span>
          }
          subtitle="Temukan jawaban cepat seputar pembelian, kredit, trade-in, dan servis Suzuki."
        />

          {/* Filter kategori + pencarian */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
                aria-hidden
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari pertanyaan… (mis. DP, garansi, servis)"
                aria-label="Cari pertanyaan pada FAQ"
                className="w-full pl-10 pr-9 py-2.5 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-suzuki-red/40 focus:border-suzuki-red/60 transition-shadow"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  aria-label="Bersihkan pencarian"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-suzuki-navy transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {faqs.length > 3 && (
            <div className="flex flex-wrap gap-2 mb-6" role="group" aria-label="Filter kategori FAQ">
              {kategoriTersedia.map((k) => {
                const aktif = kategori === k;
                const label = k === "all" ? "Semua" : (FAQ_KATEGORI_LABEL[k] ?? k);
                const jumlah =
                  k === "all" ? faqs.length : faqs.filter((f) => f.kategori === k).length;
                return (
                  <button
                    key={k}
                    onClick={() => setKategori(k)}
                    aria-pressed={aktif}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all active:scale-95 ${
                      aktif
                        ? "bg-suzuki-red text-white border-suzuki-red shadow-sm shadow-suzuki-red/30"
                        : "bg-card text-muted-foreground border-border hover:border-suzuki-red/40 hover:text-suzuki-navy"
                    }`}
                  >
                    {label}
                    <span className={`ml-1.5 text-xs ${aktif ? "text-white/70" : "text-muted-foreground/70"}`}>
                      {jumlah}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {isLoading ? (
            <div className="space-y-3" aria-label="Memuat FAQ">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" style={{ animationDelay: `${i * 120}ms` }} />
              ))}
            </div>
          ) : terfilter.length === 0 ? (
            <div className="text-center py-10 rounded-xl border border-dashed border-border bg-card">
              <HelpCircle className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" aria-hidden />
              <p className="font-medium text-suzuki-navy mb-1">
                {faqs.length === 0 ? "Belum ada FAQ yang dipublikasikan" : "Tidak ada pertanyaan yang cocok"}
              </p>
              <p className="text-sm text-muted-foreground">
                {faqs.length === 0
                  ? "Silakan kembali lagi nanti."
                  : "Coba kata kunci lain atau tanyakan langsung ke sales kami."}
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-3" aria-live="polite">
                Menampilkan {terfilter.length} pertanyaan
              </p>
              <Accordion type="single" collapsible className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                {terfilter.map((f, i) => (
                  <AccordionItem
                    key={f.id}
                    value={f.id}
                    className={i !== terfilter.length - 1 ? "border-border" : ""}
                  >
                    <AccordionTrigger className="px-5 py-4 text-left hover:no-underline hover:bg-suzuki-red/5 transition-colors group">
                      <span className="flex items-center gap-3">
                        <span
                          className="shrink-0 w-7 h-7 rounded-full bg-suzuki-navy/5 text-suzuki-navy text-xs font-bold flex items-center justify-center group-hover:bg-suzuki-red/10 group-hover:text-suzuki-red transition-colors"
                          aria-hidden
                        >
                          {i + 1}
                        </span>
                        <span className="font-semibold text-suzuki-navy text-sm sm:text-base">{f.pertanyaan}</span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="px-5 pb-5 pt-0 text-sm leading-relaxed text-muted-foreground">
                      <span className="block border-l-2 border-suzuki-red/30 pl-4 ml-3.5">{f.jawaban}</span>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </>
          )}

          {/* CTA tanya langsung */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground mb-3">Tidak menemukan jawaban yang Anda cari?</p>
            <a
              href={waLink(
                search
                  ? `Halo, saya ingin bertanya: ${search.trim()}`
                  : "Halo, saya ingin bertanya seputar mobil Suzuki.",
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-suzuki-navy hover:bg-suzuki-navy/90 text-white font-semibold px-6 py-3 rounded-full text-sm transition-all hover:shadow-lg hover:shadow-suzuki-navy/25 hover:-translate-y-0.5 active:scale-95"
            >
              <HelpCircle className="w-4 h-4" aria-hidden />
              Tanya Langsung via WhatsApp
            </a>
          </div>
      </div>
    </section>
  );
}
