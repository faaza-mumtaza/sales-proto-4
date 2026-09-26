"use client";

import { useQuery } from "@tanstack/react-query";
import { Users, Fuel, Settings, CheckCircle, ArrowLeft, ChevronLeft, ChevronRight, Calendar, MessageCircle, Palette } from "lucide-react";
import { useState } from "react";
import { SiteLayout } from "@/components/site/site-layout";
import { ErrorState, CardSkeleton } from "@/components/site/states";
import { CarCard } from "@/components/site/car-card";
import { CreditSimulator } from "@/components/site/credit-simulator";
import { Reveal } from "@/components/site/reveal";
import { Link, usePageMeta, navigate } from "@/lib/router";
import { apiGet } from "@/lib/api";
import { CAR_FALLBACK_IMAGE, formatPrice, waLink, type Mobil } from "@/lib/site-utils";

const FEATURES = [
  "Mesin bertenaga dan efisien",
  "Fitur keselamatan lengkap",
  "Interior modern dan nyaman",
  "Teknologi terkini",
  "Garansi resmi Suzuki",
  "Spare part asli tersedia",
];

export function MobilDetailView({ slug }: { slug: string }) {
  const [imgIndex, setImgIndex] = useState(0);
  const [activeWarna, setActiveWarna] = useState<number | null>(null);
  // Reset galeri saat slug berubah (pola "adjust state during render" React)
  const [trackedSlug, setTrackedSlug] = useState(slug);
  if (trackedSlug !== slug) {
    setTrackedSlug(slug);
    setImgIndex(0);
    setActiveWarna(null);
  }

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["mobil", "public", slug],
    queryFn: () => apiGet<{ car: Mobil }>(`/api/cars/${encodeURIComponent(slug)}`),
    retry: false,
  });

  const car = data?.car;
  usePageMeta(car ? `${car.nama} — Suzuki BSB Semarang` : "Detail Mobil — Suzuki BSB Semarang");

  // Mobil serupa
  const relatedQuery = useQuery({
    queryKey: ["mobil", "public"],
    queryFn: () => apiGet<{ cars: Mobil[] }>("/api/cars"),
    enabled: !isLoading && !isError,
  });
  const related = (relatedQuery.data?.cars ?? [])
    .filter((c) => c.slug !== slug)
    .slice(0, 4);

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="container mx-auto px-4 py-12 max-w-5xl">
          <CardSkeleton />
        </div>
      </SiteLayout>
    );
  }

  if (isError || !car) {
    return (
      <SiteLayout>
        <div className="container mx-auto py-8">
          <ErrorState
            message="Mobil tidak ditemukan atau sedang tidak ditampilkan."
            onRetry={() => navigate("/mobil")}
          />
          <div className="text-center -mt-4">
            <Link to="/mobil" className="text-suzuki-red underline text-sm">
              Kembali ke katalog
            </Link>
          </div>
        </div>
      </SiteLayout>
    );
  }

  const gallery = car.galeri_gambar.length > 0 ? car.galeri_gambar : car.gambar_utama ? [car.gambar_utama] : [];
  const warnaAktif = activeWarna != null ? car.warna[activeWarna] : undefined;
  const currentImage =
    warnaAktif?.gambar ?? gallery[imgIndex] ?? car.gambar_utama ?? CAR_FALLBACK_IMAGE;

  // Pesan WA menyertakan warna pilihan agar sales langsung paham konteksnya
  const namaUntukWa =
    car.nama + (warnaAktif ? ` warna ${warnaAktif.nama}` : "");

  return (
    <SiteLayout>
      <div className="bg-muted py-4">
        <div className="container mx-auto px-4">
          <Link
            to="/mobil"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-suzuki-red transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden />
            Kembali ke Katalog
          </Link>
        </div>
      </div>

      <article className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Galeri */}
            <Reveal variant="zoom">
              <div className="relative bg-card rounded-xl p-8 border border-border overflow-hidden group">
                <span className="absolute top-4 left-4 z-10 px-3 py-1 bg-suzuki-red text-white text-sm font-semibold rounded-full shadow-sm">
                  {car.kategori_label}
                </span>
                {car.is_new && (
                  <span className="absolute top-4 right-4 z-10 px-3 py-1 bg-suzuki-navy text-white text-sm font-semibold rounded-full shadow-sm">
                    NEW
                  </span>
                )}
                <div className="min-h-[280px] flex items-center justify-center">
                  <img
                    src={currentImage}
                    alt={`${car.nama} — ${warnaAktif ? `warna ${warnaAktif.nama}` : `tampilan ${imgIndex + 1}`}`}
                    className="w-full h-auto max-h-[380px] object-contain group-hover:scale-[1.02] transition-transform duration-500"
                    loading="eager"
                  />
                </div>
                {warnaAktif && (
                  <p className="text-center text-sm text-muted-foreground mt-3" aria-live="polite">
                    Warna: <span className="font-semibold text-suzuki-navy">{warnaAktif.nama}</span>
                  </p>
                )}
                {gallery.length > 1 && (
                  <>
                    <button
                      onClick={() => {
                        setActiveWarna(null);
                        setImgIndex((i) => (i - 1 + gallery.length) % gallery.length);
                      }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 border border-border flex items-center justify-center hover:bg-white hover:shadow-md transition-all active:scale-90"
                      aria-label="Gambar sebelumnya"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        setActiveWarna(null);
                        setImgIndex((i) => (i + 1) % gallery.length);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 border border-border flex items-center justify-center hover:bg-white hover:shadow-md transition-all active:scale-90"
                      aria-label="Gambar berikutnya"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <div className="flex justify-center gap-2 mt-4">
                      {gallery.map((g, i) => (
                        <button
                          key={g + i}
                          onClick={() => {
                            setActiveWarna(null);
                            setImgIndex(i);
                          }}
                          aria-label={`Lihat gambar ${i + 1}`}
                          aria-current={i === imgIndex && activeWarna == null}
                          className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                            i === imgIndex && activeWarna == null
                              ? "bg-suzuki-red scale-125"
                              : "bg-border hover:bg-muted-foreground/40"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </Reveal>

            {/* Info */}
            <Reveal variant="up" delay={100}>
              <h1 className="text-3xl md:text-4xl font-bold text-suzuki-navy mb-4">{car.nama}</h1>

              <div className="flex items-center gap-6 mb-6 text-muted-foreground flex-wrap">
                {car.seater != null && (
                  <span className="flex items-center gap-2">
                    <Users className="w-5 h-5" aria-hidden />
                    {car.seater} Seater
                  </span>
                )}
                {car.fuel && (
                  <span className="flex items-center gap-2">
                    <Fuel className="w-5 h-5" aria-hidden />
                    {car.fuel}
                  </span>
                )}
                {car.transmission && (
                  <span className="flex items-center gap-2">
                    <Settings className="w-5 h-5" aria-hidden />
                    {car.transmission}
                  </span>
                )}
              </div>

              {/* Pilihan warna */}
              {car.warna.length > 0 && (
                <div className="mb-6">
                  <h2 className="font-semibold text-suzuki-navy mb-3 text-lg flex items-center gap-3">
                    <span className="inline-block w-8 h-1 rounded-full bg-suzuki-red" aria-hidden />
                    Warna Tersedia
                    <Palette className="w-4 h-4 text-muted-foreground" aria-hidden />
                  </h2>
                  <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Pilih warna">
                    {car.warna.map((w, i) => {
                      const selected = activeWarna === i;
                      return (
                        <button
                          key={w.nama + i}
                          role="radio"
                          aria-checked={selected}
                          onClick={() => setActiveWarna(selected ? null : i)}
                          title={w.nama}
                          className={`group/w flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all ${
                            selected
                              ? "border-suzuki-red bg-suzuki-red/5 shadow-sm"
                              : "border-border hover:border-suzuki-red/40"
                          }`}
                        >
                          <span
                            className="w-9 h-9 rounded-full border border-black/10 shadow-inner transition-transform group-hover/w:scale-110"
                            style={{ backgroundColor: w.hex }}
                            aria-hidden
                          />
                          <span
                            className={`text-[11px] font-medium max-w-20 truncate ${
                              selected ? "text-suzuki-red" : "text-muted-foreground"
                            }`}
                          >
                            {w.nama}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="bg-gradient-to-br from-suzuki-light to-white rounded-xl p-6 mb-6 border border-border">
                <p className="text-sm text-muted-foreground mb-1">Harga mulai dari</p>
                <p className="text-3xl font-bold text-suzuki-red">
                  {car.harga_label ?? formatPrice(car.harga_mulai)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  * Harga OTR Semarang, dapat berubah sewaktu-waktu
                </p>
              </div>

              <p className="text-muted-foreground mb-6 whitespace-pre-line">
                {car.deskripsi ??
                  `${car.nama} adalah kendaraan andal dari Suzuki yang dirancang untuk memenuhi kebutuhan mobilitas Anda.`}
              </p>

              {/* Simulasi kredit */}
              <div className="mb-6">
                <CreditSimulator carName={car.nama} price={car.harga_mulai} />
              </div>

              {/* Spesifikasi */}
              {car.spesifikasi.length > 0 && (
                <div className="mb-8">
                  <h2 className="font-semibold text-suzuki-navy mb-3 text-lg flex items-center gap-3">
                    <span className="inline-block w-8 h-1 rounded-full bg-suzuki-red" aria-hidden />
                    Spesifikasi
                  </h2>
                  <dl className="rounded-xl border border-border overflow-hidden">
                    {car.spesifikasi.map((s, i) => (
                      <div
                        key={s.label + i}
                        className={`grid grid-cols-[auto_1fr] sm:grid-cols-2 gap-x-6 px-4 py-3 text-sm transition-colors hover:bg-suzuki-red/5 ${
                          i % 2 === 0 ? "bg-card" : "bg-muted/50"
                        }`}
                      >
                        <dt className="text-muted-foreground">{s.label}</dt>
                        <dd className="font-medium text-suzuki-navy sm:text-right">{s.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              <div className="mb-8">
                <h2 className="font-semibold text-suzuki-navy mb-4 text-lg flex items-center gap-3">
                  <span className="inline-block w-8 h-1 rounded-full bg-suzuki-red" aria-hidden />
                  Keunggulan:
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {FEATURES.map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-suzuki-red shrink-0" aria-hidden />
                      <span className="text-sm text-muted-foreground">{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to={`/kontak?form=test-drive&mobil=${car.id}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 text-center bg-suzuki-red hover:bg-suzuki-red/90 text-white font-semibold py-3 rounded-lg transition-all hover:shadow-lg hover:shadow-suzuki-red/30 hover:-translate-y-0.5 active:scale-95"
                >
                  <Calendar className="w-4 h-4" aria-hidden />
                  Jadwalkan Test Drive
                </Link>
                <a
                  href={waLink(`Halo, saya tertarik dengan ${namaUntukWa}. Mohon info lebih lanjut.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 text-center bg-suzuki-navy hover:bg-suzuki-navy/90 text-white font-semibold py-3 rounded-lg transition-all hover:shadow-lg hover:shadow-suzuki-navy/30 hover:-translate-y-0.5 active:scale-95"
                >
                  <MessageCircle className="w-4 h-4" aria-hidden />
                  Hubungi Sales
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="py-12 bg-suzuki-light border-t border-border" aria-labelledby="judul-serupa">
          <div className="container mx-auto px-4">
            <h2 id="judul-serupa" className="text-2xl font-bold text-suzuki-navy mb-8 text-center flex items-center justify-center gap-4">
              <span className="inline-block w-8 h-1.5 rounded-full bg-suzuki-red/70" aria-hidden />
              Mobil Suzuki Lainnya
              <span className="inline-block w-8 h-1.5 rounded-full bg-suzuki-red/70" aria-hidden />
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((c, i) => (
                <Reveal key={c.id} delay={i * 80}>
                  <CarCard car={c} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </SiteLayout>
  );
}
