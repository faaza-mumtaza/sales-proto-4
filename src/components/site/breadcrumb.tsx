"use client";

// Breadcrumb navigasi untuk halaman detail — memudahkan pengunjung kembali
// ke daftar tanpa harus scroll ke menu atas.

import { ChevronRight, Home } from "lucide-react";
import { Link } from "@/lib/router";

export interface Crumb {
  label: string;
  to?: string;
}

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <li>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 hover:text-suzuki-red transition-colors"
          >
            <Home className="w-3.5 h-3.5" aria-hidden />
            <span className="sr-only sm:not-sr-only">Beranda</span>
          </Link>
        </li>
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={item.label} className="flex items-center gap-1.5">
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" aria-hidden />
              {item.to && !last ? (
                <Link to={item.to} className="hover:text-suzuki-red transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span
                  className={last ? "text-suzuki-navy font-medium" : undefined}
                  aria-current={last ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
