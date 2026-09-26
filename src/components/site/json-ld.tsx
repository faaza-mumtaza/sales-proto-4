"use client";

// Suntikan data terstruktur JSON-LD (schema.org) ke halaman.
// Dipasang per-view (mobil detail, artikel detail, FAQ) dan sekali di root
// untuk data dealer (AutoDealer).

export function JsonLd({ data }: { data: object | object[] }) {
  const items = Array.isArray(data) ? data : [data];
  return (
    <>
      {items.map((d, i) => (
        <script
          key={i}
          type="application/ld+json"
          // JSON.stringify aman dari XSS pada konteks elemen <script type="ld+json>:
          // karakter "</script" di-escape agar tidak bisa menutup tag script.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(d).replace(/<\/script/gi, "<\\/script"),
          }}
        />
      ))}
    </>
  );
}
