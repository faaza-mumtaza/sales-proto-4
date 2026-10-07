"use client";

/**
 * Quick view mobil — dialog pratinjau cepat dari kartu katalog tanpa
 * meninggalkan halaman: foto, spesifikasi utama, warna, harga, dan CTA
 * ke halaman detail / WhatsApp sales / perbandingan.
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Users, Fuel, Settings, MessageCircle, ArrowRight, Scale, Check, Car } from "lucide-react";
import { Link } from "@/lib/router";
import {
  CAR_FALLBACK_IMAGE,
  carHarga,
  waLink,
  type Mobil,
} from "@/lib/site-utils";
import { useCompare } from "@/lib/use-compare";
import { toast } from "sonner";

export function QuickViewDialog({
  car,
  open,
  onOpenChange,
}: {
  car: Mobil;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [imgErr, setImgErr] = useState(false);
  const { slugs, toggle, isFull } = useCompare();
  const selected = slugs.includes(car.slug);
  const img = imgErr || !car.gambar_utama ? CAR_FALLBACK_IMAGE : car.gambar_utama;
  const specs = car.spesifikasi.slice(0, 6);

  function handleCompare() {
    if (!selected && isFull) {
      toast.info(`Maksimal 3 mobil untuk dibandingkan. Hapus salah satu dulu.`);
      return;
    }
    toggle(car.slug);
    if (!selected) toast.success(`${car.nama} ditambahkan ke perbandingan`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl p-0 overflow-hidden gap-0 sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="sr-only">
          <DialogTitle>Pratinjau {car.nama}</DialogTitle>
          <DialogDescription>
            Ringkasan spesifikasi {car.nama} — Suzuki BSB Semarang
          </DialogDescription>
        </DialogHeader>

        {/* Foto + overlay judul */}
        <div className="relative bg-gradient-to-br from-suzuki-navy via-suzuki-navy to-[#2c3e63] shrink-0">
          <div className="pattern-dots absolute inset-0" aria-hidden />
          <div className="relative h-52 sm:h-60 flex items-center justify-center p-6">
            <img
              src={img}
              alt={car.nama}
              onError={() => setImgErr(true)}
              className="max-h-full max-w-full object-contain drop-shadow-2xl"
            />
          </div>
          <span className="absolute top-4 left-4 px-3 py-1 bg-suzuki-red text-white text-xs font-semibold rounded-full shadow-sm">
            {car.kategori_label}
          </span>
          {car.is_new && (
            <span className="absolute top-4 right-4 px-3 py-1 bg-white text-suzuki-navy text-xs font-bold rounded-full shadow-sm">
              NEW
            </span>
          )}
        </div>

        <div className="p-6 overflow-y-auto scroll-thin">
          <h2 className="text-xl sm:text-2xl font-bold text-suzuki-navy leading-tight">
            {car.nama}
          </h2>
          {car.deskripsi && (
            <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
              {car.deskripsi}
            </p>
          )}

          {/* Meta ringkas */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 text-sm text-foreground">
            {car.seater != null && (
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-suzuki-red" aria-hidden />
                {car.seater} kursi
              </span>
            )}
            {car.fuel && (
              <span className="flex items-center gap-1.5">
                <Fuel className="w-4 h-4 text-suzuki-red" aria-hidden />
                {car.fuel}
              </span>
            )}
            {car.transmission && (
              <span className="flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-suzuki-red" aria-hidden />
                {car.transmission}
              </span>
            )}
          </div>

          {/* Spesifikasi utama */}
          {specs.length > 0 && (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 mt-5 pt-5 border-t border-border">
              {specs.map((s) => (
                <div key={s.label} className="flex items-baseline justify-between gap-3 text-sm">
                  <dt className="text-muted-foreground shrink-0">{s.label}</dt>
                  <dd className="font-medium text-suzuki-navy text-right">{s.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {/* Warna */}
          {car.warna.length > 0 && (
            <div className="mt-5 pt-5 border-t border-border">
              <p className="text-xs uppercase tracking-wide font-semibold text-muted-foreground mb-2.5">
                {car.warna.length} pilihan warna
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {car.warna.map((w, i) => (
                  <span
                    key={w.nama + i}
                    title={w.nama}
                    className="w-6 h-6 rounded-full border border-black/10 shadow-sm ring-2 ring-transparent hover:ring-suzuki-red/40 transition-all cursor-help"
                    style={{ backgroundColor: w.hex }}
                    aria-label={w.nama}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Harga + CTA */}
          <div className="mt-6 pt-5 border-t border-border flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Harga mulai</p>
              <p className="text-xl font-bold text-suzuki-red">
                {carHarga(car)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleCompare}
                aria-pressed={selected}
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium border transition-colors ${
                  selected
                    ? "bg-suzuki-red text-white border-suzuki-red"
                    : "text-suzuki-navy border-border hover:border-suzuki-navy hover:bg-muted/60"
                }`}
              >
                {selected ? (
                  <Check className="w-4 h-4" aria-hidden />
                ) : (
                  <Scale className="w-4 h-4" aria-hidden />
                )}
                {selected ? "Dibandingkan" : "Bandingkan"}
              </button>
              <a
                href={waLink(`Halo, saya ingin menanyakan harga dan ketersediaan ${car.nama}.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-suzuki-navy text-white text-sm font-medium hover:bg-suzuki-navy/90 transition-colors"
              >
                <MessageCircle className="w-4 h-4" aria-hidden />
                Tanya Sales
              </a>
              <Link
                to={`/mobil/${car.slug}`}
                onClick={() => onOpenChange(false)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-suzuki-red text-white text-sm font-semibold hover:bg-suzuki-red/90 transition-colors shadow-sm shadow-suzuki-red/30"
              >
                <Car className="w-4 h-4" aria-hidden />
                Lihat Detail
                <ArrowRight className="w-3.5 h-3.5" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
