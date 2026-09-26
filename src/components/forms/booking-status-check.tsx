"use client";

import { useState } from "react";
import { Car, Wrench, Search, Loader2, CalendarClock, Info } from "lucide-react";
import { toast } from "sonner";
import { apiGet } from "@/lib/api";
import { formatDateID, formatRelativeID, WHATSAPP_NUMBER } from "@/lib/site-utils";

interface BookingItem {
  jenis: "TEST_DRIVE" | "SERVIS";
  nama: string;
  detail: string;
  tanggal: string;
  waktu: string;
  status: string;
  created_at: string;
}

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-orange-100 text-orange-800 border-orange-200",
  CONFIRMED: "bg-blue-100 text-blue-800 border-blue-200",
  DONE: "bg-green-100 text-green-800 border-green-200",
  CANCELLED: "bg-red-100 text-red-700 border-red-200",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Menunggu Konfirmasi",
  CONFIRMED: "Terkonfirmasi",
  DONE: "Selesai",
  CANCELLED: "Dibatalkan",
};

/** Urutan langkah status untuk indikator mini. */
const STEPS = ["PENDING", "CONFIRMED", "DONE"] as const;
const STEP_LABEL: Record<string, string> = {
  PENDING: "Menunggu",
  CONFIRMED: "Dikonfirmasi",
  DONE: "Selesai",
};

function StatusSteps({ status }: { status: string }) {
  if (status === "CANCELLED") {
    return (
      <p className="text-xs text-red-600 font-medium">
        Booking ini dibatalkan. Silakan ajukan ulang bila masih berminat.
      </p>
    );
  }
  const activeIdx = STEPS.indexOf(status as (typeof STEPS)[number]);
  return (
    <div className="flex items-center gap-0" aria-label={`Status: ${STATUS_LABEL[status]}`}>
      {STEPS.map((s, i) => {
        const reached = i <= activeIdx;
        const isCurrent = i === activeIdx;
        return (
          <div key={s} className="flex items-center">
            {i > 0 && (
              <span
                className={`w-6 sm:w-8 h-0.5 ${i <= activeIdx ? "bg-suzuki-red" : "bg-gray-200"}`}
                aria-hidden
              />
            )}
            <span className="flex flex-col items-center gap-1">
              <span
                className={`w-3 h-3 rounded-full transition-colors ${
                  reached ? "bg-suzuki-red" : "bg-gray-200"
                } ${isCurrent ? "ring-4 ring-suzuki-red/20" : ""}`}
                aria-hidden
              />
              <span
                className={`text-[10px] font-medium whitespace-nowrap ${
                  isCurrent ? "text-suzuki-red" : reached ? "text-muted-foreground" : "text-gray-300"
                }`}
              >
                {STEP_LABEL[s]}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function BookingStatusCheck() {
  const [phone, setPhone] = useState("");
  const [items, setItems] = useState<BookingItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = phone.trim();
    if (!/^(\+62|62|0)[0-9]{8,13}$/.test(trimmed)) {
      toast.error("Nomor telepon tidak valid (contoh: 08123456789).");
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const res = await apiGet<{ bookings: BookingItem[] }>(
        `/api/booking-status?phone=${encodeURIComponent(trimmed)}`,
      );
      setItems(res.bookings);
    } catch (err) {
      setItems([]);
      toast.error(err instanceof Error ? err.message : "Gagal memuat status booking.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-suzuki-navy mb-2">Lacak Status Booking</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Masukkan nomor telepon yang Anda gunakan saat mengajukan test drive atau booking servis.
      </p>

      <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2.5 mb-6">
        <div className="relative flex-1">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
            aria-hidden
          />
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="08123456789"
            aria-label="Nomor telepon Anda"
            className="w-full pl-10 pr-3 py-3 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-suzuki-red/50 focus:border-suzuki-red/50"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-suzuki-red hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
              Mencari…
            </>
          ) : (
            <>
              <Search className="w-4 h-4" aria-hidden />
              Lacak Status
            </>
          )}
        </button>
      </form>

      {loading && (
        <div className="space-y-3" aria-live="polite">
          {[0, 1].map((i) => (
            <div key={i} className="bg-gray-50 border border-border rounded-xl h-28 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && items !== null && items.length === 0 && (
        <div className="bg-gray-50 border border-border rounded-xl p-8 text-center">
          <CalendarClock className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" aria-hidden />
          <p className="text-sm text-muted-foreground mb-1 font-medium text-foreground">
            Tidak ditemukan booking aktif untuk nomor ini.
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Pastikan nomor sesuai dengan yang digunakan saat mengisi form (data 90 hari terakhir).
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <a
              href="#/kontak?form=test-drive"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-suzuki-navy hover:bg-suzuki-navy/90 text-white transition-colors"
            >
              Ajukan Test Drive
            </a>
            <a
              href="#/kontak?form=servis"
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-border bg-white hover:border-suzuki-red/40 hover:text-suzuki-red text-suzuki-navy transition-colors"
            >
              Booking Servis
            </a>
          </div>
        </div>
      )}

      {!loading && items !== null && items.length > 0 && (
        <>
          <p className="text-xs text-muted-foreground mb-3" aria-live="polite">
            Ditemukan {items.length} booking untuk nomor ini (90 hari terakhir):
          </p>
          <div className="space-y-3">
            {items.map((b) => (
              <div
                key={`${b.jenis}-${b.tanggal}-${b.created_at}`}
                className="border border-border rounded-xl p-4 hover:shadow-md transition-shadow bg-white"
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      b.jenis === "TEST_DRIVE" ? "bg-suzuki-red/10" : "bg-teal-100"
                    }`}
                  >
                    {b.jenis === "TEST_DRIVE" ? (
                      <Car className="w-5 h-5 text-suzuki-red" aria-hidden />
                    ) : (
                      <Wrench className="w-5 h-5 text-teal-700" aria-hidden />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-suzuki-navy text-sm">
                        {b.jenis === "TEST_DRIVE" ? "Test Drive" : "Servis Bengkel"}
                      </h3>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-medium border ${STATUS_STYLE[b.status]}`}
                      >
                        {STATUS_LABEL[b.status]}
                      </span>
                    </div>
                    <p className="text-sm text-foreground truncate mb-1">{b.detail}</p>
                    <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
                      <CalendarClock className="w-3.5 h-3.5" aria-hidden />
                      {formatDateID(b.tanggal)} · {b.waktu} WIB
                    </p>
                    <StatusSteps status={b.status} />
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground mt-3 pt-2.5 border-t border-border/60">
                  <span className="inline-flex items-center gap-1">
                    <Info className="w-3 h-3" aria-hidden />
                    Atas nama {b.nama} · diajukan {formatRelativeID(b.created_at)}
                  </span>
                </p>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-4 text-center">
            Ada pertanyaan? Hubungi kami via{" "}
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-suzuki-red hover:underline font-medium"
            >
              WhatsApp
            </a>
            .
          </p>
        </>
      )}
    </div>
  );
}
