"use client";

import { useQuery } from "@tanstack/react-query";
import { Car, FileText, Mail, Calendar, Star, ArrowRight, CheckCircle2, Clock, Eye, TrendingUp, Wrench } from "lucide-react";
import { apiGet } from "@/lib/api";
import { Link, usePageMeta } from "@/lib/router";
import { AdminShell } from "./admin-shell";
import { TrendChart, type TrendPoint } from "@/components/admin/trend-chart";
import { CountUp } from "@/components/site/count-up";
import { formatDateID } from "@/lib/site-utils";

interface Stats {
  counts: {
    mobilTotal: number;
    mobilAktif: number;
    artikelTotal: number;
    artikelPublished: number;
    pesanBaru: number;
    testDrivePending: number;
    servisPending?: number;
    servisTotal?: number;
    testimoniPending?: number;
    testimoniApproved?: number;
  };
  trend: TrendPoint[];
  recentPesan: Array<{
    id: string;
    nama_lengkap: string;
    no_telepon: string;
    subjek: string | null;
    pesan: string;
    status: string;
    created_at: string;
  }>;
  upcomingTestDrive: Array<{
    id: string;
    nama_lengkap: string;
    no_telepon: string;
    mobil_pilihan: string;
    tanggal_diinginkan: string;
    waktu_diinginkan: string;
    status: string;
  }>;
}

export function AdminDashboardView() {
  usePageMeta("Dashboard Admin — Suzuki BSB");
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => apiGet<Stats>("/api/admin/stats"),
  });

  return (
    <AdminShell>
      <div className="space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-suzuki-navy">Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Ringkasan aktivitas dealer hari ini.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/admin/katalog/tambah"
              className="inline-flex items-center gap-2 px-4 py-2 bg-suzuki-red text-white rounded-lg text-sm font-medium hover:bg-suzuki-red/90 transition-colors"
            >
              + Mobil
            </Link>
            <Link
              to="/admin/artikel/tambah"
              className="inline-flex items-center gap-2 px-4 py-2 bg-suzuki-navy text-white rounded-lg text-sm font-medium hover:bg-suzuki-navy/90 transition-colors"
            >
              + Artikel
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-5 border border-border">
                <div className="w-10 h-10 bg-muted rounded-lg animate-pulse mb-3" />
                <div className="h-7 w-16 bg-muted rounded animate-pulse mb-2" />
                <div className="h-3 w-24 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : isError || !data ? (
          <div className="bg-white rounded-xl border border-border p-8 text-center">
            <p className="text-muted-foreground mb-3">Gagal memuat statistik.</p>
            <button
              onClick={() => void refetch()}
              className="text-suzuki-red underline text-sm"
            >
              Coba lagi
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <StatCard
                label="Mobil Aktif"
                value={data.counts.mobilAktif}
                sub={`dari ${data.counts.mobilTotal} total`}
                icon={Car}
                color="bg-suzuki-red"
                to="/admin/katalog"
              />
              <StatCard
                label="Artikel Tayang"
                value={data.counts.artikelPublished}
                sub={`dari ${data.counts.artikelTotal} total`}
                icon={FileText}
                color="bg-purple-500"
                to="/admin/artikel"
              />
              <StatCard
                label="Pesan Baru"
                value={data.counts.pesanBaru}
                sub="perlu ditindaklanjuti"
                icon={Mail}
                color="bg-orange-500"
                to="/admin/pesan"
              />
              <StatCard
                label="Booking Baru"
                value={data.counts.testDrivePending}
                sub="menunggu konfirmasi"
                icon={Calendar}
                color="bg-green-600"
                to="/admin/test-drive"
              />
              <StatCard
                label="Booking Servis"
                value={data.counts.servisPending ?? 0}
                sub={`${data.counts.servisTotal ?? 0} total · workshop`}
                icon={Wrench}
                color="bg-teal-600"
                to="/admin/servis"
              />
              <StatCard
                label="Testimoni"
                value={data.counts.testimoniPending ?? 0}
                sub={`${data.counts.testimoniApproved ?? 0} tayang · menunggu moderasi`}
                icon={Star}
                color="bg-amber-500"
                to="/admin/testimoni"
              />
            </div>

            {/* Tren interaksi 6 bulan */}
            {data.trend && data.trend.length > 0 && <TrendChart data={data.trend} />}

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Pesan terbaru */}
              <div className="bg-white rounded-xl border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-suzuki-navy">Pesan Terbaru</h2>
                  <Link
                    to="/admin/pesan"
                    className="inline-flex items-center gap-1 text-xs text-suzuki-red font-medium hover:gap-2 transition-all"
                  >
                    Semua Pesan <ArrowRight className="w-3.5 h-3.5" aria-hidden />
                  </Link>
                </div>
                {data.recentPesan.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">Belum ada pesan.</p>
                ) : (
                  <ul className="max-h-80 overflow-y-auto scroll-thin pr-1 space-y-3">
                    {data.recentPesan.map((p) => (
                      <li key={p.id} className="text-sm border-b pb-3 last:border-0">
                        <div className="flex items-center justify-between gap-2">
                          <strong className="text-suzuki-navy truncate">{p.nama_lengkap}</strong>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                              p.status === "BARU" ? "bg-suzuki-red text-white" : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {p.status}
                          </span>
                        </div>
                        <p className="text-muted-foreground line-clamp-2 mt-1">{p.pesan}</p>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {formatDateID(p.created_at)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Jadwal test drive terdekat */}
              <div className="bg-white rounded-xl border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-suzuki-navy">Jadwal Test Drive Terdekat</h2>
                  <Link
                    to="/admin/test-drive"
                    className="inline-flex items-center gap-1 text-xs text-suzuki-red font-medium hover:gap-2 transition-all"
                  >
                    Semua Jadwal <ArrowRight className="w-3.5 h-3.5" aria-hidden />
                  </Link>
                </div>
                {data.upcomingTestDrive.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">Belum ada booking test drive.</p>
                ) : (
                  <ul className="max-h-80 overflow-y-auto scroll-thin pr-1 space-y-3">
                    {data.upcomingTestDrive.map((t) => (
                      <li key={t.id} className="text-sm border-b pb-3 last:border-0">
                        <div className="flex items-center justify-between gap-2">
                          <strong className="text-suzuki-navy truncate">{t.nama_lengkap}</strong>
                          <span
                            className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full shrink-0 ${
                              t.status === "CONFIRMED"
                                ? "bg-green-100 text-green-800"
                                : "bg-orange-100 text-orange-800"
                            }`}
                          >
                            {t.status === "CONFIRMED" ? (
                              <CheckCircle2 className="w-3 h-3" aria-hidden />
                            ) : (
                              <Clock className="w-3 h-3" aria-hidden />
                            )}
                            {t.status}
                          </span>
                        </div>
                        <p className="text-muted-foreground mt-1">
                          {t.mobil_pilihan} · {formatDateID(t.tanggal_diinginkan)} · {t.waktu_diinginkan} WIB
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-r from-suzuki-navy to-suzuki-navy/80 rounded-xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                  <TrendingUp className="w-6 h-6" aria-hidden />
                </div>
                <div>
                  <h3 className="font-bold">Tips mengelola website</h3>
                  <p className="text-white/70 text-sm mt-0.5">
                    Setiap perubahan di panel ini langsung tampil di website publik — tanpa deploy ulang.
                  </p>
                </div>
              </div>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-suzuki-navy rounded-lg text-sm font-semibold hover:bg-white/90 transition-colors shrink-0"
              >
                <Eye className="w-4 h-4" aria-hidden />
                Lihat Website
              </Link>
            </div>
          </>
        )}
      </div>
    </AdminShell>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  to,
}: {
  label: string;
  value: number;
  sub: string;
  icon: typeof Car;
  color: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="bg-white rounded-xl p-5 border border-border hover:shadow-md hover:-translate-y-0.5 transition-all group"
    >
      <div className={`w-10 h-10 ${color} text-white rounded-lg flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5" aria-hidden />
      </div>
      <p className="text-2xl font-bold text-suzuki-navy group-hover:text-suzuki-red transition-colors">
        <CountUp value={value} duration={800} />
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        {label}
        <span className="block text-[11px] opacity-75">{sub}</span>
      </p>
    </Link>
  );
}
