"use client";

// Admin: moderasi testimoni pelanggan — setujui / tolak / hapus.

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Star, Trash2, Search, Check, X, Undo2, Quote, Download } from "lucide-react";
import { toast } from "sonner";
import { apiGet, apiPatch, apiDelete } from "@/lib/api";
import { usePageMeta } from "@/lib/router";
import { AdminShell } from "./admin-shell";
import { formatDateID, formatDateTimeID } from "@/lib/site-utils";
import { buildCsv, downloadCsv, fileDatestamp } from "@/lib/csv";

interface TestimoniAdmin {
  id: string;
  nama: string;
  rating: number;
  pesan: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  ip_address: string | null;
  created_at: string;
}

const FILTERS = [
  { id: "all", label: "Semua" },
  { id: "PENDING", label: "Menunggu" },
  { id: "APPROVED", label: "Disetujui" },
  { id: "REJECTED", label: "Ditolak" },
] as const;

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-700",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Menunggu",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
};

export function AdminTestimoniView() {
  usePageMeta("Testimoni — Admin Suzuki BSB");
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "testimoni"],
    queryFn: () => apiGet<{ testimonials: TestimoniAdmin[]; counts: Record<string, number> }>(
      "/api/admin/testimonials",
    ),
  });

  async function setStatus(id: string, status: string) {
    try {
      await apiPatch("/api/admin/testimonials", { id, status });
      await qc.invalidateQueries({ queryKey: ["admin", "testimoni"] });
      await qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      await qc.invalidateQueries({ queryKey: ["testimoni", "public"] });
      toast.success(`Testimoni ${STATUS_LABEL[status]?.toLowerCase() ?? status}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal mengubah status");
    }
  }

  async function onDelete(id: string) {
    if (!window.confirm("Hapus testimoni ini secara permanen?")) return;
    try {
      await apiDelete("/api/admin/testimonials", { id });
      await qc.invalidateQueries({ queryKey: ["admin", "testimoni"] });
      await qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      await qc.invalidateQueries({ queryKey: ["testimoni", "public"] });
      toast.success("Testimoni dihapus");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menghapus testimoni");
    }
  }

  const items = data?.testimonials ?? [];
  const counts = data?.counts ?? {};

  const filtered = useMemo(() => {
    let list = filter === "all" ? items : items.filter((t) => t.status === filter);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((t) => t.nama.toLowerCase().includes(q) || t.pesan.toLowerCase().includes(q));
    }
    return list;
  }, [items, filter, search]);

  function exportCsv() {
    if (filtered.length === 0) {
      toast.info("Tidak ada testimoni untuk diexport sesuai filter saat ini.");
      return;
    }
    const csv = buildCsv(filtered, [
      { header: "Tanggal", value: (t) => formatDateTimeID(t.created_at) },
      { header: "Nama", value: (t) => t.nama },
      { header: "Rating", value: (t) => t.rating },
      { header: "Testimoni", value: (t) => t.pesan },
      { header: "Status", value: (t) => STATUS_LABEL[t.status] ?? t.status },
      { header: "IP", value: (t) => t.ip_address ?? "" },
    ]);
    downloadCsv(`testimoni-suzuki-bsb-${fileDatestamp()}.csv`, csv);
    toast.success(`${filtered.length} testimoni diexport ke CSV.`);
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-suzuki-navy">Testimoni Pelanggan</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Moderasi testimoni dari pengunjung website — hanya yang disetujui yang tayang di halaman utama.
          </p>
        </div>

        {/* Ringkasan jumlah */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {FILTERS.map((f) => {
            const n = f.id === "all" ? items.length : (counts[f.id] ?? 0);
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`rounded-xl border p-4 text-left transition-all ${
                  filter === f.id
                    ? "border-suzuki-red/50 bg-white shadow-sm ring-1 ring-suzuki-red/30"
                    : "border-border bg-white/60 hover:border-suzuki-navy/30"
                }`}
                aria-pressed={filter === f.id}
              >
                <p className="text-2xl font-bold text-suzuki-navy">{n}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{f.label}</p>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 sm:max-w-xs">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
              aria-hidden
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama / isi testimoni…"
              aria-label="Cari testimoni"
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-suzuki-red/50"
            />
          </div>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {filtered.length} testimoni
          </p>
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border bg-white text-sm text-suzuki-navy font-medium hover:border-suzuki-red/40 hover:text-suzuki-red transition-colors sm:ml-auto"
          >
            <Download className="w-4 h-4" aria-hidden />
            Export CSV
          </button>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-xl border border-border p-8 text-center text-muted-foreground text-sm">
            Memuat testimoni…
          </div>
        ) : isError ? (
          <div className="bg-white rounded-xl border border-border p-8 text-center">
            <p className="text-muted-foreground text-sm mb-2">Gagal memuat testimoni.</p>
            <button onClick={() => void refetch()} className="text-suzuki-red underline text-sm">
              Coba lagi
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-border p-10 text-center">
            <Quote className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" aria-hidden />
            <p className="text-muted-foreground text-sm">
              {filter === "all" && !search
                ? "Belum ada testimoni. Testimoni dari pengunjung website akan muncul di sini."
                : "Tidak ada testimoni yang cocok dengan filter."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((t) => (
              <div
                key={t.id}
                className={`bg-white rounded-xl border p-5 transition-shadow ${
                  t.status === "PENDING" ? "border-amber-300 shadow-sm" : "border-border"
                }`}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <strong className="text-suzuki-navy">{t.nama}</strong>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[t.status]}`}>
                        {STATUS_LABEL[t.status]}
                      </span>
                      <span className="inline-flex items-center gap-0.5" aria-label={`Rating ${t.rating} dari 5`}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < t.rating ? "fill-amber-400 text-amber-400" : "fill-muted text-muted-foreground/30"
                            }`}
                            aria-hidden
                          />
                        ))}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {formatDateID(t.created_at)}
                      {t.ip_address && <span className="ml-2 opacity-60">IP: {t.ip_address}</span>}
                    </p>
                    <p className="text-sm text-foreground leading-relaxed">“{t.pesan}”</p>
                  </div>

                  <div className="flex flex-wrap gap-2 shrink-0">
                    {t.status !== "APPROVED" && (
                      <button
                        onClick={() => void setStatus(t.id, "APPROVED")}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-full transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" aria-hidden />
                        Setujui
                      </button>
                    )}
                    {t.status !== "REJECTED" && (
                      <button
                        onClick={() => void setStatus(t.id, "REJECTED")}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium rounded-full transition-colors"
                      >
                        <X className="w-3.5 h-3.5" aria-hidden />
                        Tolak
                      </button>
                    )}
                    {t.status !== "PENDING" && (
                      <button
                        onClick={() => void setStatus(t.id, "PENDING")}
                        title="Kembalikan ke status menunggu"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-border text-muted-foreground hover:text-suzuki-navy text-xs font-medium rounded-full transition-colors"
                      >
                        <Undo2 className="w-3.5 h-3.5" aria-hidden />
                        Kembalikan
                      </button>
                    )}
                    <button
                      onClick={() => void onDelete(t.id)}
                      title="Hapus testimoni"
                      className="p-2 text-muted-foreground hover:text-suzuki-red rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
