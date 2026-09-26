"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, ExternalLink, Eye, Search } from "lucide-react";
import { toast } from "sonner";
import { apiDelete, apiGet } from "@/lib/api";
import { Link, usePageMeta } from "@/lib/router";
import { AdminShell } from "./admin-shell";
import { formatDateID, formatDateTimeID, type Artikel } from "@/lib/site-utils";

const TIPE_STYLE: Record<string, string> = {
  PROMO: "bg-suzuki-red/10 text-suzuki-red",
  BERITA: "bg-blue-100 text-blue-800",
  KEGIATAN: "bg-green-100 text-green-800",
};

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-gray-200 text-gray-700",
  TERJADWAL: "bg-amber-100 text-amber-800",
  PUBLISHED: "bg-green-100 text-green-800",
};

export function AdminArtikelView() {
  usePageMeta("Artikel — Admin Suzuki BSB");
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "artikel"],
    queryFn: () => apiGet<{ articles: Artikel[] }>("/api/admin/articles"),
  });

  async function onDelete(id: string, judul: string) {
    if (!window.confirm(`Hapus artikel "${judul.slice(0, 50)}…"?`)) return;
    setDeleting(id);
    try {
      await apiDelete("/api/admin/articles", { id });
      await qc.invalidateQueries({ queryKey: ["admin"] });
      await qc.invalidateQueries({ queryKey: ["artikel"] });
      toast.success("Artikel dihapus");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menghapus artikel");
    } finally {
      setDeleting(null);
    }
  }

  const filtered = useMemo(() => {
    const all = data?.articles ?? [];
    let list = filter === "all" ? all : all.filter((a) => a.status === filter);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((a) => a.judul.toLowerCase().includes(q) || a.tags.some((t) => t.toLowerCase().includes(q)));
    return list;
  }, [data, filter, search]);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-suzuki-navy">Artikel, Berita & Promo</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Tulis promo, berita, atau kegiatan — bisa draft, dijadwalkan, atau langsung tayang.
            </p>
          </div>
          <Link
            to="/admin/artikel/tambah"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-suzuki-red text-white rounded-lg text-sm font-medium hover:bg-suzuki-red/90 transition-colors"
          >
            <Plus className="w-4 h-4" aria-hidden />
            Tulis Artikel
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex flex-wrap gap-2">
            {[
              { id: "all", label: "Semua" },
              { id: "DRAFT", label: "Draft" },
              { id: "TERJADWAL", label: "Terjadwal" },
              { id: "PUBLISHED", label: "Tayang" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
                  filter === f.id ? "bg-suzuki-red text-white font-medium" : "bg-white border border-border text-muted-foreground hover:text-suzuki-navy"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative sm:ml-auto sm:w-72">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
              aria-hidden
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari judul / tag…"
              aria-label="Cari artikel"
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-suzuki-red/50"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-xl border border-border p-8 text-center text-muted-foreground text-sm">
            Memuat artikel…
          </div>
        ) : isError ? (
          <div className="bg-white rounded-xl border border-border p-8 text-center">
            <p className="text-muted-foreground text-sm mb-2">Gagal memuat artikel.</p>
            <button onClick={() => void refetch()} className="text-suzuki-red underline text-sm">
              Coba lagi
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-border p-8 text-center">
            <p className="text-muted-foreground text-sm mb-3">
              {filter === "all" && !search
                ? "Belum ada artikel. Tulis artikel pertama Anda!"
                : "Tidak ada artikel yang cocok dengan filter."}
            </p>
            {filter === "all" && !search && (
              <Link to="/admin/artikel/tambah" className="text-suzuki-red underline text-sm">
                Tulis artikel
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map((a) => (
              <article
                key={a.id}
                className="bg-white rounded-xl border border-border p-4 sm:p-5 flex flex-col sm:flex-row gap-4 hover:shadow-md transition-shadow"
              >
                <div className="w-full sm:w-44 shrink-0">
                  {a.cover_image ? (
                    <img
                      src={a.cover_image}
                      alt={a.judul}
                      className="w-full h-28 sm:h-24 object-cover rounded-lg border bg-muted"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-28 sm:h-24 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-xs">
                      Tanpa cover
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${TIPE_STYLE[a.tipe] ?? "bg-muted"}`}>
                      {a.tipe}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_STYLE[a.status] ?? "bg-muted"}`}>
                      {a.status === "PUBLISHED" ? "TAYANG" : a.status === "TERJADWAL" ? "TERJADWAL" : "DRAFT"}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {a.status === "PUBLISHED" && a.published_at
                        ? `tayang ${formatDateID(a.published_at)}`
                        : a.status === "TERJADWAL" && a.scheduled_at
                          ? `tayang ${formatDateTimeID(a.scheduled_at)}`
                          : `diubah ${formatDateID(a.updated_at)}`}
                    </span>
                  </div>
                  <h2 className="font-bold text-suzuki-navy line-clamp-2 mb-1">{a.judul}</h2>
                  {a.ringkasan && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{a.ringkasan}</p>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
                    <p className="text-xs text-muted-foreground">
                      /{a.slug} · {a.views.toLocaleString("id-ID")} kali dibaca
                      {a.tags.length > 0 && ` · ${a.tags.slice(0, 3).join(", ")}`}
                    </p>
                    <div className="inline-flex gap-1">
                      {a.status === "PUBLISHED" && (
                        <Link
                          to={`/artikel/${a.slug}`}
                          title="Lihat di website"
                          className="p-2 text-muted-foreground hover:text-suzuki-navy rounded-lg hover:bg-muted transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      )}
                      <Link
                        to={`/admin/artikel/${a.id}/edit`}
                        title="Edit artikel"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-suzuki-navy hover:bg-muted transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" aria-hidden /> Edit
                      </Link>
                      <button
                        onClick={() => void onDelete(a.id, a.judul)}
                        disabled={deleting === a.id}
                        title="Hapus artikel"
                        className="p-2 text-muted-foreground hover:text-suzuki-red rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
