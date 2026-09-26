"use client";

// Scroll-reveal ringan berbasis IntersectionObserver.
// - Tanpa library eksternal (hemat bundle, animasi via CSS di globals.css)
// - Tanpa state React: kelas `is-visible` ditambahkan langsung ke DOM lewat
//   observer → tidak ada setState-in-effect, tidak ada hydration mismatch,
//   dan tidak ada flicker pada render awal.
// - Menghormati prefers-reduced-motion (sudah dihandle di CSS)

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

type RevealVariant = "up" | "fade" | "zoom";

export function Reveal({
  children,
  variant = "up",
  delay = 0,
  className = "",
  as: Tag = "div",
  once = true,
}: {
  children: ReactNode;
  variant?: RevealVariant;
  /** jeda tambahan dalam milidetik (untuk efek stagger) */
  delay?: number;
  className?: string;
  /** tag pembungkus, mis. "section" / "article" */
  as?: "div" | "section" | "article" | "li" | "span";
  once?: boolean;
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Browser lawas tanpa IntersectionObserver → langsung tampil
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("is-visible");
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            if (once) io.unobserve(entry.target);
          } else if (!once) {
            entry.target.classList.remove("is-visible");
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [once]);

  return (
    <Tag
      ref={ref as never}
      data-variant={variant}
      style={{ transitionDelay: delay ? `${delay}ms` : undefined } as CSSProperties}
      className={`reveal ${className}`.trim()}
    >
      {children}
    </Tag>
  );
}
