"use client";

import { Link } from "@/lib/router";
import { Users, Fuel, Settings } from "lucide-react";
import { useState } from "react";
import { CAR_FALLBACK_IMAGE, formatPrice, type Mobil } from "@/lib/site-utils";

export function CarCard({ car }: { car: Mobil }) {
  const [imgErr, setImgErr] = useState(false);
  const img = imgErr || !car.gambar_utama ? CAR_FALLBACK_IMAGE : car.gambar_utama;
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-xl hover:shadow-suzuki-navy/10 hover:-translate-y-1 transition-all duration-300 group flex flex-col card-accent">
      <div className="relative p-4 pb-0">
        <span className="absolute top-4 left-4 z-10 px-3 py-1 bg-suzuki-red text-white text-xs font-semibold rounded-full shadow-sm">
          {car.kategori_label}
        </span>
        {car.is_new && (
          <span className="absolute top-4 right-4 z-10 px-3 py-1 bg-suzuki-navy text-white text-xs font-semibold rounded-full shadow-sm">
            NEW
          </span>
        )}
        <div className="relative h-48 flex items-center justify-center bg-[#E8E8E8] rounded-lg overflow-hidden">
          <img
            src={img}
            alt={car.nama}
            onError={() => setImgError(true)}
            loading="lazy"
            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      </div>

      <div className="p-4 pt-4 flex flex-col flex-1">
        <h3 className="font-bold text-lg text-suzuki-navy mb-2 group-hover:text-suzuki-red transition-colors">
          {car.nama}
        </h3>
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
