"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, ExternalLink, Eye, Search, Download } from "lucide-react";
import { toast } from "sonner";
import { apiDelete, apiGet, apiPatch } from "@/lib/api";
import { Link, usePageMeta } from "@/lib/router";
import { useSelection } from "@/lib/use-selection";
import { BulkActionBar } from "@/components/admin/bulk-action-bar";
import { AdminShell } from "./admin-shell";
import { formatDateID, formatDateTimeID, type Artikel } from "@/lib/site-utils";
import { buildCsv, downloadCsv, fileDatestamp } from "@/lib/csv";

const TIPE_STYLE: Record<string, string> = {
  PROMO: "bg-suzuki-red/10 text-suzuki-red",
  BERITA: "bg-blue-100 dark:bg-blue-950/70 dark:text-blue-300 text-blue-800",
  KEGIATAN: "bg-green-100 dark:bg-green-950/70 dark:text-green-300 text-green-800",
};

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-slate-300",
  TERJADWAL: "bg-amber-100 dark:bg-amber-950/70 dark:text-amber-300 text-amber-800",
  PUBLISHED: "bg-green-100 dark:bg-green-950/70 dark:text-green-300 text-green-800",
};

export function AdminArtikelView() {
  usePageMeta("Artikel — Admin Suzuki BSB");
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

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

  // Seleksi item untuk aksi massal
  const sel = useSelection(filtered);

  async function bulkStatus(status: string) {
    if (sel.count === 0) return;
    setBulkBusy(true);
    try {
      const res = await apiPatch<{ updated: number }>("/api/admin/articles", {
        ids: [...sel.selected],
        status,
      });
      await qc.invalidateQueries({ queryKey: ["admin", "artikel"] });
      await qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      await qc.invalidateQueries({ queryKey: ["artikel"] });
      toast.success(
        `${res.updated} artikel ${status === "PUBLISHED" ? "dipublikasikan" : "diubah menjadi draft"}`,
      );
      sel.clear();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal memperbarui status artikel secara massal");
    } finally {
      setBulkBusy(false);
    }
  }

  async function bulkDelete() {
    if (sel.count === 0) return;
    if (!window.confirm(`Hapus ${sel.count} artikel terpilih? Tindakan ini tidak bisa dibatalkan.`)) return;
    setBulkBusy(true);
    try {
      const res = await apiDelete<{ deleted: number }>("/api/admin/articles", {
        ids: [...sel.selected].join(","),
      });
      await qc.invalidateQueries({ queryKey: ["admin", "artikel"] });
      await qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      await qc.invalidateQueries({ queryKey: ["artikel"] });
      toast.success(`${res.deleted} artikel dihapus`);
      sel.clear();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menghapus artikel secara massal");
    } finally {
      setBulkBusy(false);
    }
  }

  function exportCsv() {
    if (filtered.length === 0) {
      toast.info("Tidak ada artikel untuk diexport sesuai filter saat ini.");
      return;
    }
    const csv = buildCsv(filtered, [
      { header: "Judul", value: (a) => a.judul },
      { header: "Slug", value: (a) => a.slug },
      { header: "Tipe", value: (a) => a.tipe },
      { header: "Status", value: (a) => a.status },
      { header: "Tag", value: (a) => a.tags.join("; ") },
      { header: "Views", value: (a) => a.views },
      { header: "Dipublikasikan", value: (a) => (a.published_at ? formatDateTimeID(a.published_at) : "") },
      { header: "Dibuat", value: (a) => formatDateTimeID(a.created_at) },
    ]);
    downloadCsv(`artikel-suzuki-bsb-${fileDatestamp()}.csv`, csv);
    toast.success(`${filtered.length} artikel diexport ke CSV.`);
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-suzuki-navy dark:text-foreground">Artikel, Berita & Promo</h1>
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
                  filter === f.id ? "bg-suzuki-red text-white font-medium" : "bg-white dark:bg-card border border-border text-muted-foreground hover:text-suzuki-navy dark:hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative sm:w-72">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
              aria-hidden
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari judul / tag…"
              aria-label="Cari artikel"
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm bg-white dark:bg-card focus:outline-none focus:ring-2 focus:ring-suzuki-red/50"
            />
          </div>
          <button
            onClick={exportCsv}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border border-border bg-white dark:bg-card text-sm text-suzuki-navy dark:text-foreground font-medium hover:border-suzuki-red/40 hover:text-suzuki-red transition-colors shrink-0"
          >
            <Download className="w-4 h-4" aria-hidden />
            Export CSV
          </button>
        </div>

        {/* Bilah aksi massal — tampil saat ada item terpilih */}
        <BulkActionBar
          count={sel.count}
          total={filtered.length}
          onSelectAll={sel.selectAll}
          onClear={sel.clear}
          statuses={[
            { value: "DRAFT", label: "Draft" },
            { value: "PUBLISHED", label: "Publikasikan" },
          ]}
          onBulkStatus={(s) => void bulkStatus(s)}
          onBulkDelete={() => void bulkDelete()}
          busy={bulkBusy}
        />

        {isLoading ? (
          <div className="bg-white dark:bg-card rounded-xl border border-border p-8 text-center text-muted-foreground text-sm">
            Memuat artikel…
          </div>
        ) : isError ? (
          <div className="bg-white dark:bg-card rounded-xl border border-border p-8 text-center">
            <p className="text-muted-foreground text-sm mb-2">Gagal memuat artikel.</p>
            <button onClick={() => void refetch()} className="text-suzuki-red underline text-sm">
              Coba lagi
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-card rounded-xl border border-border p-8 text-center">
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
            {/* Header pilih-semua dengan status indeterminate */}
            <div className="flex items-center gap-3 bg-white dark:bg-card rounded-xl border border-border px-4 py-3">
              <input
                type="checkbox"
                checked={sel.allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = sel.someSelected;
                }}
                onChange={sel.toggleAll}
                aria-label="Pilih semua artikel"
                className="w-4 h-4 cursor-pointer"
              />
              <span className="text-sm font-medium text-suzuki-navy dark:text-foreground">
                Pilih semua ({filtered.length} artikel)
              </span>
            </div>
            {filtered.map((a) => {
              const isSel = sel.selected.has(a.id);
              return (
              <article
                key={a.id}
                className={`bg-white dark:bg-card rounded-xl border p-4 sm:p-5 flex flex-col sm:flex-row gap-4 hover:shadow-md transition-shadow ${
                  isSel ? "border-suzuki-red/60 ring-1 ring-suzuki-red/40 row-selected" : "border-border"
                }`}
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
                    <input
                      type="checkbox"
                      checked={isSel}
                      onChange={() => sel.toggle(a.id)}
                      aria-label={`Pilih artikel ${a.judul.slice(0, 40)}`}
                      className="w-4 h-4 shrink-0 cursor-pointer"
                    />
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
                  <h2 className="font-bold text-suzuki-navy dark:text-foreground line-clamp-2 mb-1">{a.judul}</h2>
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
                          className="p-2 text-muted-foreground hover:text-suzuki-navy dark:hover:text-white rounded-lg hover:bg-muted transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      )}
                      <Link
                        to={`/admin/artikel/${a.id}/edit`}
                        title="Edit artikel"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-suzuki-navy dark:text-foreground hover:bg-muted transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" aria-hidden /> Edit
                      </Link>
                      <button
                        onClick={() => void onDelete(a.id, a.judul)}
                        disabled={deleting === a.id}
                        title="Hapus artikel"
                        className="p-2 text-muted-foreground hover:text-suzuki-red rounded-lg hover:bg-red-50 dark:hover:bg-red-950/60 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
              );
            })}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
