"use client";

// Dialog ganti password admin — verifikasi password lama, set password baru.

import { useState } from "react";
import { Loader2, KeyRound, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { apiPost, ApiError } from "@/lib/api";

export function ChangePasswordDialog() {
  const [open, setOpen] = useState(false);
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  function reset() {
    setOldPass("");
    setNewPass("");
    setConfirmPass("");
    setError(null);
    setDone(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPass !== confirmPass) {
      setError("Konfirmasi password baru tidak sama.");
      return;
    }
    setBusy(true);
    try {
      await apiPost("/api/admin/change-password", {
        password_lama: oldPass,
        password_baru: newPass,
      });
      setDone(true);
      toast.success("Password berhasil diganti!");
      setTimeout(() => {
        setOpen(false);
        reset();
      }, 1600);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Gagal mengganti password. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          <KeyRound className="w-4 h-4" aria-hidden />
          Ganti Password
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-suzuki-navy">
            <KeyRound className="w-5 h-5 text-suzuki-red" aria-hidden />
            Ganti Password Admin
          </DialogTitle>
          <DialogDescription>
            Password baru minimal 8 karakter dan harus mengandung huruf serta angka.
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="py-8 text-center">
            <div className="w-14 h-14 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-green-600" aria-hidden />
            </div>
            <p className="font-semibold text-suzuki-navy">Password berhasil diganti!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Gunakan password baru saat login berikutnya.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4 pt-2" noValidate>
            <div>
              <label htmlFor="pass-lama" className="block text-sm font-medium mb-1.5 text-suzuki-navy">
                Password Lama
              </label>
              <input
                id="pass-lama"
                type="password"
                value={oldPass}
                onChange={(e) => setOldPass(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-suzuki-red/50 focus:border-suzuki-red/50"
              />
            </div>
            <div>
              <label htmlFor="pass-baru" className="block text-sm font-medium mb-1.5 text-suzuki-navy">
                Password Baru
              </label>
              <input
                id="pass-baru"
                type="password"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-suzuki-red/50 focus:border-suzuki-red/50"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Minimal 8 karakter, mengandung huruf dan angka.
              </p>
            </div>
            <div>
              <label htmlFor="pass-konfirmasi" className="block text-sm font-medium mb-1.5 text-suzuki-navy">
                Konfirmasi Password Baru
              </label>
              <input
                id="pass-konfirmasi"
                type="password"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-suzuki-red/50 focus:border-suzuki-red/50"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full inline-flex items-center justify-center gap-2 bg-suzuki-red hover:bg-suzuki-red/90 text-white px-6 py-2.5 rounded-lg font-semibold transition-all hover:shadow-lg hover:shadow-suzuki-red/30 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {busy ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> Menyimpan…
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" aria-hidden /> Simpan Password Baru
                </>
              )}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
