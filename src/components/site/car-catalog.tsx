"use client";

import { useMemo, useState } from "react";
import { Search, ArrowUpDown, SlidersHorizontal, RotateCcw, Fuel, Settings, ChevronDown } from "lucide-react";
import { CarCard } from "./car-card";
import { Reveal } from "./reveal";
import { KATEGORI, formatPriceShort, type Mobil } from "@/lib/site-utils";

type SortMode = "default" | "price-asc" | "price-desc" | "name-asc";

/** Jumlah kartu per “halaman” (8 = 2 baris penuh di grid xl:4-kolom / lg:3-kolom+1). */
const PAGE_SIZE = 8;

const SORT_OPTIONS: Array<{ id: SortMode; label: string }> = [
  { id: "default", label: "Urutan Standar" },
  { id: "price-asc", label: "Harga Terendah" },
  { id: "price-desc", label: "Harga Tertinggi" },
  { id: "name-asc", label: "Nama (A–Z)" },
];

/** Rentang budget (juta rupiah) — batas atas Infinity utk "di atasnya". */
const BUDGET_RANGES: Array<{ id: string; label: string; min: number; max: number }> = [
  { id: "all", label: "Semua Budget", min: 0, max: Infinity },
  { id: "under-150", label: "Di bawah Rp 150 Jt", min: 0, max: 150 },
  { id: "150-250", label: "Rp 150 – 250 Jt", min: 150, max: 250 },
  { id: "250-400", label: "Rp 250 – 400 Jt", min: 250, max: 400 },
  { id: "above-400", label: "Di atas Rp 400 Jt", min: 400, max: Infinity },
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
  const [budget, setBudget] = useState<string>("all");
  const [transmission, setTransmission] = useState<string>("all");
  const [fuel, setFuel] = useState<string>("all");
  const [visible, setVisible] = useState<number>(PAGE_SIZE);

  // Opsi dinamis dari data: hanya tampilkan filter yang bermakna (≥2 variasi)
  const transmissionOptions = useMemo(() => {
    const set = new Set(
      cars.map((c) => c.transmission?.trim()).filter((t): t is string => !!t),
    );
    return [...set];
  }, [cars]);
  const fuelOptions = useMemo(() => {
    const set = new Set(
      cars.map((c) => c.fuel?.trim()).filter((f): f is string => !!f),
    );
    return [...set];
  }, [cars]);

  const hasBudgetData = cars.some((c) => c.harga_mulai != null);
  const showTransmission = transmissionOptions.length >= 2;
  const showFuel = fuelOptions.length >= 2;

  const activeAdvanced =
    budget !== "all" || transmission !== "all" || fuel !== "all";

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
    if (budget !== "all") {
      const range = BUDGET_RANGES.find((b) => b.id === budget);
      if (range) {
        list = list.filter((c) => {
          if (c.harga_mulai == null) return false;
          const juta = c.harga_mulai / 1_000_000;
          return juta >= range.min && juta < range.max;
        });
      }
    }
    if (transmission !== "all") {
      list = list.filter((c) => c.transmission === transmission);
    }
    if (fuel !== "all") {
      list = list.filter((c) => c.fuel === fuel);
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
  }, [active, cars, query, sort, budget, transmission, fuel]);

  // Reset tampilan saat filter/sort berubah — pola "set state saat render"
  // (resmi dari dokumen React, lolos rule set-state-in-effect): bila key
  // filter berubah, visible dikembalikan ke satu halaman sebelum commit.
  const filterKey = `${active}|${query}|${sort}|${budget}|${transmission}|${fuel}|${cars.length}`;
  const [prevKey, setPrevKey] = useState(filterKey);
  if (filterKey !== prevKey) {
    setPrevKey(filterKey);
    setVisible(PAGE_SIZE);
  }

  const shown = useMemo(() => filtered.slice(0, visible), [filtered, visible]);
  const remaining = filtered.length - shown.length;

  function resetAdvanced() {
    setBudget("all");
    setTransmission("all");
    setFuel("all");
  }

  const chipCls = (selected: boolean) =>
    `px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border ${
      selected
        ? "bg-suzuki-navy text-white border-suzuki-navy shadow-sm"
        : "bg-background text-muted-foreground border-border hover:border-suzuki-navy/40 hover:text-suzuki-navy"
    }`;

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

          {/* Filter lanjutan */}
          {(showSearch || hasBudgetData || showTransmission || showFuel) && (
            <div className="w-full max-w-3xl rounded-2xl border border-border bg-card px-4 py-3.5 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <SlidersHorizontal className="w-4 h-4 text-suzuki-red shrink-0" aria-hidden />
                <span className="font-semibold text-suzuki-navy">Filter Lanjutan</span>
                {activeAdvanced && (
                  <button
                    onClick={resetAdvanced}
                    className="ml-auto inline-flex items-center gap-1 text-xs text-suzuki-red font-medium hover:underline"
                  >
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden />
                    Reset
                  </button>
                )}
              </div>

              <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-center">
                {hasBudgetData ? (
                  <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="text-xs uppercase tracking-wide font-medium">Budget</span>
                    <select
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      aria-label="Filter rentang harga"
                      className="flex-1 sm:w-auto px-3 py-2 rounded-full border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-suzuki-red/50"
                    >
                      {BUDGET_RANGES.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.label}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <span />
                )}
                <label className="inline-flex items-center gap-2 text-sm text-muted-foreground sm:justify-self-end">
                  <ArrowUpDown className="w-4 h-4" aria-hidden />
                  <span className="sr-only sm:not-sr-only text-xs uppercase tracking-wide font-medium">Urutkan</span>
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
              </div>

              {(showTransmission || showFuel) && (
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                  {showTransmission && (
                    <div className="flex flex-wrap items-center gap-2">
                      <Settings className="w-3.5 h-3.5 text-muted-foreground shrink-0" aria-hidden />
                      {["all", ...transmissionOptions].map((t) => (
                        <button
                          key={t}
                          onClick={() => setTransmission(t)}
                          aria-pressed={transmission === t}
                          className={chipCls(transmission === t)}
                        >
                          {t === "all" ? "Semua Transmisi" : t}
                        </button>
                      ))}
                    </div>
                  )}
                  {showFuel && (
                    <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                      <Fuel className="w-3.5 h-3.5 text-muted-foreground shrink-0" aria-hidden />
                      {["all", ...fuelOptions].map((f) => (
                        <button
                          key={f}
                          onClick={() => setFuel(f)}
                          aria-pressed={fuel === f}
                          className={chipCls(fuel === f)}
                        >
                          {f === "all" ? "Semua Bahan Bakar" : f}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-sm text-muted-foreground" aria-live="polite">
              Menampilkan <strong className="text-suzuki-navy">{filtered.length}</strong> dari{" "}
              {cars.length} mobil
            </span>
            {filtered.length > 0 && filtered[0]?.harga_mulai != null && sort === "price-asc" && (
              <span className="text-xs text-muted-foreground">
                (termurah: {formatPriceShort(filtered[0].harga_mulai)})
              </span>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {query || activeAdvanced ? (
                <>
                  Tidak ada mobil yang cocok dengan filter Anda.
                  <button
                    onClick={() => {
                      setQuery("");
                      resetAdvanced();
                      setActive("all");
                    }}
                    className="text-suzuki-red underline ml-1"
                  >
                    Reset semua filter
                  </button>
                </>
              ) : (
                "Belum ada mobil di kategori ini."
              )}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {shown.map((c, i) => (
                <Reveal key={c.id} delay={Math.min(i % PAGE_SIZE, 7) * 70}>
                  <CarCard car={c} />
                </Reveal>
              ))}
            </div>

            {remaining > 0 && (
              <div className="flex flex-col items-center gap-2.5 mt-10">
                <button
                  onClick={() => setVisible((v) => v + PAGE_SIZE)}
                  className="group inline-flex items-center gap-2 px-8 py-3 rounded-full bg-suzuki-navy text-white text-sm font-semibold hover:bg-suzuki-navy/90 transition-all hover:shadow-lg hover:shadow-suzuki-navy/20 hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
                >
                  Tampilkan {Math.min(PAGE_SIZE, remaining)} Mobil Lagi
                  <ChevronDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" aria-hidden />
                </button>
                <p className="text-xs text-muted-foreground" aria-live="polite">
                  Menampilkan <strong className="text-suzuki-navy">{shown.length}</strong> dari{" "}
                  {filtered.length} mobil
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
