"use client";

import { useState } from "react";
import { toast } from "sonner";
import { apiPost } from "@/lib/api";
import { CaptchaChallenge, HoneypotField } from "./captcha-challenge";

const SUBJEK_OPTIONS = [
  "Informasi Produk",
  "Booking Service",
  "Simulasi Kredit",
  "Lainnya",
] as const;

export function ContactForm({
  defaultSubjek = "",
  defaultPesan = "",
}: {
  /** Prefill dari CTA halaman lain (mis. simulator kredit) */
  defaultSubjek?: string;
  defaultPesan?: string;
}) {
  const [pending, setPending] = useState(false);
  const [captcha, setCaptcha] = useState({ captchaId: "", captchaAnswer: "" });
  const [captchaNonce, setCaptchaNonce] = useState(0);
  const [form, setForm] = useState({
    nama_lengkap: "",
    no_telepon: "",
    email: "",
    subjek: SUBJEK_OPTIONS.includes(defaultSubjek as never) ? defaultSubjek : "",
    pesan: defaultPesan.slice(0, 2000),
  });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    setPending(true);

    // honeypot: dibaca dari DOM (bot mengisi field tersembunyi ini)
    const hp = e.currentTarget.elements.namedItem("website") as HTMLInputElement | null;
    const website = hp?.value ?? "";

    try {
      await apiPost("/api/contact", {
        ...form,
        captchaId: captcha.captchaId,
        captchaAnswer: captcha.captchaAnswer,
        website,
      });
      toast.success("Pesan terkirim! Tim kami akan menghubungi Anda segera.");
      setForm({ nama_lengkap: "", no_telepon: "", email: "", subjek: "", pesan: "" });
      setCaptcha((c) => ({ ...c, captchaAnswer: "" }));
      setCaptchaNonce((n) => n + 1); // captcha terpakai → minta challenge baru
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengirim pesan");
      setCaptchaNonce((n) => n + 1); // challenge lama sudah terkonsumsi
    } finally {
      setPending(false);
    }
  }

  const inputCls =
    "w-full px-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-suzuki-red/50";

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="c-nama" className="block text-sm font-medium mb-2">
            Nama Lengkap <span className="text-suzuki-red">*</span>
          </label>
          <input
            id="c-nama"
            required
            minLength={2}
            maxLength={100}
            value={form.nama_lengkap}
            onChange={(e) => setForm({ ...form, nama_lengkap: e.target.value })}
            className={inputCls}
            placeholder="Masukkan nama"
          />
        </div>
        <div>
          <label htmlFor="c-telp" className="block text-sm font-medium mb-2">
            No. Telepon <span className="text-suzuki-red">*</span>
          </label>
          <input
            id="c-telp"
            required
            value={form.no_telepon}
            onChange={(e) => setForm({ ...form, no_telepon: e.target.value })}
            className={inputCls}
            placeholder="08xx-xxxx-xxxx"
            inputMode="tel"
          />
        </div>
      </div>
      <div>
        <label htmlFor="c-email" className="block text-sm font-medium mb-2">
          Email
        </label>
        <input
          id="c-email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className={inputCls}
          placeholder="email@contoh.com (opsional)"
        />
      </div>
      <div>
        <label htmlFor="c-subjek" className="block text-sm font-medium mb-2">
          Subjek
        </label>
        <select
          id="c-subjek"
          value={form.subjek}
          onChange={(e) => setForm({ ...form, subjek: e.target.value })}
          className={inputCls}
        >
          <option value="">Pilih subjek</option>
          {SUBJEK_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="c-pesan" className="block text-sm font-medium mb-2">
          Pesan <span className="text-suzuki-red">*</span>
        </label>
        <textarea
          id="c-pesan"
          required
          minLength={10}
          maxLength={2000}
          rows={4}
          value={form.pesan}
          onChange={(e) => setForm({ ...form, pesan: e.target.value })}
          className={`${inputCls} resize-none`}
          placeholder="Tulis pesan Anda…"
        />
      </div>

      <HoneypotField />
      <CaptchaChallenge key={captchaNonce} value={captcha} onChange={setCaptcha} />

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-suzuki-red hover:bg-suzuki-red/90 disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-colors"
      >
        {pending ? "Mengirim…" : "Kirim Pesan"}
      </button>
    </form>
  );
}
