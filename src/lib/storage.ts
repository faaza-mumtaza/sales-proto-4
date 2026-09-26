// Storage gambar: file disimpan di db/uploads (RUNTIME DATA — bukan source code,
// otomatis .gitignore). Diserve via /api/files/[...path].
// Untuk production Vercel+Supabase: ganti saveUploadedFile/getUploadedFile
// dengan Supabase Storage SDK — kontrak return URL tetap sama.

import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

const UPLOAD_ROOT = path.join(process.cwd(), "db", "uploads");

const ALLOWED_TYPES: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB

export interface SaveResult {
  url: string; // URL relatif, mis. /api/files/cars/2026-06/uuid.png
  path: string; // path relatif dalam uploads
}

export function isAllowedImageType(contentType: string): boolean {
  return contentType in ALLOWED_TYPES;
}

/** Simpan buffer gambar ke storage. Return URL publik. */
export async function saveUploadedImage(
  buffer: Buffer,
  contentType: string,
  category: "cars" | "articles" | "misc" = "misc",
): Promise<SaveResult> {
  const ext = ALLOWED_TYPES[contentType];
  if (!ext) throw new Error("Tipe file tidak diizinkan.");
  if (buffer.length > MAX_UPLOAD_BYTES) throw new Error("Ukuran file maksimal 5MB.");
  if (buffer.length === 0) throw new Error("File kosong.");

  const now = new Date();
  const monthDir = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const relPath = path.posix.join(category, monthDir, `${randomUUID()}${ext}`);
  const absPath = path.join(UPLOAD_ROOT, relPath);

  // Pastikan folder ada
  await mkdir(path.dirname(absPath), { recursive: true });
  await writeFile(absPath, buffer);

  return { url: `/api/files/${relPath}`, path: relPath };
}

const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export interface StoredFile {
  buffer: Buffer;
  contentType: string;
}

/**
 * Baca file dari storage secara AMAN (anti path-traversal):
 * hanya [a-zA-Z0-9._-] dan minimal satu "/" diperbolehkan.
 */
export async function readUploadedFile(relPath: string): Promise<StoredFile | null> {
  const normalized = relPath.replace(/^\/+/, "");
  // Tolak path traversal / karakter aneh
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/.test(normalized)) return null;
  if (normalized.includes("..")) return null;
  if (!/\.(png|jpe?g|webp|gif)$/i.test(normalized)) return null;

  const absPath = path.join(UPLOAD_ROOT, normalized);
  // Pastikan masih di bawah UPLOAD_ROOT
  if (!path.resolve(absPath).startsWith(path.resolve(UPLOAD_ROOT))) return null;

  try {
    const buffer = await readFile(absPath);
    const ext = path.extname(normalized).toLowerCase();
    return { buffer, contentType: MIME_BY_EXT[ext] ?? "application/octet-stream" };
  } catch {
    return null;
  }
}
