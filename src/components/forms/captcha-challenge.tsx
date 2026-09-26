"use client";

// Challenge math-captcha untuk form publik (anti-bot + anti-spam).
// Meminta /api/captcha lalu mengirim captchaId + jawaban saat submit.

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { apiGet } from "@/lib/api";

interface CaptchaData {
  captchaId: string;
  question: string;
}

export function CaptchaChallenge({
  value,
  onChange,
}: {
  value: { captchaId: string; captchaAnswer: string };
  onChange: (v: { captchaId: string; captchaAnswer: string }) => void;
}) {
  const [captcha, setCaptcha] = useState<CaptchaData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet<{ captcha: CaptchaData }>("/api/captcha");
      setCaptcha(res.captcha);
      onChange({ captchaId: res.captcha.captchaId, captchaAnswer: "" });
    } catch {
      setCaptcha(null);
    } finally {
      setLoading(false);
    }
  }, [onChange]);

  useEffect(() => {
    void load();
  }, []);

  return (
    <div>
      <label htmlFor="captcha-answer" className="flex items-center gap-1.5 text-sm font-medium mb-2">
        <ShieldCheck className="w-4 h-4 text-suzuki-red" aria-hidden />
        Verifikasi Keamanan <span className="text-suzuki-red">*</span>
      </label>
      <div className="flex items-stretch gap-2">
        <div className="flex items-center px-4 rounded-lg bg-suzuki-navy text-white font-bold tracking-widest select-none min-w-[110px] justify-center">
          {loading ? "…" : captcha ? captcha.question : "Gagal memuat"}
        </div>
        <input
          id="captcha-answer"
          inputMode="numeric"
          autoComplete="off"
          required
          value={value.captchaAnswer}
          onChange={(e) => onChange({ ...value, captchaAnswer: e.target.value })}
          placeholder="Jawaban"
          className="w-24 px-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-suzuki-red/50"
        />
        <button
          type="button"
          onClick={() => void load()}
          className="px-3 rounded-lg border border-input text-muted-foreground hover:text-suzuki-navy dark:hover:text-white hover:bg-muted transition-colors"
          aria-label="Ganti soal verifikasi"
          title="Ganti soal"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/** Honeypot tersembunyi — manusia tidak akan melihat/mengisinya. */
export function HoneypotField() {
  return (
    <div className="hidden" aria-hidden="true">
      <label>
        Website
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}
