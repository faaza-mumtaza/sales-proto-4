"use client";

// Bar perbandingan mengambang — muncul saat minimal 1 mobil dipilih untuk
// dibandingkan. Hilang otomatis di halaman perbandingan itu sendiri.

import { useQuery } from "@tanstack/react-query";
import { X, Scale, Trash2, ArrowRight } from "lucide-react";
import { useHashRoute, navigate } from "@/lib/router";
import { apiGet } from "@/lib/api";
import { CAR_FALLBACK_IMAGE, type Mobil } from "@/lib/site-utils";
import { useCompare } from "@/lib/use-compare";

export function ComparisonBar() {
  const route = useHashRoute();
  const { slugs, remove, clear } = useCompare();

  const carsQuery = useQuery({
    queryKey: ["mobil", "public"],
    queryFn: () => apiGet<{ cars: Mobil[] }>("/api/cars"),
    staleTime: 60_000,
  });

  // Jangan tampilkan bar di halaman perbandingan atau di area admin
  if (route.segments[0] === "bandingkan" || route.segments[0] === "admin") return null;
  if (slugs.length === 0) return null;

  const cars = carsQuery.data?.cars ?? [];
  const selected = slugs
    .map((slug) => cars.find((c) => c.slug === slug))
    .filter((c): c is Mobil => Boolean(c));

  return (
    <>
      {/* Spacer agar konten/footer tidak tertutup bar fixed */}
      <div className="h-20 sm:h-[4.75rem] no-print" aria-hidden />
      <div
        className="fixed bottom-0 inset-x-0 z-40 border-t border-suzuki-red/20 bg-white/95 backdrop-blur-md shadow-[0_-8px_30px_rgba(26,41,66,0.15)] animate-[fade-in-up_0.3s_ease-out] no-print"
        role="region"
        aria-label="Mobil yang dipilih untuk dibandingkan"
      >
      <div className="container mx-auto px-4 py-3 flex items-center gap-3 overflow-x-auto">
        <span className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-suzuki-navy shrink-0">
          <Scale className="w-4 h-4 text-suzuki-red" aria-hidden />
          Bandingkan
        </span>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          {selected.map((c) => (
            <div
              key={c.id}
              className="relative flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-full border border-border bg-muted/50 shrink-0"
            >
              <img
                src={c.gambar_utama ?? CAR_FALLBACK_IMAGE}
                alt=""
                className="w-8 h-8 object-contain rounded-full bg-white"
                aria-hidden
              />
              <span className="text-xs font-medium text-suzuki-navy max-w-28 truncate">{c.nama}</span>
              <button
                type="button"
                onClick={() => remove(c.slug)}
                aria-label={`Keluarkan ${c.nama} dari perbandingan`}
                className="w-5 h-5 rounded-full bg-suzuki-navy/10 hover:bg-suzuki-red hover:text-white text-suzuki-navy flex items-center justify-center transition-colors"
              >
                <X className="w-3 h-3" aria-hidden />
              </button>
            </div>
          ))}
          {slugs.length < 3 && (
            <span className="hidden md:inline text-xs text-muted-foreground italic shrink-0">
              pilih hingga {3 - slugs.length} mobil lagi…
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={clear}
            className="hidden sm:inline-flex items-center gap-1 px-3 py-2 text-xs text-muted-foreground hover:text-suzuki-red transition-colors rounded-full"
            aria-label="Kosongkan pilihan perbandingan"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden />
            Kosongkan
          </button>
          <button
            type="button"
            onClick={() => navigate("/bandingkan")}
            disabled={slugs.length < 2}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all active:scale-95 ${
              slugs.length < 2
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-suzuki-red text-white shadow-lg shadow-suzuki-red/30 hover:bg-suzuki-red/90 hover:shadow-xl"
            }`}
          >
            {slugs.length < 2 ? "Pilih 2 mobil dulu" : `Bandingkan Sekarang (${slugs.length})`}
            {slugs.length >= 2 && <ArrowRight className="w-4 h-4" aria-hidden />}
          </button>
        </div>
      </div>
      </div>
    </>
  );
}
