"use client";

import { Link } from "@/lib/router";
import { Users, Fuel, Settings, Scale, Check, Eye, Flame } from "lucide-react";
import { useState } from "react";
import { CAR_FALLBACK_IMAGE, formatPrice, type Mobil } from "@/lib/site-utils";
import { useCompare } from "@/lib/use-compare";
import { toast } from "sonner";
import { QuickViewDialog } from "./quick-view-dialog";

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
    <div className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all group flex flex-col">
      {/* Quick view — pratinjau cepat tanpa pindah halaman */}
      <QuickViewDialog car={car} open={quickOpen} onOpenChange={setQuickOpen} />
      <div className="relative p-4 pb-0">
        <span className="absolute top-4 left-4 z-10 px-3 py-1 bg-suzuki-red text-white text-xs font-semibold rounded-full">
          {car.kategori_label}
        </span>
        {car.is_new && (
          <span className="absolute top-4 right-4 z-10 px-3 py-1 bg-suzuki-navy text-white text-xs font-semibold rounded-full">
            NEW
          </span>
        )}
        {/* Badge mobil paling dicari — berdasarkan permintaan test drive nyata */}
        {hot && (
          <span className="absolute bottom-16 left-4 z-10 inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide text-white bg-suzuki-red shadow-sm">
            <Flame className="w-3.5 h-3.5" aria-hidden />
            Paling Diminati
            {demand > 0 && <span className="font-extrabold">· {demand}×</span>}
          </span>
        )}
        <button
          type="button"
          onClick={handleToggleCompare}
          aria-pressed={selected}
          aria-label={selected ? `Keluarkan ${car.nama} dari perbandingan` : `Bandingkan ${car.nama} dengan mobil lain`}
          title={selected ? "Keluarkan dari perbandingan" : "Bandingkan mobil ini"}
          className={`absolute bottom-3 right-7 z-10 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold border transition-colors md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100 ${
            selected
              ? "bg-suzuki-red text-white border-suzuki-red"
              : "bg-white/90 backdrop-blur text-suzuki-navy border-border hover:border-suzuki-red/50 hover:text-suzuki-red"
          }`}
        >
          {selected ? <Check className="w-3.5 h-3.5" aria-hidden /> : <Scale className="w-3.5 h-3.5" aria-hidden />}
          <span className="hidden sm:inline">{selected ? "Dibandingkan" : "Bandingkan"}</span>
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setQuickOpen(true);
          }}
          aria-label={`Pratinjau cepat ${car.nama}`}
          title="Pratinjau cepat"
          className="absolute bottom-3 left-4 z-10 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold border bg-white/90 backdrop-blur text-suzuki-navy border-border hover:border-suzuki-red/50 hover:text-suzuki-red transition-colors md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100"
        >
          <Eye className="w-3.5 h-3.5" aria-hidden />
          <span className="hidden sm:inline">Pratinjau</span>
        </button>
        <div className="relative h-48 flex items-center justify-center bg-[#E8E8E8] rounded-lg overflow-hidden">
          <img
            src={img}
            alt={car.nama}
            onError={() => setImgErr(true)}
            loading="lazy"
            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      </div>

      <div className="p-4 pt-4 flex flex-col flex-1">
        <h3 className="font-bold text-lg text-suzuki-navy mb-2">{car.nama}</h3>
        {car.warna.length > 0 && (
          <div className="flex items-center gap-1.5 mb-3" aria-label={`${car.warna.length} pilihan warna`}>
            {car.warna.slice(0, 5).map((w, i) => (
              <span
                key={w.nama + i}
                title={w.nama}
                className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-sm"
                style={{ backgroundColor: w.hex }}
                aria-hidden
              />
            ))}
            {car.warna.length > 5 && (
              <span className="text-[10px] text-muted-foreground ml-0.5">+{car.warna.length - 5}</span>
            )}
          </div>
        )}
        <div className="flex items-center gap-4 text-muted-foreground text-xs mb-4">
          {car.seater != null && (
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" aria-hidden />
              {car.seater}
            </span>
          )}
          {car.fuel && (
            <span className="flex items-center gap-1">
              <Fuel className="w-3.5 h-3.5" aria-hidden />
              {car.fuel}
            </span>
          )}
          {car.transmission && (
            <span className="flex items-center gap-1">
              <Settings className="w-3.5 h-3.5" aria-hidden />
              {car.transmission}
            </span>
          )}
        </div>
        <div className="flex items-end justify-between mt-auto">
          <div>
            <p className="text-xs text-muted-foreground">Mulai dari</p>
            <p className="font-bold text-suzuki-red">
              {car.harga_label ?? formatPrice(car.harga_mulai)}
            </p>
          </div>
          <Link
            to={`/mobil/${car.slug}`}
            className="inline-flex items-center gap-1 px-4 py-2 bg-suzuki-navy text-white text-sm font-medium rounded-full hover:bg-suzuki-red transition-colors"
          >
            Detail <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
