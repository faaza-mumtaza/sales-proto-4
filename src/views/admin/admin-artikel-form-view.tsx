"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { apiGet } from "@/lib/api";
import { Link, usePageMeta } from "@/lib/router";
import { AdminShell } from "./admin-shell";
import { ArtikelEditor } from "@/components/admin/artikel-editor";
import type { Artikel } from "@/lib/site-utils";

export function AdminArtikelFormView({ artikelId }: { artikelId?: string }) {
  const isEdit = Boolean(artikelId);
  usePageMeta(isEdit ? "Edit Artikel — Admin Suzuki BSB" : "Tulis Artikel — Admin Suzuki BSB");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "artikel"],
    queryFn: () => apiGet<{ articles: Artikel[] }>("/api/admin/articles"),
    enabled: isEdit,
  });

  const artikel = data?.articles.find((a) => a.id === artikelId);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <Link
            to="/admin/artikel"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-suzuki-red transition-colors mb-3"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden />
            Kembali ke Artikel
          </Link>
          <h1 className="text-2xl font-bold text-suzuki-navy dark:text-foreground">
            {isEdit ? "Edit Artikel" : "Tulis Artikel Baru"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gunakan editor di bawah — format teks, sisipkan gambar, dan atur jadwal tayang.
          </p>
        </div>

        {isEdit && isLoading ? (
          <div className="bg-white dark:bg-card rounded-xl border border-border p-8 text-center text-muted-foreground text-sm">
            Memuat artikel…
          </div>
        ) : isEdit && (isError || !artikel) ? (
          <div className="bg-white dark:bg-card rounded-xl border border-border p-8 text-center">
            <p className="text-muted-foreground text-sm mb-3">Artikel tidak ditemukan.</p>
            <Link to="/admin/artikel" className="text-suzuki-red underline text-sm">
              Kembali ke daftar artikel
            </Link>
          </div>
        ) : (
          <div className="bg-white dark:bg-card rounded-xl border border-border p-6 md:p-8">
            <ArtikelEditor initial={artikel} />
          </div>
        )}
      </div>
    </AdminShell>
  );
}
