import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Izinkan origin preview sandbox agar HMR & aset berjalan normal
  allowedDevOrigins: ["*.space-z.ai", "localhost", "127.0.0.1"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          // CATATAN: X-Frame-Options sengaja TIDAK dibatasi karena preview
          // sandbox memuat situs via iframe lintas-origin. Untuk produksi,
          // pertimbangkan Content-Security-Policy frame-ancestors yang lebih ketat.
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Next.js membutuhkan inline eval/style untuk dev & hidrasi
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https:",
              "frame-src https://www.google.com https://maps.google.com",
              "frame-ancestors *",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
      {
        // API tidak perlu di-cache browser
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
    ];
  },
};

export default nextConfig;
