"use client";

import { Link } from "@/lib/router";
import { WHATSAPP_NUMBER, INSTAGRAM_URL, waLink } from "@/lib/site-utils";
import { SuzukiLogo } from "./header";

export function Footer() {
  return (
    <footer className="bg-suzuki-navy text-white mt-auto">
      <div className="bg-suzuki-red py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h2 className="text-xl md:text-2xl font-bold mb-2">Butuh Bantuan?</h2>
              <p className="text-white/90 text-sm">
                Tim kami siap membantu Anda menemukan kendaraan yang tepat.
                <br className="hidden md:block" />
                Hubungi kami untuk konsultasi gratis atau kunjungi dealer terdekat.
              </p>
            </div>
            <a
              href={waLink("Halo, saya tertarik dengan mobil Suzuki")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-white text-suzuki-red font-semibold rounded-full hover:bg-white/90 transition-colors shrink-0"
            >
              Chat Sekarang
            </a>
          </div>
        </div>
      </div>

      <div className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <Link to="/" className="mb-4 block" aria-label="Beranda">
                <SuzukiLogo className="h-8 w-auto brightness-0 invert" />
              </Link>
              <p className="text-white/70 text-sm">
                PT. SUNMOTOR INDOSENTRA TRADA merupakan dealer resmi Suzuki di Semarang
                yang menyediakan penjualan dan layanan purna jual kendaraan Suzuki.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">Sosial Media</h3>
              <div className="space-y-3">
                <a
                  href={waLink("Halo, saya ingin bertanya tentang mobil Suzuki")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between pb-2 border-b border-white/20 hover:border-suzuki-red transition-colors text-white/70 hover:text-white text-sm"
                >
                  WhatsApp <span aria-hidden>→</span>
                </a>
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between pb-2 border-b border-white/20 hover:border-suzuki-red transition-colors text-white/70 hover:text-white text-sm"
                >
                  Instagram <span aria-hidden>→</span>
                </a>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">Layanan</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link
                    to="/kontak?form=servis"
                    className="text-white/70 hover:text-suzuki-red transition-colors"
                  >
                    Booking Service
                  </Link>
                </li>
                <li>
                  <Link
                    to="/kontak?form=test-drive"
                    className="text-white/70 hover:text-suzuki-red transition-colors"
                  >
                    Test Drive
                  </Link>
                </li>
                <li>
                  <Link to="/mobil" className="text-white/70 hover:text-suzuki-red transition-colors">
                    Katalog Mobil
                  </Link>
                </li>
                <li>
                  <Link to="/artikel" className="text-white/70 hover:text-suzuki-red transition-colors">
                    Promo & Artikel
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">Kontak</h3>
              <ul className="space-y-4 text-sm">
                <li>
                  <p className="text-white/50 text-xs mb-1">Sales Marketing</p>
                  <p className="font-semibold">NAUFAL, S.E.</p>
                </li>
                <li>
                  <p className="text-white/50 text-xs mb-1">Telepon / WhatsApp</p>
                  <a
                    href={waLink("Halo, saya ingin bertanya tentang mobil Suzuki")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-suzuki-red transition-colors"
                  >
                    +62 856-4707-9807
                  </a>
                </li>
                <li>
                  <p className="text-white/50 text-xs mb-1">Dealer</p>
                  <p className="font-medium">PT. SUNMOTOR INDOSENTRA TRADA</p>
                </li>
                <li>
                  <p className="text-white/50 text-xs mb-1">Alamat</p>
                  <p>
                    Jl. Kompleks Graha Taman Karet, Kedungpane, Mijen, Bukit Semarang,
                    Semarang
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-6">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/60 text-sm">
            © {new Date().getFullYear()} PT. SUNMOTOR INDOSENTRA TRADA. All rights reserved.
          </p>
          <p className="text-white/40 text-xs">Dealer Resmi Suzuki — Semarang, Jawa Tengah</p>
        </div>
      </div>
    </footer>
  );
}
