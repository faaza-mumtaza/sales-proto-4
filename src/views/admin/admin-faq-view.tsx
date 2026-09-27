"use client";

// Admin: kelola FAQ (tambah/edit/hapus/urutan/tampil-sembunyi).

import { useMemo, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { HelpCircle, Trash2, Search, Plus, Pencil, Eye, EyeOff, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from "@/lib/api";
import { usePageMeta } from "@/lib/router";
import { useSelection } from "@/lib/use-selection";
import { BulkActionBar } from "@/components/admin/bulk-action-bar";
import { AdminShell } from "./admin-shell";
import { FAQ_KATEGORI_LABEL } from "@/lib/site-utils";

interface FaqAdmin {
  id: string;
  kategori: string;
  pertanyaan: string;
  jawaban: string;
  urutan: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

const KATEGORI_WARNA: Record<string, string> = {
  umum: "bg-suzuki-navy/10 text-suzuki-navy",
  pembelian: "bg-suzuki-red/10 text-suzuki-red",
  purnajual: "bg-green-100 text-green-700",
};

interface FormState {
  id?: string;
  kategori: string;
  pertanyaan: string;
  jawaban: string;
  urutan: number;
  is_published: boolean;
}

const EMPTY_FORM: FormState = {
  kategori: "umum",
  pertanyaan: "",
  jawaban: "",
  urutan: 0,
  is_published: true,
};

export function AdminFaqView() {
  usePageMeta("FAQ — Admin Suzuki BSB");
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterKategori, setFilterKategori] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "faqs"],
    queryFn: () => apiGet<{ faqs: FaqAdmin[]; counts: { published: number; hidden: number } }>(
      "/api/admin/faqs",
    ),
  });

  const faqs = data?.faqs ?? [];
  const counts = data?.counts;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return faqs.filter((f) => {
      const cocokKategori = filterKategori === "all" || f.kategori === filterKategori;
      const cocokCari =
        q === "" ||
        f.pertanyaan.toLowerCase().includes(q) ||
        f.jawaban.toLowerCase().includes(q);
      return cocokKategori && cocokCari;
    });
  }, [faqs, search, filterKategori]);

  // Daftar final yang tampil (filter kartu ringkasan tampil/sembunyi + urutan)
  // — dipakai juga untuk seleksi aksi massal agar konsisten dengan yang terlihat.
  const visible = useMemo(() => {
    let list = filtered;
    if (filterKategori === "__published__") list = list.filter((f) => f.is_published);
    if (filterKategori === "__hidden__") list = list.filter((f) => !f.is_published);
    return [...list].sort((a, b) => a.urutan - b.urutan || a.created_at.localeCompare(b.created_at));
  }, [filtered, filterKategori]);

  const sortedAll = useMemo(
    () => [...faqs].sort((a, b) => a.urutan - b.urutan || a.created_at.localeCompare(b.created_at)),
    [faqs],
  );

  // Seleksi item untuk aksi massal
  const sel = useSelection(visible);

  async function bulkPublish(isPublished: boolean) {
    if (sel.count === 0) return;
    setBulkBusy(true);
    try {
      const res = await apiPatch<{ updated: number }>("/api/admin/faqs", {
        ids: [...sel.selected],
        is_published: isPublished,
      });
      await qc.invalidateQueries({ queryKey: ["admin", "faqs"] });
      await qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      await qc.invalidateQueries({ queryKey: ["faqs", "public"] });
      toast.success(`${res.updated} FAQ ${isPublished ? "ditampilkan" : "disembunyikan"}`);
      sel.clear();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal mengubah status FAQ secara massal");
    } finally {
      setBulkBusy(false);
    }
  }

  async function bulkDelete() {
    if (sel.count === 0) return;
    if (!window.confirm(`Hapus ${sel.count} FAQ terpilih? Tindakan ini tidak bisa dibatalkan.`)) return;
    setBulkBusy(true);
    try {
      const res = await apiDelete<{ deleted: number }>("/api/admin/faqs", {
        ids: [...sel.selected].join(","),
      });
      await qc.invalidateQueries({ queryKey: ["admin", "faqs"] });
      await qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      await qc.invalidateQueries({ queryKey: ["faqs", "public"] });
      toast.success(`${res.deleted} FAQ dihapus`);
      sel.clear();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menghapus FAQ secara massal");
    } finally {
      setBulkBusy(false);
    }
  }

  function openCreate() {
    const urutanBaru = faqs.length > 0 ? Math.max(...faqs.map((f) => f.urutan)) + 1 : 1;
    setForm({ ...EMPTY_FORM, urutan: urutanBaru });
    setError(null);
    setDialogOpen(true);
  }

  function openEdit(f: FaqAdmin) {
    setForm({
      id: f.id,
      kategori: f.kategori,
      pertanyaan: f.pertanyaan,
      jawaban: f.jawaban,
      urutan: f.urutan,
      is_published: f.is_published,
    });
    setError(null);
    setDialogOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.pertanyaan.trim().length < 8) {
      setError("Pertanyaan minimal 8 karakter.");
      return;
    }
    if (form.jawaban.trim().length < 10) {
      setError("Jawaban minimal 10 karakter.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...(form.id ? { id: form.id } : {}),
        kategori: form.kategori,
        pertanyaan: form.pertanyaan.trim(),
        jawaban: form.jawaban.trim(),
        urutan: form.urutan,
        is_published: form.is_published,
      };
      if (form.id) {
        await apiPut("/api/admin/faqs", payload);
        toast.success("FAQ diperbarui");
      } else {
        await apiPost("/api/admin/faqs", payload);
        toast.success("FAQ ditambahkan");
      }
      setDialogOpen(false);
      await qc.invalidateQueries({ queryKey: ["admin", "faqs"] });
      await qc.invalidateQueries({ queryKey: ["faqs", "public"] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal menyimpan FAQ";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function onToggle(f: FaqAdmin) {
    try {
      await apiPatch("/api/admin/faqs", { id: f.id, is_published: !f.is_published });
      await qc.invalidateQueries({ queryKey: ["admin", "faqs"] });
      await qc.invalidateQueries({ queryKey: ["faqs", "public"] });
      toast.success(f.is_published ? "FAQ disembunyikan dari website" : "FAQ ditampilkan di website");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal mengubah status");
    }
  }

  async function onDelete(f: FaqAdmin) {
    if (!window.confirm(`Hapus FAQ "${f.pertanyaan}" secara permanen?`)) return;
    try {
      await apiDelete("/api/admin/faqs", { id: f.id });
      await qc.invalidateQueries({ queryKey: ["admin", "faqs"] });
      await qc.invalidateQueries({ queryKey: ["faqs", "public"] });
      toast.success("FAQ dihapus");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menghapus FAQ");
    }
  }

  /** Tukar urutan dua FAQ bersebelahan pada daftar terurut, lalu simpan. */
  async function onMove(f: FaqAdmin, arah: -1 | 1) {
    const urutList = [...faqs].sort((a, b) => a.urutan - b.urutan || a.created_at.localeCompare(b.created_at));
    const idx = urutList.findIndex((x) => x.id === f.id);
    const tukar = urutList[idx + arah];
    if (!tukar) return;
    try {
      // Tukar nilai urutan kedua item
      await apiPut("/api/admin/faqs", {
        id: f.id,
        kategori: f.kategori,
        pertanyaan: f.pertanyaan,
        jawaban: f.jawaban,
        urutan: tukar.urutan,
        is_published: f.is_published,
      });
      await apiPut("/api/admin/faqs", {
        id: tukar.id,
        kategori: tukar.kategori,
        pertanyaan: tukar.pertanyaan,
        jawaban: tukar.jawaban,
        urutan: f.urutan,
        is_published: tukar.is_published,
      });
      await qc.invalidateQueries({ queryKey: ["admin", "faqs"] });
      await qc.invalidateQueries({ queryKey: ["faqs", "public"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal mengubah urutan");
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-suzuki-navy">FAQ (Pertanyaan Umum)</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Kelola daftar pertanyaan umum yang tampil di halaman Kontak website.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 bg-suzuki-red hover:bg-suzuki-red/90 text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-all hover:shadow-lg hover:shadow-suzuki-red/30 active:scale-95"
          >
            <Plus className="w-4 h-4" aria-hidden />
            Tambah FAQ
          </button>
        </div>

        {/* Ringkasan */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { id: "all", label: "Total", n: faqs.length },
            { id: "published", label: "Tampil di website", n: counts?.published ?? 0 },
            { id: "hidden", label: "Disembunyikan", n: counts?.hidden ?? 0 },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() =>
                setFilterKategori(
                  s.id === "all"
                    ? "all"
                    : s.id === "published"
                      ? "__published__"
                      : "__hidden__",
                )
              }
              className={`rounded-xl border p-4 text-left transition-all ${
                (s.id === "all" && filterKategori === "all") ||
                (s.id === "published" && filterKategori === "__published__") ||
                (s.id === "hidden" && filterKategori === "__hidden__")
                  ? "border-suzuki-red/50 bg-white shadow-sm ring-1 ring-suzuki-red/30"
                  : "border-border bg-white/60 hover:border-suzuki-navy/30"
              }`}
              aria-pressed={s.id === "all" ? filterKategori === "all" : s.id === "published" ? filterKategori === "__published__" : filterKategori === "__hidden__"}
            >
              <p className="text-2xl font-bold text-suzuki-navy">{s.n}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </button>
          ))}
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari pertanyaan / jawaban…"
              aria-label="Cari FAQ"
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-suzuki-red/50"
            />
          </div>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter kategori FAQ">
            {["all", "umum", "pembelian", "purnajual"].map((k) => (
              <button
                key={k}
                onClick={() => setFilterKategori(k === "all" ? "all" : k)}
                aria-pressed={filterKategori === k || (k === "all" && filterKategori === "all")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all active:scale-95 ${
                  (k === "all" && filterKategori === "all") || filterKategori === k
                    ? "bg-suzuki-navy text-white border-suzuki-navy"
                    : "bg-white text-muted-foreground border-border hover:border-suzuki-navy/40 hover:text-suzuki-navy"
                }`}
              >
                {k === "all" ? "Semua Kategori" : (FAQ_KATEGORI_LABEL[k] ?? k)}
              </button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground sm:ml-auto" aria-live="polite">
            {filtered.length} FAQ
          </p>
        </div>

        {/* Bilah aksi massal — tampil saat ada item terpilih */}
        <BulkActionBar
          count={sel.count}
          total={visible.length}
          onSelectAll={sel.selectAll}
          onClear={sel.clear}
          statuses={[
            { value: "true", label: "Tampilkan" },
            { value: "false", label: "Sembunyikan" },
          ]}
          onBulkStatus={(s) => void bulkPublish(s === "true")}
          onBulkDelete={() => void bulkDelete()}
          busy={bulkBusy}
        />

        {/* Daftar */}
        {isLoading ? (
          <div className="bg-white rounded-xl border border-border p-8 text-center text-muted-foreground text-sm">
            Memuat FAQ…
          </div>
        ) : isError ? (
          <div className="bg-white rounded-xl border border-border p-8 text-center">
            <p className="text-muted-foreground text-sm mb-2">Gagal memuat FAQ.</p>
            <button onClick={() => void refetch()} className="text-suzuki-red underline text-sm">
              Coba lagi
            </button>
          </div>
        ) : visible.length === 0 ? (
          <div className="bg-white rounded-xl border border-border p-10 text-center">
            <HelpCircle className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" aria-hidden />
            <p className="text-muted-foreground text-sm">
              {faqs.length === 0
                ? "Belum ada FAQ. Klik \"Tambah FAQ\" untuk membuat pertanyaan pertama."
                : "Tidak ada FAQ yang cocok dengan filter."}
            </p>
          </div>
        ) : (
          <>
            {/* Header pilih-semua dengan status indeterminate */}
            <div className="flex items-center gap-3 bg-white rounded-xl border border-border px-4 py-3">
              <input
                type="checkbox"
                checked={sel.allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = sel.someSelected;
                }}
                onChange={sel.toggleAll}
                aria-label="Pilih semua FAQ"
                className="w-4 h-4 cursor-pointer"
              />
              <span className="text-sm font-medium text-suzuki-navy">
                Pilih semua ({visible.length} FAQ)
              </span>
            </div>
            <Accordion type="multiple" className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
              {visible.map((f) => {
                const idxGlobal = sortedAll.findIndex((x) => x.id === f.id);
                const isSel = sel.selected.has(f.id);
                return (
                  <AccordionItem
                    key={f.id}
                    value={f.id}
                    className={`border-border relative ${isSel ? "row-selected" : ""}`}
                  >
                    {/* Checkbox aksi massal — menumpuk di gutter kiri */}
                    <div className="absolute left-3 sm:left-3.5 top-6 z-10">
                      <input
                        type="checkbox"
                        checked={isSel}
                        onChange={() => sel.toggle(f.id)}
                        aria-label={`Pilih FAQ: ${f.pertanyaan.slice(0, 60)}`}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </div>
                    <AccordionTrigger className="px-4 pl-10 sm:pl-11 sm:pr-5 py-4 hover:no-underline hover:bg-suzuki-red/5 transition-colors [&>svg]:hidden">
                      <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0 flex-col sm:flex-row">
                        <span className="flex items-center gap-2 shrink-0">
                          <span
                            className="text-xs font-bold w-8 h-8 rounded-lg bg-muted text-suzuki-navy flex items-center justify-center"
                            aria-hidden
                            title={`Urutan ke-${f.urutan}`}
                          >
                            {f.urutan}
                          </span>
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${KATEGORI_WARNA[f.kategori] ?? "bg-muted text-muted-foreground"}`}>
                            {FAQ_KATEGORI_LABEL[f.kategori] ?? f.kategori}
                          </span>
                          {!f.is_published && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">
                              Disembunyikan
                            </span>
                          )}
                        </span>
                        <span className="font-semibold text-suzuki-navy text-sm truncate text-left">
                          {f.pertanyaan}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 sm:px-5 pb-4 pt-0">
                      <p className="text-sm text-muted-foreground leading-relaxed border-l-2 border-suzuki-red/30 pl-4 mb-4">
                        {f.jawaban}
                      </p>
                      <div className="flex flex-wrap gap-2 pl-4">
                        <button
                          onClick={() => openEdit(f)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border text-suzuki-navy hover:bg-muted text-xs font-medium rounded-full transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" aria-hidden />
                          Edit
                        </button>
                        <button
                          onClick={() => void onToggle(f)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                            f.is_published
                              ? "border border-amber-200 text-amber-700 hover:bg-amber-50"
                              : "bg-green-600 text-white hover:bg-green-700"
                          }`}
                        >
                          {f.is_published ? (
                            <>
                              <EyeOff className="w-3.5 h-3.5" aria-hidden />
                              Sembunyikan
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5" aria-hidden />
                              Tampilkan
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => void onMove(f, -1)}
                          disabled={idxGlobal === 0}
                          title="Naikkan urutan"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-border text-muted-foreground hover:text-suzuki-navy hover:bg-muted text-xs rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                          <ArrowUp className="w-3.5 h-3.5" aria-hidden />
                        </button>
                        <button
                          onClick={() => void onMove(f, 1)}
                          disabled={idxGlobal === sortedAll.length - 1}
                          title="Turunkan urutan"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-border text-muted-foreground hover:text-suzuki-navy hover:bg-muted text-xs rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                          <ArrowDown className="w-3.5 h-3.5" aria-hidden />
                        </button>
                        <button
                          onClick={() => void onDelete(f)}
                          title="Hapus FAQ"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium rounded-full transition-colors ml-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden />
                          Hapus
                        </button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </>
        )}

        {/* Dialog tambah/edit */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{form.id ? "Edit FAQ" : "Tambah FAQ Baru"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label htmlFor="faq-kategori" className="text-sm font-medium text-suzuki-navy mb-1.5 block">
                  Kategori
                </label>
                <Select value={form.kategori} onValueChange={(v) => setForm((f) => ({ ...f, kategori: v }))}>
                  <SelectTrigger id="faq-kategori" className="w-full">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FAQ_KATEGORI_LABEL).map(([k, label]) => (
                      <SelectItem key={k} value={k}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="faq-pertanyaan" className="text-sm font-medium text-suzuki-navy mb-1.5 block">
                  Pertanyaan <span className="text-suzuki-red">*</span>
                </label>
                <input
                  id="faq-pertanyaan"
                  value={form.pertanyaan}
                  onChange={(e) => setForm((f) => ({ ...f, pertanyaan: e.target.value }))}
                  maxLength={200}
                  placeholder="mis. Berapa uang muka minimal untuk kredit?"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-suzuki-red/50 focus:border-suzuki-red/60"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">{form.pertanyaan.length}/200 karakter</p>
              </div>
              <div>
                <label htmlFor="faq-jawaban" className="text-sm font-medium text-suzuki-navy mb-1.5 block">
                  Jawaban <span className="text-suzuki-red">*</span>
                </label>
                <textarea
                  id="faq-jawaban"
                  value={form.jawaban}
                  onChange={(e) => setForm((f) => ({ ...f, jawaban: e.target.value }))}
                  maxLength={1500}
                  rows={5}
                  placeholder="Tulis jawaban yang jelas dan membantu calon pembeli…"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-suzuki-red/50 focus:border-suzuki-red/60 resize-y"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">{form.jawaban.length}/1500 karakter</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label htmlFor="faq-urutan" className="text-sm font-medium text-suzuki-navy mb-1.5 block">
                    Urutan tampil
                  </label>
                  <input
                    id="faq-urutan"
                    type="number"
                    min={0}
                    max={999}
                    value={form.urutan}
                    onChange={(e) => setForm((f) => ({ ...f, urutan: Number(e.target.value) }))}
                    className="w-28 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-suzuki-red/50"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer select-none mt-5">
                  <input
                    type="checkbox"
                    checked={form.is_published}
                    onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))}
                    className="w-4 h-4 accent-[#e32322]"
                  />
                  Tampilkan di website
                </label>
              </div>
              {error && (
                <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
              <DialogFooter className="gap-2">
                <button
                  type="button"
                  onClick={() => setDialogOpen(false)}
                  className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-suzuki-red hover:bg-suzuki-red/90 text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-60 active:scale-95"
                >
                  {saving ? "Menyimpan…" : form.id ? "Simpan Perubahan" : "Tambah FAQ"}
                </button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminShell>
  );
}
