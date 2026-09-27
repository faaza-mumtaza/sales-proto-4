"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Phone, MessageCircle, Trash2, Search, Download } from "lucide-react";
import { toast } from "sonner";
import { apiDelete, apiGet, apiPatch } from "@/lib/api";
import { usePageMeta } from "@/lib/router";
import { useSelection } from "@/lib/use-selection";
import { BulkActionBar } from "@/components/admin/bulk-action-bar";
import { AdminShell } from "./admin-shell";
import { formatDateID, formatDateTimeID, phoneToWaNumber, type Pesan } from "@/lib/site-utils";
import { buildCsv, downloadCsv, fileDatestamp } from "@/lib/csv";
import { DateRangeFilter, EMPTY_RANGE, inRange, isRangeActive, type DateRange } from "@/components/admin/date-range-filter";

const STATUSES = ["BARU", "DIBACA", "DIBALAS", "SELESAI"] as const;

const STATUS_STYLE: Record<string, string> = {
  BARU: "bg-suzuki-red text-white",
  DIBACA: "bg-blue-100 text-blue-800",
  DIBALAS: "bg-green-100 text-green-800",
  SELESAI: "bg-gray-200 text-gray-700",
};

export function AdminPesanView() {
  usePageMeta("Pesan Masuk — Admin Suzuki BSB");
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>(EMPTY_RANGE);
  const [bulkBusy, setBulkBusy] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "pesan"],
    queryFn: () => apiGet<{ messages: Pesan[] }>("/api/admin/messages"),
  });

  async function setStatus(id: string, status: string) {
    try {
      await apiPatch("/api/admin/messages", { id, status });
      await qc.invalidateQueries({ queryKey: ["admin", "pesan"] });
      await qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      toast.success("Status pesan diperbarui");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal memperbarui status");
    }
  }

  async function onDelete(id: string) {
    if (!window.confirm("Hapus pesan ini?")) return;
    try {
      await apiDelete("/api/admin/messages", { id });
      await qc.invalidateQueries({ queryKey: ["admin", "pesan"] });
      await qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      toast.success("Pesan dihapus");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menghapus pesan");
    }
  }

  const allMessages = data?.messages ?? [];
  const filtered = useMemo(() => {
    let list = filter === "all" ? allMessages : allMessages.filter((p) => p.status === filter);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.nama_lengkap.toLowerCase().includes(q) ||
          p.pesan.toLowerCase().includes(q) ||
          (p.subjek ?? "").toLowerCase().includes(q),
      );
    }
    if (isRangeActive(dateRange)) {
      list = list.filter((p) => inRange(p.created_at, dateRange));
    }
    return list;
  }, [allMessages, filter, search, dateRange]);

  // Seleksi item untuk aksi massal
  const sel = useSelection(filtered);

  async function bulkStatus(status: string) {
    if (sel.count === 0) return;
    setBulkBusy(true);
    try {
      const res = await apiPatch<{ updated: number }>("/api/admin/messages", {
        ids: [...sel.selected],
        status,
      });
      await qc.invalidateQueries({ queryKey: ["admin", "pesan"] });
      await qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      toast.success(`${res.updated} pesan ditandai "${status}"`);
      sel.clear();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal memperbarui status massal");
    } finally {
      setBulkBusy(false);
    }
  }

  async function bulkDelete() {
    if (sel.count === 0) return;
    if (!window.confirm(`Hapus ${sel.count} pesan terpilih? Tindakan ini tidak bisa dibatalkan.`)) return;
    setBulkBusy(true);
    try {
      const res = await apiDelete<{ deleted: number }>("/api/admin/messages", {
        ids: [...sel.selected].join(","),
      });
      await qc.invalidateQueries({ queryKey: ["admin", "pesan"] });
      await qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      toast.success(`${res.deleted} pesan dihapus`);
      sel.clear();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menghapus pesan secara massal");
    } finally {
      setBulkBusy(false);
    }
  }

  function exportCsv() {
    if (filtered.length === 0) {
      toast.info("Tidak ada pesan untuk diexport sesuai filter saat ini.");
      return;
    }
    const csv = buildCsv(filtered, [
      { header: "Tanggal", value: (p) => formatDateTimeID(p.created_at) },
      { header: "Nama", value: (p) => p.nama_lengkap },
      { header: "No. Telepon", value: (p) => p.no_telepon },
      { header: "Email", value: (p) => p.email ?? "" },
      { header: "Subjek", value: (p) => p.subjek ?? "" },
      { header: "Pesan", value: (p) => p.pesan },
      { header: "Status", value: (p) => p.status },
    ]);
    downloadCsv(`pesan-kontak-suzuki-bsb-${fileDatestamp()}.csv`, csv);
    toast.success(`${filtered.length} pesan diexport ke CSV.`);
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-suzuki-navy">Pesan Masuk</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Pesan dari form kontak website — balas langsung via WhatsApp atau ubah statusnya.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
                filter === "all" ? "bg-suzuki-red text-white font-medium" : "bg-white border border-border text-muted-foreground hover:text-suzuki-navy"
              }`}
            >
              Semua
            </button>
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-4 py-1.5 rounded-full text-sm capitalize transition-colors ${
                  filter === s ? "bg-suzuki-red text-white font-medium" : "bg-white border border-border text-muted-foreground hover:text-suzuki-navy"
                }`}
              >
                {s.toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
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
              placeholder="Cari nama / isi pesan…"
              aria-label="Cari pesan"
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-suzuki-red/50"
            />
          </div>
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border bg-white text-sm text-suzuki-navy font-medium hover:border-suzuki-red/40 hover:text-suzuki-red transition-colors"
          >
            <Download className="w-4 h-4" aria-hidden />
            Export CSV
          </button>
        </div>

        {/* Filter rentang tanggal (memengaruhi daftar & export CSV) */}
        <div className="bg-white rounded-lg border border-border px-3.5 py-2.5">
          <DateRangeFilter
            value={dateRange}
            onChange={setDateRange}
            count={filtered.length}
            total={allMessages.length}
          />
        </div>

        {/* Bilah aksi massal — tampil saat ada item terpilih */}
        <BulkActionBar
          count={sel.count}
          total={filtered.length}
          onSelectAll={sel.selectAll}
          onClear={sel.clear}
          statuses={[
            { value: "BARU", label: "Baru" },
            { value: "DIBACA", label: "Dibaca" },
            { value: "DIBALAS", label: "Dibalas" },
            { value: "SELESAI", label: "Selesai" },
          ]}
          onBulkStatus={(s) => void bulkStatus(s)}
          onBulkDelete={() => void bulkDelete()}
          busy={bulkBusy}
        />

        {isLoading ? (
          <div className="bg-white rounded-xl border border-border p-8 text-center text-muted-foreground text-sm">
            Memuat pesan…
          </div>
        ) : isError ? (
          <div className="bg-white rounded-xl border border-border p-8 text-center">
            <p className="text-muted-foreground text-sm mb-2">Gagal memuat pesan.</p>
            <button onClick={() => void refetch()} className="text-suzuki-red underline text-sm">
              Coba lagi
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-border p-10 text-center">
            <Mail className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" aria-hidden />
            <p className="text-muted-foreground text-sm">
              {filter === "all" && !search && !isRangeActive(dateRange)
                ? "Belum ada pesan masuk. Pesan dari form kontak website akan muncul di sini."
                : "Tidak ada pesan yang cocok dengan filter."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((p) => {
              const isOpen = expanded === p.id;
              const isSel = sel.selected.has(p.id);
              return (
                <div
                  key={p.id}
                  className={`bg-white rounded-xl border p-5 transition-all ${
                    isSel
                      ? "border-suzuki-red/60 ring-1 ring-suzuki-red/40 row-selected"
                      : p.status === "BARU"
                        ? "border-suzuki-red/40 shadow-sm"
                        : "border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <input
                          type="checkbox"
                          checked={isSel}
                          onChange={() => sel.toggle(p.id)}
                          aria-label={`Pilih pesan dari ${p.nama_lengkap}`}
                          className="w-4 h-4 shrink-0 cursor-pointer"
                        />
                        <strong className="text-suzuki-navy">{p.nama_lengkap}</strong>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[p.status]}`}>
                          {p.status}
                        </span>
                        {p.subjek && (
                          <span className="text-xs text-muted-foreground">· {p.subjek}</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="inline-flex items-center gap-1">
                          <Phone className="w-3 h-3" aria-hidden />
                          {p.no_telepon}
                        </span>
                        {p.email && (
                          <span className="inline-flex items-center gap-1">
                            <Mail className="w-3 h-3" aria-hidden />
                            {p.email}
                          </span>
                        )}
                        <span>· {formatDateID(p.created_at)}</span>
                      </p>
                      <p
                        className={`text-sm text-foreground ${isOpen ? "" : "line-clamp-2"}`}
                        style={{ whiteSpace: isOpen ? "pre-wrap" : undefined }}
                      >
                        {p.pesan}
                      </p>
                      {p.pesan.length > 140 && (
                        <button
                          onClick={() => setExpanded(isOpen ? null : p.id)}
                          className="text-xs text-suzuki-red hover:underline mt-1"
                        >
                          {isOpen ? "Sembunyikan" : "Baca selengkapnya"}
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                      <a
                        href={`https://wa.me/${phoneToWaNumber(p.no_telepon)}?text=${encodeURIComponent(
                          `Halo ${p.nama_lengkap}, terima kasih sudah menghubungi Suzuki BSB Semarang. ` +
                            (p.subjek ? `Terkait "${p.subjek}": ` : "") +
                            `ada yang bisa kami bantu?`,
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-full transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" aria-hidden />
                        Balas WA
                      </a>
                      <select
                        value={p.status}
                        onChange={(e) => void setStatus(p.id, e.target.value)}
                        aria-label="Ubah status pesan"
                        className="text-xs px-2.5 py-2 border border-input rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-suzuki-red/50"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            Tandai: {s}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => void onDelete(p.id)}
                        title="Hapus pesan"
                        className="p-2 text-muted-foreground hover:text-suzuki-red rounded-lg hover:bg-red-50 transition-colors justify-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
