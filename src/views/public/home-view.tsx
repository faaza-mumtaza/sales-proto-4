"use client";

import { useQuery } from "@tanstack/react-query";
import { Shield, Wrench, CreditCard, Headphones, Car } from "lucide-react";
import { SiteLayout } from "@/components/site/site-layout";
import { HeroSection } from "@/components/site/hero-section";
import { UspStrip } from "@/components/site/usp-strip";
import { CarCatalog } from "@/components/site/car-catalog";
import { ArticleCard } from "@/components/site/article-card";
import { TestimonialSection } from "@/components/site/testimonial-section";
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
      <HeroSection carCount={cars.length} />
      <UspStrip />

      <section id="katalog" className="py-16 pt-20 bg-suzuki-light" aria-labelledby="judul-katalog">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 id="judul-katalog" className="text-3xl md:text-4xl font-bold text-suzuki-navy mb-4">
              Katalog Mobil Suzuki
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Temukan berbagai pilihan mobil Suzuki yang sesuai dengan kebutuhan dan gaya
              hidup Anda.
            </p>
          </div>
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
            className="inline-flex items-center gap-2 px-6 py-3 border border-suzuki-navy/30 text-suzuki-navy hover:bg-suzuki-navy hover:text-white rounded-full text-sm font-semibold transition-colors"
          >
            Lihat Semua Mobil →
          </Link>
        </div>
      </section>

      <section className="py-16" aria-labelledby="judul-keunggulan">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 id="judul-keunggulan" className="text-3xl md:text-4xl font-bold text-suzuki-navy mb-4">
              Mengapa Memilih Kami?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Dealer resmi Suzuki dengan layanan terlengkap dan terpercaya.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-card rounded-xl p-6 border border-border hover:border-suzuki-red/30 hover:shadow-lg transition-all group"
              >
                <div className="w-12 h-12 bg-suzuki-red/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-suzuki-red transition-colors">
                  <f.icon className="w-6 h-6 text-suzuki-red group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-semibold text-lg text-suzuki-navy mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimoni pelanggan */}
      <TestimonialSection />

      <section className="py-16 bg-suzuki-light" aria-labelledby="judul-promo">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10">
            <div>
              <h2 id="judul-promo" className="text-3xl md:text-4xl font-bold text-suzuki-navy mb-3">
                Promo Terbaru
              </h2>
              <p className="text-muted-foreground max-w-xl">
                Penawaran spesial dari Suzuki BSB Semarang untuk Anda.
              </p>
            </div>
            <Link
              to="/artikel?tipe=PROMO"
              className="inline-flex items-center gap-2 text-suzuki-red font-semibold text-sm hover:gap-3 transition-all"
            >
              Semua Promo →
            </Link>
          </div>

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
              {promos.map((a) => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-16" aria-labelledby="judul-cta">
        <div className="container mx-auto px-4">
          <div className="max-w-lg mx-auto bg-card rounded-xl p-8 border border-border hover:border-suzuki-red/30 hover:shadow-xl transition-all group">
            <div className="w-14 h-14 bg-suzuki-red/10 rounded-xl flex items-center justify-center mb-5 group-hover:bg-suzuki-red transition-colors">
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
              className="block w-full text-center bg-suzuki-red hover:bg-suzuki-red/90 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Jadwalkan Test Drive
            </Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
