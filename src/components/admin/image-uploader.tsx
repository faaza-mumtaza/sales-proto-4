"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Upload, Loader2, LinkIcon } from "lucide-react";
import { apiPost } from "@/lib/api";

/** Konversi File ke string base64 (tanpa prefix data URL). */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = r.result as string;
      resolve(s.split(",")[1] ?? "");
    };
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

/**
 * Upload gambar ke storage server (admin only).
 * Bisa via file atau tempel URL eksternal.
 */
export function ImageUploader({
  value,
  onChange,
  label = "Gambar",
  category = "misc",
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  category?: "cars" | "articles" | "misc";
}) {
  const [pending, setPending] = useState(false);
  const [manualUrl, setManualUrl] = useState("");

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran maksimal 5MB");
      return;
    }
    setPending(true);
    try {
      const b64 = await fileToBase64(file);
      const res = await apiPost<{ url: string }>("/api/admin/upload", {
        contentBase64: b64,
        contentType: file.type,
        category,
      });
      onChange(res.url);
      toast.success("Gambar berhasil diupload");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload gagal");
    } finally {
      setPending(false);
    }
  }

  function applyManualUrl() {
    const trimmed = manualUrl.trim();
    if (!trimmed) return;
    try {
      onChange(new URL(trimmed).toString());
      setManualUrl("");
    } catch {
      toast.error("URL gambar tidak valid");
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">{label}</label>
      {value && (
        <div className="relative w-full max-w-xs">
          <img
            src={value}
            alt={`Pratinjau ${label}`}
            className="w-full h-32 object-cover rounded-lg border"
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-1 right-1 bg-white/95 text-suzuki-red px-2 py-0.5 rounded text-xs font-medium shadow-sm hover:bg-white"
          >
            Hapus
          </button>
        </div>
      )}
      <div className="flex flex-wrap gap-2 items-center">
        <label className="inline-flex items-center gap-2 cursor-pointer px-4 py-2 bg-suzuki-navy text-white rounded-lg text-sm hover:bg-suzuki-navy/90 transition-colors">
          {pending ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          ) : (
            <Upload className="w-4 h-4" aria-hidden />
          )}
          {pending ? "Mengunggah…" : "Upload Gambar"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            disabled={pending}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
              e.target.value = "";
            }}
          />
        </label>
        <span className="text-xs text-muted-foreground">atau</span>
        <div className="flex gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              placeholder="Tempel URL gambar (https://…)"
              className="w-full pl-9 pr-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-suzuki-red/50"
            />
          </div>
          <button
            type="button"
            onClick={applyManualUrl}
            className="px-3 py-2 bg-muted hover:bg-muted/70 rounded-lg text-sm transition-colors"
          >
            Pakai
          </button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">PNG, JPG, WebP, atau GIF — maksimal 5MB.</p>
    </div>
  );
}

/** Multi-upload untuk galeri gambar mobil/artikel. */
export function GalleryUploader({
  images,
  onChange,
  label = "Galeri Gambar",
  category = "cars",
}: {
  images: string[];
  onChange: (urls: string[]) => void;
  label?: string;
  category?: "cars" | "articles" | "misc";
}) {
  const [pending, setPending] = useState(false);

  async function handleFiles(files: FileList) {
    setPending(true);
    const results: string[] = [];
    try {
      for (const file of Array.from(files).slice(0, 6)) {
        if (!file.type.startsWith("image/")) continue;
        if (file.size > 5 * 1024 * 1024) continue;
        const b64 = await fileToBase64(file);
        try {
          const res = await apiPost<{ url: string }>("/api/admin/upload", {
            contentBase64: b64,
            contentType: file.type,
            category,
          });
          results.push(res.url);
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Upload gagal");
        }
      }
      if (results.length > 0) {
        onChange([...images, ...results].slice(0, 12));
        toast.success(`${results.length} gambar ditambahkan ke galeri`);
      }
    } finally {
      setPending(false);
    }
  }

  function move(i: number, dir: -1 | 1) {
    const next = [...images];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">
        {label} <span className="text-muted-foreground font-normal">({images.length}/12)</span>
      </label>
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {images.map((img, i) => (
            <div key={img + i} className="relative group rounded-lg border overflow-hidden bg-muted">
              <img src={img} alt={`Galeri ${i + 1}`} className="w-full h-24 object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="p-1.5 bg-white/90 rounded text-suzuki-navy disabled:opacity-40"
                  aria-label="Geser kiri"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => onChange(images.filter((_, x) => x !== i))}
                  className="p-1.5 bg-suzuki-red rounded text-white text-xs"
                  aria-label="Hapus gambar"
                >
                  Hapus
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === images.length - 1}
                  className="p-1.5 bg-white/90 rounded text-suzuki-navy disabled:opacity-40"
                  aria-label="Geser kanan"
                >
                  →
                </button>
              </div>
              {i === 0 && (
                <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-suzuki-navy text-white text-[10px] rounded">
                  Utama
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      <label className="inline-flex items-center gap-2 cursor-pointer px-4 py-2 bg-suzuki-navy text-white rounded-lg text-sm hover:bg-suzuki-navy/90 transition-colors">
        {pending ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Upload className="w-4 h-4" aria-hidden />}
        {pending ? "Mengunggah…" : "Tambah ke Galeri"}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          multiple
          className="hidden"
          disabled={pending}
          onChange={(e) => {
            if (e.target.files?.length) void handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </label>
    </div>
  );
}
