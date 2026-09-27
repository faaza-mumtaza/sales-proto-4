"use client";

import { useCallback, useEffect, useState } from "react";
import { Link, useHashRoute } from "@/lib/router";
import { Menu, X, Search } from "lucide-react";
import { SearchCommand } from "./search-command";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/mobil", label: "Katalog" },
  { to: "/artikel", label: "Artikel" },
  { to: "/tentang-kami", label: "Tentang Kami" },
  { to: "/kontak", label: "Kontak" },
] as const;

export function SuzukiLogo({ className = "h-7 w-auto" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 453.4 86.9"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Suzuki"
      role="img"
    >
      <g>
        <rect fill="#1a2942" x="434.7" y="18.77" width="18.69" height="50.47" />
        <polygon
          fill="#1a2942"
          points="404.38 69.24 384.95 50.76 384.95 69.24 366.24 69.24 366.24 18.77 384.95 18.77 384.95 36.69 405.84 18.77 430.33 18.77 401.56 43.35 429.46 69.24 404.38 69.24"
        />
        <path
          fill="#1a2942"
          d="M330.78,71.18c-25.72,0-28.81-10.74-28.89-18.82-.05-4.49-.1-12.78-.1-15.29v-18.31h17.9v29.17c0,7.42,3.42,10.72,11.09,10.72s11.1-3.31,11.1-10.72v-29.17h17.9v18.31c0,2.47-.05,10.76-.1,15.29-.08,8.08-3.17,18.82-28.89,18.82Z"
        />
        <polygon
          fill="#1a2942"
          points="236.8 69.24 236.8 58.79 266.4 31.15 237.79 31.15 237.79 18.77 295.54 18.77 295.54 29.22 265.54 56.8 295.45 56.8 295.45 69.24 236.8 69.24"
        />
        <path
          fill="#1a2942"
          d="M202.54,71.18c-25.73,0-28.81-10.74-28.89-18.82-.05-4.47-.1-12.76-.1-15.29v-18.31h17.9v29.17c0,7.42,3.42,10.72,11.1,10.72s11.1-3.31,11.1-10.72v-29.17h17.9v18.31c0,2.54-.05,10.83-.1,15.29-.08,8.08-3.17,18.82-28.89,18.82Z"
        />
        <path
          fill="#1a2942"
          d="M139.12,70.46c-26.77,0-31.45-8.2-32.34-17.15h22.64c2.05,5.98,8.1,5.98,10.1,5.98,2.42,0,8-.42,8-4.3,0-3.4-3.8-3.77-9.54-4.32-.75-.07-1.54-.15-2.36-.23-18.41-1.93-27.76-5.01-27.76-16.5,0-5.01,2.75-16.65,28.2-16.65h.23c19.47.06,30.7,6.13,30.9,16.69h-20.81c-1.41-5-6.96-5.76-10.17-5.76-1.24,0-5.44.15-7.26,2.1-.63.67-.91,1.48-.85,2.42.17,2.75,5.39,3.34,11.99,4.09,1.36.15,2.78.31,4.22.5,16.55,2.12,24.59,7.52,24.59,16.53,0,3.88-2.12,16.53-29.39,16.61h-.39Z"
        />
        <path
          fill="#e32322"
          d="M33.98,19.33l18.5,12.43c3.83,2.58,7.76,5.09,14.52,5.09,10.53,0,19.91-7.66,19.91-7.66L43.45,0s-4.74,5.22-19.63,14.49C8.19,24.23,0,27.06,0,27.06l56.09,37.72-3.69,2.42-17.99-12.09c-3.82-2.56-7.76-5.09-14.52-5.09C9.36,50.01,0,57.69,0,57.69l43.46,29.21s4.74-5.22,19.63-14.49c15.63-9.74,23.82-12.57,23.82-12.57L30.29,21.75l3.68-2.42Z"
        />
      </g>
    </svg>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const route = useHashRoute();

  // Shortcut keyboard global: Ctrl/Cmd + K membuka pencarian situs
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const openSearch = useCallback(() => setSearchOpen(true), []);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
      {/* Command palette pencarian global (Ctrl/Cmd+K) */}
      <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} />
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center shrink-0" aria-label="Beranda Suzuki BSB">
            <SuzukiLogo />
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <nav className="flex items-center gap-1" aria-label="Navigasi utama">
              {navLinks.map((link) => {
                const isActive =
                  link.to === "/"
                    ? route.path === "/"
                    : route.path === link.to || route.path.startsWith(link.to + "/");
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    aria-current={isActive ? "page" : undefined}
                    className={`relative px-4 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "text-suzuki-navy font-bold"
                        : "text-gray-500 hover:text-suzuki-navy"
                    }`}
                  >
                    {link.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-suzuki-red rounded-full" />
                    )}
                  </Link>
                );
              })}
            </nav>
            {/* Pemicu pencarian global */}
            <button
              type="button"
              onClick={openSearch}
              aria-label="Cari di situs (Ctrl K)"
              title="Cari di situs (Ctrl+K)"
              className="p-2.5 -mr-1 text-gray-500 hover:text-suzuki-navy transition-colors"
            >
              <Search className="w-5 h-5" aria-hidden />
            </button>
            <Link
              to="/kontak?form=test-drive"
              className="hidden lg:inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-suzuki-red hover:bg-suzuki-red/90 text-white text-sm font-semibold rounded-full transition-colors shadow-sm"
            >
              Test Drive
            </Link>
          </div>

          <div className="flex items-center gap-1 md:hidden">
            <button
              type="button"
              onClick={openSearch}
              aria-label="Cari di situs"
              title="Cari (Ctrl+K)"
              className="p-2.5 -mr-1 text-suzuki-navy"
            >
              <Search className="h-[22px] w-[22px]" aria-hidden />
            </button>
            <button
              className="p-2.5 -mr-2.5"
              onClick={() => setOpen(!open)}
              aria-label={open ? "Tutup menu" : "Buka menu"}
              aria-expanded={open}
            >
              {open ? (
                <X className="h-6 w-6 text-suzuki-navy" />
              ) : (
                <Menu className="h-6 w-6 text-suzuki-navy" />
              )}
            </button>
          </div>
        </div>

        {open && (
          <nav className="md:hidden pb-4 border-t border-gray-100 pt-3" aria-label="Navigasi mobile">
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  openSearch();
                }}
                className="flex items-center gap-3 text-sm font-medium py-3 px-4 rounded-lg text-suzuki-navy bg-suzuki-light hover:bg-gray-100 transition-colors"
              >
                <Search className="w-4 h-4" aria-hidden />
                Cari mobil, promo, atau artikel…
                <kbd className="search-kbd ml-auto">Ctrl K</kbd>
              </button>
              {navLinks.map((link) => {
                const isActive =
                  link.to === "/"
                    ? route.path === "/"
                    : route.path === link.to || route.path.startsWith(link.to + "/");
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setOpen(false)}
                    className={`text-sm font-medium transition-colors py-3 px-4 rounded-lg ${
                      isActive
                        ? "text-suzuki-navy bg-gray-100 font-bold"
                        : "text-gray-500 hover:text-suzuki-navy hover:bg-gray-50"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <Link
                to="/kontak?form=test-drive"
                onClick={() => setOpen(false)}
                className="mt-2 text-center text-sm font-semibold bg-suzuki-red text-white py-3 px-4 rounded-lg"
              >
                Jadwalkan Test Drive
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
