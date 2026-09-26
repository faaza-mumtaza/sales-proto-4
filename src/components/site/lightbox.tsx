"use client";

// Lightbox galeri fullscreen — navigasi keyboard (←/→/Esc), strip thumbnail,
// counter, scroll-lock body, fokus dikelola agar ramah keyboard & screen reader.
// Di-render via portal ke document.body agar KEBAL terhadap ancestor yang
// membuat containing block (transform/backdrop-filter) — position:fixed tetap
// merujuk viewport.

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export interface LightboxImage {
  src: string;
  alt: string;
}

export function Lightbox({
  images,
  index,
  onIndexChange,
  onClose,
  title,
}: {
  images: LightboxImage[];
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
  title?: string;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const thumbRefs = useRef<Array<HTMLButtonElement | null>>([]);
  // Pola "sudah hidrasi" tanpa setState di dalam effect (lolos rule
  // react-hooks/set-state-in-effect): snapshot server = false, client = true.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const total = images.length;
  const goto = useCallback(
    (i: number) => {
      if (total === 0) return;
      onIndexChange((i + total) % total);
    },
    [onIndexChange, total],
  );

  // Navigasi keyboard + scroll-lock body
  useEffect(() => {
    if (typeof document === "undefined") return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goto(index + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goto(index - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [index, goto, onClose]);

  // Pastikan thumbnail aktif terlihat di strip
  useEffect(() => {
    thumbRefs.current[index]?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [index]);

  if (total === 0 || !mounted) return null;
  const current = images[Math.min(index, total - 1)]!;

  const ui = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title ? `Galeri ${title}` : "Galeri gambar"}
      className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-sm flex flex-col animate-[fade-in_.2s_ease-out]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Bar atas: judul + counter + tutup */}
      <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3 text-white shrink-0">
        <p className="text-sm font-medium truncate opacity-90">
          {title && <span className="mr-2">{title}</span>}
          <span className="opacity-60 tabular-nums" aria-live="polite">
            {index + 1} / {total}
          </span>
        </p>
        <button
          ref={closeRef}
          onClick={onClose}
          aria-label="Tutup galeri (Esc)"
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-suzuki-red flex items-center justify-center transition-colors active:scale-90 shrink-0"
        >
          <X className="w-5 h-5" aria-hidden />
        </button>
      </div>

      {/* Area gambar utama */}
      <div className="relative flex-1 min-h-0 flex items-center justify-center px-12 sm:px-20 group">
        <img
          key={current.src + index}
          src={current.src}
          alt={current.alt}
          className="max-w-full max-h-full object-contain animate-[scale-in_.25s_ease-out] select-none"
          draggable={false}
        />

        {total > 1 && (
          <>
            <button
              onClick={() => goto(index - 1)}
              aria-label="Gambar sebelumnya (←)"
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur flex items-center justify-center transition-all active:scale-90 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
            >
              <ChevronLeft className="w-6 h-6" aria-hidden />
            </button>
            <button
              onClick={() => goto(index + 1)}
              aria-label="Gambar berikutnya (→)"
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur flex items-center justify-center transition-all active:scale-90 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
            >
              <ChevronRight className="w-6 h-6" aria-hidden />
            </button>
          </>
        )}
      </div>

      {/* Strip thumbnail */}
      {total > 1 && (
        <div className="shrink-0 px-4 py-4 overflow-x-auto no-scrollbar" role="tablist" aria-label="Pilih gambar">
          <div className="flex gap-2.5 justify-center min-w-max mx-auto">
            {images.map((img, i) => (
              <button
                key={img.src + i}
                ref={(el) => {
                  thumbRefs.current[i] = el;
                }}
                role="tab"
                aria-selected={i === index}
                aria-label={`Gambar ${i + 1}`}
                onClick={() => onIndexChange(i)}
                className={`relative w-20 h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                  i === index
                    ? "border-suzuki-red scale-105 shadow-lg shadow-suzuki-red/30"
                    : "border-white/20 opacity-60 hover:opacity-100 hover:border-white/50"
                }`}
              >
                <img src={img.src} alt="" className="w-full h-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(ui, document.body);
}
