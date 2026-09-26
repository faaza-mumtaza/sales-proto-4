"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

/**
 * Provider tema global (next-themes).
 *
 * - `attribute="class"` → kelas `.dark` pada <html> (Tailwind v4 custom variant).
 * - `defaultTheme="light"` → kunjungan pertama deterministik (terang);
 *   pilihan pengguna disimpan di localStorage dan dipulihkan kunjungan berikutnya.
 * - `disableTransitionOnChange` → mencegah transisi warna "berkedip" saat toggle.
 */
export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
