"use client";

import { ListChecks, Trash2, X } from "lucide-react";

export interface BulkStatusOption {
  value: string;
  label: string;
}

interface BulkActionBarProps {
  /** Jumlah item yang sedang dipilih. */
  count: number;
  /** Total item pada daftar terfilter saat ini. */
  total: number;
  onSelectAll: () => void;
  onClear: () => void;
  /** Opsi status massal — kosongkan bila entitas tidak punya status. */
  statuses: BulkStatusOption[];
  onBulkStatus: (status: string) => void;
  onBulkDelete: () => void;
  /** Nonaktifkan semua tombol saat request berjalan. */
  busy?: boolean;
}

/**
 * Bilah aksi massal (sticky) — tampil di atas daftar ketika ada item
 * terpilih: pilih semua / kosongkan, ubah status massal, hapus massal.
 */
export function BulkActionBar({
  count,
  total,
  onSelectAll,
  onClear,
  statuses,
  onBulkStatus,
  onBulkDelete,
  busy = false,
}: BulkActionBarProps) {
  if (count === 0) return null;

  return (
    <div
      className="sticky top-4 z-30 no-print"
      role="toolbar"
      aria-label="Aksi massal item terpilih"
    >
      <div className="rounded-xl bg-suzuki-navy/95 backdrop-blur border border-suzuki-navy shadow-xl px-4 py-3 text-white flex flex-wrap items-center gap-x-3 gap-y-2.5">
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap">
          <ListChecks className="w-4 h-4 text-suzuki-red" aria-hidden />
          {count} dipilih
        </span>
        <span className="text-white/40" aria-hidden>
          /
        </span>
        <button
          type="button"
          onClick={onSelectAll}
          disabled={busy}
          className="text-xs text-white/80 hover:text-white underline underline-offset-2 decoration-white/30 disabled:opacity-50"
        >
          Pilih semua ({total})
        </button>
        <button
          type="button"
          onClick={onClear}
          disabled={busy}
          className="inline-flex items-center gap-1 text-xs text-white/80 hover:text-white disabled:opacity-50"
        >
          <X className="w-3.5 h-3.5" aria-hidden />
          Kosongkan
        </button>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {statuses.length > 0 && (
            <span className="text-[11px] uppercase tracking-wide text-white/50 mr-0.5 hidden sm:inline">
              Tandai:
            </span>
          )}
          {statuses.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => onBulkStatus(s.value)}
              disabled={busy}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/20 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {s.label}
            </button>
          ))}
          <button
            type="button"
            onClick={onBulkDelete}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-suzuki-red hover:bg-red-600 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden />
            Hapus ({count})
          </button>
        </div>
      </div>
    </div>
  );
}
