"use client";

// Halaman perbandingan mobil — menampilkan 2–3 mobil berdampingan dengan
// seluruh spesifikasi. Baris yang nilainya berbeda antar mobil ditandai.

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Plus, Scale, X, Users, Fuel, Settings, Sparkles } from "lucide-react";
import { Link, navigate, usePageMeta } from "@/lib/router";
import { apiGet } from "@/lib/api";
import { CAR_FALLBACK_IMAGE, formatPrice, waLink, type Mobil, type SpecItem } from "@/lib/site-utils";
import { SiteLayout } from "@/components/site/site-layout";
import { SectionHeading } from "@/components/site/section-heading";
import { Reveal } from "@/components/site/reveal";
import { CardSkeleton, ErrorState } from "@/components/site/states";
import { useCompare } from "@/lib/use-compare";
import { toast } from "sonner";

export function BandingkanView() {
  usePageMeta("Bandingkan Mobil — Suzuki BSB Semarang");
  const { slugs, remove, clear } = useCompare();

  const carsQuery = useQuery({
    queryKey: ["mobil", "public"],
    queryFn: () => apiGet<{ cars: Mobil[] }>("/api/cars"),
  });

  const allCars = carsQuery.data?.cars ?? [];
  const cars = slugs
    .map((slug) => allCars.find((c) => c.slug === slug))
    .filter((c): c is Mobil => Boolean(c));

  // Gabungan seluruh label spesifikasi dari mobil terpilih (urutan: mobil pertama dulu)
  const specLabels: string[] = [];
  for (const car of cars) {
    for (const s of car.spesifikasi) {
      if (!specLabels.includes(s.label)) specLabels.push(s.label);
    }
  }
  const specValue = (car: Mobil, label: string): SpecItem | undefined =>
    car.spesifikasi.find((s) => s.label === label);
  const specDiffers = (label: string): boolean => {
    if (cars.length < 2) return false;
    const vals = cars.map((c) => specValue(c, label)?.value);
    return vals.some((v) => v !== vals[0]);
  };
  const basicDiffers = (get: (c: Mobil) => string | number | null): boolean => {
    if (cars.length < 2) return false;
    const vals = cars.map(get);
    return vals.some((v) => v !== vals[0]);
  };

  return (
    <SiteLayout>
      <section className="py-12 md:py-16 bg-suzuki-light" aria-labelledby="judul-bandingkan">
        <div className="container mx-auto px-4">
          <SectionHeading
            title="Bandingkan Mobil Suzuki"
            subtitle="Bandingkan hingga 3 mobil berdampingan — harga, spesifikasi, dan fitur penting dalam satu tampilan."
          />

          {carsQuery.isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: Math.max(slugs.length, 2) }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : carsQuery.isError ? (
            <ErrorState message="Gagal memuat data mobil." onRetry={() => void carsQuery.refetch()} />
          ) : cars.length < 2 ? (
            <Reveal>
              <div className="max-w-lg mx-auto bg-card rounded-xl border border-dashed border-border p-10 text-center">
                <div className="w-16 h-16 mx-auto mb-5 bg-suzuki-red/10 rounded-full flex items-center justify-center">
                  <Scale className="w-8 h-8 text-suzuki-red" aria-hidden />
                </div>
                <h2 className="text-xl font-bold text-suzuki-navy mb-2">
                  {cars.length === 0 ? "Belum ada mobil dipilih" : "Pilih minimal 2 mobil"}
                </h2>
                <p className="text-muted-foreground text-sm mb-6">
                  Buka katalog lalu tekan tombol <span className="font-semibold text-suzuki-navy">“Bandingkan”</span> pada
                  kartu mobil untuk menambahkannya ke sini. Anda dapat membandingkan hingga 3 mobil sekaligus.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link
                    to="/mobil"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-suzuki-red hover:bg-suzuki-red/90 text-white rounded-full font-semibold transition-all shadow-lg shadow-suzuki-red/30 hover:shadow-xl active:scale-95"
                  >
                    <Plus className="w-4 h-4" aria-hidden />
                    Buka Katalog Mobil
                  </Link>
                  {cars.length > 0 && (
                    <button
                      type="button"
                      onClick={clear}
                      className="inline-flex items-center gap-2 px-5 py-3 border border-border rounded-full text-sm font-medium text-muted-foreground hover:text-suzuki-red hover:border-suzuki-red/40 transition-colors"
                    >
                      <X className="w-4 h-4" aria-hidden />
                      Kosongkan
                    </button>
                  )}
                </div>
              </div>
            </Reveal>
          ) : (
            <>
              {/* Baris aksi di atas tabel */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <p className="text-sm text-muted-foreground" aria-live="polite">
                  Membandingkan <span className="font-semibold text-suzuki-navy">{cars.length} mobil</span>
                  {specHint()}
                </p>
                <div className="flex flex-wrap gap-2">
                  {cars.length < 3 && (
                    <Link
                      to="/mobil"
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-suzuki-navy/30 text-suzuki-navy rounded-full hover:bg-suzuki-navy hover:text-white transition-all active:scale-95"
                    >
                      <Plus className="w-4 h-4" aria-hidden />
                      Tambah Mobil
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={clear}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-suzuki-red rounded-full transition-colors"
                  >
                    <TrashIcon />
                    Kosongkan
                  </button>
                </div>
              </div>

              {/* Tabel perbandingan — scroll horizontal di layar kecil */}
              <Reveal>
                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                  <div className="overflow-x-auto" role="region" aria-label="Tabel perbandingan mobil" tabIndex={0}>
                    <table className="w-full border-collapse min-w-[640px]">
                      {/* Header: gambar + nama + harga + CTA */}
                      <thead>
                        <tr>
                          <th scope="col" className="sticky left-0 z-10 bg-card w-40 min-w-40 p-4 text-left align-top border-b border-border">
                            <span className="sr-only">Aspek perbandingan</span>
                          </th>
                          {cars.map((c) => (
                            <th key={c.id} scope="col" className="p-4 align-top border-b border-l border-border min-w-56">
                              <div className="relative group">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (cars.length <= 2) {
                                      toast.info("Minimal 2 mobil untuk perbandingan. Tambah mobil lain dulu.");
                                      return;
                                    }
                                    remove(c.slug);
                                  }}
                                  className="absolute -top-1 -right-1 z-10 w-6 h-6 rounded-full bg-muted text-muted-foreground hover:bg-suzuki-red hover:text-white flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                                  aria-label={`Keluarkan ${c.nama} dari perbandingan`}
                                >
                                  <X className="w-3.5 h-3.5" aria-hidden />
                                </button>
                                <div className="h-36 flex items-center justify-center bg-[#E8E8E8] rounded-lg mb-3 overflow-hidden">
                                  <img
                                    src={c.gambar_utama ?? CAR_FALLBACK_IMAGE}
                                    alt={`Foto ${c.nama}`}
                                    loading="lazy"
                                    className="max-h-full max-w-full object-contain"
                                  />
                                </div>
                                <span className="inline-block px-2.5 py-0.5 bg-suzuki-red/10 text-suzuki-red text-[11px] font-semibold rounded-full mb-2">
                                  {c.kategori_label}
                                </span>
                                <h3 className="font-bold text-suzuki-navy text-base leading-snug">{c.nama}</h3>
                                <p className="text-suzuki-red font-bold mt-1.5">
                                  {c.harga_label ?? formatPrice(c.harga_mulai)}
                                </p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">harga mulai dari</p>

                                <div className="flex flex-col gap-2 mt-4">
                                  <Link
                                    to={`/mobil/${c.slug}`}
                                    className="block text-center px-4 py-2 bg-suzuki-navy text-white text-sm font-semibold rounded-full hover:bg-suzuki-red transition-colors"
                                  >
                                    Lihat Detail
                                  </Link>
                                  <a
                                    href={waLink(
                                      `Halo, saya sedang membandingkan mobil dan tertarik dengan ${c.nama}. Boleh info lebih lanjut?`,
                                    )}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block text-center px-4 py-2 border border-suzuki-red/40 text-suzuki-red text-sm font-semibold rounded-full hover:bg-suzuki-red hover:text-white transition-all"
                                  >
                                    Tanya Sales
                                  </a>
                                </div>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {/* Ringkasan cepat */}
                        <CompareRow label="Penumpang" differs={basicDiffers((c) => c.seater)}>
                          {cars.map((c) => (
                            <td key={c.id} className="p-4 border-l border-border">
                              {c.seater != null ? (
                                <span className="inline-flex items-center gap-1.5">
                                  <Users className="w-4 h-4 text-muted-foreground" aria-hidden />
                                  {c.seater} orang
                                </span>
                              ) : (
                                <Dash />
                              )}
                            </td>
                          ))}
                        </CompareRow>
                        <CompareRow label="Bahan Bakar" differs={basicDiffers((c) => c.fuel)}>
                          {cars.map((c) => (
                            <td key={c.id} className="p-4 border-l border-border">
                              {c.fuel ? (
                                <span className="inline-flex items-center gap-1.5">
                                  <Fuel className="w-4 h-4 text-muted-foreground" aria-hidden />
                                  {c.fuel}
                                </span>
                              ) : (
                                <Dash />
                              )}
                            </td>
                          ))}
                        </CompareRow>
                        <CompareRow label="Transmisi" differs={basicDiffers((c) => c.transmission)}>
                          {cars.map((c) => (
                            <td key={c.id} className="p-4 border-l border-border">
                              {c.transmission ? (
                                <span className="inline-flex items-center gap-1.5">
                                  <Settings className="w-4 h-4 text-muted-foreground" aria-hidden />
                                  {c.transmission}
                                </span>
                              ) : (
                                <Dash />
                              )}
                            </td>
                          ))}
                        </CompareRow>
                        <CompareRow label="Pilihan Warna" differs={basicDiffers((c) => c.warna.length)}>
                          {cars.map((c) => (
                            <td key={c.id} className="p-4 border-l border-border">
                              {c.warna.length > 0 ? (
                                <div className="flex items-center gap-2 flex-wrap">
                                  {c.warna.slice(0, 6).map((w, i) => (
                                    <span
                                      key={w.nama + i}
                                      title={w.nama}
                                      className="w-5 h-5 rounded-full border border-black/10 shadow-sm"
                                      style={{ backgroundColor: w.hex }}
                                      aria-hidden
                                    />
                                  ))}
                                  {c.warna.length > 6 && (
                                    <span className="text-xs text-muted-foreground">+{c.warna.length - 6}</span>
                                  )}
                                </div>
                              ) : (
                                <Dash />
                              )}
                            </td>
                          ))}
                        </CompareRow>

                        {/* Spesifikasi teknis (gabungan label) */}
                        {specLabels.length > 0 && (
                          <tr className="bg-suzuki-navy/5">
                            <th scope="colgroup" colSpan={cars.length + 1} className="p-3 text-left text-xs font-bold uppercase tracking-wider text-suzuki-navy">
                              Spesifikasi Teknis
                            </th>
                          </tr>
                        )}
                        {specLabels.map((label, idx) => (
                          <CompareRow key={label} label={label} differs={specDiffers(label)} zebra={idx % 2 === 1}>
                            {cars.map((c) => (
                              <td key={c.id} className="p-4 border-l border-border text-sm">
                                {specValue(c, label)?.value ?? <Dash />}
                              </td>
                            ))}
                          </CompareRow>
                        ))}

                        {/* Deskripsi */}
                        <tr className="bg-suzuki-navy/5">
                          <th scope="colgroup" colSpan={cars.length + 1} className="p-3 text-left text-xs font-bold uppercase tracking-wider text-suzuki-navy">
                            Ringkasan
                          </th>
                        </tr>
                        <tr>
                          <th scope="row" className="p-4 text-left align-top text-sm font-medium text-suzuki-navy bg-muted/40 border-b border-border w-40">
                            Deskripsi
                          </th>
                          {cars.map((c) => (
                            <td key={c.id} className="p-4 border-l border-b border-border text-sm text-muted-foreground align-top leading-relaxed">
                              {c.deskripsi ?? <Dash />}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </Reveal>

              <div className="flex flex-wrap items-center justify-center gap-3 mt-10">
                <button
                  type="button"
                  onClick={() => navigate("/mobil")}
                  className="inline-flex items-center gap-2 px-6 py-3 border border-suzuki-navy/30 text-suzuki-navy hover:bg-suzuki-navy hover:text-white rounded-full text-sm font-semibold transition-all hover:shadow-lg hover:shadow-suzuki-navy/20 hover:-translate-y-0.5 active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4" aria-hidden />
                  Kembali ke Katalog
                </button>
                <a
                  href={waLink(
                    `Halo, saya membandingkan ${cars.map((c) => c.nama).join(" vs ")}. Mohon bantuannya memilih yang paling cocok untuk kebutuhan saya.`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-suzuki-red hover:bg-suzuki-red/90 text-white rounded-full text-sm font-semibold transition-all shadow-lg shadow-suzuki-red/30 hover:shadow-xl hover:-translate-y-0.5 active:scale-95"
                >
                  <Sparkles className="w-4 h-4" aria-hidden />
                  Minta Rekomendasi Sales
                </a>
              </div>
            </>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}

function specHint() {
  return (
    <span className="hidden sm:inline">
      {" "}
      — <span className="inline-flex items-center gap-1 text-amber-600"><Sparkles className="w-3 h-3" aria-hidden /> nilai yang berbeda ditandai</span>
    </span>
  );
}

function TrashIcon() {
  return <X className="w-4 h-4" aria-hidden />;
}

function Dash() {
  return <span className="text-muted-foreground/50" aria-label="tidak tersedia">—</span>;
}

function CompareRow({
  label,
  differs,
  zebra,
  children,
}: {
  label: string;
  differs: boolean;
  zebra?: boolean;
  children: React.ReactNode;
}) {
  return (
    <tr className={zebra ? "bg-muted/20" : undefined}>
      <th
        scope="row"
        className={`p-4 text-left align-top text-sm font-medium bg-muted/40 border-b border-border w-40 sticky left-0 z-10 ${differs ? "text-suzuki-navy" : "text-muted-foreground"}`}
      >
        <span className="inline-flex items-center gap-1.5">
          {differs && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title="Nilai berbeda antar mobil" aria-hidden />}
          {label}
        </span>
      </th>
      {children}
    </tr>
  );
}
