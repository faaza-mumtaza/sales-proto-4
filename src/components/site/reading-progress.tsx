"use client";

/**
 * Bilah progres membaca — tipis (3px) di paling atas viewport, menunjukkan
 * seberapa jauh pengguna men-scroll halaman. Update lewat manipulasi DOM
 * langsung (rAF) tanpa state React agar bebas re-render; hormati
 * prefers-reduced-motion.
 */

import { useEffect, useRef } from "react";

export function ReadingProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      const pct =
        scrollable > 0
          ? Math.min(1, Math.max(0, window.scrollY / scrollable))
          : 0;
      bar.style.width = `${(pct * 100).toFixed(2)}%`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="reading-progress no-print"
    >
      <div ref={barRef} className="reading-progress-bar" />
    </div>
  );
}
