// Session auth untuk admin — stateless HMAC-signed token di HttpOnly cookie.
// Server-only. Semua /api/admin/** (kecuali login) wajib memanggil requireAdmin().

import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const SESSION_COOKIE = "suzuki_admin_session";
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 hari

function getSecret(): string {
  // Secret hanya di server (env) — tidak pernah diekspos ke frontend.
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (secret && secret.length >= 16) return secret;
  // Fallback dev-only: deterministik dari DATABASE_URL agar session tetap
  // valid antar-restart dev server. PRODUCTION WAJIB set ADMIN_SESSION_SECRET.
  return "dev-fallback-secret::" + (process.env.DATABASE_URL ?? "local");
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export interface SessionPayload {
  sub: string; // admin id
  email: string;
  name: string;
  exp: number; // epoch seconds
}

export function createSessionToken(admin: {
  id: string;
  email: string;
  name: string;
}): { token: string; maxAge: number } {
  const payload: SessionPayload = {
    sub: admin.id,
    email: admin.email,
    name: admin.name,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const body = b64url(JSON.stringify(payload));
  return { token: `${body}.${sign(body)}`, maxAge: SESSION_TTL_SECONDS };
}

export function verifySessionToken(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  let expected: string;
  try {
    expected = sign(body);
  } catch {
    return null;
  }
  // Bandingkan dengan panjang sama agar timingSafeEqual aman
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(body.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"),
    ) as SessionPayload;
    if (!payload?.sub || !payload?.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

/** Baca session dari request. Return null jika tidak valid. */
export function getSession(req: NextRequest): SessionPayload | null {
  return verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
}

/**
 * Guard untuk API admin. Return null jika valid, atau NextResponse 401
 * yang harus langsung di-return handler.
 */
export function requireAdmin(req: NextRequest): NextResponse | null {
  const session = getSession(req);
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "UNAUTHORIZED", message: "Silakan login sebagai admin." },
      { status: 401 },
    );
  }
  return null;
}
