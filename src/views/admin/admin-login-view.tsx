"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Lock, Mail, LogIn, Loader2 } from "lucide-react";
import { apiPost } from "@/lib/api";
import { Link, navigate, usePageMeta } from "@/lib/router";
import { SuzukiLogo } from "@/components/site/header";
import { useAdminSession } from "./admin-shell";

export function AdminLoginView() {
  usePageMeta("Login Admin — Suzuki BSB");
  const qc = useQueryClient();
  const { data: session } = useAdminSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  // Sudah login? langsung ke dashboard
  useEffect(() => {
    if (session?.authenticated) navigate("/admin");
  }, [session]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    try {
      const res = await apiPost<{ admin: { email: string; name: string } }>(
        "/api/admin/login",
        { email, password },
      );
      // Update cache sesi SECARA SINKRON sebelum navigasi, supaya guard
      // AdminShell tidak membaca data sesi lama yang belum ter-autentikasi.
      qc.setQueryData(["admin", "me"], {
        ok: true,
        authenticated: true,
        admin: res.admin,
      });
      toast.success("Berhasil login. Selamat datang!");
      navigate("/admin");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login gagal");
    } finally {
      setPending(false);
    }
  }

  const inputWrap = "relative";
  const inputCls =
    "w-full pl-11 pr-4 py-3 rounded-lg border border-input bg-white focus:outline-none focus:ring-2 focus:ring-suzuki-red/50";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-suzuki-navy via-suzuki-navy to-suzuki-dark px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-block bg-white rounded-2xl px-6 py-4 shadow-xl mb-5">
            <SuzukiLogo className="h-8 w-auto" />
          </div>
          <h1 className="text-2xl font-bold text-white text-balance">Login Admin</h1>
          <p className="text-white/60 text-sm mt-2">
            Halaman khusus pengelola website Suzuki BSB Semarang.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-2xl p-8">
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <div className={inputWrap}>
                <Mail
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                  aria-hidden
                />
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  className={inputCls}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@suzukibsb.id"
                />
              </div>
            </div>
            <div>
              <label htmlFor="login-pass" className="block text-sm font-medium mb-2">
                Password
              </label>
              <div className={inputWrap}>
                <Lock
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                  aria-hidden
                />
                <input
                  id="login-pass"
                  type="password"
                  required
                  autoComplete="current-password"
                  className={inputCls}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={pending}
              className="w-full inline-flex items-center justify-center gap-2 bg-suzuki-red hover:bg-suzuki-red/90 disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {pending ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
              ) : (
                <LogIn className="w-4 h-4" aria-hidden />
              )}
              {pending ? "Memproses…" : "Login"}
            </button>
          </form>

          <p className="mt-6 text-xs text-muted-foreground text-center leading-relaxed">
            Halaman ini dilindungi. Percobaan login dibatasi dan dicatat.
            <br />
            Kembali ke{" "}
            <Link to="/" className="text-suzuki-red hover:underline">
              website publik
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
