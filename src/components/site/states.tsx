"use client";

// Skeleton loading bersama untuk kartu & section.

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
      <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-suzuki-red/10 flex items-center justify-center">
        <span className="text-suzuki-red text-2xl" aria-hidden>
          !
        </span>
      </div>
      <p className="text-muted-foreground mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-5 py-2.5 bg-suzuki-red text-white text-sm font-semibold rounded-lg hover:bg-suzuki-red/90 transition-colors"
        >
          Coba Lagi
        </button>
      )}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12 px-4">
      <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
        <span className="text-muted-foreground text-2xl" aria-hidden>
          ∅
        </span>
      </div>
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}
