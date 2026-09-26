// Helper umum untuk API routes: response JSON konsisten, ambil IP client,
// dan parse body JSON dengan aman.

import { NextRequest, NextResponse } from "next/server";

export function ok<T extends object>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, ...data }, init);
}

export function fail(
  message: string,
  status = 400,
  extra?: Record<string, unknown>,
) {
  return NextResponse.json({ ok: false, message, ...extra }, { status });
}

export function getClientIP(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export function getUserAgent(req: NextRequest): string {
  return (req.headers.get("user-agent") ?? "").slice(0, 255);
}

/** Parse JSON body dengan batas ukuran; return null jika invalid. */
export async function parseJsonBody(
  req: NextRequest,
  maxBytes = 7 * 1024 * 1024,
): Promise<Record<string, unknown> | null> {
  try {
    const text = await req.text();
    if (text.length > maxBytes) return null;
    const parsed = JSON.parse(text);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Pesan error pertama dari ZodError agar informatif untuk user. */
export function zodErrorMessage(error: { issues?: Array<{ message: string }> }): string {
  return error.issues?.[0]?.message ?? "Data yang dikirim tidak valid.";
}
