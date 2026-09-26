"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, Car, FileText, Mail, Calendar, Star, LogOut, Menu, X, Globe } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { Link, useHashRoute, navigate } from "@/lib/router";
import { SuzukiLogo } from "@/components/site/header";
import { ChangePasswordDialog } from "@/components/admin/change-password-dialog";

const NAV: Array<{ to: string; label: string; icon: typeof Car; exact?: boolean; badgeKind?: "pesanBaru" | "testDrivePending" | "testimoniPending" }> = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/katalog", label: "Katalog Mobil", icon: Car },
  { to: "/admin/artikel", label: "Artikel", icon: FileText },
  { to: "/admin/pesan", label: "Pesan Masuk", icon: Mail, badgeKind: "pesanBaru" },
  { to: "/admin/test-drive", label: "Test Drive", icon: Calendar, badgeKind: "testDrivePending" },
  { to: "/admin/testimoni", label: "Testimoni", icon: Star, badgeKind: "testimoniPending" },
];

interface AdminStats {
  counts: {
    pesanBaru: number;
    testDrivePending: number;
    testimoniPending?: number;
  };
}

export function useAdminSession() {
  return useQuery({
    queryKey: ["admin", "me"],
    queryFn: () => apiGet<{ authenticated: boolean; admin?: { email: string; name: string } }>("/api/admin/me"),
    // Selalu segar saat mount — status auth tidak boleh dipaham dari cache basi
    staleTime: 0,
    refetchOnMount: "always",
    retry: false,
  });
}

export function AdminShell({ children }: { children: ReactNode }) {
  const route = useHashRoute();
  const qc = useQueryClient();
  const { data, isLoading } = useAdminSession();
  const [open, setOpen] = useState(false);

  // Badge notifikasi ringan — refresh tiap 60 detik selama admin aktif
  const statsQuery = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => apiGet<AdminStats>("/api/admin/stats"),
    enabled: !isLoading && !!data?.authenticated,
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: false,
  });
  const pesanBaru = statsQuery.data?.counts?.pesanBaru ?? 0;
  const tdPending = statsQuery.data?.counts?.testDrivePending ?? 0;
  const testiPending = statsQuery.data?.counts?.testimoniPending ?? 0;
  const badgeFor = (kind?: "pesanBaru" | "testDrivePending" | "testimoniPending") =>
    kind === "pesanBaru" ? pesanBaru : kind === "testDrivePending" ? tdPending : kind === "testimoniPending" ? testiPending : 0;

  // Guard: belum login → lempar ke halaman login
  useEffect(() => {
    if (!isLoading && data && !data.authenticated) {
      navigate("/admin/login");
    }
  }, [isLoading, data]);

  async function handleLogout() {
    try {
      await apiPost("/api/admin/logout");
    } catch {
      // abaikan error logout
    }
    qc.clear();
    navigate("/admin/login");
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-suzuki-light">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-suzuki-red/30 border-t-suzuki-red rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Memeriksa sesi admin…</p>
        </div>
      </div>
    );
  }

  if (!data?.authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-suzuki-light">
        <div className="text-center">
          <p className="text-muted-foreground text-sm mb-4">Mengalihkan ke halaman login…</p>
          <Link to="/admin/login" className="text-suzuki-red underline text-sm">
            Klik di sini jika tidak otomatis
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-suzuki-light">
      {/* Sidebar */}
      <aside
        className={`${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-suzuki-navy text-white flex flex-col transition-transform duration-200 shadow-xl`}
      >
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <Link to="/admin" className="block">
            <SuzukiLogo className="h-6 w-auto brightness-0 invert" />
            <p className="text-xs text-white/60 mt-2">Admin Panel</p>
          </Link>
          <button className="md:hidden p-1" onClick={() => setOpen(false)} aria-label="Tutup menu admin">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto" aria-label="Menu admin">
          {NAV.map((n) => {
            const active = n.exact ? route.path === n.to : route.path.startsWith(n.to);
            const Icon = n.icon;
            const badge = badgeFor(n.badgeKind);
            return (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                aria-label={badge > 0 ? `${n.label} — ${badge} butuh perhatian` : undefined}
                className={`relative flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-suzuki-red text-white font-medium"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" aria-hidden />
                {n.label}
                {badge > 0 && (
                  <span
                    className="badge-pop ml-auto min-w-5 h-5 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center bg-suzuki-red text-white ring-2 ring-suzuki-navy"
                    title={`${badge} butuh perhatian`}
                  >
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-1">
          <Link
            to="/"
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Globe className="w-4 h-4" aria-hidden />
            Lihat Website
          </Link>
          <div className="px-4 py-2">
            <p className="text-xs text-white/50 truncate">{data.admin?.name}</p>
            <p className="text-[11px] text-white/40 truncate">{data.admin?.email}</p>
          </div>
          <ChangePasswordDialog />
          <button
            onClick={() => void handleLogout()}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" aria-hidden />
            Logout
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-30 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Konten */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden sticky top-0 z-20 flex items-center justify-between p-4 bg-white border-b shadow-sm">
          <button onClick={() => setOpen(!open)} aria-label="Buka menu admin">
            {open ? <X className="w-6 h-6 text-suzuki-navy" /> : <Menu className="w-6 h-6 text-suzuki-navy" />}
          </button>
          <span className="font-bold text-suzuki-navy">Admin Suzuki BSB</span>
          <Link to="/" className="text-xs text-muted-foreground underline">
            Situs
          </Link>
        </header>
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-x-auto">{children}</main>
        <footer className="px-6 py-4 border-t bg-white text-xs text-muted-foreground">
          Panel Admin Suzuki BSB Semarang — kelola katalog, artikel, pesan, dan test drive.
        </footer>
      </div>
    </div>
  );
}
