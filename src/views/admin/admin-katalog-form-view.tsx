"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { apiGet } from "@/lib/api";
import { Link, usePageMeta } from "@/lib/router";
import { AdminShell } from "./admin-shell";
import { CarForm } from "@/components/admin/car-form";
import type { Mobil } from "@/lib/site-utils";

export function AdminKatalogFormView({ carId }: { carId?: string }) {
  const isEdit = Boolean(carId);
  usePageMeta(isEdit ? "Edit Mobil — Admin Suzuki BSB" : "Tambah Mobil — Admin Suzuki BSB");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "mobil"],
    queryFn: () => apiGet<{ cars: Mobil[] }>("/api/admin/cars"),
    enabled: isEdit,
  });

  const car = data?.cars.find((c) => c.id === carId);

  return (
    <AdminShell>
      <div className="space-y-6 max-w-4xl">
        <div>
          <Link
            to="/admin/katalog"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-suzuki-red transition-colors mb-3"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden />
            Kembali ke Katalog
          </Link>
          <h1 className="text-2xl font-bold text-suzuki-navy">
            {isEdit ? "Edit Mobil" : "Tambah Mobil Baru"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isEdit
              ? "Perubahan langsung tampil di website setelah disimpan."
              : "Lengkapi data mobil — mobil baru bisa langsung tampil di website."}
          </p>
        </div>

        {isEdit && isLoading ? (
          <div className="bg-white rounded-xl border border-border p-8 text-center text-muted-foreground text-sm">
            Memuat data mobil…
          </div>
        ) : isEdit && (isError || !car) ? (
          <div className="bg-white rounded-xl border border-border p-8 text-center">
            <p className="text-muted-foreground text-sm mb-3">Mobil tidak ditemukan.</p>
            <Link to="/admin/katalog" className="text-suzuki-red underline text-sm">
              Kembali ke katalog
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-border p-6 md:p-8">
            <CarForm initial={car} />
          </div>
        )}
      </div>
    </AdminShell>
  );
}
