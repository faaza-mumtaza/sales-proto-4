"use client";

import { useState } from "react";
import slugify from "slugify";
import { toast } from "sonner";
import { Plus, Trash2, Eye, EyeOff, Save, Palette, Image as ImageIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { apiPost, apiPut } from "@/lib/api";
import { ImageUploader, GalleryUploader } from "./image-uploader";
import { WarnaImageInput } from "./warna-image-input";
import { navigate } from "@/lib/router";
import type { Mobil, SpecItem, WarnaItem } from "@/lib/site-utils";

function cleanSlug(value: string) {
  return slugify(value, { lower: true, strict: true });
}

function normalizeNullable(value: string | null | undefined) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed ? trimmed : null;
}

export interface CarFormPayload {
  id?: string;
  nama: string;
  slug: string;
  kategori: "passenger" | "commercial";
  kategori_label: string;
  harga_mulai: number | null;
  harga_label: string | null;
  seater: number | null;
  fuel: string | null;
  transmission: string | null;
  deskripsi: string | null;
  spesifikasi: SpecItem[];
  gambar_utama: string | null;
  galeri_gambar: string[];
  warna: WarnaItem[];
  is_new: boolean;
  is_published: boolean;
  urutan: number;
}

export function CarForm({ initial }: { initial?: Mobil }) {
  const qc = useQueryClient();
  const [pending, setPending] = useState(false);
  const [preview, setPreview] = useState(false);
  const [form, setForm] = useState<CarFormPayload>({
    id: initial?.id,
    nama: initial?.nama ?? "",
    slug: initial?.slug ?? "",
    kategori: (initial?.kategori as "passenger" | "commercial") ?? "passenger",
    kategori_label: initial?.kategori_label ?? "",
    harga_mulai: initial?.harga_mulai ?? null,
    harga_label: initial?.harga_label ?? "",
    seater: initial?.seater ?? null,
    fuel: initial?.fuel ?? "",
    transmission: initial?.transmission ?? "",
    deskripsi: initial?.deskripsi ?? "",
    spesifikasi: initial?.spesifikasi ?? [{ label: "", value: "" }],
    gambar_utama: initial?.gambar_utama ?? null,
    galeri_gambar: initial?.galeri_gambar ?? [],
    warna: initial?.warna ?? [],
    is_new: initial?.is_new ?? false,
    is_published: initial?.is_published ?? true,
    urutan: initial?.urutan ?? 0,
  });

  function setSpec(index: number, patch: Partial<SpecItem>) {
    setForm((f) => ({
      ...f,
      spesifikasi: f.spesifikasi.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    }));
  }

  function setWarna(index: number, patch: Partial<WarnaItem>) {
    setForm((f) => ({
      ...f,
      warna: f.warna.map((w, i) => (i === index ? { ...w, ...patch } : w)),
    }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    try {
      const slug = cleanSlug(form.slug || form.nama);
      if (!slug) throw new Error("Slug wajib diisi.");
      const hargaMulai = form.harga_mulai ? Number(form.harga_mulai) : null;
      const payload: CarFormPayload = {
        ...form,
        nama: form.nama.trim(),
        slug,
        kategori_label: form.kategori_label.trim(),
        harga_mulai: hargaMulai,
        harga_label:
          normalizeNullable(form.harga_label) ??
          (hargaMulai ? `Rp. ${hargaMulai.toLocaleString("id-ID")}` : null),
        seater: form.seater ? Number(form.seater) : null,
        urutan: Number(form.urutan) || 0,
        deskripsi: normalizeNullable(form.deskripsi),
        fuel: normalizeNullable(form.fuel),
        transmission: normalizeNullable(form.transmission),
        spesifikasi: form.spesifikasi.filter((s) => s.label.trim() && s.value.trim()),
        warna: form.warna
          .filter((w) => w.nama.trim())
          .map((w) => ({
            nama: w.nama.trim(),
            hex: /^#[0-9a-fA-F]{6}$/.test(w.hex) ? w.hex : "#cccccc",
            gambar: normalizeNullable(w.gambar),
          })),
        galeri_gambar:
          form.gambar_utama && !form.galeri_gambar.includes(form.gambar_utama)
            ? [form.gambar_utama, ...form.galeri_gambar]
            : form.galeri_gambar,
      };

      if (payload.id) {
        await apiPut("/api/admin/cars", payload);
      } else {
        await apiPost("/api/admin/cars", payload);
      }
      await qc.invalidateQueries({ queryKey: ["admin"] });
      await qc.invalidateQueries({ queryKey: ["mobil"] });
      toast.success(payload.id ? "Perubahan mobil tersimpan" : "Mobil baru ditambahkan");
      navigate("/admin/katalog");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menyimpan");
    } finally {
      setPending(false);
    }
  }

  const inputCls =
    "w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-suzuki-red/50";

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-3xl">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="f-nama" className="block text-sm font-medium mb-2">
            Nama Mobil <span className="text-suzuki-red">*</span>
          </label>
          <input
            id="f-nama"
            required
            className={inputCls}
            value={form.nama}
            onChange={(e) =>
              setForm({ ...form, nama: e.target.value, slug: form.slug || cleanSlug(e.target.value) })
            }
            placeholder="mis. ALL NEW ERTIGA HYBRID"
          />
        </div>
        <div>
          <label htmlFor="f-slug" className="block text-sm font-medium mb-2">
            Slug (URL) <span className="text-suzuki-red">*</span>
          </label>
          <input
            id="f-slug"
            required
            className={inputCls}
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: cleanSlug(e.target.value) })}
            placeholder="otomatis dari nama"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Huruf kecil, angka, dan strip saja. Contoh: <code>/mobil/{form.slug || "slug-mobil"}</code>
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="f-kategori" className="block text-sm font-medium mb-2">
            Kategori <span className="text-suzuki-red">*</span>
          </label>
          <select
            id="f-kategori"
            className={inputCls}
            value={form.kategori}
            onChange={(e) => setForm({ ...form, kategori: e.target.value as "passenger" | "commercial" })}
          >
            <option value="passenger">Passenger Car</option>
            <option value="commercial">Commercial Car</option>
          </select>
        </div>
        <div>
          <label htmlFor="f-label" className="block text-sm font-medium mb-2">
            Label Kategori <span className="text-suzuki-red">*</span>
          </label>
          <input
            id="f-label"
            required
            className={inputCls}
            value={form.kategori_label}
            onChange={(e) => setForm({ ...form, kategori_label: e.target.value })}
            placeholder="SUV MEDIUM, LMPV, CITY CAR, PICK UP…"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="f-harga" className="block text-sm font-medium mb-2">
            Harga Mulai (Rp)
          </label>
          <input
            id="f-harga"
            type="number"
            min={0}
            className={inputCls}
            value={form.harga_mulai ?? ""}
            onChange={(e) => setForm({ ...form, harga_mulai: e.target.value ? Number(e.target.value) : null })}
            placeholder="mis. 293200000"
          />
        </div>
        <div>
          <label htmlFor="f-seater" className="block text-sm font-medium mb-2">
            Jumlah Kursi
          </label>
          <input
            id="f-seater"
            type="number"
            min={1}
            max={20}
            className={inputCls}
            value={form.seater ?? ""}
            onChange={(e) => setForm({ ...form, seater: e.target.value ? Number(e.target.value) : null })}
          />
        </div>
        <div>
          <label htmlFor="f-urutan" className="block text-sm font-medium mb-2">
            Urutan Tampil
          </label>
          <input
            id="f-urutan"
            type="number"
            min={0}
            className={inputCls}
            value={form.urutan}
            onChange={(e) => setForm({ ...form, urutan: Number(e.target.value) || 0 })}
          />
          <p className="text-xs text-muted-foreground mt-1">Angka kecil tampil lebih dulu.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="f-fuel" className="block text-sm font-medium mb-2">
            Bahan Bakar
          </label>
          <input
            id="f-fuel"
            className={inputCls}
            value={form.fuel ?? ""}
            onChange={(e) => setForm({ ...form, fuel: e.target.value })}
            placeholder="Bensin / Hybrid / Diesel"
          />
        </div>
        <div>
          <label htmlFor="f-trans" className="block text-sm font-medium mb-2">
            Transmisi
          </label>
          <input
            id="f-trans"
            className={inputCls}
            value={form.transmission ?? ""}
            onChange={(e) => setForm({ ...form, transmission: e.target.value })}
            placeholder="AT / MT / AT/MT"
          />
        </div>
      </div>

      <div>
        <label htmlFor="f-deskripsi" className="block text-sm font-medium mb-2">
          Deskripsi
        </label>
        <textarea
          id="f-deskripsi"
          rows={3}
          className={inputCls}
          value={form.deskripsi ?? ""}
          onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
          placeholder="Deskripsi singkat mobil untuk halaman detail"
        />
      </div>

      {/* Spesifikasi dinamis */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium">Spesifikasi Mobil</label>
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, spesifikasi: [...f.spesifikasi, { label: "", value: "" }] }))}
            className="inline-flex items-center gap-1 text-sm text-suzuki-red font-medium hover:underline"
          >
            <Plus className="w-4 h-4" aria-hidden /> Tambah Baris
          </button>
        </div>
        <div className="space-y-2">
          {form.spesifikasi.map((s, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                className={inputCls}
                value={s.label}
                onChange={(e) => setSpec(i, { label: e.target.value })}
                placeholder="Label (mis. Mesin)"
                aria-label={`Spesifikasi ${i + 1} label`}
              />
              <input
                className={inputCls}
                value={s.value}
                onChange={(e) => setSpec(i, { value: e.target.value })}
                placeholder="Nilai (mis. K15C 1.462cc)"
                aria-label={`Spesifikasi ${i + 1} nilai`}
              />
              <button
                type="button"
                onClick={() =>
                  setForm((f) => ({ ...f, spesifikasi: f.spesifikasi.filter((_, x) => x !== i) }))
                }
                className="p-2 text-muted-foreground hover:text-suzuki-red shrink-0"
                aria-label={`Hapus spesifikasi ${i + 1}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {form.spesifikasi.length === 0 && (
            <p className="text-xs text-muted-foreground">Belum ada spesifikasi — klik &quot;Tambah Baris&quot;.</p>
          )}
        </div>
      </div>

      <ImageUploader
        value={form.gambar_utama}
        onChange={(url) => setForm({ ...form, gambar_utama: url })}
        label="Gambar Utama"
        category="cars"
      />
      <GalleryUploader
        images={form.galeri_gambar}
        onChange={(urls) => setForm({ ...form, galeri_gambar: urls })}
        label="Galeri (gambar pertama dipakai bila gambar utama kosong)"
        category="cars"
      />

      {/* Warna tersedia */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <Palette className="w-4 h-4 text-suzuki-red" aria-hidden />
            Warna Tersedia
          </label>
          <button
            type="button"
            onClick={() =>
              setForm((f) => ({
                ...f,
                warna:
                  f.warna.length < 12
                    ? [...f.warna, { nama: "", hex: "#ffffff", gambar: "" }]
                    : f.warna,
              }))
            }
            disabled={form.warna.length >= 12}
            className="inline-flex items-center gap-1 text-sm text-suzuki-red font-medium hover:underline disabled:opacity-50 disabled:no-underline"
          >
            <Plus className="w-4 h-4" aria-hidden /> Tambah Warna
          </button>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Tampil sebagai pilihan warna di halaman detail mobil (maks. 12). Foto per
          warna opsional — upload file atau tempel URL; foto tampil di galeri
          detail saat warna dipilih.
        </p>
        <div className="space-y-2">
          {form.warna.map((w, i) => (
            <div key={i} className="flex flex-col gap-2 bg-muted/40 rounded-lg p-2.5">
              <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
                <input
                  type="color"
                  value={w.hex}
                  onChange={(e) => setWarna(i, { hex: e.target.value })}
                  aria-label={`Warna ${i + 1} kode warna`}
                  className="w-10 h-10 rounded-lg border border-input cursor-pointer bg-white p-1 shrink-0"
                  title={w.nama || `Warna ${i + 1}`}
                />
                <input
                  className={`${inputCls} flex-1 min-w-32`}
                  value={w.nama}
                  onChange={(e) => setWarna(i, { nama: e.target.value })}
                  placeholder="Nama warna (mis. Solid White)"
                  aria-label={`Warna ${i + 1} nama`}
                />
                {w.gambar && (
                  <span
                    className="hidden sm:inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full shrink-0"
                    title="Warna ini punya foto unit sendiri"
                  >
                    <ImageIcon className="w-3 h-3" aria-hidden /> Ada foto
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, warna: f.warna.filter((_, x) => x !== i) }))}
                  className="p-2 text-muted-foreground hover:text-suzuki-red shrink-0"
                  aria-label={`Hapus warna ${i + 1}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="sm:pl-12">
                <WarnaImageInput
                  value={w.gambar}
                  onChange={(url) => setWarna(i, { gambar: url })}
                  index={i}
                />
              </div>
            </div>
          ))}
          {form.warna.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Belum ada warna — klik &quot;Tambah Warna&quot; untuk menambahkan pilihan warna unit.
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 accent-suzuki-navy"
            checked={form.is_new}
            onChange={(e) => setForm({ ...form, is_new: e.target.checked })}
          />
          Tandai <span className="bg-suzuki-navy text-white text-xs px-2 py-0.5 rounded">NEW</span>
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 accent-green-600"
            checked={form.is_published}
            onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
          />
          Tampilkan di website publik
        </label>
      </div>

      <div className="flex flex-wrap gap-3 pt-4 border-t">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-suzuki-red text-white rounded-lg font-medium hover:bg-suzuki-red/90 disabled:opacity-60 transition-colors"
        >
          <Save className="w-4 h-4" aria-hidden />
          {pending ? "Menyimpan…" : form.id ? "Simpan Perubahan" : "Tambah Mobil"}
        </button>
        <button
          type="button"
          onClick={() => setPreview((p) => !p)}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-suzuki-navy text-white rounded-lg font-medium hover:bg-suzuki-navy/90 transition-colors"
        >
          {preview ? <EyeOff className="w-4 h-4" aria-hidden /> : <Eye className="w-4 h-4" aria-hidden />}
          {preview ? "Tutup Preview" : "Preview"}
        </button>
        <button
          type="button"
          onClick={() => navigate("/admin/katalog")}
          className="px-6 py-2.5 bg-muted rounded-lg font-medium hover:bg-muted/70 transition-colors"
        >
          Batal
        </button>
      </div>

      {preview && (
        <div className="border-2 border-dashed border-suzuki-red/40 rounded-xl p-6 bg-suzuki-light/50">
          <p className="text-xs font-semibold text-suzuki-red uppercase tracking-wide mb-4">
            Preview Kartu Mobil (tampilan publik)
          </p>
          <div className="max-w-xs">
            <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
              <div className="relative p-4 pb-0">
                <span className="absolute top-4 left-4 z-10 px-3 py-1 bg-suzuki-red text-white text-xs font-semibold rounded-full">
                  {form.kategori_label || "KATEGORI"}
                </span>
                {form.is_new && (
                  <span className="absolute top-4 right-4 z-10 px-3 py-1 bg-suzuki-navy text-white text-xs font-semibold rounded-full">
                    NEW
                  </span>
                )}
                <div className="h-48 flex items-center justify-center bg-[#E8E8E8] rounded-lg overflow-hidden">
                  {form.gambar_utama ? (
                    <img src={form.gambar_utama} alt="Preview" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <span className="text-muted-foreground text-sm">Belum ada gambar</span>
                  )}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-lg text-suzuki-navy mb-2">{form.nama || "Nama Mobil"}</h3>
                <div className="flex gap-4 text-muted-foreground text-xs mb-4">
                  {form.seater && <span>{form.seater} kursi</span>}
                  {form.fuel && <span>{form.fuel}</span>}
                  {form.transmission && <span>{form.transmission}</span>}
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Mulai dari</p>
                    <p className="font-bold text-suzuki-red">
                      {form.harga_label ||
                        (form.harga_mulai ? `Rp. ${form.harga_mulai.toLocaleString("id-ID")}` : "Hubungi sales")}
                    </p>
                  </div>
                  <span className="px-4 py-2 bg-suzuki-navy text-white text-sm rounded-full">Detail →</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
