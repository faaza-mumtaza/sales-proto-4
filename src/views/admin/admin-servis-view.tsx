"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Wrench, Phone, Mail, MessageCircle, Trash2, Download, Calendar } from "lucide-react";
import { toast } from "sonner";
import { apiDelete, apiGet, apiPatch } from "@/lib/api";
import { usePageMeta } from "@/lib/router";
import { AdminShell } from "./admin-shell";
import {
  formatDateID,
  formatDateTimeID,
  phoneToWaNumber,
  SERVIS_JENIS_LABEL,
  type BookingServis,
} from "@/lib/site-utils";
import { buildCsv, downloadCsv, fileDatestamp } from "@/lib/csv";
import { DateRangeFilter, EMPTY_RANGE, inRange, isRangeActive, type DateRange } from "@/components/admin/date-range-filter";

const STATUSES = ["PENDING", "CONFIRMED", "DONE", "CANCELLED"] as const;

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-orange-100 text-orange-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  DONE: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-700",
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

function jenisBadgeClass(jenis: string): string {
  switch (jenis) {
    case "servis-berkala":
      return "bg-sky-100 text-sky-800";
    case "ganti-oli":
      return "bg-amber-100 text-amber-800";
    case "tune-up":
      return "bg-violet-100 text-violet-800";
    case "servis-berat":
      return "bg-rose-100 text-rose-800";
    case "cek-kaki-kaki":
      return "bg-teal-100 text-teal-800";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function AdminServisView() {
  usePageMeta("Booking Servis — Admin Suzuki BSB");
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const [jenisFilter, setJenisFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange>(EMPTY_RANGE);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "servis"],
    queryFn: () => apiGet<{ bookings: BookingServis[] }>("/api/admin/service-bookings"),
  });

  async function setStatus(id: string, status: string) {
    try {
      await apiPatch("/api/admin/service-bookings", { id, status });
      await qc.invalidateQueries({ queryKey: ["admin", "servis"] });
      await qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      toast.success(`Booking servis ${STATUS_LABEL[status]?.toLowerCase() ?? status}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal memperbarui status");
    }
  }

  async function onDelete(id: string) {
    if (!window.confirm("Hapus booking servis ini?")) return;
    try {
      await apiDelete("/api/admin/service-bookings", { id });
      await qc.invalidateQueries({ queryKey: ["admin", "servis"] });
      await qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      toast.success("Booking servis dihapus");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menghapus booking servis");
    }
  }

  const allBookings = data?.bookings ?? [];
  const filtered = useMemo(() => {
    let list = filter === "all" ? allBookings : allBookings.filter((b) => b.status === filter);
    if (jenisFilter !== "all") {
      list = list.filter((b) => b.jenis_servis === jenisFilter);
    }
    if (isRangeActive(dateRange)) {
      // Filter pada tanggal jadwal servis (bukan tanggal submit)
      list = list.filter((b) => inRange(b.tanggal_diinginkan, dateRange));
    }
    return list;
  }, [allBookings, filter, jenisFilter, dateRange]);

  function exportCsv() {
    if (filtered.length === 0) {
      toast.info("Tidak ada booking servis untuk diexport sesuai filter saat ini.");
      return;
    }
    const csv = buildCsv(filtered, [
      { header: "Nama", value: (b) => b.nama_lengkap },
      { header: "No. Telepon", value: (b) => b.no_telepon },
      { header: "Email", value: (b) => b.email ?? "" },
      { header: "Mobil", value: (b) => b.mobil_pilihan },
      { header: "Jenis Servis", value: (b) => SERVIS_JENIS_LABEL[b.jenis_servis] ?? b.jenis_servis },
      { header: "Tanggal Servis", value: (b) => formatDateID(b.tanggal_diinginkan) },
      { header: "Waktu", value: (b) => `${b.waktu_diinginkan} WIB` },
      { header: "Keluhan", value: (b) => b.keluhan ?? "" },
      { header: "Status", value: (b) => STATUS_LABEL[b.status] ?? b.status },
      { header: "Dibuat", value: (b) => formatDateTimeID(b.created_at) },
    ]);
    downloadCsv(`booking-servis-suzuki-bsb-${fileDatestamp()}.csv`, csv);
    toast.success(`${filtered.length} booking servis diexport ke CSV.`);
  }

  // Ringkasan jadwal mendatang
  const todayStr = new Date().toISOString().slice(0, 10);
  const upcoming = filtered
    .filter((b) => b.tanggal_diinginkan.slice(0, 10) >= todayStr && b.status !== "CANCELLED")
    .sort((a, b) => (a.tanggal_diinginkan < b.tanggal_diinginkan ? -1 : 1));

  const jenisCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const b of allBookings) {
      counts.set(b.jenis_servis, (counts.get(b.jenis_servis) ?? 0) + 1);
    }
    // Urutkan menurut frekuensi, jenis "lainnya" selalu terakhir
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [allBookings]);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-suzuki-navy">Booking Servis Bengkel</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Kelola jadwal servis dari pengunjung website — konfirmasi, batalkan, atau tandai selesai.
          </p>
        </div>

        {/* Ringkasan jadwal */}
        {upcoming.length > 0 && (
          <div className="bg-gradient-to-r from-suzuki-navy to-suzuki-navy/85 rounded-xl p-5 text-white">
            <h2 className="font-bold mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" aria-hidden />
              Jadwal Servis Mendatang ({upcoming.length})
            </h2>
            <div className="flex gap-6 flex-wrap">
              {upcoming.slice(0, 4).map((b) => (
                <div key={b.id} className="text-sm">
                  <p className="font-semibold">{formatDateID(b.tanggal_diinginkan)}</p>
                  <p className="text-white/70 text-xs">
                    {b.waktu_diinginkan} WIB · {SERVIS_JENIS_LABEL[b.jenis_servis] ?? b.jenis_servis}
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
                filter === "all" ? "bg-suzuki-red text-white font-medium" : "bg-white border border-border text-muted-foreground hover:text-suzuki-navy"
              }`}
            >
              Semua
            </button>
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
                  filter === s ? "bg-suzuki-red text-white font-medium" : "bg-white border border-border text-muted-foreground hover:text-suzuki-navy"
                }`}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
          <button
            onClick={exportCsv}
            className="sm:ml-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border bg-white text-sm text-suzuki-navy font-medium hover:border-suzuki-red/40 hover:text-suzuki-red transition-colors"
          >
            <Download className="w-4 h-4" aria-hidden />
            Export CSV
          </button>
        </div>

        {/* Filter jenis layanan (chips, hanya jenis yang benar-benar ada) */}
        {jenisCounts.length > 1 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Jenis layanan:</span>
            <button
              onClick={() => setJenisFilter("all")}
              className={`px-3 py-1 rounded-full text-xs transition-colors ${
                jenisFilter === "all"
                  ? "bg-suzuki-navy text-white font-medium"
                  : "bg-white border border-border text-muted-foreground hover:text-suzuki-navy"
              }`}
            >
              Semua ({allBookings.length})
            </button>
            {jenisCounts.map(([jenis, count]) => (
              <button
                key={jenis}
                onClick={() => setJenisFilter(jenis)}
                className={`px-3 py-1 rounded-full text-xs transition-colors ${
                  jenisFilter === jenis
                    ? "bg-suzuki-navy text-white font-medium"
                    : "bg-white border border-border text-muted-foreground hover:text-suzuki-navy"
                }`}
              >
                {SERVIS_JENIS_LABEL[jenis] ?? jenis} ({count})
              </button>
            ))}
          </div>
        )}

        {/* Filter rentang tanggal jadwal (memengaruhi daftar & export CSV) */}
        <div className="bg-white rounded-lg border border-border px-3.5 py-2.5">
          <DateRangeFilter
            value={dateRange}
            onChange={setDateRange}
            count={filtered.length}
            total={allBookings.length}
          />
          <p className="text-[11px] text-muted-foreground mt-1.5">
            Rentang tanggal berlaku pada <strong>jadwal servis</strong>, bukan tanggal pemesanan.
          </p>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-xl border border-border p-8 text-center text-muted-foreground text-sm">
            Memuat booking servis…
          </div>
        ) : isError ? (
          <div className="bg-white rounded-xl border border-border p-8 text-center">
            <p className="text-muted-foreground text-sm mb-2">Gagal memuat booking servis.</p>
            <button onClick={() => void refetch()} className="text-suzuki-red underline text-sm">
              Coba lagi
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-border p-10 text-center">
            <Wrench className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" aria-hidden />
            <p className="text-muted-foreground text-sm">
              Belum ada booking servis{filter !== "all" ? " yang cocok dengan filter" : ""} —
              pengunjung bisa memesan lewat halaman Kontak → Booking Servis.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            {/* Tabel (tablet ke atas) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-[900px] w-full text-sm" aria-label="Tabel booking servis">
                <thead className="bg-muted text-left">
                  <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3">Pelanggan</th>
                    <th className="px-4 py-3">Mobil</th>
                    <th className="px-4 py-3">Layanan</th>
                    <th className="px-4 py-3">Jadwal</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((b) => (
                    <tr key={b.id} className="border-t align-top hover:bg-suzuki-light/60 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-suzuki-navy">{b.nama_lengkap}</p>
                        <p className="text-xs text-muted-foreground flex flex-col gap-0.5 mt-1">
                          <span className="inline-flex items-center gap-1">
                            <Phone className="w-3 h-3" aria-hidden />
                            {b.no_telepon}
                          </span>
                          {b.email && (
                            <span className="inline-flex items-center gap-1">
                              <Mail className="w-3 h-3" aria-hidden />
                              {b.email}
                            </span>
                          )}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="inline-flex items-center gap-1.5">
                          <Wrench className="w-3.5 h-3.5 text-muted-foreground" aria-hidden />
                          {b.mobil_pilihan}
                        </p>
                        {b.keluhan && (
                          <p className="text-xs text-muted-foreground mt-1 max-w-[220px] line-clamp-2">
                            “{b.keluhan}”
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${jenisBadgeClass(b.jenis_servis)}`}>
                          {SERVIS_JENIS_LABEL[b.jenis_servis] ?? b.jenis_servis}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="font-medium">{formatDateID(b.tanggal_diinginkan)}</p>
                        <p className="text-xs text-muted-foreground">{b.waktu_diinginkan} WIB</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_STYLE[b.status]}`}>
                          {STATUS_LABEL[b.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="inline-flex flex-col gap-1.5 items-end">
                          <div className="flex gap-1.5">
                            {ACTIONS[b.status].map((a) => (
                              <button
                                key={a.label}
                                onClick={() => void setStatus(b.id, a.next)}
                                className={`px-2.5 py-1.5 text-xs text-white rounded-lg transition-colors ${a.className}`}
                              >
                                {a.label}
                              </button>
                            ))}
                          </div>
                          <div className="flex gap-1.5">
                            <a
                              href={`https://wa.me/${phoneToWaNumber(b.no_telepon)}?text=${encodeURIComponent(
                                `Halo ${b.nama_lengkap}, terkait booking servis ${b.mobil_pilihan} (${SERVIS_JENIS_LABEL[b.jenis_servis] ?? b.jenis_servis}) pada ${formatDateID(b.tanggal_diinginkan)} pukul ${b.waktu_diinginkan} WIB. Mohon konfirmasi jadwal servisnya ya. Terima kasih!`,
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                            >
                              <MessageCircle className="w-3 h-3" aria-hidden /> WA
                            </a>
                            <button
                              onClick={() => void onDelete(b.id)}
                              className="p-1.5 text-muted-foreground hover:text-suzuki-red rounded-lg hover:bg-red-50 transition-colors"
                              title="Hapus booking servis"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Kartu (mobile) */}
            <div className="sm:hidden divide-y">
              {filtered.map((b) => (
                <div key={b.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-suzuki-navy">{b.nama_lengkap}</p>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[b.status]}`}>
                      {STATUS_LABEL[b.status]}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p className="inline-flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5" aria-hidden /> {b.mobil_pilihan}
                    </p>
                    <p>
                      🛠 {SERVIS_JENIS_LABEL[b.jenis_servis] ?? b.jenis_servis}
                    </p>
                    <p>
                      📅 {formatDateID(b.tanggal_diinginkan)} · {b.waktu_diinginkan} WIB
                    </p>
                    <p className="inline-flex items-center gap-1.5">
                      <Phone className="w-3 h-3" aria-hidden /> {b.no_telepon}
                    </p>
                  </div>
                  {b.keluhan && <p className="text-xs text-muted-foreground italic">“{b.keluhan}”</p>}
                  <div className="flex flex-wrap gap-2">
                    {ACTIONS[b.status].map((a) => (
                      <button
                        key={a.label}
                        onClick={() => void setStatus(b.id, a.next)}
                        className={`px-3 py-1.5 text-xs text-white rounded-lg ${a.className}`}
                      >
                        {a.label}
                      </button>
                    ))}
                    <a
                      href={`https://wa.me/${phoneToWaNumber(b.no_telepon)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-green-500 text-white rounded-lg"
                    >
                      <MessageCircle className="w-3 h-3" aria-hidden /> Hubungi
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
