"use client";

import { useQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/site-layout";
import { CarCatalog } from "@/components/site/car-catalog";
import { CardSkeleton, ErrorState } from "@/components/site/states";
import { usePageMeta } from "@/lib/router";
import { apiGet } from "@/lib/api";
import type { Mobil } from "@/lib/site-utils";

export function MobilView() {
  usePageMeta("Katalog Mobil — Suzuki BSB Semarang");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["mobil", "public"],
    queryFn: () => apiGet<{ cars: Mobil[] }>("/api/cars"),
  });

  const cars = data?.cars ?? [];

  return (
    <SiteLayout>
      <section className="bg-suzuki-navy py-16 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Katalog Mobil Suzuki</h1>
          <p className="text-white/70 max-w-2xl mx-auto">
            Temukan mobil Suzuki impian Anda. Dari SUV tangguh hingga city car efisien —
            semua bergaransi resmi dan bisa di-test drive.
          </p>
        </div>
      </section>

      {isLoading ? (
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      ) : isError ? (
        <div className="container mx-auto py-8">
          <ErrorState message="Gagal memuat katalog mobil." onRetry={() => void refetch()} />
        </div>
      ) : (
        <CarCatalog cars={cars} showSearch />
      )}
    </SiteLayout>
  );
}
