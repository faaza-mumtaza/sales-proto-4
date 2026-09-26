"use client";

/**
 * Strip keunggulan (USP) — kartu mengambang yang menumpuk batas hero →
 * katalog: 4 nilai jual utama dealer, masing-masing menuju halaman relevan.
 */

import { ShieldCheck, CalendarCheck, BadgePercent, Repeat } from "lucide-react";
import { Link } from "@/lib/router";
import { Reveal } from "./reveal";

const USP_ITEMS = [
  {
    icon: ShieldCheck,
    title: "Garansi Resmi",
    desc: "Garansi pabrikan Suzuki",
    to: "/tentang-kami",
  },
  {
    icon: CalendarCheck,
    title: "Test Drive Gratis",
    desc: "Coba unit tanpa biaya",
    to: "/kontak?form=test-drive",
  },
  {
    icon: BadgePercent,
    title: "DP Ringan",
    desc: "Angsuran mulai Rp 3 jutaan",
    to: "/promo",
  },
  {
    icon: Repeat,
    title: "Trade-In",
    desc: "Tukar tambah unit lama",
    to: "/promo",
  },
] as const;

export function UspStrip() {
  return (
    <div className="container mx-auto px-4 relative z-10">
      <Reveal variant="up" delay={150}>
        <div className="bg-white dark:bg-card rounded-2xl shadow-xl shadow-suzuki-navy/10 border border-border grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 -mb-10 overflow-hidden">
          {USP_ITEMS.map((item, i) => (
            <Link
              key={item.title}
              to={item.to}
              className={`group flex items-center gap-3.5 p-4 sm:p-5 hover:bg-suzuki-light/70 transition-colors ${
                i >= 2 ? "lg:divide-y-0 border-t lg:border-t-0" : ""
              } ${i % 2 === 1 ? "border-l" : ""} lg:border-l-0 ${i === 0 ? "" : "lg:border-l"}`}
            >
              <span className="w-11 h-11 shrink-0 rounded-xl bg-suzuki-red/10 flex items-center justify-center transition-all duration-300 group-hover:bg-suzuki-red group-hover:scale-110 group-hover:rotate-3">
                <item.icon className="w-5.5 h-5.5 text-suzuki-red transition-colors group-hover:text-white" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-suzuki-navy dark:text-foreground leading-tight group-hover:text-suzuki-red transition-colors">
                  {item.title}
                </span>
                <span className="block text-[11px] sm:text-xs text-muted-foreground truncate">
                  {item.desc}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </Reveal>
    </div>
  );
}
