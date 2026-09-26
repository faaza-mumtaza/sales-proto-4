"use client";

import { useEffect, useState } from "react";
import { WHATSAPP_NUMBER } from "@/lib/site-utils";
import { MessageCircle, ArrowUp, Wrench } from "lucide-react";
import { useCompare } from "@/lib/use-compare";
import { useHashRoute, Link } from "@/lib/router";

export function FloatingButtons() {
  const [showTop, setShowTop] = useState(false);
  const { slugs } = useCompare();
  const route = useHashRoute();

  // Munculkan tombol "kembali ke atas" setelah pengunjung scroll cukup jauh.
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 480);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Naikkan posisi saat bar perbandingan tampil (menghindari tumpang tindih)
  const compareBarVisible =
    slugs.length > 0 && route.segments[0] !== "bandingkan" && route.segments[0] !== "admin";
  const bottomClass = compareBarVisible ? "bottom-24" : "bottom-6";

  return (
    <div className={`fixed ${bottomClass} right-6 z-40 flex flex-col gap-3 transition-all duration-300 no-print`}>
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Kembali ke atas"
        title="Kembali ke atas"
        className={`w-14 h-14 bg-suzuki-navy/90 hover:bg-suzuki-navy text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 focus-visible:ring-2 focus-visible:ring-suzuki-red/60 ${
          showTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <ArrowUp className="w-6 h-6" aria-hidden />
      </button>
      <Link
        to="/kontak?form=servis"
        aria-label="Booking servis bengkel"
        title="Booking Servis Bengkel"
        className="w-14 h-14 bg-suzuki-navy/90 hover:bg-suzuki-red text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110"
      >
        <Wrench className="w-6 h-6" aria-hidden />
      </Link>
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
          "Halo, saya tertarik dengan mobil Suzuki",
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
        aria-label="Chat WhatsApp"
      >
        <MessageCircle className="w-7 h-7" />
      </a>
    </div>
  );
}
