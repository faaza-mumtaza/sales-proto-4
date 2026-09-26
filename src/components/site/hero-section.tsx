"use client";

import { Link } from "@/lib/router";
import { ArrowRight, Sparkles } from "lucide-react";
import { Reveal } from "./reveal";
import { CountUp } from "./count-up";

export function HeroSection({ carCount }: { carCount?: number }) {
  // Jumlah model real dari DB (fallback 9 bila data belum termuat)
  const models = carCount && carCount > 0 ? carCount : 9;
  return (
    <section className="relative bg-white overflow-hidden" aria-label="Hero">
      {/* dekorasi latar */}
      <div className="decoration absolute -top-24 -right-24 w-96 h-96 rounded-full bg-suzuki-red/5 blur-3xl" />
      <div className="decoration absolute -bottom-32 -left-24 w-96 h-96 rounded-full bg-suzuki-navy/5 blur-3xl" />
      <div className="decoration absolute top-1/3 right-1/3 w-16 h-16 rounded-2xl border-2 border-suzuki-red/10 rotate-12 hidden md:block floaty" />
      <div className="decoration absolute bottom-1/4 right-10 w-10 h-10 rounded-full border-2 border-suzuki-navy/10 hidden md:block floaty-delay" />

      <div className="container mx-auto px-4 py-16 md:py-24 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <Reveal className="relative order-1" variant="zoom">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-suzuki-navy/10 to-suzuki-red/10 shadow-xl group">
              <img
                src="https://suzuki-tradajateng-bsbsemarang-naufal.netlify.app/images/3.jpg"
                alt="Sales Consultant Suzuki BSB Semarang"
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                loading="eager"
              />
              <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-2xl" />
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
          </Reveal>

          <Reveal className="order-2" variant="up" delay={120}>
            <p className="shimmer inline-flex items-center gap-2 px-4 py-1.5 mb-5 rounded-full bg-suzuki-red/10 text-suzuki-red text-xs font-semibold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5" aria-hidden />
              Suzuki BSB Semarang
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight text-suzuki-navy">
              Temukan Mobil
              <br />
              <span className="text-suzuki-red relative inline-block">
                Impian Anda
                <svg
                  className="absolute -bottom-2 left-0 w-full h-2.5 text-suzuki-red/60"
                  viewBox="0 0 200 10"
                  preserveAspectRatio="none"
                  aria-hidden
                >
                  <path
                    d="M2 7 Q 50 -2 100 5 T 198 4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>
            <p className="text-gray-600 text-lg mb-8 max-w-lg">
              Jelajahi koleksi lengkap kendaraan Suzuki dengan teknologi terdepan, desain
              modern, dan performa handal untuk setiap perjalanan Anda.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/mobil"
                className="group inline-flex items-center justify-center gap-2 bg-suzuki-navy hover:bg-suzuki-red text-white rounded-full px-8 py-4 text-base font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-suzuki-red/30 hover:-translate-y-0.5 active:scale-95"
              >
                Lihat Katalog
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1.5" />
              </Link>
              <Link
                to="/kontak"
                className="inline-flex items-center justify-center border border-suzuki-navy/30 text-suzuki-navy hover:bg-suzuki-navy hover:text-white hover:border-suzuki-navy rounded-full px-8 py-4 text-base font-semibold transition-all duration-300 hover:-translate-y-0.5 active:scale-95"
              >
                Hubungi Kami
              </Link>
            </div>

            <dl className="grid grid-cols-3 gap-4 mt-10 max-w-md">
              <div className="text-center sm:text-left">
                <dt className="sr-only">Model tersedia</dt>
                <dd className="text-xl font-bold text-suzuki-navy">
                  <CountUp value={models} suffix="+" />
                </dd>
                <dd className="text-xs text-muted-foreground">Model Tersedia</dd>
              </div>
              <div className="text-center sm:text-left">
                <dt className="sr-only">Garansi resmi</dt>
                <dd className="text-xl font-bold text-suzuki-navy">
                  <CountUp value={100} suffix="%" />
                </dd>
                <dd className="text-xs text-muted-foreground">Garansi Resmi</dd>
              </div>
              <div className="text-center sm:text-left">
                <dt className="sr-only">Test drive gratis</dt>
                <dd className="text-xl font-bold text-suzuki-navy">Gratis</dd>
                <dd className="text-xs text-muted-foreground">Test Drive</dd>
              </div>
            </dl>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
