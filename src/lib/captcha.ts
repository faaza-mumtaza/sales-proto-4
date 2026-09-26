// Math CAPTCHA server-side — anti-bot tanpa layanan pihak ketiga.
// Challenge disimpan in-memory dengan TTL. Terhubung opsi Turnstile
// (jika TURNSTILE_SECRET_KEY di-set, verifikasi Turnstile yang dipakai).

import { randomInt, randomUUID } from "crypto";

interface Challenge {
  answer: number;
  expires: number;
}

// Simpan Map di globalThis agar terbagi antar route handler
// (di dev, tiap route punya instans modul terpisah).
const globalStore = globalThis as unknown as {
  __suzukiCaptchaStore?: Map<string, Challenge>;
};
const challenges: Map<string, Challenge> =
  globalStore.__suzukiCaptchaStore ?? new Map();
globalStore.__suzukiCaptchaStore = challenges;

const TTL_MS = 5 * 60_000; // 5 menit

// Bersihkan challenge kadaluarsa secara periodik saat dibuat
function sweep() {
  const now = Date.now();
  if (challenges.size < 500) return;
  for (const [id, c] of challenges) {
    if (c.expires < now) challenges.delete(id);
  }
}

export interface CaptchaChallenge {
  captchaId: string;
  question: string;
  expiresIn: number;
}

export function issueCaptcha(): CaptchaChallenge {
  sweep();
  const a = randomInt(2, 12);
  const b = randomInt(2, 12);
  const usePlus = randomInt(0, 2) === 1;
  const answer = usePlus ? a + b : Math.max(a, b) - Math.min(a, b);
  const question = usePlus
    ? `${a} + ${b} = ?`
    : `${Math.max(a, b)} − ${Math.min(a, b)} = ?`;
  const id = randomUUID();
  challenges.set(id, { answer, expires: Date.now() + TTL_MS });
  return { captchaId: id, question, expiresIn: TTL_MS / 1000 };
}

/** Verifikasi dan konsumsi challenge. Return true jika jawaban benar. */
export function verifyCaptcha(id: unknown, answer: unknown): boolean {
  if (typeof id !== "string" || typeof answer !== "string" && typeof answer !== "number") {
    return false;
  }
  const challenge = challenges.get(id);
  if (!challenge) return false;
  challenges.delete(id); // sekali pakai
  if (challenge.expires < Date.now()) return false;
  const parsed = Number(String(answer).trim());
  return Number.isFinite(parsed) && parsed === challenge.answer;
}

/**
 * Verifikasi bukti anti-bot gabungan:
 * 1. Turnstile token (jika TURNSTILE_SECRET_KEY dikonfigurasi) — prioritas.
 * 2. Math captcha (fallback sandbox / tanpa key).
 */
export async function verifyAntiBot(input: {
  captchaId?: unknown;
  captchaAnswer?: unknown;
  turnstileToken?: unknown;
  remoteIp?: string;
}): Promise<{ ok: boolean; reason?: string }> {
  const tsSecret = process.env.TURNSTILE_SECRET_KEY;
  const token = typeof input.turnstileToken === "string" ? input.turnstileToken : "";
  if (tsSecret && token) {
    try {
      const res = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            secret: tsSecret,
            response: token,
            remoteip: input.remoteIp,
          }),
        },
      );
      const data = (await res.json()) as { success?: boolean };
      return data.success ? { ok: true } : { ok: false, reason: "Verifikasi CAPTCHA gagal." };
    } catch {
      return { ok: false, reason: "Verifikasi CAPTCHA gagal." };
    }
  }
  const ok = verifyCaptcha(input.captchaId, input.captchaAnswer);
  return ok ? { ok: true } : { ok: false, reason: "Jawaban verifikasi salah atau kedaluwarsa." };
}

/** Honeypot: field tersembunyi — bot biasanya mengisinya. */
export function isHoneypotTripped(website: unknown): boolean {
  return typeof website === "string" && website.trim().length > 0;
}
