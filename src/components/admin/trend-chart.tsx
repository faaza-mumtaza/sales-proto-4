"use client";

// Grafik tren pesan & booking test drive 6 bulan terakhir untuk dashboard admin.
// Menggunakan recharts (sudah terpasang) dengan warna brand Suzuki.

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { ChartColumn } from "lucide-react";

export interface TrendPoint {
  bulan: string;
  pesan: number;
  test_drive: number;
}

export function TrendChart({ data }: { data: TrendPoint[] }) {
  const totalPesan = data.reduce((s, d) => s + d.pesan, 0);
  const totalTd = data.reduce((s, d) => s + d.test_drive, 0);

  return (
    <div className="bg-white rounded-xl border border-border p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-suzuki-red/10 rounded-lg flex items-center justify-center">
            <ChartColumn className="w-5 h-5 text-suzuki-red" aria-hidden />
          </div>
          <div>
            <h2 className="font-bold text-suzuki-navy">Tren Interaksi Pengunjung</h2>
            <p className="text-xs text-muted-foreground">
              Pesan kontak &amp; booking test drive — 6 bulan terakhir
            </p>
          </div>
        </div>
        <div className="flex gap-4 text-sm">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-suzuki-red inline-block" aria-hidden />
            <span className="font-semibold text-suzuki-navy">{totalPesan}</span>
            <span className="text-muted-foreground">pesan</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-suzuki-navy inline-block" aria-hidden />
            <span className="font-semibold text-suzuki-navy">{totalTd}</span>
            <span className="text-muted-foreground">booking</span>
          </span>
        </div>
      </div>

      <div className="h-56" role="img" aria-label="Grafik batang tren pesan dan booking test drive per bulan">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="bulan"
              tick={{ fontSize: 12, fill: "#64748b" }}
              axisLine={{ stroke: "#e2e8f0" }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 12, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(227,35,34,0.06)" }}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                boxShadow: "0 8px 24px rgba(26,41,66,0.08)",
                fontSize: 13,
              }}
              formatter={(value: number, name: string) => [
                value,
                name === "pesan" ? "Pesan kontak" : "Booking test drive",
              ]}
            />
            <Legend
              formatter={(value: string) => (
                <span className="text-xs text-muted-foreground">
                  {value === "pesan" ? "Pesan kontak" : "Booking test drive"}
                </span>
              )}
              iconType="rounded"
              iconSize={10}
            />
            <Bar dataKey="pesan" fill="#e32322" radius={[6, 6, 0, 0]} maxBarSize={28} />
            <Bar dataKey="test_drive" fill="#1a2942" radius={[6, 6, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
