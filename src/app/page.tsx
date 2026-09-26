"use client";

// Entry seluruh website — SPA dengan hash router (batasan preview sandbox:
// hanya route "/" yang tampil, semua halaman dinavigasi via fragment #/...).

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useHashRoute } from "@/lib/router";

import { HomeView } from "@/views/public/home-view";
import { MobilView } from "@/views/public/mobil-view";
import { MobilDetailView } from "@/views/public/mobil-detail-view";
import { BandingkanView } from "@/views/public/bandingkan-view";
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
import { AdminTestimoniView } from "@/views/admin/admin-testimoni-view";

import { ComparisonBar } from "@/components/site/comparison-bar";

function AppRoutes() {
  const route = useHashRoute();
  const [seg1, seg2, seg3] = route.segments;

  // ----- Admin (login berada DI LUAR shell terproteksi) -----
  if (seg1 === "admin") {
    if (seg2 === "login")
      return (
        <div key="admin-login" className="page-enter">
          <AdminLoginView />
        </div>
      );
    if (seg2 === undefined)
      return (
        <div key="admin-dash" className="page-enter">
          <AdminDashboardView />
        </div>
      );
    if (seg2 === "katalog") {
      if (seg3 === "tambah")
        return (
          <div key="admin-katalog-tambah" className="page-enter">
            <AdminKatalogFormView />
          </div>
        );
      if (seg3) {
        // /admin/katalog/:id/edit
        return (
          <div key={`admin-katalog-${seg3}`} className="page-enter">
            <AdminKatalogFormView key={seg3} carId={seg3} />
          </div>
        );
      }
      return (
        <div key="admin-katalog" className="page-enter">
          <AdminKatalogView />
        </div>
      );
    }
    if (seg2 === "artikel") {
      if (seg3 === "tambah")
        return (
          <div key="admin-artikel-tambah" className="page-enter">
            <AdminArtikelFormView />
          </div>
        );
      if (seg3) {
        // /admin/artikel/:id/edit
        return (
          <div key={`admin-artikel-${seg3}`} className="page-enter">
            <AdminArtikelFormView key={seg3} artikelId={seg3} />
          </div>
        );
      }
      return (
        <div key="admin-artikel" className="page-enter">
          <AdminArtikelView />
        </div>
      );
    }
    if (seg2 === "pesan")
      return (
        <div key="admin-pesan" className="page-enter">
          <AdminPesanView />
        </div>
      );
    if (seg2 === "test-drive")
      return (
        <div key="admin-td" className="page-enter">
          <AdminTestDriveView />
        </div>
      );
    if (seg2 === "testimoni")
      return (
        <div key="admin-testi" className="page-enter">
          <AdminTestimoniView />
        </div>
      );
    return (
      <div key="admin-dash-2" className="page-enter">
        <AdminDashboardView />
      </div>
    );
  }

  // ----- Website publik -----
  switch (seg1) {
    case undefined:
      return (
        <div key="home" className="page-enter">
          <HomeView />
        </div>
      );
    case "mobil":
      return seg2 ? (
        <div key={`mobil-${seg2}`} className="page-enter">
          <MobilDetailView key={seg2} slug={seg2} />
        </div>
      ) : (
        <div key="mobil" className="page-enter">
          <MobilView />
        </div>
      );
    case "bandingkan":
      return (
        <div key="bandingkan" className="page-enter">
          <BandingkanView />
        </div>
      );
    case "artikel":
      return seg2 ? (
        <div key={`artikel-${seg2}`} className="page-enter">
          <ArtikelDetailView key={seg2} slug={seg2} />
        </div>
      ) : (
        <div key="artikel" className="page-enter">
          <ArtikelView />
        </div>
      );
    case "promo":
      return (
        <div key="promo" className="page-enter">
          <PromoView />
        </div>
      );
    case "tentang-kami":
      return (
        <div key="tentang" className="page-enter">
          <TentangKamiView />
        </div>
      );
    case "kontak":
      return (
        <div key={`kontak-${route.query.toString()}`} className="page-enter">
          <KontakView key={route.query.toString()} />
        </div>
      );
    default:
      return (
        <div key="not-found" className="page-enter">
          <NotFoundView />
        </div>
      );
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
      <ComparisonBar />
    </QueryClientProvider>
  );
}
