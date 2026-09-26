"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MessageCircle, Facebook, Twitter, Link2, Check, Share2 } from "lucide-react";

/**
 * Grup tombol bagikan — dipakai di halaman detail mobil & artikel.
 * WhatsApp, Facebook, X (Twitter), dan salin tautan (Clipboard API + fallback).
 */
export function ShareButtons({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Tautan disalin!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback untuk browser tanpa Clipboard API
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        toast.success("Tautan disalin!");
        setTimeout(() => setCopied(false), 2000);
      } catch {
        toast.error("Gagal menyalin tautan — salin manual dari address bar.");
      }
      document.body.removeChild(ta);
    }
  }

  const text = `${title} — lihat di website Suzuki BSB Semarang`;

  return (
    <div className="flex flex-wrap items-center gap-2.5" role="group" aria-label="Bagikan halaman ini">
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground mr-1">
        <Share2 className="w-3.5 h-3.5" aria-hidden />
        Bagikan
      </span>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${title} — ${url}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Bagikan via WhatsApp"
        title="Bagikan via WhatsApp"
        className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-500 hover:bg-green-600 text-white transition-all hover:scale-110 hover:shadow-lg hover:shadow-green-500/25 active:scale-95"
      >
        <MessageCircle className="w-[18px] h-[18px]" aria-hidden />
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Bagikan ke Facebook"
        title="Bagikan ke Facebook"
        className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#1877F2] hover:bg-[#166fe0] text-white transition-all hover:scale-110 hover:shadow-lg hover:shadow-[#1877F2]/25 active:scale-95"
      >
        <Facebook className="w-[18px] h-[18px]" aria-hidden />
      </a>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Bagikan ke X (Twitter)"
        title="Bagikan ke X (Twitter)"
        className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-black hover:bg-black/85 text-white transition-all hover:scale-110 hover:shadow-lg hover:shadow-black/20 active:scale-95"
      >
        <Twitter className="w-[18px] h-[18px]" aria-hidden />
      </a>
      <button
        type="button"
        onClick={() => void copyLink()}
        aria-live="polite"
        aria-label={copied ? "Tautan tersalin" : "Salin tautan halaman"}
        title="Salin tautan"
        className={`inline-flex items-center justify-center gap-2 h-10 px-4 rounded-full border text-sm font-medium transition-all active:scale-95 ${
          copied
            ? "bg-green-50 dark:bg-green-950/60 border-green-300 dark:border-green-900 text-green-700 dark:text-green-300"
            : "bg-card border-border text-foreground hover:border-suzuki-red/40 hover:text-suzuki-red"
        }`}
      >
        {copied ? <Check className="w-4 h-4" aria-hidden /> : <Link2 className="w-4 h-4" aria-hidden />}
        {copied ? "Tersalin!" : "Salin Tautan"}
      </button>
    </div>
  );
}
