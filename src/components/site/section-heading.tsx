"use client";

// Judul section konsisten dengan aksen brand Suzuki (garis merah + titik navy).

import type { ReactNode } from "react";

export function SectionHeading({
  title,
  subtitle,
  align = "center",
  className = "",
  action,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  align?: "center" | "left";
  className?: string;
  /** elemen aksi di kanan (mis. tombol "Semua →"), hanya untuk align=left */
  action?: ReactNode;
}) {
  if (align === "left") {
    return (
      <div className={`flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10 ${className}`}>
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-suzuki-navy mb-3 flex items-center gap-4">
            <span className="inline-block w-10 h-1.5 rounded-full bg-suzuki-red" aria-hidden />
            {title}
          </h2>
          {subtitle && <p className="text-muted-foreground max-w-xl">{subtitle}</p>}
        </div>
        {action}
      </div>
    );
  }
  return (
    <div className={`text-center mb-10 ${className}`}>
      <h2 className="text-3xl md:text-4xl font-bold text-suzuki-navy mb-4 flex items-center justify-center gap-4">
        <span className="inline-block w-8 h-1.5 rounded-full bg-suzuki-red/70" aria-hidden />
        {title}
        <span className="inline-block w-8 h-1.5 rounded-full bg-suzuki-red/70" aria-hidden />
      </h2>
      {subtitle && <p className="text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>}
    </div>
  );
}
