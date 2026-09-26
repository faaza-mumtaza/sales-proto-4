"use client";

import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { Link } from "@tiptap/extension-link";
import slugify from "slugify";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  Bold, Italic, Heading1, Heading2, Quote, Link as LinkIcon, Image as ImageIcon,
  List, ListOrdered, Undo2, Redo2, Eye, EyeOff, Save, Upload, Loader2,
} from "lucide-react";
import { apiPost, apiPut } from "@/lib/api";
import { ImageUploader } from "./image-uploader";
import { navigate } from "@/lib/router";
import type { Artikel } from "@/lib/site-utils";

const TIPTAP_EXTENSIONS = [
  StarterKit.configure({ link: false }),
  Image.configure({ allowBase64: false }),
  Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
];

function cleanSlug(value: string) {
  return slugify(value, { lower: true, strict: true });
}
function normalizeNullable(value: string | null | undefined) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed ? trimmed : null;
}

/** ISO → nilai input datetime-local (waktu lokal browser). */
function isoToLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export type ArtikelStatus = "DRAFT" | "TERJADWAL" | "PUBLISHED";

export function ArtikelEditor({ initial }: { initial?: Artikel }) {
  const qc = useQueryClient();
  const [pending, setPending] = useState(false);
  const [preview, setPreview] = useState(false);
  const [imgUploading, setImgUploading] = useState(false);
  const [form, setForm] = useState({
    id: initial?.id as string | undefined,
    judul: initial?.judul ?? "",
    slug: initial?.slug ?? "",
    ringkasan: initial?.ringkasan ?? "",
    cover_image: initial?.cover_image ?? null,
    tipe: (initial?.tipe ?? "BERITA") as "PROMO" | "BERITA" | "KEGIATAN",
    tags: (initial?.tags ?? []).join(", "),
    status: (initial?.status as ArtikelStatus | undefined) ?? "DRAFT",
    scheduled_at: isoToLocalInput(initial?.scheduled_at),
  });

  const editor = useEditor({
    immediatelyRender: false,
    extensions: TIPTAP_EXTENSIONS,
    content: initial?.konten ?? "<p></p>",
    editorProps: {
      attributes: { class: "prose-artikel min-h-[300px] p-4 focus:outline-none" },
    },
  });

  async function insertImageFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran maksimal 5MB");
      return;
    }
    setImgUploading(true);
    try {
      const b64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve((r.result as string).split(",")[1] ?? "");
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      const res = await apiPost<{ url: string }>("/api/admin/upload", {
        contentBase64: b64,
        contentType: file.type,
        category: "articles",
      });
      editor?.chain().focus().setImage({ src: res.url }).run();
      toast.success("Gambar ditambahkan ke konten");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload gagal");
    } finally {
      setImgUploading(false);
    }
  }

  function addLink() {
    if (!editor) return;
    const existing = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Masukkan URL (https://…)", existing ?? "https://");
    if (url === null) return;
    const trimmed = url.trim();
    if (!trimmed) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    try {
      const normalized = new URL(trimmed).toString();
      editor.chain().focus().setLink({ href: normalized }).run();
    } catch {
      toast.error("URL tidak valid");
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editor) return;
    if (pending) return;
    if (form.status === "TERJADWAL" && !form.scheduled_at) {
      toast.error("Isi jadwal publikasi terlebih dahulu.");
      return;
    }
    setPending(true);
    try {
      const slug = cleanSlug(form.slug || form.judul);
      if (!slug) throw new Error("Slug wajib diisi.");
      const konten = editor.getHTML();
      if (!konten || konten === "<p></p>") throw new Error("Konten artikel masih kosong.");

      const payload = {
        id: form.id,
        judul: form.judul.trim(),
        slug,
        ringkasan: normalizeNullable(form.ringkasan),
        konten,
        cover_image: form.cover_image,
        tipe: form.tipe,
        tags: form.tags
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 20),
        status: form.status,
        scheduled_at:
          form.status === "TERJADWAL" && form.scheduled_at
            ? new Date(form.scheduled_at).toISOString()
            : null,
      };

      if (payload.id) {
        await apiPut("/api/admin/articles", payload);
      } else {
        await apiPost("/api/admin/articles", payload);
      }
      await qc.invalidateQueries({ queryKey: ["admin"] });
      await qc.invalidateQueries({ queryKey: ["artikel"] });
      toast.success(
        form.status === "PUBLISHED"
          ? "Artikel dipublikasikan!"
          : form.status === "TERJADWAL"
            ? "Artikel dijadwalkan — otomatis tayang sesuai jadwal."
            : "Draft artikel tersimpan.",
      );
      navigate("/admin/artikel");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menyimpan");
    } finally {
      setPending(false);
    }
  }

  const inputCls =
    "w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-suzuki-red/50";
  const btnCls = "p-2 rounded hover:bg-muted transition-colors";
  const activeBtn = "bg-suzuki-navy text-white hover:bg-suzuki-navy";

  const statusOptions: { value: ArtikelStatus; label: string; desc: string }[] = [
    { value: "DRAFT", label: "Draft", desc: "Disimpan, belum tampil di website" },
    { value: "TERJADWAL", label: "Terjadwalkan", desc: "Otomatis tayang di tanggal & jam tertentu" },
    { value: "PUBLISHED", label: "Publikasikan", desc: "Langsung tampil di website" },
  ];

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-4xl">
      <div>
        <label htmlFor="a-judul" className="block text-sm font-medium mb-2">
          Judul Artikel <span className="text-suzuki-red">*</span>
        </label>
        <input
          id="a-judul"
          required
          className={inputCls}
          value={form.judul}
          onChange={(e) => setForm({ ...form, judul: e.target.value, slug: form.slug || cleanSlug(e.target.value) })}
          placeholder="mis. Promo Akhir Tahun Suzuki BSB Semarang"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="a-slug" className="block text-sm font-medium mb-2">
            Slug (URL) <span className="text-suzuki-red">*</span>
          </label>
          <input
            id="a-slug"
            required
            className={inputCls}
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: cleanSlug(e.target.value) })}
            placeholder="otomatis dari judul"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Contoh: <code>/artikel/{form.slug || "slug-artikel"}</code>
          </p>
        </div>
        <div>
          <label htmlFor="a-tipe" className="block text-sm font-medium mb-2">
            Jenis Artikel <span className="text-suzuki-red">*</span>
          </label>
          <select
            id="a-tipe"
            className={inputCls}
            value={form.tipe}
            onChange={(e) => setForm({ ...form, tipe: e.target.value as typeof form.tipe })}
          >
            <option value="PROMO">Promo</option>
            <option value="BERITA">Berita</option>
            <option value="KEGIATAN">Kegiatan</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="a-ringkasan" className="block text-sm font-medium mb-2">
          Ringkasan
        </label>
        <textarea
          id="a-ringkasan"
          rows={2}
          maxLength={500}
          className={inputCls}
          value={form.ringkasan}
          onChange={(e) => setForm({ ...form, ringkasan: e.target.value })}
          placeholder="Ringkasan singkat yang tampil di daftar artikel & hasil pencarian"
        />
      </div>

      <ImageUploader
        value={form.cover_image}
        onChange={(url) => setForm({ ...form, cover_image: url })}
        label="Cover Image"
        category="articles"
      />

      <div>
        <label htmlFor="a-tags" className="block text-sm font-medium mb-2">
          Tags (pisahkan dengan koma)
        </label>
        <input
          id="a-tags"
          className={inputCls}
          value={form.tags}
          onChange={(e) => setForm({ ...form, tags: e.target.value })}
          placeholder="promo, akhir-tahun, kredit"
        />
      </div>

      {/* Editor Tiptap */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Konten Artikel <span className="text-suzuki-red">*</span>
        </label>
        <div className="border border-input rounded-lg overflow-hidden bg-white">
          <div className="flex flex-wrap gap-1 p-2 border-b bg-muted items-center">
            <button
              type="button"
              disabled={!editor}
              onClick={() => editor?.chain().focus().undo().run()}
              className={btnCls}
              title="Undo"
              aria-label="Undo"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={!editor}
              onClick={() => editor?.chain().focus().redo().run()}
              className={btnCls}
              title="Redo"
              aria-label="Redo"
            >
              <Redo2 className="w-4 h-4" />
            </button>
            <span className="w-px h-5 bg-border mx-1" aria-hidden />
            <button
              type="button"
              disabled={!editor}
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className={`${btnCls} ${editor?.isActive("bold") ? activeBtn : ""}`}
              title="Bold"
              aria-label="Bold"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={!editor}
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              className={`${btnCls} ${editor?.isActive("italic") ? activeBtn : ""}`}
              title="Italic"
              aria-label="Italic"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={!editor}
              onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`${btnCls} ${editor?.isActive("heading", { level: 1 }) ? activeBtn : ""}`}
              title="Judul Besar"
              aria-label="Judul besar"
            >
              <Heading1 className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={!editor}
              onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`${btnCls} ${editor?.isActive("heading", { level: 2 }) ? activeBtn : ""}`}
              title="Sub Judul"
              aria-label="Sub judul"
            >
              <Heading2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={!editor}
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              className={`${btnCls} ${editor?.isActive("bulletList") ? activeBtn : ""}`}
              title="Daftar Poin"
              aria-label="Daftar poin"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={!editor}
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              className={`${btnCls} ${editor?.isActive("orderedList") ? activeBtn : ""}`}
              title="Daftar Bernomor"
              aria-label="Daftar bernomor"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={!editor}
              onClick={() => editor?.chain().focus().toggleBlockquote().run()}
              className={`${btnCls} ${editor?.isActive("blockquote") ? activeBtn : ""}`}
              title="Kutipan"
              aria-label="Kutipan"
            >
              <Quote className="w-4 h-4" />
            </button>
            <button type="button" onClick={addLink} className={btnCls} title="Sisipkan Link" aria-label="Sisipkan link">
              <LinkIcon className="w-4 h-4" />
            </button>
            <label
              className={`${btnCls} cursor-pointer ${imgUploading ? "opacity-60" : ""}`}
              title="Upload Gambar ke Konten"
            >
              {imgUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span className="sr-only">Upload gambar ke konten</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                disabled={imgUploading || !editor}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void insertImageFile(f);
                  e.target.value = "";
                }}
              />
            </label>
            <button
              type="button"
              disabled={!editor}
              onClick={() => {
                const url = window.prompt("URL gambar (https://…)");
                if (!url) return;
                try {
                  editor?.chain().focus().setImage({ src: new URL(url).toString() }).run();
                } catch {
                  toast.error("URL tidak valid");
                }
              }}
              className={btnCls}
              title="Sisipkan Gambar via URL"
              aria-label="Sisipkan gambar via URL"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
          </div>
          {editor ? (
            <EditorContent editor={editor} />
          ) : (
            <div className="min-h-[300px] p-4 text-sm text-muted-foreground">Memuat editor…</div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Konten otomatis disanitasi server-side saat disimpan (script & atribut berbahaya dibuang).
        </p>
      </div>

      {/* Status publikasi */}
      <fieldset className="border border-input rounded-lg p-4">
        <legend className="text-sm font-medium px-2">Status Publikasi</legend>
        <div className="grid sm:grid-cols-3 gap-3">
          {statusOptions.map((s) => (
            <label
              key={s.value}
              className={`flex gap-3 items-start p-3 rounded-lg border cursor-pointer transition-colors ${
                form.status === s.value
                  ? "border-suzuki-red bg-suzuki-red/5"
                  : "border-border hover:border-suzuki-navy/40"
              }`}
            >
              <input
                type="radio"
                name="artikel-status"
                className="mt-0.5 accent-suzuki-red"
                checked={form.status === s.value}
                onChange={() => setForm({ ...form, status: s.value })}
              />
              <span>
                <span className="block text-sm font-medium">{s.label}</span>
                <span className="block text-xs text-muted-foreground">{s.desc}</span>
              </span>
            </label>
          ))}
        </div>
        {form.status === "TERJADWAL" && (
          <div className="mt-4">
            <label htmlFor="a-jadwal" className="block text-sm font-medium mb-2">
              Jadwal Tayang <span className="text-suzuki-red">*</span>
            </label>
            <input
              id="a-jadwal"
              type="datetime-local"
              required
              className={`${inputCls} max-w-xs`}
              value={form.scheduled_at}
              onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Artikel otomatis tampil di website pada tanggal & jam ini.
            </p>
          </div>
        )}
      </fieldset>

      <div className="flex flex-wrap gap-3 pt-4 border-t">
        <button
          type="submit"
          disabled={pending || !editor}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-suzuki-red text-white rounded-lg font-medium hover:bg-suzuki-red/90 disabled:opacity-60 transition-colors"
        >
          <Save className="w-4 h-4" aria-hidden />
          {pending ? "Menyimpan…" : form.id ? "Simpan Artikel" : "Buat Artikel"}
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
          onClick={() => navigate("/admin/artikel")}
          className="px-6 py-2.5 bg-muted rounded-lg font-medium hover:bg-muted/70 transition-colors"
        >
          Batal
        </button>
      </div>

      {preview && (
        <div className="border-2 border-dashed border-suzuki-red/40 rounded-xl bg-suzuki-light/50 overflow-hidden">
          <p className="text-xs font-semibold text-suzuki-red uppercase tracking-wide px-6 pt-5">
            Preview Artikel (tampilan publik)
          </p>
          {form.cover_image && (
            <div className="aspect-[21/9] max-h-[300px] overflow-hidden mt-4">
              <img src={form.cover_image} alt="Preview cover" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="px-6 py-8 max-w-2xl mx-auto">
            <span className="inline-block px-3 py-1 bg-suzuki-red text-white text-xs font-semibold rounded-full mb-4">
              {form.tipe}
            </span>
            <h1 className="text-3xl font-bold text-suzuki-navy mb-3 leading-tight">
              {form.judul || "Judul Artikel"}
            </h1>
            {form.ringkasan && <p className="text-muted-foreground mb-6">{form.ringkasan}</p>}
            <div
              className="prose-artikel"
              dangerouslySetInnerHTML={{ __html: editor?.getHTML() ?? "<p>Konten…</p>" }}
            />
          </div>
        </div>
      )}
    </form>
  );
}
