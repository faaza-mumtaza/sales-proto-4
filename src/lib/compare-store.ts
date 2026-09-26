"use client";

// Store sisi klien untuk fitur "Bandingkan Mobil" (maks 3 mobil).
// State disimpan di localStorage + sinkron antar komponen via custom event,
// sehingga pilihan bertahan saat pindah halaman SPA.
//
// PENTING: getSnapshot (getCompareSlugs) WAJIB mengembalikan referensi stabil
// selama nilai tidak berubah (syarat useSyncExternalStore) — cache disimpan
// di globalThis agar terbagi antar instans modul di dev.

const STORAGE_KEY = "suzuki_compare_slugs";
export const MAX_COMPARE = 3;
const EVENT = "suzuki-compare-change";

interface CompareCache {
  raw: string | null;
  slugs: string[];
}

const globalStore = globalThis as unknown as {
  __suzukiCompareCache?: CompareCache;
};
const cache: CompareCache =
  globalStore.__suzukiCompareCache ?? { raw: "\u0000unset", slugs: [] };
globalStore.__suzukiCompareCache = cache;

function read(): string[] {
  if (typeof window === "undefined") return [];
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return cache.slugs;
  }
  if (raw !== cache.raw) {
    cache.raw = raw;
    try {
      const parsed = raw ? JSON.parse(raw) : [];
      cache.slugs = Array.isArray(parsed)
        ? parsed.filter((s) => typeof s === "string").slice(0, MAX_COMPARE)
        : [];
    } catch {
      cache.slugs = [];
    }
  }
  return cache.slugs;
}

function write(slugs: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
  } catch {
    // localStorage bisa diblokir (private mode) — tetap update cache in-memory
  }
  // Invalidate cache agar getSnapshot mengembalikan referensi baru → re-render
  cache.raw = "\u0000unset";
  cache.slugs = slugs;
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function getCompareSlugs(): string[] {
  return read();
}

/** Tambah/hapus mobil dari perbandingan. Return daftar baru. */
export function toggleCompare(slug: string): string[] {
  const current = read();
  let next: string[];
  if (current.includes(slug)) {
    next = current.filter((s) => s !== slug);
  } else if (current.length < MAX_COMPARE) {
    next = [...current, slug];
  } else {
    return current; // penuh — tidak berubah
  }
  write(next);
  return next;
}

/** Tambah slug bila belum ada (tanpa toggle). */
export function addCompareSlug(slug: string): string[] {
  const current = read();
  if (current.includes(slug) || current.length >= MAX_COMPARE) return current;
  const next = [...current, slug];
  write(next);
  return next;
}

export function removeCompare(slug: string): string[] {
  const next = read().filter((s) => s !== slug);
  write(next);
  return next;
}

export function clearCompare(): string[] {
  write([]);
  return [];
}

/** Berlangganan perubahan (dipakai React via useSyncExternalStore / useEffect). */
export function subscribeCompare(cb: () => void): () => void {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}
