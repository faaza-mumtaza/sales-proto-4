"use client";

import { useState, type FormEvent } from "react";
import { Send, CheckCircle2, Loader2, AlertCircle, MailOpen } from "lucide-react";
import { toast } from "sonner";
import { apiPost } from "@/lib/api";
import { HoneypotField } from "@/components/forms/captcha-challenge";

type FormState = "idle" | "loading" | "success" | "error";

/**
 * Form langganan newsletter — dipakai di footer website publik.
 * Footer selalu navy (terang & gelap), jadi palet putih/transparan statis.
 * Anti-spam: honeypot + rate-limit server-side (tanpa CAPTCHA agar ringan).
 */
export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Honeypot dibaca dari DOM (bot mengisi field tersembunyi ini)
    const hp = e.currentTarget.elements.namedItem("website") as HTMLInputElement | null;
    const website = hp?.value ?? "";

    if (state === "loading") return;
    setState("loading");
    setMessage("");

    try {
      const res = await apiPost<{ already?: boolean; reactivated?: boolean; created?: boolean }>(
        "/api/newsletter",
        { email, website },
      );
      setState("success");
      if (res.already) {
        setMessage("Email Anda sudah terdaftar — terima kasih tetap bersama kami!");
        toast.info("Anda sudah berlangganan newsletter kami.");
      } else if (res.reactivated) {
        setMessage("Langganan Anda berhasil diaktifkan kembali. Terima kasih!");
        toast.success("Langganan diaktifkan kembali.");
      } else {
        setMessage("Berhasil! Promo & artikel terbaru akan dikirim ke email Anda.");
        toast.success("Berhasil berlangganan newsletter!");
      }
      setEmail("");
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : "Gagal berlangganan. Coba lagi.");
      toast.error(err instanceof Error ? err.message : "Gagal berlangganan.");
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="w-full">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MailOpen
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/50 pointer-events-none"
            aria-hidden
          />
          <label htmlFor="newsletter-email" className="sr-only">
            Alamat email Anda
          </label>
          <input
            id="newsletter-email"
            type="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (state !== "loading") {
                setState("idle");
                setMessage("");
              }
            }}
            placeholder="nama@email.com"
            autoComplete="email"
            disabled={state === "loading"}
            aria-invalid={state === "error"}
            aria-describedby={message ? "newsletter-feedback" : undefined}
            className="w-full h-12 pl-11 pr-4 rounded-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-suzuki-red/70 focus:border-suzuki-red/60 focus:bg-white/15 transition-all disabled:opacity-60"
          />
        </div>
        <button
          type="submit"
          disabled={state === "loading" || !email.trim()}
          className="h-12 px-7 inline-flex items-center justify-center gap-2 rounded-full bg-suzuki-red text-white text-sm font-semibold hover:bg-suzuki-red/90 hover:shadow-lg hover:shadow-suzuki-red/30 active:scale-[0.97] transition-all disabled:opacity-60 disabled:hover:shadow-none disabled:active:scale-100 shrink-0"
        >
          {state === "loading" ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
              <span className="sm:hidden">Memproses…</span>
              <span className="hidden sm:inline">Memproses…</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" aria-hidden />
              Berlangganan
            </>
          )}
        </button>
      </div>

      <HoneypotField />

      {/* Umpan balik inline (aria-live agar pembaca layar ikut tahu) */}
      <div aria-live="polite" className="min-h-[22px] mt-2">
        {message && (
          <p
            id="newsletter-feedback"
            className={`flex items-center gap-1.5 text-xs ${
              state === "success" ? "text-green-300" : "text-red-300"
            }`}
          >
            {state === "success" ? (
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden />
            )}
            {message}
          </p>
        )}
      </div>
    </form>
  );
}
