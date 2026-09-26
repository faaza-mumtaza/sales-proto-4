// Rate limiter in-memory (sliding window) per IP + endpoint.
// Cukup untuk single-process (dev & serverless kecil). Untuk production
// berskala besar, ganti implementasi ini dengan Redis/Upstash — interface tetap.

interface Entry {
  timestamps: number[];
}

// Simpan bucket di globalThis agar terbagi antar route handler
// (di dev, tiap route punya instans modul terpisah).
const globalStore = globalThis as unknown as {
  __suzukiRateBuckets?: Map<string, Entry>;
  __suzukiRateLastSweep?: number;
};
const buckets: Map<string, Entry> = globalStore.__suzukiRateBuckets ?? new Map();
globalStore.__suzukiRateBuckets = buckets;

function sweep(windowMs: number) {
  const now = Date.now();
  const lastSweep = globalStore.__suzukiRateLastSweep ?? now;
  if (now - lastSweep < 60_000) return; // sapu maksimal 1x/menit
  globalStore.__suzukiRateLastSweep = now;
  for (const [key, entry] of buckets) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);
    if (entry.timestamps.length === 0) buckets.delete(key);
  }
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * true = boleh lewat (dan tercatat), false = limit terlampaui.
 */
export function rateLimit(
  ip: string,
  endpoint: string,
  max: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  sweep(windowMs);
  const key = `${ip}::${endpoint}`;
  const entry = buckets.get(key) ?? { timestamps: [] };
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);
  if (entry.timestamps.length >= max) {
    const oldest = entry.timestamps[0];
    buckets.set(key, entry);
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
    };
  }
  entry.timestamps.push(now);
  buckets.set(key, entry);
  return { ok: true, remaining: max - entry.timestamps.length, retryAfterSeconds: 0 };
}

export const RATE_LIMITS = {
  contact: { max: 5, windowMs: 10 * 60_000 },
  testDrive: { max: 5, windowMs: 10 * 60_000 },
  serviceBooking: { max: 5, windowMs: 10 * 60_000 },
  bookingStatus: { max: 10, windowMs: 10 * 60_000 },
  testimoni: { max: 3, windowMs: 15 * 60_000 },
  login: { max: 10, windowMs: 15 * 60_000 },
  changePassword: { max: 5, windowMs: 15 * 60_000 },
  captcha: { max: 30, windowMs: 60_000 },
  upload: { max: 40, windowMs: 10 * 60_000 },
  newsletter: { max: 5, windowMs: 10 * 60_000 },
  newsletterUnsub: { max: 10, windowMs: 10 * 60_000 },
} as const;
