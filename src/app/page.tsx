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
import { AdminServisView } from "@/views/admin/admin-servis-view";
import { AdminTestimoniView } from "@/views/admin/admin-testimoni-view";
import { AdminFaqView } from "@/views/admin/admin-faq-view";

import { ComparisonBar } from "@/components/site/comparison-bar";
import { JsonLd } from "@/components/site/json-ld";
import { dealerJsonLd } from "@/lib/jsonld";

function AppRoutes() {
  const route = useHashRoute();
  const [seg1, seg2, seg3] = route.segments;

  // ----- Admin (login berada DI LUAR shell terproteksi) -----
  if (seg1 === "admin") {
    if (seg2 === "login") return <AdminLoginView key="admin-login" />;
    if (seg2 === undefined) return <AdminDashboardView key="admin-dash" />;
    if (seg2 === "katalog") {
      if (seg3 === "tambah") return <AdminKatalogFormView key="admin-katalog-tambah" />;
      if (seg3) {
        // /admin/katalog/:id/edit
        return <AdminKatalogFormView key={`admin-katalog-${seg3}`} carId={seg3} />;
      }
      return <AdminKatalogView key="admin-katalog" />;
    }
    if (seg2 === "artikel") {
      if (seg3 === "tambah") return <AdminArtikelFormView key="admin-artikel-tambah" />;
      if (seg3) {
        // /admin/artikel/:id/edit
        return <AdminArtikelFormView key={`admin-artikel-${seg3}`} artikelId={seg3} />;
      }
      return <AdminArtikelView key="admin-artikel" />;
    }
    if (seg2 === "pesan") return <AdminPesanView key="admin-pesan" />;
    if (seg2 === "test-drive") return <AdminTestDriveView key="admin-td" />;
    if (seg2 === "servis") return <AdminServisView key="admin-servis" />;
    if (seg2 === "testimoni") return <AdminTestimoniView key="admin-testi" />;
    if (seg2 === "faq") return <AdminFaqView key="admin-faq" />;
    return <AdminDashboardView key="admin-dash-2" />;
  }

  // ----- Website publik -----
  switch (seg1) {
    case undefined:
      return <HomeView key="home" />;
    case "mobil":
      return seg2 ? (
        <MobilDetailView key={`mobil-${seg2}`} slug={seg2} />
      ) : (
        <MobilView key="mobil" />
      );
    case "bandingkan":
      return <BandingkanView key="bandingkan" />;
    case "artikel":
      return seg2 ? (
        <ArtikelDetailView key={`artikel-${seg2}`} slug={seg2} />
      ) : (
        <ArtikelView key="artikel" />
      );
    case "tentang-kami":
      return <TentangKamiView key="tentang" />;
    case "kontak":
      return <KontakView key={`kontak-${route.query.toString()}`} />;
    default:
      return <NotFoundView key="not-found" />;
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
      {/* Data terstruktur schema.org: identitas dealer (seluruh halaman) */}
      <JsonLd data={dealerJsonLd()} />
      <AppRoutes />
      <ComparisonBar />
    </QueryClientProvider>
  );
}
