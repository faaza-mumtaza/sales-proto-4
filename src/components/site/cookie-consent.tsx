"use client";

import { useEffect, useState } from "react";
import { Cookie, X } from "lucide-react";

const STORAGE_KEY = "suzuki_bsb_cookie_consent_v1";

/**
 * Banner persetujuan cookie — tampil sekali per browser (localStorage),
 * menutup dengan animasi slide-down. Hanya UI informatif (situs ini tidak
 * memasang cookie pelacak pihak ketiga); cookie yang dipakai hanya sesi
 * admin & preferensi tampilan.
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        const t = setTimeout(() => setVisible(true), 900);
        return () => clearTimeout(t);
      }
    } catch {
      // localStorage tidak tersedia (mode privat ketat) — jangan tampilkan
    }
  }, []);

  function dismiss(value: "accepted" | "essential") {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // abaikan kegagalan penyimpanan
    }
    setClosing(true);
    setTimeout(() => setVisible(false), 350);
  }

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Persetujuan cookie"
      className={`fixed bottom-0 inset-x-0 z-50 no-print transition-transform duration-300 ease-out ${
        closing ? "translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="bg-suzuki-navy/97 backdrop-blur-md text-white border-t border-white/10 shadow-[0_-8px_30px_rgba(15,23,42,0.35)]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-start gap-3 flex-1">
              <span
                aria-hidden
                className="w-10 h-10 rounded-xl bg-suzuki-red/15 text-suzuki-red flex items-center justify-center shrink-0"
              >
                <Cookie className="w-5 h-5" />
              </span>
              <div>
                <p className="text-sm font-semibold mb-1">Kami menggunakan cookie</p>
                <p className="text-xs text-white/70 leading-relaxed max-w-2xl">
                  Situs ini memakai cookie untuk sesi panel admin dan preferensi tampilan Anda —
                  bukan pelacakan pihak ketiga. Lanjutkan menjelajah berarti Anda tidak keberatan.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-stretch sm:self-auto">
              <button
                onClick={() => dismiss("essential")}
                className="px-4 py-2 rounded-full text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                Hanya penting
              </button>
              <button
                onClick={() => dismiss("accepted")}
                className="px-5 py-2 rounded-full bg-suzuki-red hover:bg-suzuki-red/90 text-white text-xs font-semibold transition-all hover:shadow-lg hover:shadow-suzuki-red/30 active:scale-95"
              >
                Mengerti
              </button>
              <button
                onClick={() => dismiss("accepted")}
                aria-label="Tutup notifikasi cookie"
                className="p-1.5 text-white/50 hover:text-white rounded-lg hover:bg-white/10 transition-colors sm:hidden"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
