"use client";

import { useEffect, useRef } from "react";

/**
 * Angka yang menghitung naik saat masuk viewport (animated counter).
 * Animasi memakai requestAnimationFrame + manipulasi DOM langsung (tanpa
 * state React) — mengikuti pola komponen <Reveal> agar lolos aturan
 * react-compiler dan bebas hydration mismatch. SSR merender 0; nilai
 * akhir selalu tersedia lewat aria-label.
 */
export function CountUp({
  value,
  duration = 900,
  prefix = "",
  suffix = "",
  className,
}: {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const final = `${prefix}${value.toLocaleString("id-ID")}${suffix}`;

    // Hormati preferensi pengguna: langsung tampilkan nilai akhir
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = final;
      return;
    }

    let raf = 0;
    let started = false;

    const start = () => {
      if (started) return;
      started = true;
      const t0 = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / duration);
        const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
        el.textContent = `${prefix}${Math.round(eased * value).toLocaleString("id-ID")}${suffix}`;
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          start();
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, duration, prefix, suffix]);

  return (
    <span
      ref={ref}
      className={className}
      aria-label={`${prefix}${value.toLocaleString("id-ID")}${suffix}`}
    >
      {prefix}0{suffix}
    </span>
  );
}
