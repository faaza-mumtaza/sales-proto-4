"use client";

import { Link } from "@/lib/router";
import { ArrowRight } from "lucide-react";

export function HeroSection({ carCount }: { carCount?: number }) {
  // Jumlah model real dari DB (fallback 9 bila data belum termuat)
  const models = carCount && carCount > 0 ? `${carCount}+` : "9+";
  return (
    <section className="relative bg-white overflow-hidden" aria-label="Hero">
      {/* dekorasi latar */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-suzuki-red/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 w-96 h-96 rounded-full bg-suzuki-navy/5 blur-3xl" />

      <div className="container mx-auto px-4 py-16 md:py-24 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative order-1">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-suzuki-navy/10 to-suzuki-red/10 shadow-xl">
              <img
                src="https://suzuki-tradajateng-bsbsemarang-naufal.netlify.app/images/3.jpg"
                alt="Sales Consultant Suzuki BSB Semarang"
                className="w-full h-full object-cover"
                loading="eager"
              />
            </div>
            <div className="absolute -bottom-5 left-6 bg-white rounded-xl shadow-lg border border-border px-5 py-3 flex items-center gap-3">
              <div className="flex -space-x-2">
                <span className="w-8 h-8 rounded-full bg-suzuki-red/10 text-suzuki-red text-xs font-bold flex items-center justify-center ring-2 ring-white">
                  ★
                </span>
              </div>
              <div>
                <p className="text-sm font-bold text-suzuki-navy leading-tight">Dealer Resmi</p>
                <p className="text-xs text-muted-foreground">PT. Sunmotor Indosentra Trada</p>
              </div>
            </div>
          </div>

          <div className="order-2">
            <p className="inline-flex items-center gap-2 px-4 py-1.5 mb-5 rounded-full bg-suzuki-red/10 text-suzuki-red text-xs font-semibold tracking-wide uppercase">
              Suzuki BSB Semarang
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight text-suzuki-navy">
              Temukan Mobil
              <br />
              <span className="text-suzuki-red">Impian Anda</span>
            </h1>
            <p className="text-gray-600 text-lg mb-8 max-w-lg">
              Jelajahi koleksi lengkap kendaraan Suzuki dengan teknologi terdepan, desain
              modern, dan performa handal untuk setiap perjalanan Anda.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/mobil"
                className="group inline-flex items-center justify-center gap-2 bg-suzuki-navy hover:bg-suzuki-red text-white rounded-full px-8 py-4 text-base font-semibold transition-colors"
              >
                Lihat Katalog
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/kontak"
                className="inline-flex items-center justify-center border border-suzuki-navy/30 text-suzuki-navy hover:bg-suzuki-navy/5 rounded-full px-8 py-4 text-base font-semibold transition-colors"
              >
                Hubungi Kami
              </Link>
            </div>

            <dl className="grid grid-cols-3 gap-4 mt-10 max-w-md">
              {[
                { value: models, label: "Model Tersedia" },
                { value: "100%", label: "Garansi Resmi" },
                { value: "Gratis", label: "Test Drive" },
              ].map((s) => (
                <div key={s.label} className="text-center sm:text-left">
                  <dt className="sr-only">{s.label}</dt>
                  <dd className="text-xl font-bold text-suzuki-navy">{s.value}</dd>
                  <dd className="text-xs text-muted-foreground">{s.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
