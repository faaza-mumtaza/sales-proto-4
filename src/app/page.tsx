"use client";

// Entry seluruh website — SPA dengan hash router (batasan preview sandbox:
// hanya route "/" yang tampil, semua halaman dinavigasi via fragment #/...).

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useHashRoute } from "@/lib/router";

import { HomeView } from "@/views/public/home-view";
import { MobilView } from "@/views/public/mobil-view";
import { MobilDetailView } from "@/views/public/mobil-detail-view";
import { ArtikelView } from "@/views/public/artikel-view";
import { ArtikelDetailView } from "@/views/public/artikel-detail-view";
import { PromoView } from "@/views/public/promo-view";
import { TentangKamiView } from "@/views/public/tentang-kami-view";
import { KontakView } from "@/views/public/kontak-view";
import { NotFoundView } from "@/views/public/not-found-view";

import { AdminLoginView } from "@/views/admin/admin-login-view";
import { AdminDashboardView } from "@/views/admin/admin-dashboard-view";
import { AdminKatalogView } from "@/views/admin/admin-katalog-view";
import { AdminKatalogFormView } from "@/views/admin/admin-katalog-form-view";
import { AdminArtikelView } from "@/views/admin/admin-artikel-view";
import { AdminArtikelFormView } from "@/views/admin/admin-artikel-form-view";
import { AdminPesanView } from "@/views/admin/admin-pesan-view";
import { AdminTestDriveView } from "@/views/admin/admin-test-drive-view";

function AppRoutes() {
  const route = useHashRoute();
  const [seg1, seg2, seg3] = route.segments;

  // ----- Admin (login berada DI LUAR shell terproteksi) -----
  if (seg1 === "admin") {
    if (seg2 === "login") return <AdminLoginView />;
    if (seg2 === undefined) return <AdminDashboardView />;
    if (seg2 === "katalog") {
      if (seg3 === "tambah") return <AdminKatalogFormView />;
      if (seg3) {
        // /admin/katalog/:id/edit
        return <AdminKatalogFormView key={seg3} carId={seg3} />;
      }
      return <AdminKatalogView />;
    }
    if (seg2 === "artikel") {
      if (seg3 === "tambah") return <AdminArtikelFormView />;
      if (seg3) {
        // /admin/artikel/:id/edit
        return <AdminArtikelFormView key={seg3} artikelId={seg3} />;
      }
      return <AdminArtikelView />;
    }
    if (seg2 === "pesan") return <AdminPesanView />;
    if (seg2 === "test-drive") return <AdminTestDriveView />;
    return <AdminDashboardView />;
  }

  // ----- Website publik -----
  switch (seg1) {
    case undefined:
      return <HomeView />;
    case "mobil":
      return seg2 ? <MobilDetailView key={seg2} slug={seg2} /> : <MobilView />;
    case "artikel":
      return seg2 ? <ArtikelDetailView key={seg2} slug={seg2} /> : <ArtikelView />;
    case "promo":
      return <PromoView />;
    case "tentang-kami":
      return <TentangKamiView />;
    case "kontak":
      return <KontakView key={route.query.toString()} />;
    default:
      return <NotFoundView />;
  }
}

export default function Page() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AppRoutes />
    </QueryClientProvider>
  );
}
