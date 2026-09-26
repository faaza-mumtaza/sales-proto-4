"use client";

import { useState } from "react";
import { toast } from "sonner";
import { apiPost } from "@/lib/api";
import { WAKTU_SLOTS, type Mobil } from "@/lib/site-utils";
import { CaptchaChallenge, HoneypotField } from "./captcha-challenge";

export function TestDriveForm({
  cars,
  defaultMobilId,
}: {
  cars: Pick<Mobil, "id" | "nama" | "slug">[];
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
    tanggal_diinginkan: today,
    waktu_diinginkan: "",
    catatan: "",
  });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    const selectedCar = cars.find((c) => c.id === form.mobil_id);
    if (!selectedCar) {
      toast.error("Pilih mobil terlebih dahulu");
      return;
    }
    setPending(true);

    const hp = e.currentTarget.elements.namedItem("website") as HTMLInputElement | null;
    const website = hp?.value ?? "";

    try {
      await apiPost("/api/test-drive", {
        ...form,
        mobil_id: form.mobil_id || null,
        mobil_pilihan: selectedCar.nama,
        captchaId: captcha.captchaId,
        captchaAnswer: captcha.captchaAnswer,
        website,
      });
      toast.success("Pendaftaran test drive berhasil! Tim kami akan menghubungi untuk konfirmasi.");
      setForm({
        ...form,
        nama_lengkap: "",
        no_telepon: "",
        email: "",
        catatan: "",
        waktu_diinginkan: "",
      });
      setCaptcha((c) => ({ ...c, captchaAnswer: "" }));
      setCaptchaNonce((n) => n + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mendaftar test drive");
      setCaptchaNonce((n) => n + 1);
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
          <label htmlFor="td-nama" className="block text-sm font-medium mb-2">
            Nama Lengkap <span className="text-suzuki-red">*</span>
          </label>
          <input
            id="td-nama"
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
          <label htmlFor="td-telp" className="block text-sm font-medium mb-2">
            No. WhatsApp <span className="text-suzuki-red">*</span>
          </label>
          <input
            id="td-telp"
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
        <label htmlFor="td-email" className="block text-sm font-medium mb-2">
          Email <span className="text-suzuki-red">*</span>
        </label>
        <input
          id="td-email"
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className={inputCls}
          placeholder="email@contoh.com"
        />
      </div>
      <div>
        <label htmlFor="td-mobil" className="block text-sm font-medium mb-2">
          Mobil yang Ingin Dicoba <span className="text-suzuki-red">*</span>
        </label>
        <select
          id="td-mobil"
          required
          value={form.mobil_id}
          onChange={(e) => setForm({ ...form, mobil_id: e.target.value })}
          className={inputCls}
        >
          <option value="">Pilih mobil untuk test drive</option>
          {cars.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nama}
            </option>
          ))}
        </select>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="td-tanggal" className="block text-sm font-medium mb-2">
            Tanggal <span className="text-suzuki-red">*</span>
          </label>
          <input
            id="td-tanggal"
            type="date"
            required
            min={today}
            value={form.tanggal_diinginkan}
            onChange={(e) => setForm({ ...form, tanggal_diinginkan: e.target.value })}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="td-waktu" className="block text-sm font-medium mb-2">
            Waktu <span className="text-suzuki-red">*</span>
          </label>
          <select
            id="td-waktu"
            required
            value={form.waktu_diinginkan}
            onChange={(e) => setForm({ ...form, waktu_diinginkan: e.target.value })}
            className={inputCls}
          >
            <option value="">Pilih waktu</option>
            {WAKTU_SLOTS.map((w) => (
              <option key={w} value={w}>
                {w} WIB
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="td-catatan" className="block text-sm font-medium mb-2">
          Catatan Tambahan
        </label>
        <textarea
          id="td-catatan"
          rows={3}
          maxLength={1000}
          value={form.catatan}
          onChange={(e) => setForm({ ...form, catatan: e.target.value })}
          className={`${inputCls} resize-none`}
          placeholder="Catatan tambahan (opsional)"
        />
      </div>

      <HoneypotField />
      <CaptchaChallenge key={captchaNonce} value={captcha} onChange={setCaptcha} />

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-suzuki-red hover:bg-suzuki-red/90 disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-colors"
      >
        {pending ? "Mengirim…" : "Daftar Test Drive"}
      </button>
      <p className="text-xs text-muted-foreground text-center">
        Test drive gratis dan tanpa kewajiban membeli.
      </p>
    </form>
  );
}
