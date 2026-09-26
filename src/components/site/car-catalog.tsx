"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { CarCard } from "./car-card";
import { KATEGORI, type Mobil } from "@/lib/site-utils";

export function CarCatalog({
  cars,
  showSearch = false,
}: {
  cars: Mobil[];
  showSearch?: boolean;
}) {
  const [active, setActive] = useState<string>("all");
  const [query, setQuery] = useState("");

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
    return list;
  }, [active, cars, query]);

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
            {filtered.map((c) => (
              <CarCard key={c.id} car={c} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
