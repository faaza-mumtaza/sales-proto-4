// Token unsubscribe newsletter — HMAC-signed (server-only).
// Token ditempel admin pada link email kampanye, contoh:
//   https://situs/#/newsletter/keluar?email=...&token=...
// Memakai secret yang sama dengan session admin (ADMIN_SESSION_SECRET)
// agar hanya satu env yang perlu di-set di production.

import { createHmac, timingSafeEqual } from "crypto";

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (secret && secret.length >= 16) return secret;
  // Fallback dev-only — sama pola dengan lib/auth.ts.
  return "dev-fallback-secret::" + (process.env.DATABASE_URL ?? "local");
}

/** Buat token unsubscribe untuk sebuah email (hex 32 karakter). */
export function newsletterToken(email: string): string {
  return createHmac("sha256", getSecret())
    .update(`newsletter-unsub:${email.toLowerCase().trim()}`)
    .digest("hex")
    .slice(0, 32);
}

/** Verifikasi token unsubscribe — konstanta waktu (anti timing attack). */
export function verifyNewsletterToken(email: string, token: string): boolean {
  const expected = newsletterToken(email);
  const a = Buffer.from(expected);
  const b = Buffer.from(token);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
