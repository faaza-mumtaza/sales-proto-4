"use client";

import { useQuery } from "@tanstack/react-query";
import { Shield, Wrench, CreditCard, Headphones, Car } from "lucide-react";
import { SiteLayout } from "@/components/site/site-layout";
import { HeroSection } from "@/components/site/hero-section";
import { CarCatalog } from "@/components/site/car-catalog";
import { ArticleCard } from "@/components/site/article-card";
import { SectionHeading } from "@/components/site/section-heading";
import { Reveal } from "@/components/site/reveal";
import { CardSkeleton, ArticleSkeleton, ErrorState, EmptyState } from "@/components/site/states";
import { Link, usePageMeta } from "@/lib/router";
import { apiGet } from "@/lib/api";
import type { Mobil, Artikel } from "@/lib/site-utils";

const features = [
  {
    icon: Shield,
    title: "Garansi Resmi",
    description: "Dapatkan garansi resmi dari Suzuki Indonesia untuk setiap pembelian.",
  },
  {
    icon: Wrench,
    title: "Service Berkala",
    description: "Layanan service berkala dengan teknisi bersertifikat dan spare part asli.",
  },
  {
    icon: CreditCard,
    title: "Kredit Mudah",
    description: "Proses kredit mudah dengan berbagai pilihan tenor dan bunga kompetitif.",
  },
  {
    icon: Headphones,
    title: "Customer Support",
    description: "Tim customer service siap membantu Anda kapan saja.",
  },
];

export function HomeView() {
  usePageMeta("Suzuki BSB Semarang — Dealer Resmi Suzuki");

  const carsQuery = useQuery({
    queryKey: ["mobil", "public"],
    queryFn: () => apiGet<{ cars: Mobil[] }>("/api/cars"),
  });
  const promoQuery = useQuery({
    queryKey: ["artikel", "public", "PROMO"],
    queryFn: () => apiGet<{ articles: Artikel[] }>("/api/articles?tipe=PROMO"),
  });

  const cars = carsQuery.data?.cars ?? [];
  const promos = (promoQuery.data?.articles ?? []).slice(0, 3);

  return (
    <SiteLayout>
      <HeroSection />

      <section id="katalog" className="py-16 bg-suzuki-light" aria-labelledby="judul-katalog">
        <div className="container mx-auto px-4">
          <SectionHeading
            title="Katalog Mobil Suzuki"
            subtitle="Temukan berbagai pilihan mobil Suzuki yang sesuai dengan kebutuhan dan gaya hidup Anda."
          />
        </div>
        {carsQuery.isLoading ? (
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : carsQuery.isError ? (
          <div className="container mx-auto px-4">
            <ErrorState
              message="Gagal memuat katalog mobil."
              onRetry={() => void carsQuery.refetch()}
            />
          </div>
        ) : (
          <CarCatalog cars={cars} />
        )}
        <div className="container mx-auto px-4 text-center -mt-6">
          <Link
            to="/mobil"
            className="inline-flex items-center gap-2 px-6 py-3 border border-suzuki-navy/30 text-suzuki-navy hover:bg-suzuki-navy hover:text-white rounded-full text-sm font-semibold transition-all hover:shadow-lg hover:shadow-suzuki-navy/20 hover:-translate-y-0.5 active:scale-95"
          >
            Lihat Semua Mobil →
          </Link>
        </div>
      </section>

      <section className="py-16" aria-labelledby="judul-keunggulan">
        <div className="container mx-auto px-4">
          <SectionHeading
            title="Mengapa Memilih Kami?"
            subtitle="Dealer resmi Suzuki dengan layanan terlengkap dan terpercaya."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 90} className="h-full">
                <div className="bg-card rounded-xl p-6 border border-border hover:border-suzuki-red/30 hover:shadow-lg transition-all duration-300 group h-full card-accent">
                  <div className="w-12 h-12 bg-suzuki-red/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-suzuki-red group-hover:scale-110 transition-all duration-300">
                    <f.icon className="w-6 h-6 text-suzuki-red group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="font-semibold text-lg text-suzuki-navy mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-sm">{f.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-suzuki-light" aria-labelledby="judul-promo">
        <div className="container mx-auto px-4">
          <SectionHeading
            align="left"
            title="Promo Terbaru"
            subtitle="Penawaran spesial dari Suzuki BSB Semarang untuk Anda."
            action={
              <Link
                to="/promo"
                className="inline-flex items-center gap-2 text-suzuki-red font-semibold text-sm hover:gap-3 transition-all"
              >
                Semua Promo →
              </Link>
            }
          />

          {promoQuery.isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <ArticleSkeleton key={i} />
              ))}
            </div>
          ) : promoQuery.isError ? (
            <ErrorState message="Gagal memuat promo." onRetry={() => void promoQuery.refetch()} />
          ) : promos.length === 0 ? (
            <EmptyState message="Belum ada promo saat ini. Nantikan penawaran menarik berikutnya!" />
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {promos.map((a, i) => (
                <Reveal key={a.id} delay={i * 100}>
                  <ArticleCard article={a} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-16" aria-labelledby="judul-cta">
        <div className="container mx-auto px-4">
          <Reveal variant="zoom">
            <div className="max-w-lg mx-auto bg-card rounded-xl p-8 border border-border hover:border-suzuki-red/30 hover:shadow-xl transition-all duration-300 group card-accent">
              <div className="w-14 h-14 bg-suzuki-red/10 rounded-xl flex items-center justify-center mb-5 group-hover:bg-suzuki-red group-hover:rotate-6 transition-all duration-300">
                <Car className="w-7 h-7 text-suzuki-red group-hover:text-white transition-colors" />
              </div>
              <h2 id="judul-cta" className="text-2xl font-bold text-suzuki-navy mb-3">
                Siap Untuk Test Drive?
              </h2>
              <p className="text-muted-foreground mb-6">
                Jadwalkan test drive gratis dan rasakan langsung pengalaman berkendara dengan
                mobil Suzuki pilihan Anda.
              </p>
              <Link
                to="/kontak?form=test-drive"
                className="block w-full text-center bg-suzuki-red hover:bg-suzuki-red/90 text-white px-6 py-3 rounded-lg font-semibold transition-all hover:shadow-lg hover:shadow-suzuki-red/30 active:scale-95"
              >
                Jadwalkan Test Drive
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </SiteLayout>
  );
}
