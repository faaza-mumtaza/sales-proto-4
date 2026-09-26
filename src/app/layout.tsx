import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const SITE_NAME = "Suzuki BSB Semarang";
const SITE_DESC =
  "Dealer resmi Suzuki BSB Semarang (PT. Sunmotor Indosentra Trada). Katalog mobil Suzuki, promo terbaru, test drive gratis, dan layanan purna jual terpercaya di Semarang.";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://suzuki-bsb-semarang.example.com",
  ),
  title: {
    default: `${SITE_NAME} — Dealer Resmi Suzuki`,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESC,
  keywords: [
    "suzuki semarang",
    "dealer suzuki",
    "suzuki bsb",
    "jual mobil suzuki",
    "test drive suzuki",
    "promo suzuki",
    "ertiga",
    "xl7",
    "grand vitara",
    "fronx",
    "jimny",
  ],
  authors: [{ name: "Suzuki BSB Semarang" }],
  robots: { index: true, follow: true },
  openGraph: {
    title: `${SITE_NAME} — Dealer Resmi Suzuki`,
    description: SITE_DESC,
    siteName: SITE_NAME,
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Dealer Resmi Suzuki`,
    description: SITE_DESC,
  },
  icons: {
    icon: [
      { url: "/suzuki-favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
  applicationName: "Suzuki BSB",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Suzuki BSB",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#e32322",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${poppins.variable} font-sans antialiased bg-background text-foreground`}>
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
