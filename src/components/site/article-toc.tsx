"use client";

/**
 * Daftar isi (TOC) artikel — dibangun dari heading h2/h3 konten artikel.
 * Varian "sidebar": kolom sticky di samping artikel (xl+). Varian "inline":
 * collapsible <details> untuk layar kecil. Item aktif ditandai via
 * IntersectionObserver (dikelola di view pemanggil).
 */

import { ListTree, ChevronRight } from "lucide-react";

export interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

export function ArticleToc({
  items,
  activeId,
  variant,
}: {
  items: TocItem[];
  activeId: string | null;
  variant: "sidebar" | "inline";
}) {
  if (items.length === 0) return null;

  const list = (
    <ol className="space-y-0.5" role="list">
      {items.map((item, i) => {
        const isActive = item.id === activeId;
        return (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              onClick={(e) => {
                // Cegah hash masuk URL (TOC bukan navigasi halaman SPA)
                e.preventDefault();
                const el = document.getElementById(item.id);
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              aria-current={isActive ? "location" : undefined}
              className={`toc-link group flex items-start gap-2 text-sm leading-snug py-1.5 pr-2 border-l-2 transition-colors ${
                item.level === 3 ? "pl-6" : "pl-3"
              } ${
                isActive
                  ? "border-suzuki-red text-suzuki-red font-semibold bg-suzuki-red/5 dark:bg-suzuki-red/15"
                  : "border-border text-muted-foreground hover:text-suzuki-navy dark:hover:text-white hover:border-suzuki-navy/40 dark:hover:border-white/40"
              }`}
            >
              <span
                className={`text-[10px] tabular-nums mt-0.5 shrink-0 ${
                  isActive ? "text-suzuki-red" : "text-muted-foreground/70"
                }`}
                aria-hidden
              >
                {item.level === 2 ? String(i + 1) : "·"}
              </span>
              <span className="min-w-0">{item.text}</span>
            </a>
          </li>
        );
      })}
    </ol>
  );

  if (variant === "sidebar") {
    return (
      <nav aria-label="Daftar isi artikel" className="toc-sidebar">
        <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-suzuki-navy dark:text-foreground mb-3">
          <ListTree className="w-3.5 h-3.5 text-suzuki-red" aria-hidden />
          Daftar Isi
        </p>
        <div className="scroll-thin max-h-[70vh] overflow-y-auto pr-1">{list}</div>
      </nav>
    );
  }

  return (
    <details className="toc-inline group/details rounded-xl border border-border bg-card overflow-hidden">
      <summary className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-suzuki-navy dark:text-foreground cursor-pointer select-none list-none hover:bg-muted/50 transition-colors">
        <ListTree className="w-4 h-4 text-suzuki-red shrink-0" aria-hidden />
        Daftar Isi ({items.length} bagian)
        <ChevronRight
          className="w-4 h-4 ml-auto shrink-0 transition-transform group-open/details:rotate-90"
          aria-hidden
        />
      </summary>
      <div className="px-3 pb-3 pt-1 border-t border-border/60">{list}</div>
    </details>
  );
}
