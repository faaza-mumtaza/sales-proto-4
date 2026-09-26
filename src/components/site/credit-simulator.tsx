"use client";

// Kalkulator simulasi kredit (estimasi) untuk halaman detail mobil.
// Perhitungan memakai model bunga flat yang umum dipakai dealer di Indonesia:
//   angsuran = (pokok + pokok × bunga% × tenor) / (tenor × 12)
// Angka bersifat estimasi — angka final mengikuti leasing/polinan Suzuki.

import { useMemo, useState } from "react";
import { Calculator, Info, ArrowRight } from "lucide-react";
import { Link } from "@/lib/router";
import { formatPrice } from "@/lib/site-utils";

const DP_MIN = 10;
const DP_MAX = 50;
const DP_STEP = 5;
const TENOR_OPTIONS = [1, 2, 3, 4, 5, 6];
const BUNGA_MIN = 1;
const BUNGA_MAX = 12;
const BUNGA_DEFAULT = 4.5;

export function CreditSimulator({
  carName,
  price,
}: {
  carName: string;
  price: number | null;
}) {
  const [dpPct, setDpPct] = useState(20);
  const [tenor, setTenor] = useState(5);
  const [bunga, setBunga] = useState(BUNGA_DEFAULT);
  const [open, setOpen] = useState(false);

  const calc = useMemo(() => {
    if (price == null) return null;
    const dp = Math.round((price * dpPct) / 100);
    const pokok = price - dp;
    const totalBunga = Math.round((pokok * bunga * tenor) / 100);
    const totalBayar = pokok + totalBunga;
    const bulan = tenor * 12;
    const angsuran = Math.round(totalBayar / bulan);
    return { dp, pokok, totalBunga, totalBayar, angsuran, bulan };
  }, [price, dpPct, tenor, bunga]);

  // Prefill pesan ke form kontak agar sales langsung paham konteksnya
  const ajukanPesan =
    calc && price != null
      ? `Halo, saya ingin mengajukan simulasi kredit untuk ${carName} dengan DP ${dpPct}% (${formatPrice(
          calc.dp,
        )}), tenor ${tenor} tahun, bunga estimasi ${bunga}% flat — angsuran sekitar ${formatPrice(
          calc.angsuran,
        )}/bulan. Mohon dibantu hitungan resminya. Terima kasih.`
      : "";

  if (price == null) return null;

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-4 bg-gradient-to-r from-suzuki-navy to-[#25355c] text-white px-6 py-4 hover:from-suzuki-navy/95 hover:to-[#25355c]/95 transition-all"
      >
        <span className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
            <Calculator className="w-5 h-5" aria-hidden />
          </span>
          <span className="text-left">
            <span className="block font-semibold">Simulasi Kredit</span>
            <span className="block text-xs text-white/70">
              Hitung estimasi angsuran {carName} dalam hitungan detik
            </span>
          </span>
        </span>
        <ArrowRight
          className={`w-5 h-5 shrink-0 transition-transform duration-300 ${open ? "rotate-90" : ""}`}
          aria-hidden
        />
      </button>

      {open && (
        <div className="p-6 space-y-6">
          {/* Slider DP */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="sim-dp" className="text-sm font-medium text-foreground">
                Uang Muka (DP)
              </label>
              <span className="text-sm font-bold text-suzuki-red">
                {dpPct}% · {calc ? formatPrice(calc.dp) : "-"}
              </span>
            </div>
            <input
              id="sim-dp"
              type="range"
              min={DP_MIN}
              max={DP_MAX}
              step={DP_STEP}
              value={dpPct}
              onChange={(e) => setDpPct(Number(e.target.value))}
              className="w-full accent-[#e32322] cursor-pointer"
              aria-valuetext={`${dpPct} persen`}
            />
            <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
              <span>{DP_MIN}%</span>
              <span>{DP_MAX}%</span>
            </div>
          </div>

          {/* Tenor + Bunga */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="sim-tenor" className="block text-sm font-medium mb-2">
                Tenor
              </label>
              <select
                id="sim-tenor"
                value={tenor}
                onChange={(e) => setTenor(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-suzuki-red/50"
              >
                {TENOR_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t} tahun ({t * 12}×)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="sim-bunga" className="block text-sm font-medium mb-2">
                Bunga flat / tahun
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="sim-bunga"
                  type="number"
                  min={BUNGA_MIN}
                  max={BUNGA_MAX}
                  step={0.25}
                  value={bunga}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setBunga(Number.isFinite(v) ? Math.min(Math.max(v, BUNGA_MIN), BUNGA_MAX) : BUNGA_DEFAULT);
                  }}
                  className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-suzuki-red/50"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
          </div>

          {/* Hasil */}
          <div className="bg-suzuki-light rounded-xl border border-border p-5">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Estimasi angsuran per bulan</p>
                <p className="text-3xl font-bold text-suzuki-red" aria-live="polite">
                  {calc ? formatPrice(calc.angsuran) : "-"}
                </p>
              </div>
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Pokok pinjaman</dt>
                  <dd className="font-semibold text-suzuki-navy">
                    {calc ? formatPrice(calc.pokok) : "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Total bunga</dt>
                  <dd className="font-semibold text-suzuki-navy">
                    {calc ? formatPrice(calc.totalBunga) : "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Total pembayaran</dt>
                  <dd className="font-semibold text-suzuki-navy">
                    {calc ? formatPrice(calc.totalBayar) : "-"}
                  </dd>
                </div>
              </dl>
            </div>

            <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground mt-4">
              <Info className="w-3.5 h-3.5 shrink-0 mt-px" aria-hidden />
              Estimasi dengan bunga flat dan tanpa biaya administrasi/provisi. Angka final
              mengikuti skema leasing &amp; promo Suzuki yang berlaku.
            </p>

            <Link
              to={`/kontak?form=kontak&subjek=${encodeURIComponent("Simulasi Kredit")}&pesan=${encodeURIComponent(ajukanPesan)}`}
              className="mt-4 inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 bg-suzuki-red hover:bg-suzuki-red/90 text-white text-sm font-semibold rounded-lg transition-all hover:shadow-lg hover:shadow-suzuki-red/25 active:scale-95"
            >
              Ajukan Simulasi Ini
              <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
