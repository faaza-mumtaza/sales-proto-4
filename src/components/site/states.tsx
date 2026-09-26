"use client";

// Skeleton & state (loading / error / kosong) bersama untuk kartu & section.

import { AlertTriangle, Inbox, SearchX } from "lucide-react";

export function CardSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 pb-0">
        <div className="h-48 rounded-lg bg-muted animate-pulse" />
      </div>
      <div className="p-4 space-y-3">
        <div className="h-5 w-3/4 bg-muted rounded animate-pulse" />
        <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
        <div className="flex items-end justify-between pt-2">
          <div className="space-y-2">
            <div className="h-3 w-20 bg-muted rounded animate-pulse" />
            <div className="h-5 w-28 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-9 w-20 bg-muted rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function ArticleSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="aspect-[5/3] bg-muted animate-pulse" />
      <div className="p-6 space-y-3">
        <div className="h-3 w-24 bg-muted rounded animate-pulse" />
        <div className="h-5 w-full bg-muted rounded animate-pulse" />
        <div className="h-3 w-full bg-muted rounded animate-pulse" />
        <div className="h-3 w-2/3 bg-muted rounded animate-pulse" />
      </div>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="text-center py-12 px-4">
      <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-suzuki-red/10 flex items-center justify-center ring-8 ring-suzuki-red/5">
        <AlertTriangle className="w-7 h-7 text-suzuki-red" aria-hidden />
      </div>
      <p className="text-foreground font-medium mb-1">Terjadi kendala</p>
      <p className="text-muted-foreground text-sm mb-5">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-suzuki-red text-white text-sm font-semibold rounded-lg hover:bg-suzuki-red/90 hover:shadow-lg hover:shadow-suzuki-red/25 transition-all active:scale-95"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M3 12a9 9 0 1 0 3-6.7" strokeLinecap="round" />
            <path d="M3 4v5h5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Coba Lagi
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  message,
  icon = "inbox",
  hint,
}: {
  message: string;
  icon?: "inbox" | "search";
  /** baris kecil penjelas tambahan */
  hint?: string;
}) {
  const Icon = icon === "search" ? SearchX : Inbox;
  return (
    <div className="text-center py-12 px-4">
      <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-muted flex items-center justify-center ring-8 ring-muted/50">
        <Icon className="w-7 h-7 text-muted-foreground" aria-hidden />
      </div>
      <p className="text-foreground font-medium mb-1">Tidak ada data</p>
      <p className="text-muted-foreground text-sm">{message}</p>
      {hint && <p className="text-muted-foreground/70 text-xs mt-2">{hint}</p>}
    </div>
  );
}
