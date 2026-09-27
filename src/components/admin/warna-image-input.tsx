"use client";

/**
 * Input gambar per warna mobil (baris "Warna Tersedia" di form katalog):
 * kolom URL + tombol upload ke storage server + pratinjau kecil.
 * Kompatibel dengan input manual (tempel URL eksternal).
 */

import { useState } from "react";
import { toast } from "sonner";
import { Upload, Loader2, ImageIcon } from "lucide-react";
import { apiPost } from "@/lib/api";
import { fileToBase64 } from "./image-uploader";

export function WarnaImageInput({
  value,
  onChange,
  index,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  index: number;
}) {
  const [pending, setPending] = useState(false);
  const [showUrl, setShowUrl] = useState(false);

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
        category: "cars",
      });
      onChange(res.url);
      toast.success("Gambar warna tersimpan — jangan lupa Simpan Perubahan");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload gagal");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-2 min-w-0 flex-1">
      {/* Pratinjau kecil / placeholder */}
      {value ? (
        <span className="relative shrink-0 group">
          <img
            src={value}
            alt={`Gambar warna ${index + 1}`}
            className="w-10 h-10 rounded-lg border object-cover bg-muted"
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label={`Hapus gambar warna ${index + 1}`}
            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-suzuki-red text-white text-[9px] font-bold leading-none flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
          >
            ×
          </button>
        </span>
      ) : (
        <span
          className="w-10 h-10 rounded-lg border border-dashed flex items-center justify-center bg-muted/50 shrink-0"
          aria-hidden
        >
          <ImageIcon className="w-4 h-4 text-muted-foreground/60" />
        </span>
      )}

      {/* Tombol upload + toggle URL */}
      <label
        className="inline-flex items-center gap-1.5 cursor-pointer px-3 py-2 bg-suzuki-navy text-white rounded-lg text-xs font-medium hover:bg-suzuki-navy/90 transition-colors shrink-0 disabled:opacity-60"
        title="Upload foto unit dengan warna ini"
      >
        {pending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
        ) : (
          <Upload className="w-3.5 h-3.5" aria-hidden />
        )}
        {pending ? "…" : "Upload"}
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

      {showUrl || value ? (
        <input
          className="flex-1 min-w-0 px-3 py-2 border border-input rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-suzuki-red/50"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder="URL gambar (https://…)"
          aria-label={`URL gambar warna ${index + 1}`}
          spellCheck={false}
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowUrl(true)}
          className="text-xs text-muted-foreground hover:text-suzuki-red underline underline-offset-2 shrink-0"
        >
          tempel URL
        </button>
      )}
    </div>
  );
}
