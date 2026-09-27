"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

/**
 * Tombol toggle tema terang/gelap.
 *
 * Ikon Matahari/Bulan bertukar dengan animasi rotasi + scale (aware
 * prefers-reduced-motion). Konten bergantung tema hanya dirender pasca-mount
 * (pola useSyncExternalStore — hindari hydration mismatch sekaligus aturan
 * react-hooks/set-state-in-effect).
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  // SSR=false, client=true — subscribe no-op karena nilai tidak berubah pasca-mount.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
      aria-pressed={isDark}
      title={isDark ? "Mode terang" : "Mode gelap"}
      className={`relative inline-flex items-center justify-center w-9 h-9 rounded-full border border-border bg-transparent text-muted-foreground hover:text-foreground hover:border-suzuki-red/50 hover:shadow-sm transition-all active:scale-90 focus-visible:outline-2 ${className}`}
    >
      <Sun
        className="w-4 h-4 motion-safe:rotate-0 motion-safe:scale-100 motion-safe:transition-transform motion-safe:duration-300 motion-safe:dark:-rotate-90 motion-safe:dark:scale-0"
        aria-hidden
      />
      <Moon
        className="absolute w-4 h-4 motion-safe:rotate-90 motion-safe:scale-0 motion-safe:transition-transform motion-safe:duration-300 motion-safe:dark:rotate-0 motion-safe:dark:scale-100"
        aria-hidden
      />
    </button>
  );
}
