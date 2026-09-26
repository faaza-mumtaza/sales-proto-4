import { NextRequest } from "next/server";
import { ok } from "@/lib/api-helpers";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** GET /api/admin/me — cek session admin (untuk guard di frontend). */
export function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) {
    return ok({ authenticated: false });
  }
  return ok({
    authenticated: true,
    admin: { email: session.email, name: session.name },
  });
}
