"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Search, ExternalLink, Eye, EyeOff, Download } from "lucide-react";
import { toast } from "sonner";
import { apiDelete, apiGet, apiPut } from "@/lib/api";
import { Link, usePageMeta, navigate } from "@/lib/router";
import { AdminShell } from "./admin-shell";
import type { Mobil } from "@/lib/site-utils";
import { buildCsv, downloadCsv, fileDatestamp } from "@/lib/csv";

export function AdminKatalogView() {
  usePageMeta("Katalog Mobil — Admin Suzuki BSB");
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "mobil"],
    queryFn: () => apiGet<{ cars: Mobil[] }>("/api/admin/cars"),
  });

  async function onDelete(id: string, nama: string) {
    if (!window.confirm(`Hapus ${nama}? Tindakan ini tidak bisa dibatalkan.`)) return;
    setDeleting(id);
    try {
      await apiDelete("/api/admin/cars", { id });
      await qc.invalidateQueries({ queryKey: ["admin"] });
      await qc.invalidateQueries({ queryKey: ["mobil"] });
      toast.success("Mobil dihapus dari katalog");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menghapus");
    } finally {
      setDeleting(null);
    }
  }

  async function togglePublish(car: Mobil) {
    try {
      await apiPut("/api/admin/cars", { ...car, is_published: !car.is_published });
      await qc.invalidateQueries({ queryKey: ["admin"] });
      await qc.invalidateQueries({ queryKey: ["mobil"] });
      toast.success(
        car.is_published ? `${car.nama} disembunyikan dari website` : `${car.nama} kini tampil di website`,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal mengubah status");
    }
  }

  const filtered = useMemo(() => {
    const all = data?.cars ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (m) =>
        m.nama.toLowerCase().includes(q) ||
        m.kategori_label.toLowerCase().includes(q) ||
        (m.harga_label ?? "").toLowerCase().includes(q),
    );
  }, [data, search]);

  function exportCsv() {
    if (filtered.length === 0) {
      toast.info("Tidak ada mobil untuk diexport sesuai pencarian saat ini.");
      return;
    }
    const csv = buildCsv(filtered, [
      { header: "Nama", value: (m) => m.nama },
      { header: "Slug", value: (m) => m.slug },
      { header: "Kategori", value: (m) => m.kategori_label },
      { header: "Harga Mulai (Rp)", value: (m) => m.harga_mulai ?? "" },
      { header: "Harga Label", value: (m) => m.harga_label ?? "" },
      { header: "Kursi", value: (m) => m.seater ?? "" },
      { header: "Bahan Bakar", value: (m) => m.fuel ?? "" },
      { header: "Transmisi", value: (m) => m.transmission ?? "" },
      { header: "Jumlah Warna", value: (m) => m.warna.length },
      { header: "Tampil", value: (m) => (m.is_published ? "Ya" : "Tidak") },
      { header: "Urutan", value: (m) => m.urutan },
    ]);
    downloadCsv(`katalog-mobil-suzuki-bsb-${fileDatestamp()}.csv`, csv);
    toast.success(`${filtered.length} mobil diexport ke CSV.`);
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-suzuki-navy">Katalog Mobil</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Kelola daftar mobil yang tampil di website — tambah, edit, urutan, dan tampil/sembunyi.
            </p>
          </div>
          <Link
            to="/admin/katalog/tambah"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-suzuki-red text-white rounded-lg text-sm font-medium hover:bg-suzuki-red/90 transition-colors"
          >
            <Plus className="w-4 h-4" aria-hidden />
            Tambah Mobil
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-b">
            <h2 className="font-semibold text-suzuki-navy">
              Daftar Mobil <span className="text-muted-foreground font-normal">({filtered.length})</span>
            </h2>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <div className="relative sm:w-72">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                  aria-hidden
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama / kategori / harga…"
                  aria-label="Cari mobil"
                  className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-suzuki-red/50"
                />
              </div>
              <button
                onClick={exportCsv}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border border-border bg-white text-sm text-suzuki-navy font-medium hover:border-suzuki-red/40 hover:text-suzuki-red transition-colors"
              >
                <Download className="w-4 h-4" aria-hidden />
                Export CSV
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Memuat katalog…</div>
          ) : isError ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground text-sm mb-2">Gagal memuat katalog.</p>
              <button onClick={() => void refetch()} className="text-suzuki-red underline text-sm">
                Coba lagi
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground text-sm mb-3">
                {search ? "Tidak ada mobil yang cocok dengan pencarian." : "Belum ada mobil di katalog."}
              </p>
              {!search && (
                <Link to="/admin/katalog/tambah" className="text-suzuki-red underline text-sm">
                  Tambah mobil pertama
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* Tabel (tablet ke atas) */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="min-w-[760px] w-full text-sm" aria-label="Tabel katalog mobil">
                  <thead className="bg-muted text-left">
                    <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-4 py-3">Mobil</th>
                      <th className="px-4 py-3">Kategori</th>
                      <th className="px-4 py-3">Harga</th>
                      <th className="px-4 py-3">Urutan</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((m) => (
                      <tr key={m.id} className="border-t hover:bg-suzuki-light/60 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {m.gambar_utama ? (
                              <img
                                src={m.gambar_utama}
                                alt={m.nama}
                                className="w-14 h-10 object-cover rounded border bg-muted"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-14 h-10 bg-muted rounded" />
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-suzuki-navy truncate">
                                {m.nama}
                                {m.is_new && (
                                  <span className="ml-2 text-[10px] bg-suzuki-navy text-white px-1.5 py-0.5 rounded align-middle">
                                    NEW
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">/{m.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{m.kategori_label}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{m.harga_label ?? "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{m.urutan}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => void togglePublish(m)}
                            title={m.is_published ? "Sembunyikan dari website" : "Tampilkan di website"}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                              m.is_published
                                ? "bg-green-100 text-green-800 hover:bg-green-200"
                                : "bg-red-100 text-red-700 hover:bg-red-200"
                            }`}
                          >
                            {m.is_published ? (
                              <>
                                <Eye className="w-3.5 h-3.5" aria-hidden /> Tampil
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3.5 h-3.5" aria-hidden /> Disembunyikan
                              </>
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="inline-flex gap-1">
                            <Link
                              to={`/mobil/${m.slug}`}
                              title="Lihat di website"
                              className="p-2 text-muted-foreground hover:text-suzuki-navy rounded-lg hover:bg-muted transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                            <Link
                              to={`/admin/katalog/${m.id}/edit`}
                              title="Edit mobil"
                              className="p-2 text-muted-foreground hover:text-suzuki-navy rounded-lg hover:bg-muted transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => void onDelete(m.id, m.nama)}
                              disabled={deleting === m.id}
                              title="Hapus mobil"
                              className="p-2 text-muted-foreground hover:text-suzuki-red rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Kartu (mobile) */}
              <div className="sm:hidden divide-y">
                {filtered.map((m) => (
                  <div key={m.id} className="p-4 flex items-start gap-3">
                    {m.gambar_utama ? (
                      <img
                        src={m.gambar_utama}
                        alt={m.nama}
                        className="w-16 h-12 object-cover rounded border bg-muted shrink-0"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-16 h-12 bg-muted rounded shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-suzuki-navy truncate">
                          {m.nama}
                          {m.is_new && (
                            <span className="ml-1.5 text-[10px] bg-suzuki-navy text-white px-1.5 py-0.5 rounded">
                              NEW
                            </span>
                          )}
                        </p>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${
                            m.is_published ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"
                          }`}
                        >
                          {m.is_published ? "Tampil" : "Disembunyikan"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {m.kategori_label} · {m.harga_label ?? "—"}
                      </p>
                      <div className="mt-2.5 flex flex-wrap gap-2">
                        <Link
                          to={`/admin/katalog/${m.id}/edit`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-white text-xs text-suzuki-navy"
                        >
                          <Pencil className="w-3.5 h-3.5" aria-hidden /> Edit
                        </Link>
                        <button
                          onClick={() => void togglePublish(m)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-white text-xs text-suzuki-navy"
                        >
                          {m.is_published ? (
                            <>
                              <EyeOff className="w-3.5 h-3.5" aria-hidden /> Sembunyikan
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5" aria-hidden /> Tampilkan
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => void onDelete(m.id, m.nama)}
                          disabled={deleting === m.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-white text-xs text-suzuki-red disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden /> Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
