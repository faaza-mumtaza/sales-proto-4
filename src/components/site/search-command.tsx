"use client";

/**
 * Pencarian global (command palette) — Ctrl/Cmd+K dari mana pun di website
 * publik. Mencari mobil (nama/kategori) + artikel (judul/ringkasan/tag)
 * melalui API publik /api/search, plus tautan cepat antar halaman.
 *
 * shouldFilter={false}: penyaringan dilakukan penuh di server — hasil
 * relevan (termasuk kecocokan ringkasan/tag) tidak boleh tersaring ulang
 * oleh cmdk di sisi klien.
 */

import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Command as CommandPrimitive } from "cmdk";
import {
  Command,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Car,
  Newspaper,
  Home,
  LayoutGrid,
  Tag,
  Info,
  Phone,
  MoveRight,
  Loader2,
  Search,
} from "lucide-react";
import { navigate } from "@/lib/router";
import { apiGet } from "@/lib/api";
import { formatPriceShort } from "@/lib/site-utils";

interface SearchCarResult {
  nama: string;
  slug: string;
  kategori_label: string;
  harga_label: string | null;
  harga_mulai: number | null;
  gambar_utama: string | null;
}

interface SearchArticleResult {
  judul: string;
  slug: string;
  tipe: string;
  ringkasan: string | null;
}

interface SearchResponse {
  ok: boolean;
  cars: SearchCarResult[];
  articles: SearchArticleResult[];
}

const QUICK_LINKS = [
  { to: "/", label: "Beranda", icon: Home, hint: "Halaman utama" },
  { to: "/mobil", label: "Katalog Mobil", icon: LayoutGrid, hint: "Semua model Suzuki" },
  { to: "/promo", label: "Promo Terbaru", icon: Tag, hint: "Penawaran bulan ini" },
  { to: "/artikel", label: "Artikel & Berita", icon: Newspaper, hint: "Info terbaru dealer" },
  { to: "/tentang-kami", label: "Tentang Kami", icon: Info, hint: "Profil dealer BSB" },
  { to: "/kontak", label: "Kontak & Test Drive", icon: Phone, hint: "Hubungi sales kami" },
] as const;

const TIPE_BADGE: Record<string, string> = {
  PROMO: "bg-suzuki-red/10 text-suzuki-red",
  BERITA: "bg-suzuki-navy/10 dark:bg-white/5 text-suzuki-navy dark:text-foreground",
  KEGIATAN: "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300",
};

export function SearchCommand({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  // Bersihkan input saat dialog DIBUKA kembali — pola "set state saat render"
  // (resmi dari dokumen React, lolos rule set-state-in-effect): state query
  // lama dibuang sebelum dialog ditampilkan, tanpa setState di effect.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setQuery("");
      setDebounced("");
    }
  }

  // Debounce input agar tidak membanjiri API saat mengetik
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 280);
    return () => clearTimeout(t);
  }, [query]);

  const { data, isFetching } = useQuery({
    queryKey: ["search", debounced],
    queryFn: () =>
      apiGet<SearchResponse>(`/api/search?q=${encodeURIComponent(debounced)}`),
    enabled: open && debounced.length >= 2,
    staleTime: 60_000,
  });

  const go = useCallback(
    (to: string) => {
      onOpenChange(false);
      navigate(to);
    },
    [onOpenChange],
  );

  const cars = debounced.length >= 2 ? data?.cars ?? [] : [];
  const articles = debounced.length >= 2 ? data?.articles ?? [] : [];
  const hasResults = cars.length > 0 || articles.length > 0;
  const showEmpty = debounced.length >= 2 && !isFetching && !hasResults;
  const showQuickLinks = debounced.length < 2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="overflow-hidden p-0 rounded-2xl sm:max-w-xl gap-0"
        showCloseButton={false}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Pencarian situs</DialogTitle>
          <DialogDescription>
            Cari mobil, artikel, atau halaman di website Suzuki BSB
          </DialogDescription>
        </DialogHeader>
        <Command shouldFilter={false}>
          <div
            data-slot="command-input-wrapper"
            className="flex h-12 items-center gap-2 border-b px-3"
          >
            <Search className="size-5 shrink-0 text-suzuki-red" aria-hidden />
            <CommandPrimitive.Input
              data-slot="command-input"
              autoFocus
              value={query}
              onValueChange={setQuery}
              placeholder="Cari mobil, promo, atau artikel… (mis. Ertiga, DP ringan)"
              aria-label="Kata kunci pencarian"
              className="placeholder:text-muted-foreground flex h-12 w-full rounded-md bg-transparent py-3 text-base outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setDebounced("");
                }}
                aria-label="Bersihkan kata kunci"
                className="shrink-0 text-xs text-muted-foreground hover:text-suzuki-red transition-colors px-2 py-1 rounded-md hover:bg-muted"
              >
                Bersihkan
              </button>
            )}
            <kbd className="search-kbd shrink-0 hidden sm:inline-flex">Esc</kbd>
          </div>

          <CommandList className="scroll-thin max-h-[min(60vh,420px)] overflow-y-auto overflow-x-hidden">
            {isFetching && (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                Mencari “{debounced}”…
              </div>
            )}

            {showEmpty && (
              <CommandEmpty>
                Tidak ada hasil untuk “{debounced}”.
                <br />
                <span className="text-xs">
                  Coba kata kunci lain, atau telusuri{" "}
                  <button
                    type="button"
                    onClick={() => go("/mobil")}
                    className="text-suzuki-red underline underline-offset-2"
                  >
                    katalog mobil
                  </button>
                  .
                </span>
              </CommandEmpty>
            )}

            {debounced.length >= 2 && !isFetching && hasResults && (
              <>
                {cars.length > 0 && (
                  <CommandGroup heading="Mobil">
                    {cars.map((c) => (
                      <CommandItem
                        key={`car-${c.slug}`}
                        value={`car-${c.slug}`}
                        onSelect={() => go(`/mobil/${c.slug}`)}
                        className="gap-3 py-2.5"
                      >
                        {c.gambar_utama ? (
                          <img
                            src={c.gambar_utama}
                            alt=""
                            className="w-10 h-10 rounded-md object-contain bg-muted shrink-0"
                            loading="lazy"
                          />
                        ) : (
                          <span className="w-10 h-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                            <Car className="w-4 h-4 text-muted-foreground" aria-hidden />
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium text-suzuki-navy dark:text-foreground truncate">
                            {c.nama}
                          </span>
                          <span className="block text-xs text-muted-foreground truncate">
                            {c.kategori_label}
                            {c.harga_mulai != null
                              ? ` · ${formatPriceShort(c.harga_mulai)}`
                              : c.harga_label
                                ? ` · ${c.harga_label}`
                                : ""}
                          </span>
                        </span>
                        <MoveRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" aria-hidden />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                {articles.length > 0 && (
                  <CommandGroup heading="Artikel & Promo">
                    {articles.map((a) => (
                      <CommandItem
                        key={`art-${a.slug}`}
                        value={`art-${a.slug}`}
                        onSelect={() => go(`/artikel/${a.slug}`)}
                        className="gap-3 py-2.5"
                      >
                        <span className="w-10 h-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                          <Newspaper className="w-4 h-4 text-muted-foreground" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium text-suzuki-navy dark:text-foreground truncate">
                            {a.judul}
                          </span>
                          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
                                TIPE_BADGE[a.tipe] ?? "bg-muted text-muted-foreground"
                              }`}
                            >
                              {a.tipe}
                            </span>
                            {a.ringkasan && (
                              <span className="truncate max-w-[200px] sm:max-w-[320px]">
                                {a.ringkasan}
                              </span>
                            )}
                          </span>
                        </span>
                        <MoveRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" aria-hidden />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                <div className="px-4 pb-2 pt-1 text-[11px] text-muted-foreground text-right">
                  {cars.length} mobil · {articles.length} artikel
                </div>
              </>
            )}

            {/* Saat kosong: tautan cepat */}
            {showQuickLinks && (
              <>
                <CommandGroup heading="Telusuri Halaman">
                  {QUICK_LINKS.map((l) => (
                    <CommandItem
                      key={l.to}
                      value={`page-${l.label}`}
                      onSelect={() => go(l.to)}
                      className="gap-3 py-2.5"
                    >
                      <l.icon className="w-4 h-4 text-muted-foreground" aria-hidden />
                      <span className="flex-1">
                        <span className="block font-medium text-suzuki-navy dark:text-foreground">{l.label}</span>
                        <span className="block text-xs text-muted-foreground">{l.hint}</span>
                      </span>
                      <kbd className="search-kbd">Enter</kbd>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <div className="flex items-center justify-center gap-1.5 py-3 text-[11px] text-muted-foreground border-t">
                  <Search className="w-3 h-3" aria-hidden />
                  Ketik minimal 2 huruf untuk mencari mobil &amp; artikel
                </div>
              </>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
