"use client";

// Filter rentang tanggal reusable untuk halaman admin (Pesan Masuk, Test Drive).
// Bekerja client-side pada field created_at (ISO string) + preset cepat.

import { CalendarRange, X } from "lucide-react";

export interface DateRange {
  from: string; // "" | YYYY-MM-DD
  to: string; // "" | YYYY-MM-DD
}

export const EMPTY_RANGE: DateRange = { from: "", to: "" };

/** Apakah rentang aktif (minimal satu sisi terisi)? */
export function isRangeActive(r: DateRange): boolean {
  return r.from !== "" || r.to !== "";
}

/** Cek apakah ISO datetime berada dalam rentang (inklusif, toleran satu sisi). */
export function inRange(iso: string, r: DateRange): boolean {
  if (!isRangeActive(r)) return true;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  if (r.from) {
    const from = new Date(r.from + "T00:00:00").getTime();
    if (t < from) return false;
  }
  if (r.to) {
    const to = new Date(r.to + "T23:59:59.999").getTime();
    if (t > to) return false;
  }
  return true;
}

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

const PRESETS = [
  { label: "7 hari", from: () => isoDaysAgo(7) },
  { label: "30 hari", from: () => isoDaysAgo(30) },
  { label: "90 hari", from: () => isoDaysAgo(90) },
];

export function DateRangeFilter({
  value,
  onChange,
  count,
  total,
}: {
  value: DateRange;
  onChange: (r: DateRange) => void;
  /** jumlah item setelah seluruh filter (tanggal + lainnya) */
  count?: number;
  /** jumlah item sebelum filter tanggal */
  total?: number;
}) {
  const aktif = isRangeActive(value);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <CalendarRange className="w-4 h-4 shrink-0" aria-hidden />
        <span className="text-xs font-medium">Periode</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={value.from}
          max={value.to || undefined}
          onChange={(e) => onChange({ ...value, from: e.target.value })}
          aria-label="Tanggal mulai"
          className="px-2.5 py-1.5 border rounded-lg text-xs bg-white dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-suzuki-red/50"
        />
        <span className="text-muted-foreground text-xs" aria-hidden>
          —
        </span>
        <input
          type="date"
          value={value.to}
          min={value.from || undefined}
          onChange={(e) => onChange({ ...value, to: e.target.value })}
          aria-label="Tanggal akhir"
          className="px-2.5 py-1.5 border rounded-lg text-xs bg-white dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-suzuki-red/50"
        />
      </div>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Preset rentang tanggal">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => onChange({ from: p.from(), to: "" })}
            className="px-2.5 py-1 rounded-full text-xs border border-border bg-white dark:bg-white/5 text-muted-foreground hover:text-suzuki-navy dark:hover:text-white hover:border-suzuki-navy/40 transition-colors active:scale-95"
          >
            {p.label}
          </button>
        ))}
        {aktif && (
          <button
            onClick={() => onChange(EMPTY_RANGE)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border border-suzuki-red/30 bg-suzuki-red/5 text-suzuki-red hover:bg-suzuki-red/10 transition-colors active:scale-95"
            aria-label="Bersihkan filter tanggal"
          >
            <X className="w-3 h-3" aria-hidden />
            Semua
          </button>
        )}
      </div>
      {aktif && count != null && total != null && (
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {count} dari {total} entri
        </p>
      )}
    </div>
  );
}
