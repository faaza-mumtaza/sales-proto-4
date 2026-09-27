"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Wrench, Car, Info } from "lucide-react";
import { apiPost } from "@/lib/api";
import { SERVIS_JENIS, SERVIS_WAKTU_SLOTS, type Mobil } from "@/lib/site-utils";
import { CaptchaChallenge, HoneypotField } from "./captcha-challenge";

/**
 * Form booking servis bengkel — layanan purnajual dealer.
 * Data masuk ke tabel booking_servis dan dikelola admin
 * (status PENDING → CONFIRMED → DONE/CANCELLED).
 */
export function ServiceBookingForm({
  cars,
  defaultMobilId,
}: {
  cars: Pick<Mobil, "id" | "nama">[];
  defaultMobilId?: string;
}) {
  const [pending, setPending] = useState(false);
  const [captcha, setCaptcha] = useState({ captchaId: "", captchaAnswer: "" });
  const [captchaNonce, setCaptchaNonce] = useState(0);
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    nama_lengkap: "",
    no_telepon: "",
    email: "",
    mobil_id: defaultMobilId ?? "",
    mobil_lainnya: "",
    jenis_servis: "",
    tanggal_diinginkan: today,
    waktu_diinginkan: "",
    keluhan: "",
  });

  const jenisHint = SERVIS_JENIS.find((j) => j.id === form.jenis_servis)?.hint;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;

    const selectedCar = cars.find((c) => c.id === form.mobil_id);
    // mobil_id kosong → wajib isi nama mobil manual (non-katalog)
    if (!selectedCar && !form.mobil_lainnya.trim()) {
      toast.error("Pilih mobil dari katalog atau isi nama mobil Anda");
      return;
    }

    setPending(true);
    const hp = e.currentTarget.elements.namedItem("website") as HTMLInputElement | null;
    const website = hp?.value ?? "";

    try {
      await apiPost("/api/service-booking", {
        nama_lengkap: form.nama_lengkap,
        no_telepon: form.no_telepon,
        email: form.email || undefined,
        mobil_id: selectedCar ? selectedCar.id : null,
        mobil_pilihan: selectedCar ? selectedCar.nama : form.mobil_lainnya.trim(),
        jenis_servis: form.jenis_servis,
        tanggal_diinginkan: form.tanggal_diinginkan,
        waktu_diinginkan: form.waktu_diinginkan,
        keluhan: form.keluhan || undefined,
        captchaId: captcha.captchaId,
        captchaAnswer: captcha.captchaAnswer,
        website,
      });
      toast.success("Booking servis terkirim! Kami akan menghubungi Anda untuk konfirmasi jadwal.", {
        description: "Lacak perkembangan statusnya kapan saja dengan nomor telepon Anda.",
        action: {
          label: "Cek Status",
          onClick: () => {
            window.location.hash = "#/kontak?form=status";
          },
        },
      });
      setForm((f) => ({
        ...f,
        nama_lengkap: "",
        no_telepon: "",
        email: "",
        mobil_lainnya: "",
        jenis_servis: "",
        waktu_diinginkan: "",
        keluhan: "",
      }));
      setCaptcha((c) => ({ ...c, captchaAnswer: "" }));
      setCaptchaNonce((n) => n + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membuat booking servis");
      setCaptchaNonce((n) => n + 1);
    } finally {
      setPending(false);
    }
  }

  const inputCls =
    "w-full px-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-suzuki-red/50";

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="flex items-start gap-3 rounded-lg bg-suzuki-red/5 border border-suzuki-red/15 px-4 py-3">
        <Wrench className="w-5 h-5 text-suzuki-red shrink-0 mt-0.5" aria-hidden />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Workshop resmi Suzuki BSB — teknisi bersertifikat &amp; spare part asli.
          Servis berkala, tune-up, hingga perbaikan berat.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="sv-nama" className="block text-sm font-medium mb-2">
            Nama Lengkap <span className="text-suzuki-red">*</span>
          </label>
          <input
            id="sv-nama"
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
          <label htmlFor="sv-telp" className="block text-sm font-medium mb-2">
            No. WhatsApp <span className="text-suzuki-red">*</span>
          </label>
          <input
            id="sv-telp"
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
        <label htmlFor="sv-email" className="block text-sm font-medium mb-2">
          Email <span className="text-muted-foreground text-xs font-normal">(opsional)</span>
        </label>
        <input
          id="sv-email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className={inputCls}
          placeholder="email@contoh.com"
        />
      </div>

      <div>
        <label htmlFor="sv-mobil" className="flex items-center gap-1.5 text-sm font-medium mb-2">
          <Car className="w-4 h-4 text-muted-foreground" aria-hidden />
          Mobil Anda <span className="text-suzuki-red">*</span>
        </label>
        <select
          id="sv-mobil"
          value={form.mobil_id}
          onChange={(e) => setForm({ ...form, mobil_id: e.target.value })}
          className={inputCls}
          aria-required="true"
        >
          {/* Nilai "" = "mobil lain" — validasi dilakukan saat submit (bukan
              required HTML5, karena pilihan sah justru bernilai kosong). */}
          <option value="">Mobil lain / non-katalog…</option>
          {cars.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nama}
            </option>
          ))}
        </select>
        {!form.mobil_id && (
          <input
            aria-label="Nama mobil Anda"
            value={form.mobil_lainnya}
            onChange={(e) => setForm({ ...form, mobil_lainnya: e.target.value })}
            maxLength={200}
            className={`${inputCls} mt-2`}
            placeholder="Contoh: Suzuki Ertiga 2019 / mobil non-Suzuki"
          />
        )}
      </div>

      <div>
        <span className="block text-sm font-medium mb-2">
          Jenis Layanan <span className="text-suzuki-red">*</span>
        </span>
        <div role="radiogroup" aria-label="Pilih jenis layanan servis" className="grid sm:grid-cols-2 gap-2">
          {SERVIS_JENIS.map((j) => {
            const selected = form.jenis_servis === j.id;
            return (
              <button
                key={j.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setForm({ ...form, jenis_servis: j.id })}
                className={`text-left px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                  selected
                    ? "border-suzuki-red bg-suzuki-red/5 text-suzuki-navy shadow-sm"
                    : "border-input bg-background text-muted-foreground hover:border-suzuki-red/40 hover:text-suzuki-navy"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                      selected ? "border-suzuki-red" : "border-border"
                    }`}
                  >
                    {selected && <span className="w-1.5 h-1.5 rounded-full bg-suzuki-red" />}
                  </span>
                  {j.label}
                </span>
              </button>
            );
          })}
        </div>
        {jenisHint && (
          <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5" aria-live="polite">
            <Info className="w-3.5 h-3.5 shrink-0" aria-hidden />
            {jenisHint}
          </p>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="sv-tanggal" className="block text-sm font-medium mb-2">
            Tanggal <span className="text-suzuki-red">*</span>
          </label>
          <input
            id="sv-tanggal"
            type="date"
            required
            min={today}
            value={form.tanggal_diinginkan}
            onChange={(e) => setForm({ ...form, tanggal_diinginkan: e.target.value })}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="sv-waktu" className="block text-sm font-medium mb-2">
            Waktu <span className="text-suzuki-red">*</span>
          </label>
          <select
            id="sv-waktu"
            required
            value={form.waktu_diinginkan}
            onChange={(e) => setForm({ ...form, waktu_diinginkan: e.target.value })}
            className={inputCls}
          >
            <option value="">Pilih waktu</option>
            {SERVIS_WAKTU_SLOTS.map((w) => (
              <option key={w} value={w}>
                {w} WIB
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="sv-keluhan" className="block text-sm font-medium mb-2">
          Keluhan / Catatan <span className="text-muted-foreground text-xs font-normal">(opsional)</span>
        </label>
        <textarea
          id="sv-keluhan"
          rows={3}
          maxLength={1000}
          value={form.keluhan}
          onChange={(e) => setForm({ ...form, keluhan: e.target.value })}
          className={`${inputCls} resize-none`}
          placeholder="Contoh: oli perlu diganti, suara aneh di rem depan, servis 40.000 km…"
        />
      </div>

      <HoneypotField />
      <CaptchaChallenge key={captchaNonce} value={captcha} onChange={setCaptcha} />

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-suzuki-red hover:bg-suzuki-red/90 disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-all hover:shadow-lg hover:shadow-suzuki-red/30 active:scale-[0.98]"
      >
        {pending ? "Mengirim…" : "Kirim Booking Servis"}
      </button>
      <p className="text-xs text-muted-foreground text-center">
        Estimasi biaya akan diinformasikan setelah teknisi memeriksa kendaraan Anda.
      </p>
    </form>
  );
}
