"use client";

import { useMemo, useState } from "react";
import { Search, ArrowUpDown } from "lucide-react";
import { CarCard } from "./car-card";
import { Reveal } from "./reveal";
import { KATEGORI, type Mobil } from "@/lib/site-utils";

type SortMode = "default" | "price-asc" | "price-desc" | "name-asc";

const SORT_OPTIONS: Array<{ id: SortMode; label: string }> = [
  { id: "default", label: "Urutan Standar" },
  { id: "price-asc", label: "Harga Terendah" },
  { id: "price-desc", label: "Harga Tertinggi" },
  { id: "name-asc", label: "Nama (A–Z)" },
];

export function CarCatalog({
  cars,
  showSearch = false,
}: {
  cars: Mobil[];
  showSearch?: boolean;
}) {
  const [active, setActive] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("default");

  const filtered = useMemo(() => {
    let list = active === "all" ? cars : cars.filter((c) => c.kategori === active);
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.nama.toLowerCase().includes(q) ||
          c.kategori_label.toLowerCase().includes(q),
      );
    }
    switch (sort) {
      case "price-asc":
        list = [...list].sort((a, b) => (a.harga_mulai ?? Infinity) - (b.harga_mulai ?? Infinity));
        break;
      case "price-desc":
        list = [...list].sort((a, b) => (b.harga_mulai ?? -1) - (a.harga_mulai ?? -1));
        break;
      case "name-asc":
        list = [...list].sort((a, b) => a.nama.localeCompare(b.nama, "id"));
        break;
      default:
        // urutan sudah sesuai field `urutan` dari API
        break;
    }
    return list;
  }, [active, cars, query, sort]);

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-5 mb-10">
          {showSearch && (
            <div className="relative w-full max-w-md">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                aria-hidden
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari mobil… (mis. Ertiga, SUV)"
                aria-label="Cari mobil"
                className="w-full pl-11 pr-4 py-3 rounded-full border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-suzuki-red/50"
              />
            </div>
          )}
          <div
            className="inline-flex flex-wrap justify-center items-center p-1 bg-muted rounded-full"
            role="tablist"
            aria-label="Filter kategori"
          >
            {KATEGORI.map((cat) => (
              <button
                key={cat.id}
                role="tab"
                aria-selected={active === cat.id}
                onClick={() => setActive(cat.id)}
                className={`px-5 sm:px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
                  active === cat.id
                    ? "bg-suzuki-red text-white shadow-sm"
                    : "text-muted-foreground hover:text-suzuki-navy"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <ArrowUpDown className="w-4 h-4" aria-hidden />
              <span className="sr-only sm:not-sr-only">Urutkan:</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortMode)}
                aria-label="Urutkan katalog"
                className="px-3 py-2 rounded-full border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-suzuki-red/50"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <span className="text-sm text-muted-foreground" aria-live="polite">
              {filtered.length} mobil
            </span>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {query ? (
                <>Tidak ada mobil yang cocok dengan pencarian &quot;{query}&quot;.</>
              ) : (
                "Belum ada mobil di kategori ini."
              )}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((c, i) => (
              <Reveal key={c.id} delay={Math.min(i, 7) * 70}>
                <CarCard car={c} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
