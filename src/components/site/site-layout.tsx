"use client";

import type { ReactNode } from "react";
import { Header } from "./header";
import { Footer } from "./footer";
import { FloatingButtons } from "./floating-buttons";
import { CookieConsent } from "./cookie-consent";

/**
 * Layout publik: header sticky di atas, konten fleksibel, footer menempel
 * di dasar viewport saat konten pendek (sticky footer) dan terdorong alami
 * saat konten panjang.
 */
export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-background">
      <Header />
      <main className="flex-1 w-full">{children}</main>
      <div className="mt-auto">
        <Footer />
      </div>
      <FloatingButtons />
      <CookieConsent />
    </div>
  );
}
