"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, Phone, Mail, MessageCircle, Car, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import { apiDelete, apiGet, apiPatch } from "@/lib/api";
import { usePageMeta } from "@/lib/router";
import { useSelection } from "@/lib/use-selection";
import { BulkActionBar } from "@/components/admin/bulk-action-bar";
import { AdminShell } from "./admin-shell";
import { formatDateID, formatDateTimeID, phoneToWaNumber, type TestDrive } from "@/lib/site-utils";
import { buildCsv, downloadCsv, fileDatestamp } from "@/lib/csv";
import { DateRangeFilter, EMPTY_RANGE, inRange, isRangeActive, type DateRange } from "@/components/admin/date-range-filter";

const STATUSES = ["PENDING", "CONFIRMED", "DONE", "CANCELLED"] as const;

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-orange-100 dark:bg-orange-950/70 dark:text-orange-300 text-orange-800",
  CONFIRMED: "bg-blue-100 dark:bg-blue-950/70 dark:text-blue-300 text-blue-800",
  DONE: "bg-green-100 dark:bg-green-950/70 dark:text-green-300 text-green-800",
  CANCELLED: "bg-red-100 dark:bg-red-950/70 dark:text-red-300 text-red-700",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Menunggu Konfirmasi",
  CONFIRMED: "Terkonfirmasi",
  DONE: "Selesai",
  CANCELLED: "Dibatalkan",
};

const ACTIONS: Record<string, { label: string; next: string; className: string }[]> = {
  PENDING: [
    { label: "Konfirmasi", next: "CONFIRMED", className: "bg-blue-600 hover:bg-blue-700" },
    { label: "Batalkan", next: "CANCELLED", className: "bg-red-500 hover:bg-red-600" },
  ],
  CONFIRMED: [
    { label: "Tandai Selesai", next: "DONE", className: "bg-green-600 hover:bg-green-700" },
    { label: "Batalkan", next: "CANCELLED", className: "bg-red-500 hover:bg-red-600" },
  ],
  DONE: [],
  CANCELLED: [
    { label: "Aktifkan Ulang", next: "PENDING", className: "bg-suzuki-navy hover:bg-suzuki-navy/90" },
  ],
};

export function AdminTestDriveView() {
  usePageMeta("Test Drive — Admin Suzuki BSB");
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange>(EMPTY_RANGE);
  const [bulkBusy, setBulkBusy] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "testdrive"],
    queryFn: () => apiGet<{ bookings: TestDrive[] }>("/api/admin/test-drives"),
  });

  async function setStatus(id: string, status: string) {
    try {
      await apiPatch("/api/admin/test-drives", { id, status });
      await qc.invalidateQueries({ queryKey: ["admin", "testdrive"] });
      await qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      toast.success(`Booking ${STATUS_LABEL[status]?.toLowerCase() ?? status}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal memperbarui status");
    }
  }

  async function onDelete(id: string) {
    if (!window.confirm("Hapus booking test drive ini?")) return;
    try {
      await apiDelete("/api/admin/test-drives", { id });
      await qc.invalidateQueries({ queryKey: ["admin", "testdrive"] });
      await qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      toast.success("Booking dihapus");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menghapus booking");
    }
  }

  const allBookings = data?.bookings ?? [];
  const filtered = useMemo(() => {
    let list = filter === "all" ? allBookings : allBookings.filter((t) => t.status === filter);
    if (isRangeActive(dateRange)) {
      // Filter pada tanggal jadwal test drive (bukan tanggal submit)
      list = list.filter((t) => inRange(t.tanggal_diinginkan, dateRange));
    }
    return list;
  }, [allBookings, filter, dateRange]);

  // Seleksi item untuk aksi massal
  const sel = useSelection(filtered);

  async function bulkStatus(status: string) {
    if (sel.count === 0) return;
    setBulkBusy(true);
    try {
      const res = await apiPatch<{ updated: number }>("/api/admin/test-drives", {
        ids: [...sel.selected],
        status,
      });
      await qc.invalidateQueries({ queryKey: ["admin", "testdrive"] });
      await qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      toast.success(`${res.updated} booking ${STATUS_LABEL[status]?.toLowerCase() ?? status}`);
      sel.clear();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal memperbarui status massal");
    } finally {
      setBulkBusy(false);
    }
  }

  async function bulkDelete() {
    if (sel.count === 0) return;
    if (!window.confirm(`Hapus ${sel.count} booking terpilih? Tindakan ini tidak bisa dibatalkan.`)) return;
    setBulkBusy(true);
    try {
      const res = await apiDelete<{ deleted: number }>("/api/admin/test-drives", {
        ids: [...sel.selected].join(","),
      });
      await qc.invalidateQueries({ queryKey: ["admin", "testdrive"] });
      await qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      toast.success(`${res.deleted} booking dihapus`);
      sel.clear();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menghapus booking secara massal");
    } finally {
      setBulkBusy(false);
    }
  }

  function exportCsv() {
    if (filtered.length === 0) {
      toast.info("Tidak ada booking untuk diexport sesuai filter saat ini.");
      return;
    }
    const csv = buildCsv(filtered, [
      { header: "Nama", value: (t) => t.nama_lengkap },
      { header: "No. Telepon", value: (t) => t.no_telepon },
      { header: "Email", value: (t) => t.email },
      { header: "Mobil", value: (t) => t.mobil_pilihan },
      { header: "Tanggal Test Drive", value: (t) => formatDateID(t.tanggal_diinginkan) },
      { header: "Waktu", value: (t) => `${t.waktu_diinginkan} WIB` },
      { header: "Catatan", value: (t) => t.catatan ?? "" },
      { header: "Status", value: (t) => STATUS_LABEL[t.status] ?? t.status },
      { header: "Dibuat", value: (t) => formatDateTimeID(t.created_at) },
    ]);
    downloadCsv(`booking-test-drive-suzuki-bsb-${fileDatestamp()}.csv`, csv);
    toast.success(`${filtered.length} booking diexport ke CSV.`);
  }

  // Ringkasan jadwal mendatang
  const todayStr = new Date().toISOString().slice(0, 10);
  const upcoming = filtered
    .filter((t) => t.tanggal_diinginkan.slice(0, 10) >= todayStr && t.status !== "CANCELLED")
    .sort((a, b) => (a.tanggal_diinginkan < b.tanggal_diinginkan ? -1 : 1));

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-suzuki-navy dark:text-foreground">Booking Test Drive</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Kelola jadwal test drive dari pengunjung website — konfirmasi, batalkan, atau tandai selesai.
          </p>
        </div>

        {/* Ringkasan jadwal */}
        {upcoming.length > 0 && (
          <div className="bg-gradient-to-r from-suzuki-navy to-suzuki-navy/85 rounded-xl p-5 text-white">
            <h2 className="font-bold mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" aria-hidden />
              Jadwal Mendatang ({upcoming.length})
            </h2>
            <div className="flex gap-6 flex-wrap">
              {upcoming.slice(0, 4).map((t) => (
                <div key={t.id} className="text-sm">
                  <p className="font-semibold">{formatDateID(t.tanggal_diinginkan)}</p>
                  <p className="text-white/70 text-xs">
                    {t.waktu_diinginkan} WIB · {t.mobil_pilihan.split(" ").slice(0, 2).join(" ")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
                filter === "all" ? "bg-suzuki-red text-white font-medium" : "bg-white dark:bg-card border border-border text-muted-foreground hover:text-suzuki-navy dark:hover:text-white"
              }`}
            >
              Semua
            </button>
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
                  filter === s ? "bg-suzuki-red text-white font-medium" : "bg-white dark:bg-card border border-border text-muted-foreground hover:text-suzuki-navy dark:hover:text-white"
                }`}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
          <button
            onClick={exportCsv}
            className="sm:ml-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border bg-white dark:bg-card text-sm text-suzuki-navy dark:text-foreground font-medium hover:border-suzuki-red/40 hover:text-suzuki-red transition-colors"
          >
            <Download className="w-4 h-4" aria-hidden />
            Export CSV
          </button>
        </div>

        {/* Filter rentang tanggal jadwal (memengaruhi daftar & export CSV) */}
        <div className="bg-white dark:bg-card rounded-lg border border-border px-3.5 py-2.5">
          <DateRangeFilter
            value={dateRange}
            onChange={setDateRange}
            count={filtered.length}
            total={allBookings.length}
          />
          <p className="text-[11px] text-muted-foreground mt-1.5">
            Rentang tanggal berlaku pada <strong>jadwal test drive</strong>, bukan tanggal pemesanan.
          </p>
        </div>

        {/* Bilah aksi massal — tampil saat ada item terpilih */}
        <BulkActionBar
          count={sel.count}
          total={filtered.length}
          onSelectAll={sel.selectAll}
          onClear={sel.clear}
          statuses={[
            { value: "CONFIRMED", label: "Konfirmasi" },
            { value: "DONE", label: "Selesai" },
            { value: "CANCELLED", label: "Batalkan" },
            { value: "PENDING", label: "Aktifkan" },
          ]}
          onBulkStatus={(s) => void bulkStatus(s)}
          onBulkDelete={() => void bulkDelete()}
          busy={bulkBusy}
        />

        {isLoading ? (
          <div className="bg-white dark:bg-card rounded-xl border border-border p-8 text-center text-muted-foreground text-sm">
            Memuat booking…
          </div>
        ) : isError ? (
          <div className="bg-white dark:bg-card rounded-xl border border-border p-8 text-center">
            <p className="text-muted-foreground text-sm mb-2">Gagal memuat booking.</p>
            <button onClick={() => void refetch()} className="text-suzuki-red underline text-sm">
              Coba lagi
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-card rounded-xl border border-border p-10 text-center">
            <Calendar className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" aria-hidden />
            <p className="text-muted-foreground text-sm">
              Tidak ada booking yang cocok dengan filter.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-card rounded-xl border border-border overflow-hidden">
            {/* Tabel (tablet ke atas) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-[860px] w-full text-sm" aria-label="Tabel booking test drive">
                <thead className="bg-muted text-left">
                  <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={sel.allSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = sel.someSelected;
                        }}
                        onChange={sel.toggleAll}
                        aria-label="Pilih semua booking"
                        className="w-4 h-4 cursor-pointer"
                      />
                    </th>
                    <th className="px-4 py-3">Pemesan</th>
                    <th className="px-4 py-3">Mobil</th>
                    <th className="px-4 py-3">Jadwal</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => {
                    const isSel = sel.selected.has(t.id);
                    return (
                    <tr
                      key={t.id}
                      className={`border-t align-top hover:bg-suzuki-light/60 transition-colors ${isSel ? "row-selected" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSel}
                          onChange={() => sel.toggle(t.id)}
                          aria-label={`Pilih booking ${t.nama_lengkap}`}
                          className="w-4 h-4 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-suzuki-navy dark:text-foreground">{t.nama_lengkap}</p>
                        <p className="text-xs text-muted-foreground flex flex-col gap-0.5 mt-1">
                          <span className="inline-flex items-center gap-1">
                            <Phone className="w-3 h-3" aria-hidden />
                            {t.no_telepon}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Mail className="w-3 h-3" aria-hidden />
                            {t.email}
                          </span>
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="inline-flex items-center gap-1.5">
                          <Car className="w-3.5 h-3.5 text-muted-foreground" aria-hidden />
                          {t.mobil_pilihan}
                        </p>
                        {t.catatan && (
                          <p className="text-xs text-muted-foreground mt-1 max-w-[220px] line-clamp-2">
                            “{t.catatan}”
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="font-medium">{formatDateID(t.tanggal_diinginkan)}</p>
                        <p className="text-xs text-muted-foreground">{t.waktu_diinginkan} WIB</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_STYLE[t.status]}`}>
                          {STATUS_LABEL[t.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="inline-flex flex-col gap-1.5 items-end">
                          <div className="flex gap-1.5">
                            {ACTIONS[t.status].map((a) => (
                              <button
                                key={a.label}
                                onClick={() => void setStatus(t.id, a.next)}
                                className={`px-2.5 py-1.5 text-xs text-white rounded-lg transition-colors ${a.className}`}
                              >
                                {a.label}
                              </button>
                            ))}
                          </div>
                          <div className="flex gap-1.5">
                            <a
                              href={`https://wa.me/${phoneToWaNumber(t.no_telepon)}?text=${encodeURIComponent(
                                `Halo ${t.nama_lengkap}, terkait booking test drive ${t.mobil_pilihan} pada ${formatDateID(t.tanggal_diinginkan)} pukul ${t.waktu_diinginkan} WIB. Mohon konfirmasi jadwalnya ya. Terima kasih!`,
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                            >
                              <MessageCircle className="w-3 h-3" aria-hidden /> WA
                            </a>
                            <button
                              onClick={() => void onDelete(t.id)}
                              className="p-1.5 text-muted-foreground hover:text-suzuki-red rounded-lg hover:bg-red-50 dark:hover:bg-red-950/60 transition-colors"
                              title="Hapus booking"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                  })}
                </tbody>
              </table>
            </div>

            {/* Kartu (mobile) */}
            <div className="sm:hidden divide-y">
              {filtered.map((t) => {
                const isSel = sel.selected.has(t.id);
                return (
                <div key={t.id} className={`p-4 space-y-3 ${isSel ? "row-selected" : ""}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSel}
                        onChange={() => sel.toggle(t.id)}
                        aria-label={`Pilih booking ${t.nama_lengkap}`}
                        className="w-4 h-4 shrink-0 cursor-pointer"
                      />
                      <p className="font-medium text-suzuki-navy dark:text-foreground truncate">{t.nama_lengkap}</p>
                    </div>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_STYLE[t.status]}`}>
                      {STATUS_LABEL[t.status]}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p className="inline-flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5" aria-hidden /> {t.mobil_pilihan}
                    </p>
                    <p>
                      📅 {formatDateID(t.tanggal_diinginkan)} · {t.waktu_diinginkan} WIB
                    </p>
                    <p className="inline-flex items-center gap-1.5">
                      <Phone className="w-3 h-3" aria-hidden /> {t.no_telepon}
                    </p>
                  </div>
                  {t.catatan && <p className="text-xs text-muted-foreground italic">“{t.catatan}”</p>}
                  <div className="flex flex-wrap gap-2">
                    {ACTIONS[t.status].map((a) => (
                      <button
                        key={a.label}
                        onClick={() => void setStatus(t.id, a.next)}
                        className={`px-3 py-1.5 text-xs text-white rounded-lg ${a.className}`}
                      >
                        {a.label}
                      </button>
                    ))}
                    <a
                      href={`https://wa.me/${phoneToWaNumber(t.no_telepon)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-green-500 text-white rounded-lg"
                    >
                      <MessageCircle className="w-3 h-3" aria-hidden /> Hubungi
                    </a>
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
