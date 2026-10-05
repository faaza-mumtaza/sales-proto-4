"use client";

import { Link } from "@/lib/router";
import { Users, Fuel, Settings, Scale, Check, Eye, Flame, ArrowRight } from "lucide-react";
import { useState } from "react";
import { CAR_FALLBACK_IMAGE, carHarga, type Mobil } from "@/lib/site-utils";
import { useCompare } from "@/lib/use-compare";
import { toast } from "sonner";
import { QuickViewDialog } from "./quick-view-dialog";

/**
 * Kartu mobil — meniru kartu model suzuki.co.id: foto full-bleed rasio 4:3,
 * nama uppercase, label "Mulai" cukup sekali, harga selalu dari angka
 * terbaru (bukan label basi), dan seluruh kartu bisa diketuk menuju detail
 * (stretched link). Responsif untuk grid 2 kolom di layar kecil.
 */
export function CarCard({ car, hot = false }: { car: Mobil; hot?: boolean }) {
  const [imgErr, setImgErr] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const { slugs, toggle, isFull } = useCompare();
  const selected = slugs.includes(car.slug);
  const img = imgErr || !car.gambar_utama ? CAR_FALLBACK_IMAGE : car.gambar_utama;
  const demand = car.jumlah_minat ?? 0;

  function handleToggleCompare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!selected && isFull) {
      toast.info(`Maksimal 3 mobil untuk dibandingkan. Hapus salah satu dulu.`);
      return;
    }
    toggle(car.slug);
    if (!selected) toast.success(`${car.nama} ditambahkan ke perbandingan`);
  }

  return (
    <div className="relative bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all group flex flex-col">
      {/* Quick view — pratinjau cepat tanpa pindah halaman */}
      <QuickViewDialog car={car} open={quickOpen} onOpenChange={setQuickOpen} />

      {/* Foto full-bleed tanpa padding — lapang di layar kecil ala suzuki.co.id */}
      <div className="relative aspect-[4/3] bg-[#E8E8E8] overflow-hidden">
        <span className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-suzuki-red text-white text-[10px] font-semibold rounded-full">
          {car.kategori_label}
        </span>
        {car.is_new && (
          <span className="absolute top-2 right-2 z-10 px-2 py-0.5 bg-suzuki-navy text-white text-[10px] font-semibold rounded-full">
            NEW
          </span>
        )}
        {/* Badge mobil paling dicari — berdasarkan permintaan test drive nyata */}
        {hot && (
          <span className="absolute top-9 left-2 z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide text-white bg-suzuki-red shadow-sm">
            <Flame className="w-3 h-3" aria-hidden />
            Paling Diminati
            {demand > 0 && <span className="font-extrabold">· {demand}×</span>}
          </span>
        )}
        <img
          src={img}
          alt={car.nama}
          onError={() => setImgErr(true)}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-contain p-3 sm:p-4 group-hover:scale-105 transition-transform duration-300"
        />
        {/* Aksi melayang di atas foto — ikon saja di layar kecil, teks di sm+ */}
        <div className="absolute bottom-2 inset-x-2 z-20 flex items-center justify-between">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setQuickOpen(true);
            }}
            aria-label={`Pratinjau cepat ${car.nama}`}
            title="Pratinjau cepat"
            className="inline-flex items-center gap-1.5 h-9 px-2.5 rounded-full text-[11px] font-semibold border bg-white/90 backdrop-blur text-suzuki-navy border-border hover:border-suzuki-red/50 hover:text-suzuki-red transition-colors md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100"
          >
            <Eye className="w-4 h-4" aria-hidden />
            <span className="hidden sm:inline">Pratinjau</span>
          </button>
          <button
            type="button"
            onClick={handleToggleCompare}
            aria-pressed={selected}
            aria-label={selected ? `Keluarkan ${car.nama} dari perbandingan` : `Bandingkan ${car.nama} dengan mobil lain`}
            title={selected ? "Keluarkan dari perbandingan" : "Bandingkan mobil ini"}
            className={`inline-flex items-center gap-1.5 h-9 px-2.5 rounded-full text-[11px] font-semibold border transition-colors md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100 ${
              selected
                ? "bg-suzuki-red text-white border-suzuki-red"
                : "bg-white/90 backdrop-blur text-suzuki-navy border-border hover:border-suzuki-red/50 hover:text-suzuki-red"
            }`}
          >
            {selected ? <Check className="w-4 h-4" aria-hidden /> : <Scale className="w-4 h-4" aria-hidden />}
            <span className="hidden sm:inline">{selected ? "Dibandingkan" : "Bandingkan"}</span>
          </button>
        </div>
      </div>

      <div className="p-3 sm:p-4 flex flex-col flex-1">
        <h3 className="font-bold text-suzuki-navy text-sm sm:text-base uppercase leading-snug line-clamp-2 min-h-10 sm:min-h-11 mb-1.5 sm:mb-2">
          {car.nama}
        </h3>
        {/* Titik warna hanya bila ≥2 pilihan — satu titik terkesan glitch */}
        {car.warna.length > 1 && (
          <div className="flex items-center gap-1.5 mb-2" aria-label={`${car.warna.length} pilihan warna`}>
            {car.warna.slice(0, 5).map((w, i) => (
              <span
                key={w.nama + i}
                title={w.nama}
                className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border border-black/10 shadow-sm"
                style={{ backgroundColor: w.hex }}
                aria-hidden
              />
            ))}
            {car.warna.length > 5 && (
              <span className="text-[10px] text-muted-foreground ml-0.5">+{car.warna.length - 5}</span>
            )}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground text-[10px] sm:text-xs mb-3">
          {car.seater != null && (
            <span className="inline-flex items-center gap-1">
              <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5" aria-hidden />
              {car.seater}
            </span>
          )}
          {car.fuel && (
            <span className="inline-flex items-center gap-1">
              <Fuel className="w-3 h-3 sm:w-3.5 sm:h-3.5" aria-hidden />
              {car.fuel}
            </span>
          )}
          {car.transmission && (
            <span className="inline-flex items-center gap-1">
              <Settings className="w-3 h-3 sm:w-3.5 sm:h-3.5" aria-hidden />
              {car.transmission}
            </span>
          )}
        </div>
        <div className="mt-auto flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Mulai</p>
            <p className="font-bold text-suzuki-red text-sm sm:text-base leading-tight">
              {carHarga(car)}
            </p>
          </div>
          <span
            className="hidden sm:flex w-11 h-11 shrink-0 items-center justify-center bg-suzuki-navy text-white rounded-full transition-colors group-hover:bg-suzuki-red"
            aria-hidden
          >
            <ArrowRight className="w-5 h-5" />
          </span>
        </div>
      </div>

      {/* Stretched link — seluruh kartu dapat diketuk menuju detail (ala suzuki.co.id). */}
      <Link
        to={`/mobil/${car.slug}`}
        className="absolute inset-0 z-10 rounded-xl focus-visible:ring-2 focus-visible:ring-suzuki-red/60"
      >
        <span className="sr-only">Lihat detail {car.nama}</span>
      </Link>
    </div>
  );
}
