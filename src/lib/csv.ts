// Utilitas export CSV sisi klien — dipakai admin untuk pesan & booking test drive.
// Aman dari CSV injection: sel yang diawali =,+,-,@ diberi prefiks apostrof.

export type CsvColumn<T> = {
  header: string;
  value: (row: T) => string | number | null | undefined;
};

function escapeCell(raw: string | number | null | undefined): string {
  const s = raw == null ? "" : String(raw);
  // Cegah formula injection (Excel/Sheets): awalan berbahaya di-escape dengan '
  const dangerous = /^[=+\-@\t\r]/.test(s);
  const safe = dangerous ? `'${s}` : s;
  // Bungkus dalam kutip ganda bila mengandung koma, kutip, atau newline
  if (/[",\n\r]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

/** Susun isi CSV dari baris + kolom. */
export function buildCsv<T>(rows: T[], columns: Array<CsvColumn<T>>): string {
  const head = columns.map((c) => escapeCell(c.header)).join(",");
  const body = rows.map((r) => columns.map((c) => escapeCell(c.value(r))).join(","));
  // BOM UTF-8 agar Excel membaca karakter Indonesia dengan benar
  return "\uFEFF" + [head, ...body].join("\r\n");
}

/** Unduh CSV sebagai file dari browser. */
export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Tanggal aman untuk nama file (YYYY-MM-DD). */
export function fileDatestamp(): string {
  return new Date().toISOString().slice(0, 10);
}
